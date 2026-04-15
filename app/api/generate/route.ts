// ============================================================
// PolicyPen — Generation API Route
// POST /api/generate
// Auth → cache check → Claude stream → Supabase save → SSE
// ============================================================

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePolicy } from '@/prompts/generate'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PolicyType, Questionnaire } from '@/lib/types'
import type { Database } from '@/types/database'

export const runtime     = 'nodejs'  // streaming requires nodejs, not edge
export const maxDuration = 60        // 60s hard timeout for long generations

type PolicyRow    = Database['public']['Tables']['policies']['Row']
type PolicyInsert = Database['public']['Tables']['policies']['Insert']

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────
  // Cast to fully-typed client: @supabase/ssr v0.5.x doesn't forward the
  // Database generic through its cookie wrapper's type inference chain.
  const supabase = (await createClient()) as unknown as SupabaseClient<Database>
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────
  let policyType: PolicyType
  let questionnaire: Questionnaire
  let productName: string

  try {
    const body = await req.json()
    policyType    = body.policy_type    as PolicyType
    questionnaire = body.questionnaire  as Questionnaire
    productName   = questionnaire.product_name ?? 'unnamed'

    if (!(['privacy', 'tos', 'cookie', 'refund'] as string[]).includes(policyType)) {
      return Response.json({ error: 'Invalid policy_type' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ── 3. Cache check — return if < 24h old ──────────────────
  const cacheResult = await supabase
    .from('policies')
    .select('id, content_html, version, created_at')
    .eq('user_id', user.id)
    .eq('product_name', productName)
    .eq('policy_type', policyType)
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const existing = cacheResult.data as Pick<PolicyRow, 'id' | 'content_html' | 'version' | 'created_at'> | null

  // Check if a pending law_update invalidates the cache
  const lawUpdateResult = await supabase
    .from('law_updates')
    .select('id')
    .contains('affects_policy_types', [policyType])
    .gt('created_at', existing?.created_at ?? '1970-01-01')
    .limit(1)
    .maybeSingle()

  const lawUpdate = lawUpdateResult.data

  if (existing && !lawUpdate) {
    return Response.json({ cached: true, html: existing.content_html })
  }

  // ── 4. Stream from Claude → SSE ───────────────────────────
  const encoder       = new TextEncoder()
  let accumulatedHtml = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await generatePolicy(
          policyType,
          questionnaire,
          (chunk: string) => {
            accumulatedHtml += chunk
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            )
          }
        )

        // ── 5. Save to Supabase ─────────────────────────────
        const nextVersion = (existing?.version ?? 0) + 1

        const insertData: PolicyInsert = {
          user_id:      user.id,
          product_name: productName,
          policy_type:  policyType,
          content_html: accumulatedHtml,
          version:      nextVersion,
          tokens_used:  result.tokens_input + result.tokens_output,
          cost_usd:     result.cost_usd,
        }

        await supabase.from('policies').insert(insertData)

        // ── 6. Done event ───────────────────────────────────
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done:              true,
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
