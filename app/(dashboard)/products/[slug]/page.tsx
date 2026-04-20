import { notFound } from "next/navigation"
import Link from "next/link"
import { getProductBySlug, getProductPolicyStatus } from "@/lib/db/dal"
import type { PolicyType, PolicyStatus, ProductPolicyStatus } from "@/types/supabase"

const POLICY_TYPES: { type: PolicyType; label: string }[] = [
  { type: "privacy_policy",   label: "Privacy Policy" },
  { type: "terms_of_service", label: "Terms of Service" },
  { type: "cookie_policy",    label: "Cookie Policy" },
  { type: "refund_policy",    label: "Refund Policy" },
]

function StatusBadge({ status }: { status: PolicyStatus | string }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug).catch(() => null)
  if (!product) notFound()

  const policyStatuses = await getProductPolicyStatus(product.id).catch((): ProductPolicyStatus[] => [])

  const statusMap = new Map<string, ProductPolicyStatus>()
  for (const s of policyStatuses) {
    if (s.policy_type) statusMap.set(s.policy_type, s)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="product-header">
          <h1 className="product-title">{product.name}</h1>
          {product.website_url && (
            <div className="product-website">
              <a href={product.website_url} target="_blank" rel="noopener noreferrer">
                {product.website_url}
              </a>
            </div>
          )}
          <div className="product-meta-row">
            <span className="badge badge-draft">{product.primary_jurisdiction}</span>
            {product.business_type && (
              <span className="text-muted">{product.business_type}</span>
            )}
            <span className="text-muted">Added {formatDate(product.created_at)}</span>
          </div>
        </div>
        <Link href="/products" className="btn btn-secondary btn-sm">← Products</Link>
      </div>

      <div className="section">
        <div className="section-title">Policies</div>
        <div className="policy-grid">
          {POLICY_TYPES.map(({ type, label }) => {
            const status = statusMap.get(type)
            const hasPolicy = !!status && status.status !== null
            const isActive = status?.status === "active"

            return (
              <div key={type} className="policy-card">
                <div className="policy-card-header">
                  <span className="policy-card-name">{label}</span>
                  {hasPolicy && status.status && (
                    <StatusBadge status={status.status} />
                  )}
                </div>

                {hasPolicy && (
                  <div className="policy-card-meta">
                    {status.version != null && `v${status.version}`}
                    {status.generated_at && ` · ${formatDate(status.generated_at)}`}
                    {status.word_count != null && ` · ${status.word_count.toLocaleString()} words`}
                  </div>
                )}

                {!hasPolicy && (
                  <div className="policy-card-meta" style={{ color: "var(--muted)" }}>
                    Not generated yet
                  </div>
                )}

                <div className="policy-card-actions">
                  {!hasPolicy ? (
                    <button className="btn btn-primary btn-sm" disabled title="Generation coming soon">
                      Generate
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-secondary btn-sm" disabled title="Regeneration coming soon">
                        Regenerate
                      </button>
                      {isActive && (
                        <a
                          href={`/p/${product.slug}?type=${type}`}
                          className="btn btn-secondary btn-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="section">
        <button className="btn btn-primary" disabled title="Coming soon">
          Generate All Policies
        </button>
        <span className="text-muted" style={{ marginLeft: 12 }}>
          Generates all 4 policies in sequence
        </span>
      </div>
    </div>
  )
}
