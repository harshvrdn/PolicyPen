// ============================================================
// PolicyPen — Clause Library
// 28 clause instruction blocks organized by policy type.
// Each clause: applicable jurisdictions, condition function,
// interpolatable instruction, and priority.
// ============================================================

import type { Clause, Jurisdiction, PolicyType, Questionnaire } from '@/lib/types'

// ─────────────────────────────────────────────────────────────
// PRIVACY CLAUSES (11)
// ─────────────────────────────────────────────────────────────
export const PRIVACY_CLAUSES: Clause[] = [

  // GDPR Art.6 Legal Basis — mandatory for any EU/UK processing
  {
    id: 'gdpr_legal_basis',
    jurisdiction: ['GDPR', 'UK_GDPR'],
    condition: (q) => q.legal_basis.length > 0,
    priority: 'mandatory',
    instruction: `Include a "Legal Basis for Processing" section under GDPR Article 6. For each legal basis in {{legal_basis}}:
- consent: account creation data, marketing communications, non-essential cookies
- contract: data required to deliver the service to the user
- legal_obligation: financial records, fraud prevention, regulatory compliance
- legitimate_interests: security monitoring, analytics, abuse prevention (include balancing test)
State that where consent is the basis, users may withdraw at any time without affecting prior lawful processing. Provide withdrawal instructions.`,
  },

  // GDPR Art.9 Special Category — high risk, explicit consent required
  {
    id: 'gdpr_special_category',
    jurisdiction: ['GDPR', 'UK_GDPR'],
    condition: (q) =>
      q.special_category_data.length > 0 &&
      !q.special_category_data.includes('None'),
    priority: 'mandatory',
    instruction: `Include a "Special Category Data" section (GDPR Art.9). List each sensitive data type collected: {{special_category_data}}. State that explicit consent is required under Art.9(2)(a). Users can withdraw consent for special category data at any time. Describe heightened security measures applied to this data. Include the specific purpose for which each category is processed.`,
  },

  // GDPR Art.46 International Data Transfers
  {
    id: 'gdpr_data_transfers',
    jurisdiction: ['GDPR', 'UK_GDPR'],
    condition: (q) =>
      (q.data_storage_regions ?? []).some(
        r => !r.toLowerCase().includes('european') && !r.toLowerCase().includes('uk')
      ),
    priority: 'mandatory',
    instruction: `Include an "International Data Transfers" section (GDPR Art.46). Data is stored in: {{data_storage_regions}}. For transfers outside the EEA/UK, state the legal mechanism used: Standard Contractual Clauses (SCCs) adopted by the European Commission, or an adequacy decision where applicable. Name the specific third-party processors and the countries involved. State that users can request a copy of the safeguards by contacting {{contact_email}}.`,
  },

  // GDPR Art.22 Automated Decisions
  {
    id: 'gdpr_automated_decisions',
    jurisdiction: ['GDPR', 'UK_GDPR'],
    condition: (q) => (q.ai_features ?? []).includes('automated_decisions'),
    priority: 'mandatory',
    instruction: `Include an "Automated Decision-Making" section (GDPR Art.22). {{product_name}} uses automated processing that produces legal or similarly significant effects on users. Users have the right to: (1) not be subject to solely automated decisions, (2) obtain human review of any automated decision, (3) express their point of view, (4) contest the decision. Explain the logic involved, significance, and envisaged consequences. Provide contact at {{contact_email}} to request human review.`,
  },

  // GDPR Art.37 DPO
  {
    id: 'gdpr_dpo',
    jurisdiction: ['GDPR', 'UK_GDPR'],
    condition: (q) => !!q.dpo_email,
    priority: 'recommended',
    instruction: `Include a "Data Protection Officer" paragraph. State that {{company_name}} has designated a Data Protection Officer (DPO) who can be contacted at {{dpo_email}} for all data protection matters, exercising data subject rights, or raising concerns about processing activities.`,
  },

  // CCPA/CPRA Consumer Rights
  {
    id: 'ccpa_rights',
    jurisdiction: ['CCPA', 'CPRA'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include a "California Privacy Rights" section covering all CCPA/CPRA rights:
1. Right to Know: categories of personal information collected, sources, purposes, and recipients — respond within 45 days
2. Right to Delete: request deletion of personal information subject to exceptions
3. Right to Correct (CPRA): request correction of inaccurate personal information
4. Right to Opt-Out of Sale/Sharing: include "Do Not Sell or Share My Personal Information" link. If {{data_selling}} is 'no', explicitly state "We do not sell or share your personal information for cross-context behavioral advertising."
5. Right to Limit Use of Sensitive Personal Information (CPRA)
6. Right to Non-Discrimination: we will not discriminate for exercising rights
Provide two methods to submit requests. Contact: {{contact_email}}. We will verify identity before processing requests.`,
  },

  // COPPA — Children's Online Privacy Protection Act
  {
    id: 'coppa_children',
    jurisdiction: ['COPPA'],
    condition: (q) => ['all_ages', 'parental_consent'].includes(q.minimum_age),
    priority: 'mandatory',
    instruction: `Include a "Children's Privacy" section (COPPA). {{product_name}} may be used by children under 13. We do not knowingly collect personal information from children under 13 without verifiable parental consent. If minimum_age is 'all_ages': describe parental consent mechanism before any data collection. If we discover we have collected data from a child under 13 without consent, we will delete it promptly. Parents/guardians may review, delete, or refuse further collection by contacting {{contact_email}}.`,
  },

  // HIPAA — Healthcare data
  {
    id: 'hipaa_phi',
    jurisdiction: ['HIPAA'],
    condition: (q) =>
      (q.regulated_industry ?? []).some(i => i.toLowerCase().includes('healthcare')),
    priority: 'mandatory',
    instruction: `Include a "Health Information" section (HIPAA). {{product_name}} may handle Protected Health Information (PHI) as a Business Associate. We maintain a HIPAA-compliant environment including: administrative safeguards (access controls, workforce training), physical safeguards (facility controls, device security), technical safeguards (encryption, audit controls). Users have rights under HIPAA including access, amendment, accounting of disclosures, and restrictions. Contact our Privacy Officer at {{contact_email}} for HIPAA-related requests.`,
  },

  // LGPD — Brazil
  {
    id: 'lgpd_rights',
    jurisdiction: ['LGPD'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include a "Brazilian Data Subject Rights (LGPD)" section. Under Brazil's Lei Geral de Proteção de Dados (LGPD), Brazilian users have the right to: confirmation of processing, access to data, correction of incomplete/inaccurate data, anonymization/blocking/deletion of unnecessary data, portability, information about third-party sharing, and revocation of consent. Submit requests to {{contact_email}}. We will respond within 15 business days. The legal basis for processing is {{legal_basis}}.`,
  },

  // DPDP 2023 — India
  {
    id: 'dpdp_rights',
    jurisdiction: ['DPDP'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include an "Indian Data Principal Rights (DPDP Act 2023)" section. Under India's Digital Personal Data Protection Act 2023, Indian users (Data Principals) have the right to: access information about their personal data being processed, correct inaccurate or incomplete personal data, erase personal data where the purpose has been fulfilled or consent withdrawn, grievance redressal through our designated contact, and nominate a representative for exercise of rights. We process personal data on the basis of consent or legitimate uses under the Act. We will respond to requests within 30 days. Submit requests to {{contact_email}}. We appoint a Data Protection Officer for India-related queries.`,
  },

  // AI Processing Disclosure
  {
    id: 'ai_processing',
    jurisdiction: ['GDPR', 'UK_GDPR', 'CCPA', 'CPRA', 'FTC'],
    condition: (q) =>
      (q.ai_features ?? []).some(f => f !== 'none') ||
      (q.third_parties ?? []).some(t =>
        t.toLowerCase().includes('openai') || t.toLowerCase().includes('anthropic')
      ),
    priority: 'mandatory',
    instruction: `Include an "Artificial Intelligence & Automated Processing" section. {{product_name}} uses AI-powered features: {{ai_features}}. If third_parties includes AI providers (OpenAI, Anthropic), disclose that user inputs may be processed by AI sub-processors under appropriate data processing agreements and confidentiality safeguards. State: (1) what data is used for AI processing, (2) how outputs are generated, (3) whether human review is available, (4) data retention for AI training (if applicable). Link to third-party AI providers' privacy policies.`,
  },

  // Data Selling Disclosure
  {
    id: 'data_selling',
    jurisdiction: ['CCPA', 'CPRA'],
    condition: (q) => q.data_selling !== 'no',
    priority: 'mandatory',
    instruction: `Include a "Sale and Sharing of Personal Information" section. We share or sell personal information as follows: {{data_selling}}. Categories of personal information shared: [list relevant categories from identity_data and usage_data]. Categories of third parties: [list ad networks, data brokers as applicable]. Users may opt out using the "Do Not Sell or Share" link in the footer or by contacting {{contact_email}}. We do not sell personal information of users we know are under 16.`,
  },
]

// ─────────────────────────────────────────────────────────────
// TERMS OF SERVICE CLAUSES (9)
// ─────────────────────────────────────────────────────────────
export const TOS_CLAUSES: Clause[] = [

  // Acceptance of Terms
  {
    id: 'tos_acceptance',
    jurisdiction: ['FTC'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include an "Acceptance of Terms" section at the top. By accessing or using {{product_name}}, users agree to be bound by these Terms of Service and our Privacy Policy. If users do not agree, they must not use the service. For B2B users ({{user_type}}), state that the individual accepting has authority to bind the organization. These Terms constitute a legally binding agreement between the user and {{company_name}}, incorporated in {{incorporation_country}}.`,
  },

  // UGC License Grant
  {
    id: 'tos_ugc_license',
    jurisdiction: ['DMCA', 'FTC'],
    condition: (q) => q.ugc_type !== 'none',
    priority: 'mandatory',
    instruction: `Include a "User Content" section covering license grant. Users retain ownership of content they submit ({{ugc_type}} content). By submitting content, users grant {{company_name}} a non-exclusive, worldwide, royalty-free, sublicensable license to use, reproduce, modify, display, and distribute their content solely to provide and improve the service. Users represent they own or have rights to all submitted content and it does not violate third-party rights. We may remove content that violates these Terms.`,
  },

  // DMCA Takedown Procedure
  {
    id: 'tos_dmca_takedown',
    jurisdiction: ['DMCA'],
    condition: (q) => q.ugc_type !== 'none',
    priority: 'mandatory',
    instruction: `Include a "DMCA Copyright Policy" section. {{company_name}} respects intellectual property rights and complies with the Digital Millennium Copyright Act. To report copyright infringement, send a written notice to {{contact_email}} containing: (1) identification of the copyrighted work, (2) identification of the infringing material with location, (3) contact information, (4) good faith statement, (5) accuracy statement under penalty of perjury, (6) signature. We will respond to valid DMCA takedown notices promptly. Repeat infringers will have accounts terminated.`,
  },

  // Marketplace Additional Terms
  {
    id: 'tos_marketplace',
    jurisdiction: ['FTC'],
    condition: (q) => q.product_type === 'marketplace',
    priority: 'mandatory',
    instruction: `Include a "Marketplace Terms" section. {{product_name}} operates as a marketplace connecting buyers and sellers. {{company_name}} is not a party to transactions between users. We do not control the quality, accuracy, or legality of listings. Sellers are responsible for accurate descriptions and fulfillment. Buyers are responsible for payment. Disputes between marketplace participants should first be resolved directly; escalate to {{contact_email}} if unresolved. {{company_name}} may intervene at its discretion but assumes no obligation to do so.`,
  },

  // Binding Arbitration
  {
    id: 'tos_arbitration',
    jurisdiction: ['FTC'],
    condition: (q) =>
      q.dispute_resolution === 'arbitration' ||
      q.dispute_resolution === 'arbitration_opt_out',
    priority: 'mandatory',
    instruction: `Include a "Dispute Resolution — Binding Arbitration" section. CRITICAL: This clause applies to US users ONLY. EU/UK consumers retain their statutory right to pursue claims in court and cannot be forced into arbitration — explicitly exempt them.

For US users: disputes will be resolved through binding individual arbitration under AAA Commercial Arbitration Rules. Steps: (1) informal resolution attempt within 30 days by emailing {{contact_email}}, (2) if unresolved, arbitration administered by AAA. Each party bears its own costs; arbitrator fees split equally for claims under $10,000. CLASS ACTION WAIVER: users waive the right to participate in class actions.

If dispute_resolution is 'arbitration_opt_out': users may opt out within 30 days of first acceptance by sending a written notice to {{contact_email}} including name and account information.`,
  },

  // Limitation of Liability
  {
    id: 'tos_liability_cap',
    jurisdiction: ['FTC'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include a "Limitation of Liability" section. TO THE MAXIMUM EXTENT PERMITTED BY LAW, {{company_name}}'s total liability for any claim arising from use of {{product_name}} is limited to {{liability_cap}}. We are not liable for indirect, incidental, special, consequential, or punitive damages. This limitation applies regardless of the form of action (contract, tort, negligence, strict liability). Note: these limitations may not apply to EU/UK consumers to the extent prohibited by consumer protection law. Include a Disclaimer of Warranties (AS IS, AS AVAILABLE, without warranty of merchantability, fitness for purpose, or non-infringement).`,
  },

  // Subscription Billing
  {
    id: 'tos_subscription_billing',
    jurisdiction: ['FTC', 'CA_ARL'],
    condition: (q) =>
      (q.business_model ?? []).some(m => m.toLowerCase().includes('subscription')),
    priority: 'mandatory',
    instruction: `Include a "Subscription & Billing" section. Subscriptions automatically {{auto_renewal}} on the renewal date unless cancelled. Billing is in advance for the subscription period. Price changes take effect after {{cancellation_policy}} notice. Cancellation policy: {{cancellation_policy}} — access continues until the end of the paid period unless otherwise stated. Failed payments result in service suspension after 3 retry attempts. For California users (CA_ARL): auto-renewal terms are clearly disclosed; users may cancel at any time and cancellation takes effect at the end of the current billing period.`,
  },

  // Free Trial
  {
    id: 'tos_free_trial',
    jurisdiction: ['FTC'],
    condition: (q) => q.free_trial_type !== 'none' && !!q.free_trial_type,
    priority: 'mandatory',
    instruction: `Include a "Free Trial" section (FTC Negative Option Rule compliance). Trial type: {{free_trial_type}}. Trial duration: {{trial_duration_days}} days. IMPORTANT DISCLOSURES — clearly state: (1) the trial is free for {{trial_duration_days}} days, (2) what plan the trial converts to and its price, (3) when the trial ends and billing begins, (4) how to cancel before being charged. If free_trial_type is 'auto_convert': we will charge the payment method on file at the end of the trial unless cancelled. Trial cancellations: cancel any time during the trial period at no charge by [describe mechanism].`,
  },

  // Governing Law & Jurisdiction
  {
    id: 'tos_governing_law',
    jurisdiction: ['FTC'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include a "Governing Law" section. These Terms are governed by the laws of {{governing_law}}, without regard to conflict of law provisions. For non-arbitration disputes ({{dispute_resolution}}), the exclusive jurisdiction is the courts of {{governing_law}}. EU/UK users may also bring claims in the courts of their country of residence. For B2B users ({{user_type}}), both parties consent to personal jurisdiction in {{governing_law}}. Include account termination rights: {{company_name}} may suspend or terminate access {{termination_policy}} with or without cause, with notice via {{contact_email}}. On termination, data handling follows our Privacy Policy.`,
  },
]

// ─────────────────────────────────────────────────────────────
// COOKIE CLAUSES (4)
// ─────────────────────────────────────────────────────────────
export const COOKIE_CLAUSES: Clause[] = [

  // What Are Cookies
  {
    id: 'cookie_what_are_cookies',
    jurisdiction: ['ePrivacy', 'GDPR', 'UK_GDPR'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include a "What Are Cookies" introductory section. Explain that cookies are small text files placed on a device when visiting a website. They help the site remember preferences, understand usage patterns, and deliver personalized experiences. Distinguish between: first-party cookies (set by {{website_url}}), third-party cookies (set by external services), session cookies (deleted when browser closes), and persistent cookies (remain for a set period). State the effective date of this policy and how users will be notified of changes.`,
  },

  // Cookie Categories
  {
    id: 'cookie_categories',
    jurisdiction: ['ePrivacy', 'GDPR', 'UK_GDPR'],
    condition: (q) => q.cookie_categories.length > 0,
    priority: 'mandatory',
    instruction: `Include a "Types of Cookies We Use" section with a table or list covering each category in {{cookie_categories}}:
- Strictly necessary: required for the site to function; cannot be disabled; no consent needed
- Functional/preference: remember user choices (language, theme); require consent for non-essential
- Analytics/performance: collect aggregated usage data (tools: {{analytics_tools}}); require consent for EU/UK users
- Marketing/advertising: track across sites to serve targeted ads; require explicit opt-in consent under ePrivacy
- Social media embeds: set by third-party social platforms; subject to their own policies
For each category: name, purpose, typical duration, and whether consent is required.`,
  },

  // Consent Mechanism (EU/UK specific)
  {
    id: 'cookie_consent_mechanism',
    jurisdiction: ['ePrivacy', 'GDPR', 'UK_GDPR'],
    condition: (q) => {
      const laws = (q.active_jurisdictions ?? []).map(j => j.toLowerCase())
      return laws.some(j => j.includes('eu') || j.includes('uk') || j.includes('european'))
    },
    priority: 'mandatory',
    instruction: `Include a "Cookie Consent" section for EU/UK users. On first visit, a cookie consent banner presents clear choices: Accept All, Reject Non-Essential, or Manage Preferences. Strictly necessary cookies do not require consent. Consent is recorded with timestamp and granular choices. Users can change preferences at any time via the Cookie Preferences link in the footer. Consent for analytics/marketing is opt-in only (no pre-ticked boxes, no cookie walls). Consent can be withdrawn as easily as it was given. We retain consent records for {{retention_period}} for compliance purposes.`,
  },

  // Tracking Pixels & Similar Technologies
  {
    id: 'cookie_tracking_pixels',
    jurisdiction: ['ePrivacy', 'GDPR', 'UK_GDPR', 'CCPA', 'CPRA'],
    condition: (q) =>
      (q.tracking_technologies ?? []).length > 0 &&
      !(q.tracking_technologies.length === 1 && q.tracking_technologies[0].toLowerCase() === 'none'),
    priority: 'mandatory',
    instruction: `Include a "Other Tracking Technologies" section covering {{tracking_technologies}}. Explain each technology in plain language:
- Pixel tags/web beacons: invisible 1x1 images that confirm email opens or page visits (e.g. Meta Pixel, Google Tag Manager)
- Session recording: captures mouse movements, clicks, and scrolls to improve UX (e.g. Hotjar) — no passwords or payment data recorded
- Browser fingerprinting: collects device/browser attributes to identify devices; used for security purposes only
State the legal basis for each (consent for advertising pixels under GDPR/ePrivacy; legitimate interests for security). CCPA/CPRA: pixel sharing with ad networks may constitute "sharing" and users may opt out via the "Do Not Sell or Share" link.`,
  },
]

// ─────────────────────────────────────────────────────────────
// REFUND CLAUSES (4)
// ─────────────────────────────────────────────────────────────
export const REFUND_CLAUSES: Clause[] = [

  // Standard Refund Policy
  {
    id: 'refund_standard',
    jurisdiction: ['FTC'],
    condition: () => true,
    priority: 'mandatory',
    instruction: `Include a "Refund Policy" overview section. Our refund policy: {{refund_policy}}. To request a refund, contact {{contact_email}} with your order details. Refunds are processed within 5–10 business days to the original payment method. For subscription products, refunds apply to the most recent charge only unless otherwise stated. Digital products that have been downloaded or substantially used may not be eligible for refund. Include eligibility criteria, the claims window, and the process to initiate a request.`,
  },

  // Subscription Proration
  {
    id: 'refund_subscription_proration',
    jurisdiction: ['FTC'],
    condition: (q) =>
      (q.business_model ?? []).some(m => m.toLowerCase().includes('subscription')),
    priority: 'mandatory',
    instruction: `Include a "Subscription Cancellation & Refunds" section. Cancellation policy: {{cancellation_policy}}. When a user cancels a subscription:
- Access continues until the end of the current paid billing period
- No partial refunds are issued for unused time in the current period unless the plan explicitly provides for proration
- Annual plan cancellations: if cancelled within {{refund_policy}} window, a prorated refund for remaining full months may be issued
- If cancellation_policy is 'prorated': describe the proration formula (days remaining / days in period × amount paid)
To cancel: [describe cancellation mechanism in the product]. Cancellation confirmation will be sent to the account email.`,
  },

  // EU 14-Day Cooling-Off Period
  {
    id: 'refund_eu_cooling_off',
    jurisdiction: ['EU_CRD'],
    condition: (q) => {
      const regions = (q.active_jurisdictions ?? []).map(r => r.toLowerCase())
      return regions.some(r => r.includes('eu') || r.includes('uk') || r.includes('european') || r.includes('united kingdom'))
    },
    priority: 'mandatory',
    instruction: `Include an "EU/UK Right of Withdrawal (14-Day Cooling-Off Period)" section. Under EU Consumer Rights Directive Art.9 and UK Consumer Contracts Regulations, EU/UK consumers have 14 days from purchase to withdraw from the contract without giving a reason.

EXCEPTION for digital content/services: If the user has requested immediate access to digital content and explicitly acknowledged that they waive their right of withdrawal, the right is lost once content delivery begins. This waiver must be confirmed at checkout.

If refund_policy is 'no_refunds': this "no refunds" policy does NOT apply to EU/UK consumers exercising their statutory right of withdrawal within 14 days, unless validly waived.

Withdrawal process: contact {{contact_email}} within 14 days of purchase. Refund issued within 14 days of receiving the withdrawal request.`,
  },

  // Refund Exceptions
  {
    id: 'refund_exceptions',
    jurisdiction: ['FTC'],
    condition: (q) =>
      q.refund_policy === 'no_refunds' || q.refund_policy === 'credits_only',
    priority: 'mandatory',
    instruction: `Include a "Non-Refundable Items & Exceptions" section. The following are generally non-refundable: (1) services already fully performed with user consent, (2) custom or personalized items created per user specification, (3) add-ons or one-time purchases already consumed, (4) accounts suspended for violations of Terms of Service. If refund_policy is 'credits_only': refunds are issued as service credits applicable to future purchases, not cash. Exceptions to these limitations: (a) where required by applicable law (including EU/UK statutory rights), (b) if {{product_name}} fails to deliver as described, (c) fraudulent charges. Contact {{contact_email}} for any exceptional circumstances.`,
  },
]

// ─────────────────────────────────────────────────────────────
// SELECTOR
// ─────────────────────────────────────────────────────────────
const LIBRARY: Record<PolicyType, Clause[]> = {
  privacy: PRIVACY_CLAUSES,
  tos:     TOS_CLAUSES,
  cookie:  COOKIE_CLAUSES,
  refund:  REFUND_CLAUSES,
}

export function getClausesForPolicy(
  policyType: PolicyType,
  jurisdictions: Jurisdiction[],
  q: Questionnaire
): Clause[] {
  const library = LIBRARY[policyType]

  return library.filter(clause => {
    const hasJurisdiction = clause.jurisdiction.some(j => jurisdictions.includes(j))
    const meetsCondition  = clause.condition(q)
    return hasJurisdiction && meetsCondition
  })
}
