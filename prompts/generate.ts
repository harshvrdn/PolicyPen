// ============================================================
// PolicyPen — Claude API Integration
// Streaming generation with cost tracking
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { GenerationResult, PolicyType, Questionnaire } from '@/lib/types'
import { buildPrompt } from '@/prompts/builder'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// claude-sonnet-4-6 pricing (per 1K tokens)
const PRICING = {
  input_per_1k:  0.003,
  output_per_1k: 0.015,
}

export async function generatePolicy(
  policyType: PolicyType,
  questionnaire: Questionnaire,
  onStream?: (chunk: string) => void
): Promise<GenerationResult> {
  const start = Date.now()
  const { system, user, metadata } = buildPrompt(policyType, questionnaire)

  let fullContent = ''

  const stream = await client.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      fullContent += chunk.delta.text
      onStream?.(chunk.delta.text)  // → SSE to client
    }
  }

  const finalMsg = await stream.finalMessage()
  const { input_tokens, output_tokens } = finalMsg.usage

  const cost =
    (input_tokens  / 1000) * PRICING.input_per_1k +
    (output_tokens / 1000) * PRICING.output_per_1k

  return {
    html:              fullContent,
    policy_type:       policyType,
    tokens_input:      input_tokens,
    tokens_output:     output_tokens,
    cost_usd:          Math.round(cost * 10000) / 10000,
    jurisdictions:     metadata.jurisdictions,
    clauses_activated: metadata.clauses_activated,
    duration_ms:       Date.now() - start,
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
