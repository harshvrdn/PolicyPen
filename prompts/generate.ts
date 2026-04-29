// ============================================================
// PolicyPen — Policy Generation Entry Point
// Provider: Claude (primary) → OpenRouter (fallback)
// Override via LLM_PROVIDER / LLM_FALLBACK_PROVIDER env vars
// ============================================================

import type { GenerationResult, PolicyType, Questionnaire } from '@/lib/types'
import { buildPrompt } from '@/prompts/builder'
import { generateWithProvider, resolveProvider, type LLMProvider } from '@/lib/llm/providers'

const PRIMARY_PROVIDER: LLMProvider  = resolveProvider(process.env.LLM_PROVIDER)
const FALLBACK_PROVIDER: LLMProvider = resolveProvider(process.env.LLM_FALLBACK_PROVIDER ?? 'openrouter')

export async function generatePolicy(
  policyType: PolicyType,
  questionnaire: Questionnaire,
  onStream?: (chunk: string) => void
): Promise<GenerationResult> {
  const { system, user, metadata } = buildPrompt(policyType, questionnaire)

  let fullContent = ''
  const safeOnChunk = (text: string) => {
    fullContent += text
    onStream?.(text)
  }

  // Try primary, fall back on any error
  let result
  let usedProvider = PRIMARY_PROVIDER
  try {
    result = await generateWithProvider(PRIMARY_PROVIDER, system, user, safeOnChunk)
  } catch (primaryErr) {
    const fallback = FALLBACK_PROVIDER !== PRIMARY_PROVIDER ? FALLBACK_PROVIDER : null
    if (!fallback) throw primaryErr

    console.warn(
      `[generate] Primary provider "${PRIMARY_PROVIDER}" failed — switching to "${fallback}".`,
      primaryErr instanceof Error ? primaryErr.message : primaryErr
    )

    // Reset accumulated content before fallback attempt
    fullContent = ''
    usedProvider = fallback
    result = await generateWithProvider(fallback, system, user, safeOnChunk)
  }

  return {
    html:              fullContent,
    policy_type:       policyType,
    tokens_input:      result.tokens_input,
    tokens_output:     result.tokens_output,
    cost_usd:          result.cost_usd,
    jurisdictions:     metadata.jurisdictions,
    clauses_activated: metadata.clauses_activated,
    duration_ms:       result.duration_ms,
    provider:          usedProvider,
  }
}

export async function generateAllPolicies(
  questionnaire: Questionnaire
): Promise<Record<PolicyType, GenerationResult>> {
  const results: Partial<Record<PolicyType, GenerationResult>> = {}
  const types: PolicyType[] = ['privacy', 'tos', 'cookie', 'refund']

  for (const policyType of types) {
    results[policyType] = await generatePolicy(policyType, questionnaire)

    // 500ms cooldown between generations to avoid rate limit bursts
    if (policyType !== 'refund') {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return results as Record<PolicyType, GenerationResult>
}
