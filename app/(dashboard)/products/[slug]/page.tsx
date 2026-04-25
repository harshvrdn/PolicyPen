import { notFound } from "next/navigation"
import Link from "next/link"
import { getProductBySlug, getProductPolicyStatus } from "@/lib/db/dal"
import type { PolicyType, PolicyStatus, ProductPolicyStatus } from "@/types/supabase"
import CopyButton from "@/components/CopyButton"
import CustomDomainSection from "./CustomDomainSection"
import GenerateButton from "./GenerateButton"

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
                  <GenerateButton
                    productId={product.id}
                    productSlug={product.slug}
                    policyType={type}
                    questionnaire={product.questionnaire_data as Record<string, unknown> ?? {}}
                    label={label}
                    hasExisting={hasPolicy}
                  />
                  {isActive && (
                    <a
                      href={`/p/${product.slug}/${type}`}
                      className="btn btn-secondary btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>



      <EmbedSection slug={product.slug} />

      <CustomDomainSection
        productId={product.id}
        initialDomain={product.custom_domain ?? null}
        initialVerified={product.custom_domain_verified ?? false}
        initialVerifiedAt={product.custom_domain_verified_at ?? null}
      />
    </div>
  )
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://policypen.io"

function EmbedSection({ slug }: { slug: string }) {
  const scriptTag = `<script src="${APP_URL}/widget.js" data-product="${slug}"></script>`
  const iframeTag = `<iframe src="${APP_URL}/api/widget/${slug}/iframe" width="100%" height="40" frameborder="0" scrolling="no" style="border:none;"></iframe>`

  return (
    <div className="section">
      <div className="section-title">Embed</div>
      <p className="text-muted" style={{ marginBottom: 16, fontSize: 13 }}>
        Add a policy footer to your site. Available on Builder and Studio plans.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}>Script tag</span>
            <span className="text-muted" style={{ fontSize: 12 }}>Floating footer bar, auto-dismissible</span>
          </div>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
            <pre style={{
              flex: 1,
              background: "var(--paper3)",
              border: "1px solid var(--rule2)",
              borderRadius: 4,
              padding: "10px 12px",
              fontSize: 12,
              fontFamily: "monospace",
              overflowX: "auto",
              margin: 0,
              color: "var(--ink2)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}>{scriptTag}</pre>
            <CopyButton text={scriptTag} />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}>Iframe embed</span>
            <span className="text-muted" style={{ fontSize: 12 }}>Inline policy link strip</span>
          </div>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
            <pre style={{
              flex: 1,
              background: "var(--paper3)",
              border: "1px solid var(--rule2)",
              borderRadius: 4,
              padding: "10px 12px",
              fontSize: 12,
              fontFamily: "monospace",
              overflowX: "auto",
              margin: 0,
              color: "var(--ink2)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}>{iframeTag}</pre>
            <CopyButton text={iframeTag} />
          </div>
        </div>
      </div>
    </div>
  )
}
