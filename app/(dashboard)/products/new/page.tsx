"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"

// ─── Types ─────────────────────────────────────────────────────────────────

interface Step1 {
  name: string
  website_url: string
  business_type: string
  description: string
}

interface Step2 {
  data_collected: string[]
  uses_cookies: boolean
  shares_with_third_parties: boolean
  contact_email: string
}

interface Step3 {
  primary_jurisdiction: string
  company_legal_name: string
  company_address: string
}

interface Step4 {
  needed_policies: string[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  "Entity Info",
  "Data Practices",
  "Jurisdictions",
  "Policy Types",
  "Review",
]

const BUSINESS_TYPES = ["SaaS", "Mobile App", "E-commerce", "Other"]

const DATA_TYPES = [
  { value: "email_addresses", label: "Email addresses" },
  { value: "payment_info", label: "Payment information" },
  { value: "location_data", label: "Location data" },
  { value: "usage_analytics", label: "Usage & analytics" },
  { value: "health_data", label: "Health or sensitive data" },
  { value: "third_party_auth", label: "Third-party sign-in (Google, GitHub…)" },
]

const JURISDICTIONS = [
  { value: "US", label: "United States" },
  { value: "EU", label: "EU / GDPR" },
  { value: "UK", label: "United Kingdom" },
  { value: "CA", label: "Canada (PIPEDA)" },
  { value: "AU", label: "Australia" },
  { value: "BR", label: "Brazil (LGPD)" },
  { value: "IN", label: "India (DPDP 2023)" },
  { value: "GLOBAL", label: "Global (all of the above)" },
]

const POLICY_OPTIONS = [
  { value: "privacy_policy", label: "Privacy Policy", hint: "Required in most jurisdictions", required: true },
  { value: "terms_of_service", label: "Terms of Service", hint: "Governs use of your product", required: false },
  { value: "cookie_policy", label: "Cookie Policy", hint: "Required if you use cookies", required: false },
  { value: "refund_policy", label: "Refund Policy", hint: "Recommended for paid products", required: false },
]

const STEP1_INIT: Step1 = { name: "", website_url: "", business_type: "", description: "" }
const STEP2_INIT: Step2 = { data_collected: [], uses_cookies: false, shares_with_third_parties: false, contact_email: "" }
const STEP3_INIT: Step3 = { primary_jurisdiction: "US", company_legal_name: "", company_address: "" }
const STEP4_INIT: Step4 = { needed_policies: ["privacy_policy"] }

// ─── Helpers ────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, flexShrink: 0,
          background: checked ? "var(--accent)" : "var(--rule2)",
          position: "relative", transition: "background 0.2s", cursor: "pointer",
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ fontSize: 14, color: "var(--ink2)" }}>{label}</span>
    </label>
  )
}

function CheckCard({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
      border: `1px solid ${checked ? "var(--accent-border)" : "var(--rule)"}`,
      borderRadius: 6, cursor: "pointer",
      background: checked ? "var(--accent-light)" : "white",
      transition: "border-color 0.15s, background 0.15s",
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 2, accentColor: "var(--accent)", flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{hint}</div>}
      </div>
    </label>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ color: "var(--muted)", fontSize: 13, width: 180, paddingBottom: 10, verticalAlign: "top" }}>{label}</td>
      <td style={{ fontSize: 14, color: "var(--ink)", paddingBottom: 10 }}>{value || <span style={{ color: "var(--muted)" }}>—</span>}</td>
    </tr>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [step, setStep] = useState(0)
  const [s1, setS1] = useState<Step1>(STEP1_INIT)
  const [s2, setS2] = useState<Step2>(STEP2_INIT)
  const [s3, setS3] = useState<Step3>(STEP3_INIT)
  const [s4, setS4] = useState<Step4>(STEP4_INIT)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { setError("") }, [])
  useEffect(() => { setError("") }, [step])

  // Auth check — middleware already protects this, but guard client-side too
  if (isLoaded && !isSignedIn) {
    router.replace("/sign-in")
    return null
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): string {
    if (step === 0) {
      if (!s1.name.trim()) return "Product name is required."
      if (!s1.business_type) return "Please select a product type."
    }
    if (step === 1) {
      if (!s2.contact_email.trim()) return "Contact email is required."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s2.contact_email)) return "Please enter a valid email address."
    }
    if (step === 3) {
      if (s4.needed_policies.length === 0) return "Select at least one policy type."
    }
    return ""
  }

  function advance() {
    const msg = validate()
    if (msg) { setError(msg); return }
    setError("")
    setStep((s) => s + 1)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const msg = validate()
    if (msg) { setError(msg); return }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s1.name,
          website_url: s1.website_url,
          business_type: s1.business_type,
          description: s1.description,
          primary_jurisdiction: s3.primary_jurisdiction,
          company_legal_name: s3.company_legal_name,
          company_address: s3.company_address,
          contact_email: s2.contact_email,
          questionnaire_data: {
            data_collected: s2.data_collected,
            uses_cookies: s2.uses_cookies,
            shares_with_third_parties: s2.shares_with_third_parties,
            needed_policies: s4.needed_policies,
          },
        }),
      })

      // Parse response body — handle non-JSON responses gracefully
      let data: { error?: string; product?: { slug: string } } = {}
      try {
        data = await res.json()
      } catch {
        const text = await res.text().catch(() => "")
        const msg = `Server returned ${res.status} — ${text.slice(0, 120) || "no response body"}`
        console.error("[NewProduct] API parse error:", msg)
        setError(msg)
        setLoading(false)
        return
      }

      if (!res.ok) {
        const errMsg = data.error || `Request failed with status ${res.status}`
        console.error("[NewProduct] API error:", errMsg)
        setError(errMsg)
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong. Please try again."
      console.error("[NewProduct] Unexpected error:", e)
      setError(errMsg)
      setLoading(false)
    }
  }

  // ── Step content ──────────────────────────────────────────────────────────

  const jurLabel = JURISDICTIONS.find((j) => j.value === s3.primary_jurisdiction)?.label ?? s3.primary_jurisdiction

  return (
    <>
      <div className="wizard-page">
        <div className="page-header" style={{ marginBottom: 32 }}>
          <div>
            <h1 className="page-title">New Product</h1>
            <p className="page-subtitle">Set up a product to start generating legal policies.</p>
          </div>
          <Link href="/products" className="btn btn-secondary">Cancel</Link>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: 24 }}>{error}</div>
        )}

        {/* ── Step 0: Entity Info ── */}
        {step === 0 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">
                Product / company name <span className="req">*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Acme SaaS"
                value={s1.name}
                onChange={(e) => setS1((p) => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://example.com"
                value={s1.website_url}
                onChange={(e) => setS1((p) => ({ ...p, website_url: e.target.value }))}
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
                      padding: "10px 14px", border: `1px solid ${s1.business_type === t ? "var(--accent-border)" : "var(--rule)"}`,
                      borderRadius: 6, cursor: "pointer",
                      background: s1.business_type === t ? "var(--accent-light)" : "white",
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="business_type"
                      value={t}
                      checked={s1.business_type === t}
                      onChange={() => setS1((p) => ({ ...p, business_type: t }))}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business description</label>
              <textarea
                className="form-textarea"
                placeholder="Briefly describe what your product does and who it's for..."
                value={s1.description}
                onChange={(e) => setS1((p) => ({ ...p, description: e.target.value }))}
                style={{ minHeight: 88 }}
              />
              <span className="form-hint">Used to tailor the language in your generated policies.</span>
            </div>
          </div>
        )}

        {/* ── Step 1: Data Practices ── */}
        {step === 1 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">What personal data do you collect?</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DATA_TYPES.map((dt) => (
                  <CheckCard
                    key={dt.value}
                    checked={s2.data_collected.includes(dt.value)}
                    onChange={(checked) =>
                      setS2((p) => ({
                        ...p,
                        data_collected: checked
                          ? [...p.data_collected, dt.value]
                          : p.data_collected.filter((v) => v !== dt.value),
                      }))
                    }
                    label={dt.label}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tracking & sharing</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Toggle
                  checked={s2.uses_cookies}
                  onChange={(v) => setS2((p) => ({ ...p, uses_cookies: v }))}
                  label="We use cookies or similar tracking technologies"
                />
                <Toggle
                  checked={s2.shares_with_third_parties}
                  onChange={(v) => setS2((p) => ({ ...p, shares_with_third_parties: v }))}
                  label="We share data with third-party services or partners"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Contact email for data requests <span className="req">*</span>
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="privacy@example.com"
                value={s2.contact_email}
                onChange={(e) => setS2((p) => ({ ...p, contact_email: e.target.value }))}
              />
              <span className="form-hint">
                Shown in your privacy policy as the contact for data subject requests (GDPR, CCPA).
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Jurisdictions ── */}
        {step === 2 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">Primary jurisdiction</label>
              <select
                className="form-select"
                value={s3.primary_jurisdiction}
                onChange={(e) => setS3((p) => ({ ...p, primary_jurisdiction: e.target.value }))}
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
              <span className="form-hint">
                Determines which privacy regulations apply — GDPR, CCPA, PIPEDA, etc.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Company legal name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Acme Inc."
                value={s3.company_legal_name}
                onChange={(e) => setS3((p) => ({ ...p, company_legal_name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Registered address</label>
              <textarea
                className="form-textarea"
                placeholder={"123 Main St, Suite 100\nSan Francisco, CA 94102, US"}
                value={s3.company_address}
                onChange={(e) => setS3((p) => ({ ...p, company_address: e.target.value }))}
                style={{ minHeight: 70 }}
              />
              <span className="form-hint">Used in policy headers and as the data controller address.</span>
            </div>
          </div>
        )}

        {/* ── Step 3: Policy Types ── */}
        {step === 3 && (
          <div className="form-step">
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>
              Select the policies you need. You can generate them in any order after setup.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {POLICY_OPTIONS.map((p) => (
                <CheckCard
                  key={p.value}
                  checked={s4.needed_policies.includes(p.value)}
                  onChange={(checked) => {
                    if (p.required && !checked) return // privacy policy always required
                    setS4((prev) => ({
                      needed_policies: checked
                        ? [...prev.needed_policies, p.value]
                        : prev.needed_policies.filter((v) => v !== p.value),
                    }))
                  }}
                  label={p.label}
                  hint={p.required ? `${p.hint} — always included` : p.hint}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="form-step">
            <div className="card" style={{ marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <ReviewRow label="Product name" value={s1.name} />
                  {s1.website_url && <ReviewRow label="Website" value={s1.website_url} />}
                  <ReviewRow label="Product type" value={s1.business_type} />
                  {s1.description && <ReviewRow label="Description" value={s1.description} />}
                  <ReviewRow label="Contact email" value={s2.contact_email} />
                  <ReviewRow
                    label="Data collected"
                    value={
                      s2.data_collected.length === 0
                        ? "None selected"
                        : s2.data_collected
                            .map((v) => DATA_TYPES.find((d) => d.value === v)?.label ?? v)
                            .join(", ")
                    }
                  />
                  <ReviewRow label="Uses cookies" value={s2.uses_cookies ? "Yes" : "No"} />
                  <ReviewRow label="Shares with third parties" value={s2.shares_with_third_parties ? "Yes" : "No"} />
                  <ReviewRow label="Jurisdiction" value={jurLabel} />
                  {s3.company_legal_name && <ReviewRow label="Legal name" value={s3.company_legal_name} />}
                  <ReviewRow
                    label="Policies needed"
                    value={s4.needed_policies
                      .map((v) => POLICY_OPTIONS.find((p) => p.value === v)?.label ?? v)
                      .join(", ")}
                  />
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating step footer ── */}
      <div className="wizard-footer">
        <div>
          {step > 0 ? (
            <button className="btn btn-secondary" onClick={() => { setError(""); setStep((s) => s - 1) }}>
              ← Back
            </button>
          ) : (
            <Link href="/products" className="btn btn-secondary">Cancel</Link>
          )}
        </div>

        <div className="wizard-steps">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`wizard-step-dot${i === step ? " active" : i < step ? " done" : ""}`}
            />
          ))}
          <span className="wizard-step-label">
            {step + 1} of {STEPS.length} — {STEPS[step]}
          </span>
        </div>

        <div>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={advance}>
              Continue →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating…" : "Create Product"}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
