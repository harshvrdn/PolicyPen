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
  retireOldPolicyVersions,
  createPolicyRecord,
  savePolicyContent,
  markPolicyError,
  getProductById,
} from '@/lib/db/dal'
import { sendPolicyReadyEmail } from '@/lib/email'
import type { PolicyType } from '@/types/supabase'
import type { Questionnaire } from '@/lib/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://policypen.io'

export const runtime     = 'nodejs'
export const maxDuration = 60

// Map short names used in UI → DB enum values
const POLICY_TYPE_MAP: Record<string, PolicyType> = {
  privacy:  'privacy_policy',
  tos:      'terms_of_service',
  cookie:   'cookie_policy',
  refund:   'refund_policy',
}

// Cap string fields at 500 chars and array fields at 50 items so that
// client-supplied questionnaire overrides cannot inject oversized content
// into the Claude prompt or carry prompt-injection payloads.
function sanitiseQuestionnaire(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === 'string') {
      out[key] = val.slice(0, 500)
    } else if (Array.isArray(val)) {
      out[key] = val.slice(0, 50).map(item =>
        typeof item === 'string' ? item.slice(0, 200) : item
      )
    } else {
      out[key] = val
    }
  }
  return out
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────
  let policyTypeRaw: string
  let clientQuestionnaire: Record<string, unknown>
  let productId: string

  try {
    const body = await req.json()
    policyTypeRaw        = body.policy_type as string
    clientQuestionnaire  = (body.questionnaire ?? {}) as Record<string, unknown>
    productId            = body.product_id as string

    if (!productId) {
      return Response.json({ error: 'product_id is required' }, { status: 400 })
    }
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_REGEX.test(productId)) {
      return Response.json({ error: 'Invalid product_id format' }, { status: 400 })
    }
    if (!POLICY_TYPE_MAP[policyTypeRaw]) {
      return Response.json({ error: 'Invalid policy_type. Use: privacy, tos, cookie, refund' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const policyType = POLICY_TYPE_MAP[policyTypeRaw]

  // ── 2b. Build a complete questionnaire from product data ──
  // The wizard only saves a subset of fields; enrich from the
  // product row so the prompt builder always has what it needs.
  const product = await getProductById(productId).catch(() => null)
  if (!product) {
    return Response.json({ error: 'Product not found' }, { status: 404 })
  }

  const stored       = (product.questionnaire_data ?? {}) as Record<string, unknown>
  const dataCols     = (stored.data_collected as string[]) ?? []
  const usesCookies  = Boolean(stored.uses_cookies)
  const sharesThird  = Boolean(stored.shares_with_third_parties)

  const questionnaire: Questionnaire = {
    // Identity — from product row
    company_name:          product.company_legal_name ?? product.name,
    product_name:          product.name,
    website_url:           product.website_url       ?? '',
    contact_email:         product.contact_email     ?? '',
    business_address:      product.company_address   ?? '',
    incorporation_country: product.primary_jurisdiction ?? 'US',
    effective_date:        new Date().toISOString().slice(0, 10),

    // Product
    product_type:          product.business_type ?? 'SaaS',
    business_model:        ['subscription'],
    minimum_age:           '13',
    user_type:             'consumer',
    regulated_industry:    [],
    ugc_type:              'none',
    ai_features:           [],

    // Data — derived from questionnaire_data.data_collected
    identity_data:         dataCols.filter(d => ['email_addresses', 'third_party_auth'].includes(d)),
    usage_data:            dataCols.filter(d => ['usage_analytics'].includes(d)),
    payment_data:          dataCols.filter(d => ['payment_info'].includes(d)),
    location_data:         dataCols.includes('location_data') ? 'approximate' : 'none',
    special_category_data: dataCols.filter(d => ['health_data'].includes(d)),
    legal_basis:           ['legitimate_interests', 'contract'],
    retention_period:      '1_year',
    data_storage_regions:  [product.primary_jurisdiction ?? 'US'],
    data_selling:          'never',
    analytics_tools:       [],
    third_parties:         sharesThird ? ['payment_processor', 'analytics'] : [],

    // Cookies & Rights
    cookie_categories:     usesCookies ? ['necessary', 'analytics'] : ['necessary'],
    tracking_technologies: usesCookies ? ['cookies', 'local_storage'] : [],
    marketing_channels:    [],
    dsar_mechanism:        ['email'],
    deletion_mechanism:    'email_request',
    data_portability:      'on_request',

    // Legal
    active_jurisdictions:  [product.primary_jurisdiction ?? 'US'],
    governing_law:         product.primary_jurisdiction ?? 'US',
    dispute_resolution:    'litigation',
    liability_cap:         '12_months',
    termination_policy:    'end_of_period',

    // Allow client overrides, but cap field sizes to prevent prompt injection
    // and oversized payloads from reaching the Claude prompt builder.
    ...sanitiseQuestionnaire(clientQuestionnaire),
  }

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
  // Retire any existing version first to satisfy the unique constraint
  // on (product_id, policy_type, is_current_version).
  await retireOldPolicyVersions(productId, policyType).catch(() => {})

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
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[generate] Failed to create policy record:', detail)
    return Response.json({ error: `Failed to initialise policy record: ${detail}` }, { status: 500 })
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
          word_count:              accumulatedHtml.split(/\s+/).length,
          generation_tokens_used:  result.tokens_input + result.tokens_output,
          generation_cost_usd:     result.cost_usd,
          jurisdiction_codes:      result.jurisdictions,
          clauses_used:            result.clauses_activated,
          prompt_version:          '1.0',
          generated_at:            new Date().toISOString(),
          published_at:            new Date().toISOString(),
        })

        // ── 7. Fire-and-forget policy ready email ──────────
        if (dbUser.email) {
          const firstName = dbUser.full_name?.split(' ')[0] ?? null
          getProductById(productId)
            .then((product) =>
              sendPolicyReadyEmail(
                dbUser.email!,
                firstName,
                product?.name ?? questionnaire.product_name ?? 'your product',
                policyType,
                product ? `${APP_URL}/products/${product.slug}` : `${APP_URL}/dashboard`,
              )
            )
            .catch(() => {})
        }

        // ── 8. Done event ───────────────────────────────────
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
