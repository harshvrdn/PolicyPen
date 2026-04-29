// ============================================================
// PolicyPen — Policy Generation Entry Point
//
// Provider is chosen by user plan:
//   free / starter → OpenRouter (Gemma free / Gemini MM free)
//   builder        → OpenAI GPT-5
//   studio         → Claude
//
// Any failure (auth, rate limit, crash) → auto-retry with Claude.
// If Claude itself was the primary and fails, the error is raised.
// ============================================================

import type { GenerationResult, PolicyType, Questionnaire } from '@/lib/types'
import { buildPrompt } from '@/prompts/builder'
import { generateWithProvider, configForPlan } from '@/lib/llm/providers'

const CLAUDE_FALLBACK_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6'

export async function generatePolicy(
  policyType:    PolicyType,
  questionnaire: Questionnaire,
  onStream?:     (chunk: string) => void,
  plan?:         string | null,
): Promise<GenerationResult> {
  const { system, user, metadata } = buildPrompt(policyType, questionnaire)

  let fullContent = ''
  const safeOnChunk = (text: string) => {
    fullContent += text
    onStream?.(text)
  }

  const { provider, model } = configForPlan(plan)
  let usedProvider = provider
  let result

  try {
    result = await generateWithProvider(provider, system, user, safeOnChunk, model)
  } catch (primaryErr) {
    // Claude is the universal fallback — only retry if we weren't already using it
    if (provider === 'claude') throw primaryErr

    console.warn(
      `[generate] ${provider} failed (plan="${plan ?? 'free'}") — falling back to Claude.`,
      primaryErr instanceof Error ? primaryErr.message : primaryErr,
    )

    fullContent  = ''        // reset accumulated content before retry
    usedProvider = 'claude'
    result       = await generateWithProvider('claude', system, user, safeOnChunk, CLAUDE_FALLBACK_MODEL)
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
  questionnaire: Questionnaire,
  plan?:         string | null,
): Promise<Record<PolicyType, GenerationResult>> {
  const results: Partial<Record<PolicyType, GenerationResult>> = {}
  const types: PolicyType[] = ['privacy', 'tos', 'cookie', 'refund']

  for (const policyType of types) {
    results[policyType] = await generatePolicy(policyType, questionnaire, undefined, plan)

    // 500ms cooldown between generations to avoid rate limit bursts
    if (policyType !== 'refund') {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return results as Record<PolicyType, GenerationResult>
}
