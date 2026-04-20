import { auth, currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { getUserDashboard, getUserProducts, getLawUpdates } from "@/lib/db/dal"
import type { LawUpdateSeverity } from "@/types/supabase"

function greeting(): string {
  const h = new Date().getUTCHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function PlanBadge({ plan }: { plan: string }) {
  return <span className={`badge badge-${plan}`}>{plan}</span>
}

function SeverityBadge({ severity }: { severity: LawUpdateSeverity }) {
  return <span className={`badge severity-${severity}`}>{severity}</span>
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  const [clerkUser, dashboard, products, lawUpdates] = await Promise.all([
    currentUser(),
    getUserDashboard().catch(() => null),
    getUserProducts().catch(() => []),
    getLawUpdates(3).catch(() => []),
  ])

  const firstName = clerkUser?.firstName || "there"

  return (
    <div className="page">
      <h1 className="welcome-heading">{greeting()}, {firstName}.</h1>
      <p className="welcome-sub">Here&rsquo;s an overview of your PolicyPen workspace.</p>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{dashboard?.products_count ?? 0}</div>
          <div className="stat-label">Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{dashboard?.policies_generated_total ?? 0}</div>
          <div className="stat-label">Policies generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            <PlanBadge plan={dashboard?.plan ?? "free"} />
          </div>
          <div className="stat-label">Current plan</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Your Products</div>
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No products yet</div>
            <p className="empty-state-text">
              Add your first product to start generating legal policies.
            </p>
            <Link href="/products/new" className="btn btn-primary">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="product-card">
                <div className="product-card-name">{product.name}</div>
                {product.website_url && (
                  <div className="product-card-url">{product.website_url}</div>
                )}
                <div className="product-card-footer">
                  <span className="badge badge-draft">{product.primary_jurisdiction}</span>
                  <span className="product-card-date">{formatDate(product.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {lawUpdates.length > 0 && (
        <div className="section">
          <div className="section-title">Recent Law Updates</div>
          <div className="law-update-list">
            {lawUpdates.map((update) => (
              <div key={update.id} className="law-update-item">
                <div className="law-update-header">
                  <SeverityBadge severity={update.severity} />
                  <span className="law-update-title">{update.title}</span>
                </div>
                <div className="law-update-summary">{update.summary}</div>
                <div className="law-update-meta">
                  {update.regulation} &middot; {formatDate(update.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
