"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { PolicyType } from "@/types/supabase"

interface Props {
  productId: string
  productSlug: string
  policyType: PolicyType
  questionnaire: Record<string, unknown>
  label: string
  hasExisting: boolean
}

const SHORT_TYPE: Record<PolicyType, string> = {
  privacy_policy:   "privacy",
  terms_of_service: "tos",
  cookie_policy:    "cookie",
  refund_policy:    "refund",
  dpa:              "privacy",
}

export default function GenerateButton({
  productId,
  policyType,
  questionnaire,
  label,
  hasExisting,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "generating" | "done" | "error">("idle")
  const [error, setError] = useState("")

  async function handleGenerate() {
    setState("generating")
    setError("")

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id:  productId,
          policy_type: SHORT_TYPE[policyType],
          questionnaire,
        }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Generation failed")
      }

      // Consume SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.done) {
              setState("done")
              router.refresh()
              return
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              throw e
            }
          }
        }
      }

      setState("done")
      router.refresh()
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "Generation failed")
    }
  }

  if (state === "generating") {
    return (
      <button className="btn btn-primary btn-sm" disabled>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="spinner" /> Generating…
        </span>
      </button>
    )
  }

  if (state === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate}>
          Retry
        </button>
        <span style={{ fontSize: 11, color: "var(--error, #f87171)" }}>{error}</span>
      </div>
    )
  }

  return (
    <button className="btn btn-primary btn-sm" onClick={handleGenerate}>
      {hasExisting ? `Regenerate` : `Generate`}
    </button>
  )
}
