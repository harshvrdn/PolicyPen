"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import type { User } from "@/types/supabase"

interface Props {
  dbUser: User | null
}

const PRICING = [
  {
    name: "Starter",
    price: 9,
    features: ["1 product", "4 policy types", "Basic jurisdictions", "PDF export"],
  },
  {
    name: "Builder",
    price: 29,
    featured: true,
    features: ["5 products", "All policy types", "Multi-jurisdiction", "Law update alerts", "Custom branding"],
  },
  {
    name: "Studio",
    price: 59,
    features: ["Unlimited products", "All policy types", "Priority support", "API access", "White-label"],
  },
]

export default function SettingsTabs({ dbUser }: Props) {
  const [tab, setTab] = useState<"account" | "billing">("account")
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const { user: clerkUser } = useUser()
  const router = useRouter()

  async function handleUpgrade(plan: string) {
    setUpgrading(plan)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.checkout_url) {
        router.push(data.checkout_url)
      } else {
        alert(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      alert("Failed to start checkout. Please try again.")
    } finally {
      setUpgrading(null)
    }
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? dbUser?.email ?? "—"
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || dbUser?.full_name || "—"
  const plan = dbUser?.plan ?? "free"

  return (
    <>
      <div className="tabs">
        <button
          className={`tab-btn${tab === "account" ? " active" : ""}`}
          onClick={() => setTab("account")}
        >
          Account
        </button>
        <button
          className={`tab-btn${tab === "billing" ? " active" : ""}`}
          onClick={() => setTab("billing")}
        >
          Billing
        </button>
      </div>

      {tab === "account" && (
        <>
          <div className="settings-section">
            <div className="settings-section-title">Profile</div>
            <div className="card">
              <div className="info-row">
                <span className="info-label">Name</span>
                <span className="info-value">{name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Plan</span>
                <span className="info-value">
                  <span className={`badge badge-${plan}`}>{plan}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Usage</div>
            <div className="card">
              <div className="info-row">
                <span className="info-label">Products</span>
                <span className="info-value">
                  {dbUser?.products_count ?? 0}
                  {dbUser?.max_products != null && ` / ${dbUser.max_products}`}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Policies generated</span>
                <span className="info-value">{dbUser?.policies_generated_total ?? 0} total</span>
              </div>
              <div className="info-row">
                <span className="info-label">AI tokens (this month)</span>
                <span className="info-value">{(dbUser?.ai_tokens_used_month ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "billing" && (
        <>
          <div className="settings-section">
            <div className="settings-section-title">Plans</div>
            <div className="pricing-grid">
              {PRICING.map((p) => {
                const planKey = p.name.toLowerCase()
                const isCurrentPlan = plan === planKey
                const isLoading = upgrading === planKey
                return (
                  <div key={p.name} className={`pricing-card${p.featured ? " featured" : ""}`}>
                    <div className="pricing-plan-name">{p.name}</div>
                    <div className="pricing-price">
                      <sup>$</sup>{p.price}
                      <span className="pricing-price-mo">/mo</span>
                    </div>
                    <ul className="pricing-features">
                      {p.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    {isCurrentPlan ? (
                      <button className="btn btn-secondary" disabled style={{ width: "100%", justifyContent: "center" }}>
                        Current plan
                      </button>
                    ) : (
                      <button
                        className={`btn${p.featured ? " btn-primary" : " btn-secondary"}`}
                        style={{ width: "100%", justifyContent: "center" }}
                        disabled={isLoading || !!upgrading}
                        onClick={() => handleUpgrade(planKey)}
                      >
                        {isLoading ? "Redirecting…" : `Upgrade to ${p.name}`}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
