import { useState, useEffect, useCallback } from "react"

// ─────────────────────────────────────────────
// DATA & CONFIG
// ─────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Identity",    short: "01", title: "Company & Product", desc: "Name, contact, and incorporation details" },
  { id: 2, label: "Product",     short: "02", title: "Product & Audience", desc: "What you build and who uses it" },
  { id: 3, label: "Data",        short: "03", title: "Data Collection", desc: "What you collect, why, and how long" },
  { id: 4, label: "Cookies",     short: "04", title: "Cookies & Rights", desc: "Tracking tech and user controls" },
  { id: 5, label: "Legal",       short: "05", title: "Terms & Jurisdiction", desc: "Payments, refunds, governing law" },
]

const JURISDICTION_MAP = {
  "European Union":    ["GDPR","ePrivacy","EU_CRD"],
  "United Kingdom":   ["UK_GDPR","ePrivacy"],
  "California (US)":  ["CCPA","CPRA"],
  "Canada":           ["PIPEDA","CASL"],
  "Brazil":           ["LGPD"],
  "Singapore":        ["PDPA"],
  "Australia":        ["AU_Privacy"],
  "South Africa":     ["POPIA"],
  "Global / Unknown": ["GDPR","CCPA","PIPEDA","ePrivacy"],
}

const FEATURE_LAWS = {
  all_ages:        ["COPPA"],
  parental_consent:["COPPA"],
  healthcare:      ["HIPAA"],
  ugc:             ["DMCA"],
  email_marketing: ["CAN-SPAM"],
  sms:             ["TCPA"],
  paid:            ["FTC"],
  auto_renewal:    ["CA_ARL"],
  ai_decisions:    ["GDPR Art.22"],
}

const LAW_COLORS = {
  GDPR:"#1a6b3a", ePrivacy:"#1a5a6b", "EU_CRD":"#6b3a1a",
  "UK_GDPR":"#2a3a6b", CCPA:"#3a6b1a", CPRA:"#2a5a1a",
  PIPEDA:"#6b1a3a", CASL:"#4a1a6b", LGPD:"#6b4a1a",
  PDPA:"#1a4a6b", AU_Privacy:"#3a1a6b", POPIA:"#6b1a1a",
  COPPA:"#5a1a6b", HIPAA:"#1a3a5a", DMCA:"#4a4a1a",
  "CAN-SPAM":"#3a3a3a", TCPA:"#4a2a1a", FTC:"#2a4a2a",
  CA_ARL:"#5a2a1a", "GDPR Art.22":"#1a1a5a",
}

const PRODUCT_TYPES = [
  { v:"saas",             label:"SaaS / Web App",       icon:"⬡" },
  { v:"mobile_app",       label:"Mobile App",           icon:"◫" },
  { v:"ecommerce",        label:"E-commerce",           icon:"◈" },
  { v:"marketplace",      label:"Marketplace",          icon:"⬡" },
  { v:"api_tool",         label:"API / Dev Tool",       icon:"◉" },
  { v:"browser_ext",      label:"Browser Extension",    icon:"◧" },
  { v:"newsletter",       label:"Newsletter / Media",   icon:"◫" },
  { v:"community",        label:"Community / Forum",    icon:"◈" },
]

const BUSINESS_MODELS = [
  "Subscription (monthly)", "Subscription (annual)", "One-time purchase",
  "Freemium", "Usage-based / metered", "Free (no payment)",
  "Enterprise contracts", "Commission / take rate",
]

const IDENTITY_DATA = [
  "Email address","Full name","Username","Profile photo",
  "Phone number","Date of birth","Gender","Postal code","Social login tokens",
]

const USAGE_DATA = [
  "Page views / navigation","Feature usage events","Session duration",
  "Click / interaction data","Search queries","Error logs",
  "Device type / OS","Browser type","Referrer URL",
]

const PAYMENT_DATA_OPTS = [
  "No payment data","Billing address","Card last 4 digits",
  "Payment method type","Transaction history","Tax ID / VAT",
]

const ANALYTICS_TOOLS = [
  "None","Google Analytics","PostHog","Mixpanel",
  "Amplitude","Plausible","Fathom","Segment","Custom",
]

const THIRD_PARTIES = [
  "Stripe (payments)","Clerk / Auth0 (auth)","Supabase / Firebase",
  "AWS / GCP / Azure","Vercel / Netlify","Resend / SendGrid",
  "Intercom / Crisp","Sentry","OpenAI / Anthropic","Zapier / Make",
]

const COOKIE_CATS = [
  "Strictly necessary","Functional / preference",
  "Analytics / performance","Marketing / advertising",
  "Social media embeds","No cookies used",
]

const TRACKING_TECH = [
  "None","Meta / Facebook Pixel","Google Tag Manager",
  "LinkedIn Insight Tag","TikTok Pixel","Session recording (Hotjar)","Browser fingerprinting",
]

const MARKETING_CHANNELS = [
  "No marketing comms","Product update emails","Promotional emails",
  "Push notifications (web)","Push notifications (mobile)","SMS / text",
]

const REGIONS = Object.keys(JURISDICTION_MAP)

// ─────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────
const INITIAL = {
  // Step 1
  company_name:"", product_name:"", website_url:"", contact_email:"",
  dpo_email:"", business_address:"", incorporation_country:"",
  incorporation_state:"", effective_date:"",
  // Step 2
  product_type:"", business_model:[], minimum_age:"18",
  user_type:"b2c", regulated_industry:[], ugc_type:"none", ai_features:[],
  // Step 3
  identity_data:[], usage_data:[], payment_data:[], location_data:"none",
  special_category_data:[], legal_basis:[], retention_period:"90_days",
  data_storage_regions:[], data_selling:"no", analytics_tools:[], third_parties:[],
  // Step 4
  cookie_categories:[], tracking_technologies:[], marketing_channels:[],
  dsar_mechanism:[], deletion_mechanism:"both", data_portability:"yes",
  // Step 5
  refund_policy:"no_refunds", cancellation_policy:"end_of_period",
  auto_renewal:"no", free_trial_type:"none", trial_duration_days:14,
  governing_law:"", dispute_resolution:"courts",
  liability_cap:"12_months", termination_policy:"30_days_notice",
  active_jurisdictions:[], excluded_regions:[],
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function deriveJurisdictions(q) {
  const laws = new Set()
  ;(q.active_jurisdictions||[]).forEach(r => {
    (JURISDICTION_MAP[r]||[]).forEach(l => laws.add(l))
  })
  if (["all_ages","parental_consent"].includes(q.minimum_age)) laws.add("COPPA")
  if ((q.regulated_industry||[]).includes("healthcare")) laws.add("HIPAA")
  if (q.ugc_type && q.ugc_type !== "none") laws.add("DMCA")
  if ((q.marketing_channels||[]).some(c => c.includes("email"))) laws.add("CAN-SPAM")
  if ((q.marketing_channels||[]).some(c => c.toLowerCase().includes("sms"))) laws.add("TCPA")
  if ((q.business_model||[]).some(m => !m.toLowerCase().includes("free"))) laws.add("FTC")
  if (q.auto_renewal === "yes" && (q.active_jurisdictions||[]).includes("California (US)")) laws.add("CA_ARL")
  if ((q.ai_features||[]).includes("automated_decisions")) laws.add("GDPR Art.22")
  return [...laws]
}

function stepCompletion(q, step) {
  const checks = {
    1: () => q.company_name && q.product_name && q.contact_email && q.incorporation_country && q.effective_date,
    2: () => q.product_type && q.business_model.length > 0,
    3: () => q.identity_data.length > 0 && q.legal_basis.length > 0 && q.active_jurisdictions.length > 0,
    4: () => q.cookie_categories.length > 0 && q.dsar_mechanism.length > 0,
    5: () => q.governing_law && q.dispute_resolution,
  }
  return checks[step] ? !!checks[step]() : false
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function Label({ children, required, hint }) {
  return (
    <div style={{ marginBottom:6 }}>
      <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>
        {children}
        {required && <span style={{ color:"var(--color-text-danger)", marginLeft:3 }}>*</span>}
      </span>
      {hint && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginTop:2, lineHeight:1.4 }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type="text", disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ width:"100%", marginBottom:0 }}
    />
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width:"100%" }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.v||o} value={o.v||o}>{o.label||o}</option>
      ))}
    </select>
  )
}

function Field({ children, style }) {
  return <div style={{ marginBottom:20, ...style }}>{children}</div>
}

function Grid2({ children }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      {children}
    </div>
  )
}

function MultiChip({ options, selected, onChange, color }) {
  const toggle = v => onChange(
    selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]
  )
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {options.map(o => {
        const v = o.v||o, label = o.label||o
        const active = selected.includes(v)
        return (
          <button
            key={v}
            onClick={() => toggle(v)}
            style={{
              padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
              border: active ? "1.5px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)",
              background: active ? "var(--color-background-info)" : "var(--color-background-primary)",
              color: active ? "var(--color-text-info)" : "var(--color-text-secondary)",
              fontWeight: active ? 500 : 400,
              transition:"all 0.12s",
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function RadioCards({ options, value, onChange }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))", gap:8 }}>
      {options.map(o => {
        const active = value === (o.v||o)
        return (
          <button
            key={o.v||o}
            onClick={() => onChange(o.v||o)}
            style={{
              padding:"12px 10px", borderRadius:"var(--border-radius-md)", fontSize:12,
              cursor:"pointer", textAlign:"center", border:"0.5px solid",
              borderColor: active ? "var(--color-border-info)" : "var(--color-border-tertiary)",
              background: active ? "var(--color-background-info)" : "var(--color-background-primary)",
              color: active ? "var(--color-text-info)" : "var(--color-text-secondary)",
              fontWeight: active ? 500 : 400, transition:"all 0.12s",
            }}
          >
            {o.icon && <div style={{ fontSize:18, marginBottom:4 }}>{o.icon}</div>}
            <div>{o.label||o}</div>
          </button>
        )
      })}
    </div>
  )
}

function JurisdictionPanel({ q }) {
  const laws = deriveJurisdictions(q)
  const regions = q.active_jurisdictions||[]

  return (
    <div style={{
      background:"var(--color-background-secondary)",
      border:"0.5px solid var(--color-border-tertiary)",
      borderRadius:"var(--border-radius-lg)",
      padding:"16px", position:"sticky", top:20,
    }}>
      <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>
        Live jurisdiction map
      </div>

      {/* Active regions */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:6 }}>Serving users in</div>
        {regions.length === 0
          ? <div style={{ fontSize:12, color:"var(--color-text-tertiary)", fontStyle:"italic" }}>No regions selected yet</div>
          : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {regions.map(r => (
                <span key={r} style={{
                  fontSize:11, padding:"3px 8px", borderRadius:4,
                  background:"var(--color-background-success)", color:"var(--color-text-success)",
                  border:"0.5px solid var(--color-border-success)",
                }}>{r}</span>
              ))}
            </div>
        }
      </div>

      {/* Laws activated */}
      <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:12 }}>
        <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:6 }}>
          Laws activated {laws.length > 0 && <span style={{ color:"var(--color-text-tertiary)" }}>({laws.length})</span>}
        </div>
        {laws.length === 0
          ? <div style={{ fontSize:12, color:"var(--color-text-tertiary)", fontStyle:"italic" }}>Add regions and product features to see applicable laws</div>
          : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {laws.map(l => (
                <span key={l} style={{
                  fontSize:11, padding:"3px 8px", borderRadius:4,
                  background: LAW_COLORS[l] ? LAW_COLORS[l]+"22" : "var(--color-background-secondary)",
                  color: LAW_COLORS[l] || "var(--color-text-primary)",
                  border:`0.5px solid ${LAW_COLORS[l] ? LAW_COLORS[l]+"55" : "var(--color-border-tertiary)"}`,
                  fontFamily:"var(--font-mono)", fontWeight:500,
                }}>{l}</span>
              ))}
            </div>
        }
      </div>

      {/* Policy count preview */}
      {laws.length > 0 && (
        <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:12, marginTop:12 }}>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:8 }}>Generating</div>
          {["Privacy Policy","Terms of Service","Cookie Policy","Refund Policy"].map(doc => (
            <div key={doc} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-text-success)", flexShrink:0 }} />
              <span style={{ fontSize:12, color:"var(--color-text-primary)" }}>{doc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProgressBar({ step, completed }) {
  return (
    <div style={{ display:"flex", gap:4, marginBottom:32 }}>
      {STEPS.map(s => (
        <div key={s.id} style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{
            height:3, borderRadius:2,
            background: s.id < step ? "var(--color-text-success)"
              : s.id === step ? "var(--color-text-info)"
              : "var(--color-border-tertiary)",
            transition:"background 0.3s",
          }} />
          <div style={{
            fontSize:10, fontFamily:"var(--font-mono)",
            color: s.id === step ? "var(--color-text-info)"
              : s.id < step ? "var(--color-text-success)"
              : "var(--color-text-tertiary)",
            letterSpacing:"0.05em",
          }}>
            {s.short} {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP COMPONENTS
// ─────────────────────────────────────────────

function Step1({ q, set }) {
  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Step 01 of 05 — Identity</div>
        <h2 style={{ fontSize:22, fontWeight:500, margin:"0 0 6px" }}>Company & product identity</h2>
        <p style={{ fontSize:14, color:"var(--color-text-secondary)", margin:0 }}>These fields populate the "Data Controller" section of every policy. Required by all jurisdictions.</p>
      </div>

      <Grid2>
        <Field>
          <Label required hint="Your legal entity name as registered">Legal company name</Label>
          <Input value={q.company_name} onChange={v=>set("company_name",v)} placeholder="Acme Inc." />
        </Field>
        <Field>
          <Label required hint="What users see in the app — may differ from legal name">Product / brand name</Label>
          <Input value={q.product_name} onChange={v=>set("product_name",v)} placeholder="PolicyPen" />
        </Field>
      </Grid2>

      <Grid2>
        <Field>
          <Label required>Primary website URL</Label>
          <Input value={q.website_url} onChange={v=>set("website_url",v)} placeholder="https://policypen.io" />
        </Field>
        <Field>
          <Label required hint="Email users write to exercise data rights. Must be monitored.">Privacy contact email</Label>
          <Input value={q.contact_email} onChange={v=>set("contact_email",v)} placeholder="privacy@yourproduct.com" type="email" />
        </Field>
      </Grid2>

      <Grid2>
        <Field>
          <Label hint="Required under GDPR Art.37 if you process EU data at scale or special category data">DPO email (optional)</Label>
          <Input value={q.dpo_email} onChange={v=>set("dpo_email",v)} placeholder="dpo@yourproduct.com" type="email" />
        </Field>
        <Field>
          <Label hint="Physical address. Strengthens GDPR and CCPA compliance.">Business address (optional)</Label>
          <Input value={q.business_address} onChange={v=>set("business_address",v)} placeholder="123 Main St, City, Country" />
        </Field>
      </Grid2>

      <Grid2>
        <Field>
          <Label required hint="Determines governing law clause in Terms of Service">Country of incorporation</Label>
          <Select
            value={q.incorporation_country}
            onChange={v=>set("incorporation_country",v)}
            placeholder="Select country..."
            options={["United States","United Kingdom","Germany","France","Netherlands","Ireland","Canada","Australia","Singapore","India","Other"].map(v=>({v,label:v}))}
          />
        </Field>
        <Field>
          <Label hint="Required if US-incorporated. Triggers CCPA auto-compliance if California.">US state (if applicable)</Label>
          <Select
            value={q.incorporation_state}
            onChange={v=>set("incorporation_state",v)}
            placeholder="Select state..."
            disabled={q.incorporation_country !== "United States"}
            options={["Delaware","California","New York","Texas","Florida","Washington","Other"].map(v=>({v,label:v}))}
          />
        </Field>
      </Grid2>

      <Field style={{ maxWidth:300 }}>
        <Label required hint="Date these policies become legally binding">Policy effective date</Label>
        <input type="date" value={q.effective_date} onChange={e=>set("effective_date",e.target.value)} style={{ width:"100%" }} />
      </Field>
    </div>
  )
}

function Step2({ q, set }) {
  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Step 02 of 05 — Product</div>
        <h2 style={{ fontSize:22, fontWeight:500, margin:"0 0 6px" }}>Product type & audience</h2>
        <p style={{ fontSize:14, color:"var(--color-text-secondary)", margin:0 }}>Product type is the single most impactful variable — it activates entirely different clause libraries across all 4 documents.</p>
      </div>

      <Field>
        <Label required>What kind of product are you building?</Label>
        <RadioCards options={PRODUCT_TYPES} value={q.product_type} onChange={v=>set("product_type",v)} />
      </Field>

      <Field>
        <Label required hint="Determines billing, refund policy, and subscription clauses in ToS">Business model (select all that apply)</Label>
        <MultiChip options={BUSINESS_MODELS} selected={q.business_model} onChange={v=>set("business_model",v)} />
      </Field>

      <Grid2>
        <Field>
          <Label required hint="COPPA (US) and GDPR Art.8 restrict data from users under 13/16">Minimum user age</Label>
          <Select
            value={q.minimum_age}
            onChange={v=>set("minimum_age",v)}
            options={[
              {v:"18",label:"18+ only"},
              {v:"16",label:"16+ only"},
              {v:"all_ages",label:"All ages (COPPA required)"},
              {v:"parental_consent",label:"With parental consent"},
            ]}
          />
        </Field>
        <Field>
          <Label required hint="B2B vs B2C changes liability caps, warranty disclaimers, and data processor roles">User type</Label>
          <Select
            value={q.user_type}
            onChange={v=>set("user_type",v)}
            options={[
              {v:"b2c",label:"Consumers (B2C)"},
              {v:"b2b",label:"Businesses (B2B)"},
              {v:"both",label:"Both"},
              {v:"developers",label:"Developers / API users"},
            ]}
          />
        </Field>
      </Grid2>

      <Field>
        <Label hint="Regulated industries require additional compliance beyond standard privacy law">Regulated industry (if any)</Label>
        <MultiChip
          options={["None / General SaaS","Healthcare (HIPAA)","Fintech / Payments","Legal Services","Education (FERPA)","AI / Automated decisions"]}
          selected={q.regulated_industry}
          onChange={v=>set("regulated_industry",v)}
        />
      </Field>

      <Grid2>
        <Field>
          <Label required hint="UGC triggers DMCA safe harbor provisions and IP license grants in ToS">User-generated content</Label>
          <Select
            value={q.ugc_type}
            onChange={v=>set("ugc_type",v)}
            options={[
              {v:"none",label:"No user content"},
              {v:"text",label:"Text only"},
              {v:"files",label:"Files / images"},
              {v:"all",label:"All content types"},
            ]}
          />
        </Field>
        <Field>
          <Label hint="AI features create specific disclosure obligations under GDPR Art.22 and EU AI Act">AI features</Label>
          <MultiChip
            options={[
              {v:"generates_content",label:"Generates content"},
              {v:"personalizes",label:"Personalizes feed"},
              {v:"scores_users",label:"Scores / ranks users"},
              {v:"automated_decisions",label:"Automated decisions"},
            ]}
            selected={q.ai_features}
            onChange={v=>set("ai_features",v)}
          />
        </Field>
      </Grid2>
    </div>
  )
}

function Step3({ q, set }) {
  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Step 03 of 05 — Data</div>
        <h2 style={{ fontSize:22, fontWeight:500, margin:"0 0 6px" }}>Data collection & processing</h2>
        <p style={{ fontSize:14, color:"var(--color-text-secondary)", margin:0 }}>The most legally critical step. Every data type must be disclosed with legal basis, purpose, and retention. This generates ~70% of the Privacy Policy.</p>
      </div>

      <Field>
        <Label required hint="Basic identity fields collected during signup and account management">Account / identity data</Label>
        <MultiChip options={IDENTITY_DATA} selected={q.identity_data} onChange={v=>set("identity_data",v)} />
      </Field>

      <Field>
        <Label hint="Automatically collected — often overlooked but legally required to disclose">Usage / behavioral data</Label>
        <MultiChip options={USAGE_DATA} selected={q.usage_data} onChange={v=>set("usage_data",v)} />
      </Field>

      <Grid2>
        <Field>
          <Label hint="Even if Stripe handles card data, you may store billing address, last 4 digits, subscription state">Payment data</Label>
          <MultiChip options={PAYMENT_DATA_OPTS} selected={q.payment_data} onChange={v=>set("payment_data",v)} />
        </Field>
        <Field>
          <Label hint="IP-derived location counts as location data under GDPR. GPS requires explicit consent.">Location data</Label>
          <Select
            value={q.location_data}
            onChange={v=>set("location_data",v)}
            options={[
              {v:"none",label:"No location data"},
              {v:"ip_country",label:"IP → country only"},
              {v:"ip_city",label:"IP → city / region"},
              {v:"gps",label:"Precise GPS (requires explicit consent)"},
            ]}
          />
        </Field>
      </Grid2>

      <Field>
        <Label hint="GDPR Art.9 — requires explicit consent and stricter handling. Check everything that applies.">
          Special category / sensitive data
          <span style={{ marginLeft:6, fontSize:11, padding:"2px 6px", borderRadius:3, background:"var(--color-background-danger)", color:"var(--color-text-danger)" }}>GDPR Art.9</span>
        </Label>
        <MultiChip
          options={["None","Health / medical","Racial / ethnic origin","Political opinions","Religious beliefs","Sexual orientation","Biometric data","Genetic data","Criminal records"]}
          selected={q.special_category_data}
          onChange={v=>set("special_category_data",v)}
        />
      </Field>

      <Grid2>
        <Field>
          <Label required hint="Must specify at least one lawful basis per data category — GDPR Art.6">Legal basis for processing</Label>
          <MultiChip
            options={[
              {v:"consent",label:"Consent"},
              {v:"contract",label:"Contract performance"},
              {v:"legal_obligation",label:"Legal obligation"},
              {v:"legitimate_interests",label:"Legitimate interests"},
            ]}
            selected={q.legal_basis}
            onChange={v=>set("legal_basis",v)}
          />
        </Field>
        <Field>
          <Label required hint="GDPR requires specific retention periods. Must balance legal hold against data minimisation.">Data retention after deletion</Label>
          <Select
            value={q.retention_period}
            onChange={v=>set("retention_period",v)}
            options={[
              {v:"immediate",label:"Deleted immediately"},
              {v:"30_days",label:"30 days"},
              {v:"90_days",label:"90 days"},
              {v:"1_year",label:"1 year"},
              {v:"3_years",label:"3 years"},
              {v:"7_years",label:"7 years (tax / legal hold)"},
            ]}
          />
        </Field>
      </Grid2>

      <Grid2>
        <Field>
          <Label required hint="GDPR restricts transfers outside EEA. US storage requires Standard Contractual Clauses.">Where is data stored?</Label>
          <MultiChip
            options={["United States","European Union","United Kingdom","Canada","Australia","Singapore","Global CDN"]}
            selected={q.data_storage_regions}
            onChange={v=>set("data_storage_regions",v)}
          />
        </Field>
        <Field>
          <Label required hint="CCPA 'sell' is very broad — sharing with ad networks counts">Do you sell / share data?</Label>
          <Select
            value={q.data_selling}
            onChange={v=>set("data_selling",v)}
            options={[
              {v:"no",label:"No — never sell data"},
              {v:"ad_networks",label:"Share with ad networks"},
              {v:"data_brokers",label:"Data broker relationships"},
              {v:"anonymized",label:"Sell anonymised datasets only"},
            ]}
          />
        </Field>
      </Grid2>

      <Grid2>
        <Field>
          <Label hint="Every analytics tool receiving user data must be listed as a GDPR sub-processor">Analytics tools</Label>
          <MultiChip options={ANALYTICS_TOOLS} selected={q.analytics_tools} onChange={v=>set("analytics_tools",v)} />
        </Field>
        <Field>
          <Label hint="All third parties touching user PII must be listed — GDPR Art.28 requires written DPAs">Third-party services</Label>
          <MultiChip options={THIRD_PARTIES} selected={q.third_parties} onChange={v=>set("third_parties",v)} />
        </Field>
      </Grid2>

      <Field>
        <Label required hint="This is the primary routing key — determines which jurisdiction clauses activate across all 4 documents">
          Which regions do you serve?
          <span style={{ marginLeft:6, fontSize:11, padding:"2px 6px", borderRadius:3, background:"var(--color-background-warning)", color:"var(--color-text-warning)" }}>Primary routing key</span>
        </Label>
        <MultiChip options={REGIONS} selected={q.active_jurisdictions} onChange={v=>set("active_jurisdictions",v)} />
      </Field>
    </div>
  )
}

function Step4({ q, set }) {
  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Step 04 of 05 — Cookies</div>
        <h2 style={{ fontSize:22, fontWeight:500, margin:"0 0 6px" }}>Cookies, tracking & user rights</h2>
        <p style={{ fontSize:14, color:"var(--color-text-secondary)", margin:0 }}>Cookie consent is the most visible legal requirement. User rights have mandatory 30-day SLAs. Both must be precisely configured.</p>
      </div>

      <Field>
        <Label required hint="Strictly necessary cookies need no consent. All others require opt-in for EU users.">Cookie categories you use</Label>
        <MultiChip options={COOKIE_CATS} selected={q.cookie_categories} onChange={v=>set("cookie_categories",v)} />
      </Field>

      <Field>
        <Label hint="Pixel tracking and fingerprinting have same consent requirements as cookies under ePrivacy">Tracking technologies</Label>
        <MultiChip options={TRACKING_TECH} selected={q.tracking_technologies} onChange={v=>set("tracking_technologies",v)} />
      </Field>

      <Field>
        <Label hint="EU users need opt-in consent for marketing. US follows CAN-SPAM (opt-out model). Both need unsubscribe.">Marketing communications</Label>
        <MultiChip options={MARKETING_CHANNELS} selected={q.marketing_channels} onChange={v=>set("marketing_channels",v)} />
      </Field>

      <Grid2>
        <Field>
          <Label required hint="GDPR/CCPA require a clear mechanism. Must respond within 30 days (GDPR) or 45 days (CCPA).">Data access request mechanism</Label>
          <MultiChip
            options={["Email request","In-app self-service","Web form"]}
            selected={q.dsar_mechanism}
            onChange={v=>set("dsar_mechanism",v)}
          />
        </Field>
        <Field>
          <Label required hint="GDPR Art.17 right to erasure. Must specify what gets deleted, what's retained, and timeline.">Account deletion mechanism</Label>
          <Select
            value={q.deletion_mechanism}
            onChange={v=>set("deletion_mechanism",v)}
            options={[
              {v:"self_service",label:"In-app self-service"},
              {v:"email",label:"Email request only"},
              {v:"both",label:"Both options"},
            ]}
          />
        </Field>
      </Grid2>

      <Grid2>
        <Field>
          <Label hint="GDPR Art.20 — users can request their data in machine-readable format. Required for EU.">Data portability / export</Label>
          <Select
            value={q.data_portability}
            onChange={v=>set("data_portability",v)}
            options={[
              {v:"yes",label:"Yes — in-app export"},
              {v:"email",label:"Via email request"},
              {v:"no",label:"Not yet implemented"},
            ]}
          />
        </Field>
      </Grid2>
    </div>
  )
}

function Step5({ q, set }) {
  const isSubscription = (q.business_model||[]).some(m => m.toLowerCase().includes("subscription"))
  const isPaid = (q.business_model||[]).some(m => !m.toLowerCase().includes("free"))

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Step 05 of 05 — Legal</div>
        <h2 style={{ fontSize:22, fontWeight:500, margin:"0 0 6px" }}>Terms, payments & jurisdiction</h2>
        <p style={{ fontSize:14, color:"var(--color-text-secondary)", margin:0 }}>ToS-specific and Refund Policy variables. If you get sued, a judge reads this language. Get it right.</p>
      </div>

      {isPaid && (
        <>
          <Grid2>
            <Field>
              <Label hint="EU Consumer Rights Directive gives B2C users a 14-day cooling-off period. Be explicit.">Refund policy</Label>
              <Select
                value={q.refund_policy}
                onChange={v=>set("refund_policy",v)}
                options={[
                  {v:"no_refunds",label:"No refunds (EU exception applies)"},
                  {v:"30_day",label:"30-day money back"},
                  {v:"14_day",label:"14-day money back"},
                  {v:"7_day",label:"7-day money back"},
                  {v:"case_by_case",label:"Case-by-case basis"},
                  {v:"credits_only",label:"Credits only (no cash)"},
                ]}
              />
            </Field>
            <Field>
              <Label hint="Free trial that auto-converts to paid requires explicit FTC disclosure">Free trial type</Label>
              <Select
                value={q.free_trial_type}
                onChange={v=>set("free_trial_type",v)}
                options={[
                  {v:"none",label:"No free trial"},
                  {v:"no_card",label:"Trial, no card required"},
                  {v:"auto_convert",label:"Trial with card, auto-converts"},
                  {v:"freemium",label:"Permanent free tier"},
                ]}
              />
            </Field>
          </Grid2>

          {q.free_trial_type !== "none" && (
            <Field style={{ maxWidth:200 }}>
              <Label>Trial duration (days)</Label>
              <input
                type="number"
                value={q.trial_duration_days}
                onChange={e=>set("trial_duration_days",parseInt(e.target.value)||0)}
                min={1} max={90} style={{ width:"100%" }}
              />
            </Field>
          )}
        </>
      )}

      {isSubscription && (
        <Grid2>
          <Field>
            <Label hint="Users need to know what happens to access and data when they cancel">Cancellation policy</Label>
            <Select
              value={q.cancellation_policy}
              onChange={v=>set("cancellation_policy",v)}
              options={[
                {v:"end_of_period",label:"Access until period ends"},
                {v:"immediate",label:"Immediate termination"},
                {v:"prorated",label:"Prorated refund issued"},
                {v:"downgrade",label:"Downgrade to free tier"},
              ]}
            />
          </Field>
          <Field>
            <Label hint="Many US states require explicit disclosure of auto-renewal before checkout">Auto-renewal</Label>
            <Select
              value={q.auto_renewal}
              onChange={v=>set("auto_renewal",v)}
              options={[
                {v:"yes",label:"Yes — auto-renews"},
                {v:"no",label:"No — manual renewal"},
                {v:"opt_in",label:"Opt-in to auto-renew"},
              ]}
            />
          </Field>
        </Grid2>
      )}

      <Grid2>
        <Field>
          <Label required hint="Determines which courts handle disputes and which consumer protection laws apply">Governing law</Label>
          <Select
            value={q.governing_law}
            onChange={v=>set("governing_law",v)}
            placeholder="Select jurisdiction..."
            options={[
              "US — Delaware","US — California","US — New York",
              "England and Wales (UK)","Ireland (EU)","Netherlands (EU)",
              "Canada — Ontario","Australia — NSW","Other",
            ].map(v=>({v,label:v}))}
          />
        </Field>
        <Field>
          <Label required hint="Arbitration clauses are unenforceable against EU consumers. Choose carefully.">Dispute resolution</Label>
          <Select
            value={q.dispute_resolution}
            onChange={v=>set("dispute_resolution",v)}
            options={[
              {v:"courts",label:"Courts only (no arbitration)"},
              {v:"arbitration",label:"Binding arbitration (US only)"},
              {v:"arbitration_opt_out",label:"Arbitration with opt-out"},
              {v:"mediation",label:"Mediation first, then courts"},
            ]}
          />
        </Field>
      </Grid2>

      <Grid2>
        <Field>
          <Label hint="Standard: 12 months of fees. EU consumer law limits how much you can cap for B2C.">Liability cap</Label>
          <Select
            value={q.liability_cap}
            onChange={v=>set("liability_cap",v)}
            options={[
              {v:"12_months",label:"Fees paid in last 12 months"},
              {v:"3_months",label:"Fees paid in last 3 months"},
              {v:"100_usd",label:"$100 maximum"},
              {v:"none",label:"No cap specified"},
            ]}
          />
        </Field>
        <Field>
          <Label hint="ToS must specify your right to suspend or terminate, notice period, and data handling on termination">Account termination</Label>
          <Select
            value={q.termination_policy}
            onChange={v=>set("termination_policy",v)}
            options={[
              {v:"30_days_notice",label:"Yes — with 30 days notice"},
              {v:"7_days_notice",label:"Yes — with 7 days notice"},
              {v:"immediate_violations",label:"Yes — immediately for violations"},
              {v:"any_reason",label:"Yes — for any reason"},
            ]}
          />
        </Field>
      </Grid2>

      <Field>
        <Label hint="Optional. Generates geographic restriction clause in ToS.">Regions you do NOT serve (optional)</Label>
        <MultiChip
          options={["None — open to all","OFAC sanctioned countries","Russia","China","Custom list"]}
          selected={q.excluded_regions||[]}
          onChange={v=>set("excluded_regions",v)}
        />
      </Field>
    </div>
  )
}

// ─────────────────────────────────────────────
// REVIEW SCREEN
// ─────────────────────────────────────────────
function ReviewScreen({ q, laws }) {
  const sections = [
    { label:"Company", items: [
      ["Legal name", q.company_name], ["Product", q.product_name],
      ["Contact", q.contact_email], ["Incorporated", q.incorporation_country],
      ["Effective date", q.effective_date],
    ]},
    { label:"Product", items: [
      ["Type", q.product_type], ["Model", (q.business_model||[]).join(", ")],
      ["Users", q.user_type], ["Min age", q.minimum_age],
      ["UGC", q.ugc_type], ["AI features", (q.ai_features||[]).join(", ")||"None"],
    ]},
    { label:"Data", items: [
      ["Identity data", (q.identity_data||[]).length + " fields"],
      ["Legal basis", (q.legal_basis||[]).join(", ")],
      ["Retention", q.retention_period.replace("_"," ")],
      ["Storage", (q.data_storage_regions||[]).join(", ")],
      ["Data selling", q.data_selling],
    ]},
    { label:"Cookies & Rights", items: [
      ["Cookie cats", (q.cookie_categories||[]).length + " selected"],
      ["Tracking", (q.tracking_technologies||[]).join(", ")||"None"],
      ["DSAR", (q.dsar_mechanism||[]).join(", ")],
      ["Deletion", q.deletion_mechanism],
      ["Portability", q.data_portability],
    ]},
    { label:"Legal", items: [
      ["Governing law", q.governing_law],
      ["Disputes", q.dispute_resolution],
      ["Liability cap", q.liability_cap.replace(/_/g," ")],
      ["Refund policy", q.refund_policy?.replace(/_/g," ")||"—"],
    ]},
  ]

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--color-text-success)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Ready to generate</div>
        <h2 style={{ fontSize:22, fontWeight:500, margin:"0 0 6px" }}>Review your answers</h2>
        <p style={{ fontSize:14, color:"var(--color-text-secondary)", margin:0 }}>Confirm all details before generating your policy documents.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {sections.map(sec => (
          <div key={sec.label} style={{
            background:"var(--color-background-secondary)",
            border:"0.5px solid var(--color-border-tertiary)",
            borderRadius:"var(--border-radius-md)", padding:"14px 16px",
          }}>
            <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>{sec.label}</div>
            {sec.items.map(([k,v]) => v && (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:6 }}>
                <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{k}</span>
                <span style={{ fontSize:12, color:"var(--color-text-primary)", fontWeight:500, textAlign:"right", maxWidth:"55%" }}>{v||"—"}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", padding:"14px 16px", marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Jurisdictions ({laws.length} laws)</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {laws.map(l => (
            <span key={l} style={{
              fontSize:11, padding:"3px 8px", borderRadius:4,
              background: LAW_COLORS[l] ? LAW_COLORS[l]+"22" : "var(--color-background-secondary)",
              color: LAW_COLORS[l] || "var(--color-text-primary)",
              border:`0.5px solid ${LAW_COLORS[l]+"55" || "var(--color-border-tertiary)"}`,
              fontFamily:"var(--font-mono)",
            }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{
        background:"var(--color-background-info)", border:"0.5px solid var(--color-border-info)",
        borderRadius:"var(--border-radius-md)", padding:"12px 16px",
      }}>
        <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-info)", marginBottom:4 }}>4 documents will be generated</div>
        <div style={{ display:"flex", gap:16 }}>
          {["Privacy Policy","Terms of Service","Cookie Policy","Refund Policy"].map(d => (
            <div key={d} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-text-info)" }} />
              <span style={{ fontSize:12, color:"var(--color-text-info)" }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN WIZARD
// ─────────────────────────────────────────────
export default function PolicyWizard() {
  const [step, setStep] = useState(1)
  const [q, setQ] = useState(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [generating, setGenerating] = useState(false)

  const set = useCallback((key, val) => setQ(prev => ({ ...prev, [key]: val })), [])

  const laws = deriveJurisdictions(q)
  const canProceed = stepCompletion(q, step)
  const isReview = step === 6
  const isLastStep = step === 5

  const handleNext = () => {
    if (step < 6) setStep(s => s + 1)
    else handleGenerate()
  }

  const handleGenerate = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 2200))
    setGenerating(false)
    setSubmitted(true)
  }

  const completedSteps = STEPS.filter(s => stepCompletion(q, s.id)).length

  if (submitted) {
    return (
      <div style={{ padding:"40px 0", textAlign:"center" }}>
        <div style={{
          width:56, height:56, borderRadius:"50%", background:"var(--color-background-success)",
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px",
          border:"0.5px solid var(--color-border-success)",
        }}>
          <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--color-text-success)" }} />
        </div>
        <h2 style={{ fontSize:22, fontWeight:500, margin:"0 0 8px" }}>Policies queued for generation</h2>
        <p style={{ fontSize:14, color:"var(--color-text-secondary)", marginBottom:24 }}>
          Claude is generating your 4 policy documents with {laws.length} jurisdiction laws applied.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxWidth:480, margin:"0 auto 24px" }}>
          {["Privacy Policy","Terms of Service","Cookie Policy","Refund Policy"].map((d,i) => (
            <div key={d} style={{
              background:"var(--color-background-secondary)",
              border:"0.5px solid var(--color-border-tertiary)",
              borderRadius:"var(--border-radius-md)", padding:"12px 16px",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--color-text-success)" }} />
              <span style={{ fontSize:13 }}>{d}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setSubmitted(false); setStep(1); setQ(INITIAL) }} style={{ fontSize:13 }}>
          Start over
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding:"8px 0" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500 }}>Generate policies</div>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>
            {completedSteps} of 5 steps complete · {laws.length} laws detected
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["Privacy","Terms","Cookies","Refund"].map(d => (
            <span key={d} style={{
              fontSize:11, padding:"3px 8px", borderRadius:3,
              background: laws.length > 0 ? "var(--color-background-success)" : "var(--color-background-secondary)",
              color: laws.length > 0 ? "var(--color-text-success)" : "var(--color-text-tertiary)",
              border:`0.5px solid ${laws.length > 0 ? "var(--color-border-success)" : "var(--color-border-tertiary)"}`,
            }}>{d}</span>
          ))}
        </div>
      </div>

      <ProgressBar step={step} />

      {/* Two-column layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:24, alignItems:"start" }}>
        {/* Main content */}
        <div>
          <div style={{
            background:"var(--color-background-primary)",
            border:"0.5px solid var(--color-border-tertiary)",
            borderRadius:"var(--border-radius-lg)", padding:"28px",
            minHeight:500,
          }}>
            {step === 1 && <Step1 q={q} set={set} />}
            {step === 2 && <Step2 q={q} set={set} />}
            {step === 3 && <Step3 q={q} set={set} />}
            {step === 4 && <Step4 q={q} set={set} />}
            {step === 5 && <Step5 q={q} set={set} />}
            {step === 6 && <ReviewScreen q={q} laws={laws} />}
          </div>

          {/* Navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              style={{ fontSize:13, opacity: step === 1 ? 0.4 : 1 }}
            >
              Back
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {!canProceed && step <= 5 && (
                <span style={{ fontSize:12, color:"var(--color-text-tertiary)" }}>
                  Complete required fields to continue
                </span>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed && step <= 5}
                style={{
                  fontSize:13, padding:"8px 20px",
                  background: (canProceed || step === 6) ? "var(--color-text-primary)" : "var(--color-background-secondary)",
                  color: (canProceed || step === 6) ? "var(--color-background-primary)" : "var(--color-text-tertiary)",
                  border:"none", borderRadius:"var(--border-radius-md)", cursor: (canProceed || step === 6) ? "pointer" : "not-allowed",
                  opacity: !canProceed && step <= 5 ? 0.5 : 1,
                }}
              >
                {generating ? "Generating…"
                  : step === 6 ? "Generate 4 policies"
                  : step === 5 ? "Review answers"
                  : "Continue"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <JurisdictionPanel q={q} />

          {/* Step completion */}
          <div style={{
            marginTop:12,
            background:"var(--color-background-secondary)",
            border:"0.5px solid var(--color-border-tertiary)",
            borderRadius:"var(--border-radius-lg)", padding:"14px 16px",
          }}>
            <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Steps</div>
            {STEPS.map(s => (
              <div
                key={s.id}
                onClick={() => setStep(s.id)}
                style={{
                  display:"flex", alignItems:"center", gap:10, padding:"7px 8px",
                  borderRadius:"var(--border-radius-md)", cursor:"pointer", marginBottom:2,
                  background: s.id === step ? "var(--color-background-info)" : "transparent",
                  transition:"background 0.12s",
                }}
              >
                <div style={{
                  width:18, height:18, borderRadius:"50%", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontFamily:"var(--font-mono)",
                  background: stepCompletion(q, s.id) ? "var(--color-text-success)"
                    : s.id === step ? "var(--color-text-info)"
                    : "var(--color-border-tertiary)",
                  color: stepCompletion(q, s.id) || s.id === step ? "var(--color-background-primary)" : "var(--color-text-tertiary)",
                }}>
                  {stepCompletion(q, s.id) ? "✓" : s.short}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight: s.id === step ? 500 : 400, color: s.id === step ? "var(--color-text-info)" : "var(--color-text-primary)" }}>{s.title}</div>
                  <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
