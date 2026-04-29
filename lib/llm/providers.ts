// ============================================================
// PolicyPen — Multi-LLM Provider Abstraction
// Supports: Claude (Anthropic), OpenAI (GPT-4o), OpenRouter
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type LLMProvider = 'claude' | 'openai' | 'openrouter'

export interface LLMResult {
  tokens_input:  number
  tokens_output: number
  cost_usd:      number
  duration_ms:   number
}

// ── Pricing (per 1K tokens) ───────────────────────────────
const PRICING: Record<LLMProvider, { input_per_1k: number; output_per_1k: number }> = {
  claude:     { input_per_1k: 0.003,  output_per_1k: 0.015  },
  openai:     { input_per_1k: 0.0025, output_per_1k: 0.010  },
  openrouter: { input_per_1k: 0.001,  output_per_1k: 0.004  }, // approximate; varies by model
}

// ── Model IDs ─────────────────────────────────────────────
const CLAUDE_MODEL     = 'claude-sonnet-4-6'
const OPENAI_MODEL     = 'gpt-4o'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'google/gemini-flash-1.5'

// ── Claude ────────────────────────────────────────────────
async function generateWithClaude(
  system:   string,
  user:     string,
  onChunk:  (text: string) => void,
): Promise<LLMResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const start  = Date.now()

  const stream = await client.messages.stream({
    model:      CLAUDE_MODEL,
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
  const price = PRICING.claude

  return {
    tokens_input:  input_tokens,
    tokens_output: output_tokens,
    cost_usd:      computeCost(price, input_tokens, output_tokens),
    duration_ms:   Date.now() - start,
  }
}

// ── OpenAI ────────────────────────────────────────────────
async function generateWithOpenAI(
  system:   string,
  user:     string,
  onChunk:  (text: string) => void,
): Promise<LLMResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const start  = Date.now()

  const stream = await client.chat.completions.create({
    model:      OPENAI_MODEL,
    max_tokens: 4096,
    stream:     true,
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

  const price = PRICING.openai

  return {
    tokens_input:  input_tokens,
    tokens_output: output_tokens,
    cost_usd:      computeCost(price, input_tokens, output_tokens),
    duration_ms:   Date.now() - start,
  }
}

// ── OpenRouter ────────────────────────────────────────────
async function generateWithOpenRouter(
  system:   string,
  user:     string,
  onChunk:  (text: string) => void,
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
    model:      OPENROUTER_MODEL,
    max_tokens: 4096,
    stream:     true,
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

  const price = PRICING.openrouter

  return {
    tokens_input:  input_tokens,
    tokens_output: output_tokens,
    cost_usd:      computeCost(price, input_tokens, output_tokens),
    duration_ms:   Date.now() - start,
  }
}

// ── Dispatcher ────────────────────────────────────────────
export async function generateWithProvider(
  provider: LLMProvider,
  system:   string,
  user:     string,
  onChunk:  (text: string) => void,
): Promise<LLMResult> {
  switch (provider) {
    case 'claude':
      return generateWithClaude(system, user, onChunk)
    case 'openai':
      return generateWithOpenAI(system, user, onChunk)
    case 'openrouter':
      return generateWithOpenRouter(system, user, onChunk)
  }
}

// ── Helpers ───────────────────────────────────────────────
function computeCost(
  price: { input_per_1k: number; output_per_1k: number },
  inputTokens: number,
  outputTokens: number,
): number {
  const raw =
    (inputTokens  / 1000) * price.input_per_1k +
    (outputTokens / 1000) * price.output_per_1k
  return Math.round(raw * 10000) / 10000
}

export function resolveProvider(raw?: string): LLMProvider {
  if (raw === 'openai' || raw === 'openrouter' || raw === 'claude') return raw
  return 'claude'
}
