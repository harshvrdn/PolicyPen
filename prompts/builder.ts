// ============================================================
// PolicyPen — Prompt Builder
// Orchestrates: jurisdiction routing → clause selection →
// variable interpolation → system + user prompt assembly
// ============================================================

import type { BuiltPrompt, Clause, Jurisdiction, PolicyType, Questionnaire } from '@/lib/types'
import { resolveJurisdictions } from '@/lib/jurisdiction-router'
import { getClausesForPolicy } from '@/lib/clause-library'

// ─────────────────────────────────────────────────────────────
// Variable interpolation: {{company_name}} → "Acme Inc."
// Also translates enum values to human-readable text.
// ─────────────────────────────────────────────────────────────
function interpolate(template: string, q: Questionnaire): string {
  const LIABILITY_CAP_MAP: Record<string, string> = {
    '12_months':  'fees paid in the twelve (12) months preceding the claim',
    '3_months':   'fees paid in the three (3) months preceding the claim',
    '100_usd':    'one hundred US dollars ($100)',
    'none':       'the maximum extent permitted by applicable law',
  }

  const RETENTION_MAP: Record<string, string> = {
    'immediate': 'immediately upon deletion request',
    '30_days':   'thirty (30) days',
    '90_days':   'ninety (90) days',
    '1_year':    'one (1) year',
    '3_years':   'three (3) years',
    '7_years':   'seven (7) years',
  }

  const REFUND_MAP: Record<string, string> = {
    'no_refunds':    'No refunds (statutory rights preserved for EU/UK consumers)',
    '30_day':        '30-day money-back guarantee',
    '14_day':        '14-day money-back guarantee',
    '7_day':         '7-day money-back guarantee',
    'case_by_case':  'Refunds considered on a case-by-case basis',
    'credits_only':  'Store credits only — no cash refunds',
  }

  const CANCELLATION_MAP: Record<string, string> = {
    'end_of_period':    'access continues until the end of the current billing period',
    'immediate':        'access terminates immediately upon cancellation',
    'prorated':         'a prorated refund for unused time is issued',
    'downgrade':        'account is downgraded to the free tier',
  }

  const vars: Record<string, string> = {
    company_name:          q.company_name,
    product_name:          q.product_name,
    website_url:           q.website_url,
    contact_email:         q.contact_email,
    dpo_email:             q.dpo_email ?? '',
    business_address:      q.business_address ?? '',
    incorporation_country: q.incorporation_country,
    effective_date:        q.effective_date,
    product_type:          q.product_type,
    minimum_age:           q.minimum_age,
    user_type:             q.user_type,
    ugc_type:              q.ugc_type,
    location_data:         q.location_data,
    data_selling:          q.data_selling,
    deletion_mechanism:    q.deletion_mechanism,
    data_portability:      q.data_portability,
    governing_law:         q.governing_law,
    dispute_resolution:    q.dispute_resolution,
    auto_renewal:          q.auto_renewal ?? 'no',
    trial_duration_days:   String(q.trial_duration_days ?? 14),
    free_trial_type:       q.free_trial_type ?? 'none',
    termination_policy:    q.termination_policy.replace(/_/g, ' '),

    // Enum translations
    liability_cap:        LIABILITY_CAP_MAP[q.liability_cap] ?? q.liability_cap,
    retention_period:     RETENTION_MAP[q.retention_period] ?? q.retention_period,
    refund_policy:        REFUND_MAP[q.refund_policy ?? ''] ?? (q.refund_policy ?? ''),
    cancellation_policy:  CANCELLATION_MAP[q.cancellation_policy ?? ''] ?? (q.cancellation_policy ?? ''),

    // Array fields joined as human-readable list
    legal_basis:              q.legal_basis.join(', '),
    business_model:           q.business_model.join(', '),
    identity_data:            q.identity_data.join(', '),
    usage_data:               q.usage_data.join(', '),
    payment_data:             q.payment_data.join(', '),
    special_category_data:    q.special_category_data.join(', '),
    regulated_industry:       q.regulated_industry.join(', '),
    ai_features:              q.ai_features.join(', '),
    data_storage_regions:     q.data_storage_regions.join(', '),
    analytics_tools:          q.analytics_tools.join(', '),
    third_parties:            q.third_parties.join(', '),
    cookie_categories:        q.cookie_categories.join(', '),
    tracking_technologies:    q.tracking_technologies.join(', '),
    marketing_channels:       q.marketing_channels.join(', '),
    dsar_mechanism:           q.dsar_mechanism.join(', '),
    active_jurisdictions:     q.active_jurisdictions.join(', '),
    excluded_regions:         (q.excluded_regions ?? []).join(', '),
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `[${key}]`)
}

// ─────────────────────────────────────────────────────────────
// Base system prompt — applies to all policy types
// ─────────────────────────────────────────────────────────────
function buildBaseSystem(
  q: Questionnaire,
  policyType: PolicyType,
  jurisdictions: Jurisdiction[]
): string {
  const policyLabel = {
    privacy: 'Privacy Policy',
    tos:     'Terms of Service',
    cookie:  'Cookie Policy',
    refund:  'Refund Policy',
  }[policyType]

  return `You are an expert legal document drafter specializing in SaaS and technology company compliance. You are generating a ${policyLabel} for ${q.company_name} (product: ${q.product_name}).

DOCUMENT REQUIREMENTS:
- Output complete, production-ready HTML only — no markdown, no code fences, no explanations
- Use semantic HTML: <h1> for title, <h2> for sections, <h3> for subsections, <p> for paragraphs, <ul>/<li> for lists
- The document must be self-contained and legally precise
- Effective date: ${q.effective_date}
- Governing jurisdiction: ${q.governing_law}

JURISDICTIONS COVERED (${jurisdictions.length} laws):
${jurisdictions.map(j => `- ${j}`).join('\n')}

COMPANY DETAILS:
- Legal name: ${q.company_name}
- Product: ${q.product_name}
- Website: ${q.website_url}
- Privacy contact: ${q.contact_email}
- Incorporated in: ${q.incorporation_country}
${q.dpo_email ? `- DPO: ${q.dpo_email}` : ''}

AUDIENCE: ${q.user_type} users, minimum age ${q.minimum_age}

STYLE REQUIREMENTS:
- Clear, professional legal language — accessible to non-lawyers while legally sound
- Active voice where possible
- All user rights and obligations must be clearly stated
- All SLAs (response times) must be specific (e.g. "within 30 days" not "promptly")
- Do not use placeholder text like [INSERT NAME] — use the actual values provided
- Avoid legalese where plain English is equally precise`
}

// ─────────────────────────────────────────────────────────────
// Policy-specific system additions
// ─────────────────────────────────────────────────────────────
function policySpecificSystem(policyType: PolicyType, q: Questionnaire): string {
  switch (policyType) {
    case 'privacy':
      return `
PRIVACY POLICY REQUIREMENTS:
- Target length: 1,500–2,500 words
- Required sections (in order): Introduction, Information We Collect, How We Use Your Information, Legal Basis for Processing (if GDPR applies), How We Share Information, Data Retention, Your Rights, Security, Children's Privacy (if applicable), International Transfers (if applicable), Changes to This Policy, Contact Us
- Be specific about each data category collected — list actual examples from the product
- For every third-party service listed, name them explicitly (e.g. "Stripe for payment processing")
- Data retention periods must be specific, not vague
- The "Your Rights" section must list all applicable rights based on jurisdictions with specific response timeframes`

    case 'tos':
      return `
TERMS OF SERVICE REQUIREMENTS:
- Target length: 2,000–3,500 words
- Required sections (in order): Acceptance of Terms, Description of Service, User Accounts, Acceptable Use, Intellectual Property, User Content (if applicable), Payment Terms (if applicable), Disclaimers, Limitation of Liability, Indemnification, Dispute Resolution, Governing Law, Changes to Terms, Contact Information
- B2B vs B2C: user type is ${q.user_type} — adjust warranty disclaimers and liability caps accordingly
- All payment, billing, and subscription terms must be precise and unambiguous
- Class action waiver (if arbitration) must be conspicuous (bold or caps)`

    case 'cookie':
      return `
COOKIE POLICY REQUIREMENTS:
- Target length: 800–1,500 words
- Required sections (in order): What Are Cookies, Why We Use Cookies, Types of Cookies, Third-Party Cookies, Cookie Consent (EU/UK), Managing Your Preferences, Changes to This Policy, Contact Us
- Include a cookie table listing name, purpose, type, and duration for the primary cookies
- Explain how to manage cookies in major browsers (Chrome, Firefox, Safari, Edge)
- Link to relevant third-party cookie policies (analytics tools: ${q.analytics_tools.join(', ')})`

    case 'refund':
      return `
REFUND POLICY REQUIREMENTS:
- Target length: 600–1,200 words
- Required sections (in order): Overview, Eligibility, How to Request a Refund, Processing Time, Exceptions, EU/UK Statutory Rights (if applicable), Contact Us
- Be explicit about the refund window, process, and eligible payment methods
- Subscription-specific rules must be clearly separated from one-time purchase rules
- EU/UK 14-day statutory cooling-off period must be disclosed if those jurisdictions are active`
  }
}

// ─────────────────────────────────────────────────────────────
// Clause instructions block
// ─────────────────────────────────────────────────────────────
function buildClauseInstructions(clauses: Clause[], q: Questionnaire): string {
  if (clauses.length === 0) return ''

  const mandatory  = clauses.filter(c => c.priority === 'mandatory')
  const recommended = clauses.filter(c => c.priority === 'recommended')

  let block = '\nSPECIFIC LEGAL REQUIREMENTS (must be addressed in the document):\n'

  if (mandatory.length > 0) {
    block += '\nMANDATORY CLAUSES:\n'
    mandatory.forEach((clause, i) => {
      block += `\n${i + 1}. [${clause.jurisdiction.join('/')}] ${clause.id.replace(/_/g, ' ').toUpperCase()}\n`
      block += interpolate(clause.instruction, q) + '\n'
    })
  }

  if (recommended.length > 0) {
    block += '\nRECOMMENDED CLAUSES:\n'
    recommended.forEach((clause, i) => {
      block += `\n${i + 1}. [${clause.jurisdiction.join('/')}] ${clause.id.replace(/_/g, ' ').toUpperCase()}\n`
      block += interpolate(clause.instruction, q) + '\n'
    })
  }

  return block
}

// ─────────────────────────────────────────────────────────────
// User turn
// ─────────────────────────────────────────────────────────────
function buildUserTurn(
  policyType: PolicyType,
  q: Questionnaire,
  jurisdictions: Jurisdiction[]
): string {
  const label = {
    privacy: 'Privacy Policy',
    tos:     'Terms of Service',
    cookie:  'Cookie Policy',
    refund:  'Refund Policy',
  }[policyType]

  return `Generate a complete, production-ready ${label} for ${q.product_name} by ${q.company_name}.

Key facts:
- Product type: ${q.product_type}
- Business model: ${q.business_model.join(', ')}
- Active jurisdictions: ${jurisdictions.join(', ')}
- Users: ${q.user_type}, minimum age ${q.minimum_age}

Output only the HTML document. Start with <!DOCTYPE html> or directly with <h1>. No preamble, no explanation.`
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

export function buildPrompt(
  policyType: PolicyType,
  questionnaire: Questionnaire
): BuiltPrompt {
  // Step 1: Route jurisdictions
  const jurisdictions = resolveJurisdictions(questionnaire)

  // Step 2: Get applicable clauses
  const clauses = getClausesForPolicy(policyType, jurisdictions, questionnaire)

  // Step 3: Assemble system prompt
  const system = [
    buildBaseSystem(questionnaire, policyType, jurisdictions),
    policySpecificSystem(policyType, questionnaire),
    buildClauseInstructions(clauses, questionnaire),
  ].join('\n')

  // Step 4: Build user turn
  const user = buildUserTurn(policyType, questionnaire, jurisdictions)

  return {
    system,
    user,
    metadata: {
      policy_type:        policyType,
      jurisdictions,
      clauses_activated:  clauses.map(c => c.id),
      estimated_tokens:   Math.ceil(system.length / 4),
      version:            '1.0.0',
    },
  }
}

export function buildAllPrompts(
  questionnaire: Questionnaire
): Record<PolicyType, BuiltPrompt> {
  return {
    privacy: buildPrompt('privacy', questionnaire),
    tos:     buildPrompt('tos',     questionnaire),
    cookie:  buildPrompt('cookie',  questionnaire),
    refund:  buildPrompt('refund',  questionnaire),
  }
}
