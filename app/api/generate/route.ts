// ============================================================
// PolicyPen — Generation API Route
// POST /api/generate
// Auth → plan check → Claude stream → Supabase save → SSE
// ============================================================

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generatePolicy } from '@/prompts/generate'
import {
  getCurrentUser,
  canUserGeneratePolicy,
  countActiveGenerations,
  createPolicyRecord,
  savePolicyContent,
  markPolicyError,
} from '@/lib/db/dal'
import type { PolicyType } from '@/types/supabase'
import type { Questionnaire } from '@/lib/types'

export const runtime     = 'nodejs'
export const maxDuration = 60

// Map short names used in UI → DB enum values
const POLICY_TYPE_MAP: Record<string, PolicyType> = {
  privacy:  'privacy_policy',
  tos:      'terms_of_service',
  cookie:   'cookie_policy',
  refund:   'refund_policy',
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────
  let policyTypeRaw: string
  let questionnaire: Questionnaire
  let productId: string

  try {
    const body = await req.json()
    policyTypeRaw = body.policy_type as string
    questionnaire = body.questionnaire as Questionnaire
    productId     = body.product_id as string

    if (!productId) {
      return Response.json({ error: 'product_id is required' }, { status: 400 })
    }
    if (!POLICY_TYPE_MAP[policyTypeRaw]) {
      return Response.json({ error: 'Invalid policy_type. Use: privacy, tos, cookie, refund' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const policyType = POLICY_TYPE_MAP[policyTypeRaw]

  // ── 3. Get user + plan check ──────────────────────────────
  const dbUser = await getCurrentUser(userId).catch(() => null)
  if (!dbUser) {
    return Response.json({ error: 'User not found. Try signing out and back in.' }, { status: 404 })
  }

  const canGenerate = await canUserGeneratePolicy(dbUser.id, productId).catch(() => ({ allowed: false, reason: 'Plan check failed' }))
  if (!canGenerate.allowed) {
    return Response.json({ error: canGenerate.reason ?? 'Plan limit reached. Upgrade to generate more policies.' }, { status: 403 })
  }

  // ── Rate limit: max 3 concurrent generations per user ─────
  const activeCount = await countActiveGenerations(dbUser.id)
  if (activeCount >= 3) {
    return Response.json(
      { error: 'You already have active generations running. Please wait for them to complete.' },
      { status: 429, headers: { 'Retry-After': '30' } }
    )
  }

  // ── 4. Create pending policy record ───────────────────────
  let policyId: string
  try {
    const record = await createPolicyRecord({
      product_id:   productId,
      user_id:      dbUser.id,
      policy_type:  policyType,
      title:        `${questionnaire.product_name ?? 'Product'} — ${policyType.replace(/_/g, ' ')}`,
      status:       'generating',
      version:      1,
    })
    policyId = record.id
  } catch (err) {
    console.error('[generate] Failed to create policy record:', err)
    return Response.json({ error: 'Failed to initialise policy record' }, { status: 500 })
  }

  // ── 5. Stream from Claude → SSE ───────────────────────────
  const encoder       = new TextEncoder()
  let accumulatedHtml = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await generatePolicy(
          // prompts/generate.ts expects short names
          policyTypeRaw as 'privacy' | 'tos' | 'cookie' | 'refund',
          questionnaire,
          (chunk: string) => {
            accumulatedHtml += chunk
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            )
          }
        )

        // ── 6. Save completed policy ────────────────────────
        const crypto = await import('crypto')
        const contentHash = crypto.createHash('sha256').update(accumulatedHtml).digest('hex').slice(0, 16)

        await savePolicyContent(policyId, {
          content_html:            accumulatedHtml,
          content_markdown:        undefined,
          content_hash:            contentHash,
          status:                  'active',
          word_count:              accumulatedHtml.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
          generation_tokens_used:  result.tokens_input + result.tokens_output,
          generation_cost_usd:     result.cost_usd,
          jurisdiction_codes:      result.jurisdictions,
          clauses_used:            result.clauses_activated,
          prompt_version:          '1.0',
          generated_at:            new Date().toISOString(),
          published_at:            new Date().toISOString(),
        })

        // ── 7. Done event ───────────────────────────────────
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done:              true,
              policy_id:         policyId,
              cost_usd:          result.cost_usd,
              tokens_input:      result.tokens_input,
              tokens_output:     result.tokens_output,
              duration_ms:       result.duration_ms,
              clauses_activated: result.clauses_activated,
              jurisdictions:     result.jurisdictions,
            })}\n\n`
          )
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed'
        await markPolicyError(policyId, message).catch(() => {})
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
