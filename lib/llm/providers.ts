// ============================================================
// PolicyPen — Multi-LLM Provider Abstraction
//
// Plan tier → provider routing:
//   free    / starter → OpenRouter  (Gemma 3 free / multimodal free)
//   builder           → OpenAI      (GPT-5)
//   studio            → Claude      (claude-sonnet-4-6)
//
// Fallback on ANY failure: Claude
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type LLMProvider = 'claude' | 'openai' | 'openrouter'
export type PlanTier    = 'free' | 'starter' | 'builder' | 'studio'

export interface LLMResult {
  tokens_input:  number
  tokens_output: number
  cost_usd:      number
  duration_ms:   number
}

// ── Default model IDs ─────────────────────────────────────
// Override any of these via env vars if needed.
const MODELS = {
  claude:   process.env.CLAUDE_MODEL              ?? 'claude-sonnet-4-6',
  openai:   process.env.OPENAI_MODEL              ?? 'gpt-5',
  // Free-tier text model (Gemma 3 27B — no cost on OpenRouter)
  or_text:  process.env.OPENROUTER_FREE_MODEL     ?? 'google/gemma-3-27b-it:free',
  // Free-tier multimodal model (Gemini 2.0 Flash — no cost on OpenRouter)
  or_mm:    process.env.OPENROUTER_MM_MODEL       ?? 'google/gemini-2.0-flash-exp:free',
}

// ── Plan → provider + model ───────────────────────────────
interface PlanConfig { provider: LLMProvider; model: string }

const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
  free:    { provider: 'openrouter', model: MODELS.or_text },
  starter: { provider: 'openrouter', model: MODELS.or_mm   },
  builder: { provider: 'openai',     model: MODELS.openai  },
  studio:  { provider: 'claude',     model: MODELS.claude  },
}

export function configForPlan(plan?: string | null): PlanConfig {
  const tier = (plan && plan in PLAN_CONFIG ? plan : 'free') as PlanTier
  return PLAN_CONFIG[tier]
}

// ── Pricing (per 1K tokens) ───────────────────────────────
const PRICING: Record<LLMProvider, { input_per_1k: number; output_per_1k: number }> = {
  claude:     { input_per_1k: 0.003,  output_per_1k: 0.015 },
  openai:     { input_per_1k: 0.008,  output_per_1k: 0.032 }, // GPT-5 estimate
  openrouter: { input_per_1k: 0.000,  output_per_1k: 0.000 }, // free-tier models = $0
}

// ── Claude ────────────────────────────────────────────────
async function generateWithClaude(
  system:  string,
  user:    string,
  onChunk: (text: string) => void,
  model:   string,
): Promise<LLMResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const start  = Date.now()

  const stream = await client.messages.stream({
    model,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      onChunk(chunk.delta.text)
    }
  }

  const final = await stream.finalMessage()
  const { input_tokens, output_tokens } = final.usage

  return {
    tokens_input:  input_tokens,
    tokens_output: output_tokens,
    cost_usd:      computeCost(PRICING.claude, input_tokens, output_tokens),
    duration_ms:   Date.now() - start,
  }
}

// ── OpenAI ────────────────────────────────────────────────
async function generateWithOpenAI(
  system:  string,
  user:    string,
  onChunk: (text: string) => void,
  model:   string,
): Promise<LLMResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const start  = Date.now()

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    stream:     true,
    stream_options: { include_usage: true },
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
  })

  let input_tokens  = 0
  let output_tokens = 0

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) onChunk(text)
    if (chunk.usage) {
      input_tokens  = chunk.usage.prompt_tokens
      output_tokens = chunk.usage.completion_tokens
    }
  }

  return {
    tokens_input:  input_tokens,
    tokens_output: output_tokens,
    cost_usd:      computeCost(PRICING.openai, input_tokens, output_tokens),
    duration_ms:   Date.now() - start,
  }
}

// ── OpenRouter ────────────────────────────────────────────
async function generateWithOpenRouter(
  system:  string,
  user:    string,
  onChunk: (text: string) => void,
  model:   string,
): Promise<LLMResult> {
  const client = new OpenAI({
    apiKey:  process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://policypen.io',
      'X-Title':      'PolicyPen',
    },
  })
  const start = Date.now()

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    stream:     true,
    stream_options: { include_usage: true },
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
  })

  let input_tokens  = 0
  let output_tokens = 0

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) onChunk(text)
    if (chunk.usage) {
      input_tokens  = chunk.usage.prompt_tokens
      output_tokens = chunk.usage.completion_tokens
    }
  }

  return {
    tokens_input:  input_tokens,
    tokens_output: output_tokens,
    cost_usd:      computeCost(PRICING.openrouter, input_tokens, output_tokens),
    duration_ms:   Date.now() - start,
  }
}

// ── Dispatcher ────────────────────────────────────────────
export async function generateWithProvider(
  provider: LLMProvider,
  system:   string,
  user:     string,
  onChunk:  (text: string) => void,
  model:    string,
): Promise<LLMResult> {
  switch (provider) {
    case 'claude':
      return generateWithClaude(system, user, onChunk, model)
    case 'openai':
      return generateWithOpenAI(system, user, onChunk, model)
    case 'openrouter':
      return generateWithOpenRouter(system, user, onChunk, model)
  }
}

// ── Helpers ───────────────────────────────────────────────
function computeCost(
  price:        { input_per_1k: number; output_per_1k: number },
  inputTokens:  number,
  outputTokens: number,
): number {
  const raw =
    (inputTokens  / 1000) * price.input_per_1k +
    (outputTokens / 1000) * price.output_per_1k
  return Math.round(raw * 10000) / 10000
}
