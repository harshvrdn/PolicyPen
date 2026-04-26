"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

interface Props {
  policyId: string
  policyLabel: string
}

export default function DeletePolicyButton({ policyId, policyLabel }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/policies/${policyId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to delete policy")
      }
      toast(`${policyLabel} archived.`, "success")
      router.refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete policy", "error")
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Archive?</span>
        <button
          className="btn btn-sm"
          style={{ background: "var(--red)", color: "#fff", borderColor: "var(--red)" }}
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "…" : "Yes"}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      style={{ color: "var(--red)", borderColor: "rgba(122,26,26,0.25)" }}
      onClick={() => setConfirming(true)}
    >
      Delete
    </button>
  )
}
