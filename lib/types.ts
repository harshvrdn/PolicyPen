// ============================================================
// PolicyPen — Core Type Definitions
// ============================================================

export type PolicyType = 'privacy' | 'tos' | 'cookie' | 'refund'

export type Jurisdiction =
  | 'GDPR'        // EU / EEA
  | 'UK_GDPR'     // United Kingdom
  | 'CCPA'        // California
  | 'CPRA'        // California (updated)
  | 'PIPEDA'      // Canada
  | 'LGPD'        // Brazil
  | 'PDPA'        // Singapore / Thailand
  | 'POPIA'       // South Africa
  | 'AU_PRIVACY'  // Australia
  | 'COPPA'       // US — Children
  | 'HIPAA'       // US — Healthcare
  | 'CAN_SPAM'    // US — Email
  | 'CASL'        // Canada — Email
  | 'TCPA'        // US — SMS
  | 'ePrivacy'    // EU — Cookies
  | 'EU_CRD'      // EU Consumer Rights Directive
  | 'CA_ARL'      // California Auto-Renewal Law
  | 'FTC'         // US Federal Trade Commission
  | 'DMCA'        // US — Copyright
  | 'DPDP'        // India — Digital Personal Data Protection Act 2023

export interface Questionnaire {
  // Step 1 — Identity
  company_name: string
  product_name: string
  website_url: string
  contact_email: string
  dpo_email?: string
  business_address?: string
  incorporation_country: string
  incorporation_state?: string
  effective_date: string

  // Step 2 — Product
  product_type: string
  business_model: string[]
  minimum_age: string
  user_type: string
  regulated_industry: string[]
  ugc_type: string
  ai_features: string[]

  // Step 3 — Data
  identity_data: string[]
  usage_data: string[]
  payment_data: string[]
  location_data: string
  special_category_data: string[]
  legal_basis: string[]
  retention_period: string
  data_storage_regions: string[]
  data_selling: string
  analytics_tools: string[]
  third_parties: string[]

  // Step 4 — Cookies & Rights
  cookie_categories: string[]
  tracking_technologies: string[]
  marketing_channels: string[]
  dsar_mechanism: string[]
  deletion_mechanism: string
  data_portability: string

  // Step 5 — Legal (drives ALL clause activation — primary routing key)
  active_jurisdictions: string[]
  refund_policy?: string
  cancellation_policy?: string
  auto_renewal?: string
  free_trial_type?: string
  trial_duration_days?: number
  governing_law: string
  dispute_resolution: string
  liability_cap: string
  termination_policy: string
  excluded_regions?: string[]
}

// Internal clause shape used by clause-library.ts
export interface Clause {
  id: string
  jurisdiction: Jurisdiction[]
  condition: (q: Questionnaire) => boolean
  priority: 'mandatory' | 'recommended'
  instruction: string
}

export interface BuiltPrompt {
  system: string           // full system prompt for Claude
  user: string             // user turn content
  metadata: {
    policy_type: PolicyType
    jurisdictions: Jurisdiction[]
    clauses_activated: string[]  // audit trail
    estimated_tokens: number
    version: string
  }
}

export interface GenerationResult {
  html: string
  policy_type: PolicyType
  tokens_input: number
  tokens_output: number
  cost_usd: number
  jurisdictions: Jurisdiction[]
  clauses_activated: string[]
  duration_ms: number
}
