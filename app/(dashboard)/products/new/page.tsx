"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface FormData {
  name: string
  website_url: string
  description: string
  business_type: string
  primary_jurisdiction: string
  company_legal_name: string
  company_address: string
  contact_email: string
}

const INITIAL: FormData = {
  name: "",
  website_url: "",
  description: "",
  business_type: "",
  primary_jurisdiction: "US",
  company_legal_name: "",
  company_address: "",
  contact_email: "",
}

const BUSINESS_TYPES = ["SaaS", "E-commerce", "Marketplace", "Agency", "Other"]

const JURISDICTIONS = [
  { value: "US", label: "United States" },
  { value: "EU", label: "EU / GDPR" },
  { value: "UK", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
  { value: "GLOBAL", label: "Global" },
]

const STEP_LABELS = ["Basics", "Legal context", "Review"]

export default function NewProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function nextStep() {
    if (step === 0 && !form.name.trim()) {
      setError("Product name is required.")
      return
    }
    setError("")
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create product.")
        setLoading(false)
        return
      }
      router.push(`/products/${data.product.slug}`)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Product</h1>
          <p className="page-subtitle">Set up a product to generate legal policies for it.</p>
        </div>
        <Link href="/products" className="btn btn-secondary">Cancel</Link>
      </div>

      <div className="form-wrapper">
        <div className="step-indicator">
          {STEP_LABELS.map((label, i) => (
            <div
              key={i}
              className={`step-dot${i === step ? " active" : i < step ? " done" : ""}`}
            />
          ))}
          <span className="step-label">
            Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
          </span>
        </div>

        {error && <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>}

        {step === 0 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">
                Product name <span className="req">*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Acme SaaS"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://example.com"
                value={form.website_url}
                onChange={(e) => update("website_url", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Briefly describe what your product does..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business type</label>
              <select
                className="form-select"
                value={form.business_type}
                onChange={(e) => update("business_type", e.target.value)}
              >
                <option value="">Select a type...</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={nextStep}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">Primary jurisdiction</label>
              <select
                className="form-select"
                value={form.primary_jurisdiction}
                onChange={(e) => update("primary_jurisdiction", e.target.value)}
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
              <span className="form-hint">Determines which regulations your policies will address.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Company legal name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Acme Inc."
                value={form.company_legal_name}
                onChange={(e) => update("company_legal_name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company address</label>
              <textarea
                className="form-textarea"
                placeholder="123 Main St, Suite 100&#10;San Francisco, CA 94102"
                value={form.company_address}
                onChange={(e) => update("company_address", e.target.value)}
                style={{ minHeight: 70 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact email for policies</label>
              <input
                className="form-input"
                type="email"
                placeholder="legal@example.com"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
              />
              <span className="form-hint">Shown in your privacy policy as the data controller contact.</span>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" onClick={nextStep}>Continue →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <div className="card">
              <table className="review-table">
                <tbody>
                  <tr>
                    <td>Product name</td>
                    <td><strong>{form.name}</strong></td>
                  </tr>
                  {form.website_url && (
                    <tr>
                      <td>Website</td>
                      <td>{form.website_url}</td>
                    </tr>
                  )}
                  {form.business_type && (
                    <tr>
                      <td>Business type</td>
                      <td>{form.business_type}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Jurisdiction</td>
                    <td>{JURISDICTIONS.find((j) => j.value === form.primary_jurisdiction)?.label}</td>
                  </tr>
                  {form.company_legal_name && (
                    <tr>
                      <td>Legal name</td>
                      <td>{form.company_legal_name}</td>
                    </tr>
                  )}
                  {form.contact_email && (
                    <tr>
                      <td>Contact email</td>
                      <td>{form.contact_email}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating…" : "Create Product"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
