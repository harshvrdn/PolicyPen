"use client"

import { useState } from "react"

interface Props {
  productId: string
  initialDomain: string | null
  initialVerified: boolean
  initialVerifiedAt: string | null
}

export default function CustomDomainSection({
  productId,
  initialDomain,
  initialVerified,
  initialVerifiedAt,
}: Props) {
  const [domain, setDomain] = useState(initialDomain ?? "")
  const [savedDomain, setSavedDomain] = useState(initialDomain ?? "")
  const [verified, setVerified] = useState(initialVerified)
  const [verifiedAt, setVerifiedAt] = useState(initialVerifiedAt)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, custom_domain: domain || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: json.error ?? "Failed to save domain." })
      } else {
        setSavedDomain(json.product.custom_domain ?? "")
        setVerified(false)
        setVerifiedAt(null)
        setMessage({ type: "success", text: domain ? "Domain saved. Add the DNS records below, then verify." : "Custom domain removed." })
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    setVerifying(true)
    setMessage(null)
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      })
      const json = await res.json()
      if (json.verified) {
        setVerified(true)
        setVerifiedAt(new Date().toISOString())
        setMessage({ type: "success", text: "Domain verified successfully." })
      } else {
        setMessage({ type: "error", text: json.message ?? "Verification failed." })
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setVerifying(false)
    }
  }

  const appHost = "policypen.io"

  return (
    <div className="section">
      <div className="section-title">
        Custom Domain
        <span
          style={{
            marginLeft: 8,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--muted)",
            background: "var(--paper3)",
            border: "1px solid var(--rule2)",
            borderRadius: 4,
            padding: "2px 6px",
            verticalAlign: "middle",
          }}
        >
          Studio
        </span>
      </div>
      <p className="text-muted" style={{ marginBottom: 16, fontSize: 13 }}>
        Serve your policy pages from your own domain (e.g. <code>policies.acme.com</code>).
        Available on Studio plan.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="policies.yourdomain.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: 13,
            border: "1px solid var(--rule2)",
            borderRadius: 4,
            background: "var(--paper2)",
            color: "var(--ink1)",
            fontFamily: "monospace",
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {savedDomain && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleVerify}
            disabled={verifying || verified}
          >
            {verifying ? "Verifying…" : verified ? "✓ Verified" : "Verify Domain"}
          </button>
        )}
      </div>

      {verified && verifiedAt && (
        <div style={{ fontSize: 13, color: "var(--success, #22c55e)", marginBottom: 12 }}>
          ✓ Verified on {new Date(verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}

      {message && (
        <div
          style={{
            fontSize: 13,
            color: message.type === "success" ? "var(--success, #22c55e)" : "var(--error, #ef4444)",
            marginBottom: 12,
          }}
        >
          {message.text}
        </div>
      )}

      {savedDomain && (
        <div
          style={{
            background: "var(--paper3)",
            border: "1px solid var(--rule2)",
            borderRadius: 6,
            padding: "14px 16px",
            fontSize: 12,
            fontFamily: "monospace",
            lineHeight: 1.8,
          }}
        >
          <div style={{ marginBottom: 10, fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}>
            DNS Records Required
          </div>
          <div>
            <strong>CNAME record</strong>
            <br />
            Name: <code>{savedDomain.split(".").slice(0, -2).join(".") || "@"}</code>
            <br />
            Value: <code>{appHost}</code>
          </div>
          <div style={{ marginTop: 10 }}>
            <strong>TXT record (ownership verification)</strong>
            <br />
            Name: <code>_policypen.{savedDomain}</code>
            <br />
            Value: <code>policypen-verify={productId}</code>
          </div>
        </div>
      )}
    </div>
  )
}
