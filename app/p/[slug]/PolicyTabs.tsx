"use client"

import { useState } from "react"
import type { Policy } from "@/types/supabase"

const POLICY_LABELS: Record<string, string> = {
  privacy_policy: "Privacy Policy",
  terms_of_service: "Terms of Service",
  cookie_policy: "Cookie Policy",
  refund_policy: "Refund Policy",
  dpa: "Data Processing Agreement",
}

const TAB_ORDER = [
  "privacy_policy",
  "terms_of_service",
  "cookie_policy",
  "refund_policy",
  "dpa",
]

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function PolicyTabs({ policies }: { policies: Policy[] }) {
  const sorted = [...policies].sort(
    (a, b) => TAB_ORDER.indexOf(a.policy_type) - TAB_ORDER.indexOf(b.policy_type)
  )

  const [activeType, setActiveType] = useState(sorted[0]?.policy_type ?? "")
  const active = sorted.find((p) => p.policy_type === activeType)

  if (sorted.length === 0) {
    return <p className="policy-empty">No policies published yet.</p>
  }

  return (
    <>
      <div className="policy-tabs" role="tablist">
        {sorted.map((p) => (
          <button
            key={p.policy_type}
            role="tab"
            aria-selected={p.policy_type === activeType}
            className={`policy-tab${p.policy_type === activeType ? " active" : ""}`}
            onClick={() => setActiveType(p.policy_type)}
          >
            {POLICY_LABELS[p.policy_type] ?? p.policy_type}
          </button>
        ))}
      </div>

      {active && (
        <div className="policy-content" role="tabpanel">
          <div className="policy-meta">
            <span>Last updated: {formatDate(active.published_at ?? active.updated_at)}</span>
            <span>Version {active.version}</span>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: active.content_html ?? "" }}
          />
        </div>
      )}
    </>
  )
}
