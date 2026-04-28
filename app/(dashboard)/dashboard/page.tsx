import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getUserDashboard, getUserProducts, getLawUpdates, getCurrentUser } from "@/lib/db/dal"
import type { LawUpdateSeverity, UserDashboard } from "@/types/supabase"

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

function UpgradeCTA() {
  return (
    <div className="upgrade-cta">
      <div className="upgrade-cta-text">
        <strong>You&rsquo;re on the free plan.</strong>
        <span>Upgrade to generate unlimited policies, cover more jurisdictions, and unlock PDF exports.</span>
      </div>
      <Link href="/settings" className="btn btn-primary btn-sm">
        Upgrade →
      </Link>
    </div>
  )
}

function UsageMeter({ dashboard }: { dashboard: UserDashboard }) {
  const used = dashboard.ai_tokens_used_month ?? 0
  const FREE_LIMIT = 50_000
  const pct = Math.min(100, Math.round((used / FREE_LIMIT) * 100))
  const isNearLimit = pct >= 80

  return (
    <div className="stat-card">
      <div className="stat-label" style={{ marginBottom: 10 }}>Token usage this month</div>
      <div className="usage-bar-track">
        <div
          className="usage-bar-fill"
          style={{
            width: `${pct}%`,
            background: isNearLimit ? "#92400e" : "var(--accent)",
          }}
        />
      </div>
      <div className="usage-bar-numbers">
        <span style={{ color: isNearLimit ? "#92400e" : undefined }}>
          {used.toLocaleString()}
        </span>
        <span>{FREE_LIMIT.toLocaleString()} tokens</span>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  const [clerkUser, dashboard, dbUser, products, lawUpdates] = await Promise.all([
    currentUser(),
    getUserDashboard().catch(() => null),
    getCurrentUser(userId).catch(() => null),
    getUserProducts().catch(() => []),
    getLawUpdates(3).catch(() => []),
  ])

  const firstName = clerkUser?.firstName || "there"

  // First-time users who haven't completed onboarding
  if (dbUser && !dbUser.onboarding_completed) {
    redirect("/onboarding")
  }

  // Users who completed onboarding but haven't created a product yet
  if (
    dashboard &&
    (dashboard.products_count ?? 0) === 0 &&
    (dashboard.policies_generated_total ?? 0) === 0
  ) {
    redirect("/products/new")
  }

  const isFree = (dashboard?.plan ?? "free") === "free"

  return (
    <div className="page">
      <h1 className="welcome-heading">{greeting()}, {firstName}.</h1>
      <p className="welcome-sub">Here&rsquo;s an overview of your PolicyPen workspace.</p>

      {isFree && <UpgradeCTA />}

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

      {isFree && dashboard && <UsageMeter dashboard={dashboard} />}

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
