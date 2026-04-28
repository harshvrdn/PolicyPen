"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { markOnboardingDone } from "./actions"

const BUSINESS_TYPES = ["SaaS", "Mobile App", "E-commerce", "Other"]

const JURISDICTIONS = [
  { value: "US",     label: "United States" },
  { value: "EU",     label: "EU / GDPR" },
  { value: "UK",     label: "United Kingdom" },
  { value: "CA",     label: "Canada (PIPEDA)" },
  { value: "AU",     label: "Australia" },
  { value: "BR",     label: "Brazil (LGPD)" },
  { value: "IN",     label: "India (DPDP)" },
  { value: "GLOBAL", label: "Global (all of the above)" },
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  const [screen, setScreen]         = useState(0) // 0=welcome 1=setup 2=done
  const [loading, setLoading]       = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState("")
  const [createdSlug, setCreatedSlug] = useState("")
  const [createdName, setCreatedName] = useState("")

  // Form fields for screen 1
  const [name,         setName]         = useState("")
  const [websiteUrl,   setWebsiteUrl]   = useState("")
  const [businessType, setBusinessType] = useState("")
  const [jurisdiction, setJurisdiction] = useState("US")
  const [email,        setEmail]        = useState("")

  // Pre-fill email from Clerk
  useEffect(() => {
    const primary = user?.primaryEmailAddress?.emailAddress
    if (primary) setEmail(primary)
  }, [user])

  if (isLoaded && !isSignedIn) {
    router.replace("/sign-in")
    return null
  }

  const firstName = user?.firstName ?? "there"

  function handleSkip() {
    startTransition(async () => {
      await markOnboardingDone()
      router.replace("/dashboard")
    })
  }

  function validate(): string {
    if (!name.trim())     return "Product name is required."
    if (!businessType)    return "Please select a product type."
    if (!email.trim())    return "Contact email is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address."
    return ""
  }

  async function handleCreate() {
    const msg = validate()
    if (msg) { setError(msg); return }

    setLoading(true)
    setError("")

    try {
      const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6)

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          website_url: websiteUrl.trim() || undefined,
          business_type: businessType,
          description: "",
          primary_jurisdiction: jurisdiction,
          company_legal_name: "",
          company_address: "",
          contact_email: email.trim(),
          questionnaire_data: {
            data_collected: [],
            uses_cookies: false,
            shares_with_third_parties: false,
            needed_policies: ["privacy_policy"],
          },
        }),
      })

      const resClone = res.clone()
      let data: { error?: string; product?: { slug: string } } = {}
      try {
        data = await res.json()
      } catch {
        const text = await resClone.text().catch(() => "")
        setError(`Server error ${res.status}: ${text.slice(0, 200) || "(empty response)"}`)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`)
        setLoading(false)
        return
      }

      await markOnboardingDone()

      setCreatedSlug(data.product?.slug ?? slug)
      setCreatedName(name.trim())
      setScreen(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-wrap">

      {/* ── Screen 0: Welcome ───────────────────────────────────────────── */}
      {screen === 0 && (
        <div className="onboarding-screen">
          <div className="onboarding-logo">PolicyPen</div>
          <h1 className="onboarding-heading">Welcome, {firstName}.</h1>
          <p className="onboarding-sub">
            You&rsquo;re 2 minutes away from having proper legal policies for your product.
          </p>
          <ul className="onboarding-bullets">
            <li className="onboarding-bullet">
              <span className="onboarding-bullet-icon">1</span>
              Tell us about your product — takes about 30 seconds
            </li>
            <li className="onboarding-bullet">
              <span className="onboarding-bullet-icon">2</span>
              Claude generates jurisdiction-aware Privacy Policy, Terms &amp; more
            </li>
            <li className="onboarding-bullet">
              <span className="onboarding-bullet-icon">3</span>
              Get a hosted policy link — embed it anywhere, instantly
            </li>
          </ul>
          <div className="onboarding-actions">
            <button className="btn btn-primary" onClick={() => setScreen(1)}>
              Let&rsquo;s get started →
            </button>
            <button
              className="onboarding-skip"
              onClick={handleSkip}
              disabled={isPending}
            >
              {isPending ? "Skipping…" : "Skip for now"}
            </button>
          </div>
        </div>
      )}

      {/* ── Screen 1: Quick product setup ───────────────────────────────── */}
      {screen === 1 && (
        <div className="onboarding-screen">
          <div className="onboarding-logo">PolicyPen</div>
          <h1 className="onboarding-heading">Tell us about your product</h1>
          <p className="onboarding-sub">
            Just the basics — you can fill in more detail later from your product settings.
          </p>

          {error && (
            <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>
          )}

          <div className="form-step">
            <div className="form-group">
              <label className="form-label">
                Product / company name <span className="req">*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Acme SaaS"
                value={name}
                onChange={(e) => { setName(e.target.value); setError("") }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Product type <span className="req">*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {BUSINESS_TYPES.map((t) => (
                  <label
                    key={t}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      border: `1px solid ${businessType === t ? "var(--accent-border)" : "var(--rule)"}`,
                      borderRadius: 6, cursor: "pointer",
                      background: businessType === t ? "var(--accent-light)" : "white",
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="business_type"
                      value={t}
                      checked={businessType === t}
                      onChange={() => { setBusinessType(t); setError("") }}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Primary jurisdiction</label>
              <select
                className="form-input"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Contact email <span className="req">*</span>
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError("") }}
              />
              <span className="form-hint">Used as the legal contact address in your policies.</span>
            </div>
          </div>

          <div className="onboarding-actions" style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creating…" : "Create my product →"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setScreen(0); setError("") }}
              disabled={loading}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* ── Screen 2: Done ──────────────────────────────────────────────── */}
      {screen === 2 && (
        <div className="onboarding-screen">
          <div className="onboarding-logo">PolicyPen</div>
          <div className="onboarding-success-icon">✓</div>
          <h1 className="onboarding-heading">You&rsquo;re all set!</h1>
          <p className="onboarding-sub">
            <strong>{createdName}</strong> is ready. Click below to generate your first policies — it takes under 2 minutes.
          </p>
          <div className="onboarding-actions" style={{ marginTop: 32 }}>
            <Link href={`/products/${createdSlug}`} className="btn btn-primary">
              Generate my first policy →
            </Link>
            <Link href="/dashboard" className="btn btn-secondary">
              Go to dashboard
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
