"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

interface Props {
  productId: string
  productName: string
}

export default function DeleteProductButton({ productId, productName }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to delete product")
      }
      toast(`"${productName}" deleted.`, "success")
      router.push("/products")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete product", "error")
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Delete &ldquo;{productName}&rdquo; and all its policies?
        </span>
        <button
          className="btn btn-sm"
          style={{ background: "var(--red)", color: "#fff", border: "none" }}
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancel
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
      Delete product
    </button>
  )
}
