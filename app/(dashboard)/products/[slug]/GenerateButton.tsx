"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { PolicyType } from "@/types/supabase"
import { useToast } from "@/components/Toast"

interface Props {
  productId: string
  productSlug: string
  policyType: PolicyType
  questionnaire: Record<string, unknown>
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
  hasExisting,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [state, setState] = useState<"idle" | "generating" | "error">("idle")

  async function handleGenerate() {
    setState("generating")

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
              setState("idle")
              toast("Policy generated successfully.", "success")
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

      setState("idle")
      router.refresh()
    } catch (e) {
      setState("error")
      const message = e instanceof Error ? e.message : "Generation failed"
      toast(message, "error")
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

  return (
    <button className="btn btn-primary btn-sm" onClick={handleGenerate}>
      {state === "error" ? "Retry" : hasExisting ? "Regenerate" : "Generate"}
    </button>
  )
}
