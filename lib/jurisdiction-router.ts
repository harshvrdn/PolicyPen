// ============================================================
// PolicyPen — Jurisdiction Router
// Questionnaire answers → applicable laws (Set-based dedup)
// ============================================================

import type { Jurisdiction, Questionnaire } from '@/lib/types'

// Maps region display names (from PolicyWizard active_jurisdictions[]) → law codes
const GEO_MAP: Record<string, Jurisdiction[]> = {
  'european union':    ['GDPR', 'ePrivacy'],
  'united kingdom':    ['UK_GDPR', 'ePrivacy'],
  'california (us)':   ['CCPA', 'CPRA'],
  'canada':            ['PIPEDA', 'CASL'],
  'brazil':            ['LGPD'],
  'singapore':         ['PDPA'],
  'australia':         ['AU_PRIVACY'],
  'south africa':      ['POPIA'],
  'global / unknown':  ['GDPR', 'CCPA', 'PIPEDA', 'ePrivacy'],
  // Also accept short codes for programmatic use
  'eu':                ['GDPR', 'ePrivacy'],
  'uk':                ['UK_GDPR', 'ePrivacy'],
  'california':        ['CCPA', 'CPRA'],
  'global':            ['GDPR', 'CCPA', 'PIPEDA', 'ePrivacy'],
}

export function resolveJurisdictions(q: Questionnaire): Jurisdiction[] {
  const laws = new Set<Jurisdiction>()
  const regions = (q.active_jurisdictions ?? []).map(r => r.toLowerCase())

  // ── Geographic mapping ──────────────────────────────────────────────
  regions.forEach(region => {
    const mapped = GEO_MAP[region]
    if (mapped) mapped.forEach(j => laws.add(j))
  })

  // Also check for partial matches (e.g. "European Union" contains "eu")
  if (regions.some(r => r.includes('eu') || r.includes('european'))) {
    laws.add('GDPR')
    laws.add('ePrivacy')
  }
  if (regions.some(r => r.includes('uk') || r.includes('united kingdom') || r.includes('britain'))) {
    laws.add('UK_GDPR')
    laws.add('ePrivacy')
  }
  if (regions.some(r => r.includes('california'))) {
    laws.add('CCPA')
    laws.add('CPRA')
  }
  if (regions.some(r => r.includes('canada'))) {
    laws.add('PIPEDA')
    laws.add('CASL')
  }
  if (regions.some(r => r.includes('global'))) {
    ;(['GDPR', 'CCPA', 'PIPEDA', 'ePrivacy'] as Jurisdiction[]).forEach(j => laws.add(j))
  }

  // ── EU Consumer Rights Directive: EU/UK + paid product ───────────────
  const hasPaid = (q.business_model ?? []).some(
    m => !m.toLowerCase().includes('free')
  )
  if (hasPaid && (laws.has('GDPR') || laws.has('UK_GDPR'))) {
    laws.add('EU_CRD')
  }

  // ── California Auto-Renewal Law ──────────────────────────────────────
  if (
    q.auto_renewal === 'yes' &&
    (q.active_jurisdictions ?? []).some(r => r.toLowerCase().includes('california'))
  ) {
    laws.add('CA_ARL')
  }

  // ── Feature-triggered laws ──────────────────────────────────────────
  if (['all_ages', 'parental_consent'].includes(q.minimum_age)) {
    laws.add('COPPA')
  }
  if ((q.regulated_industry ?? []).some(i => i.toLowerCase().includes('healthcare'))) {
    laws.add('HIPAA')
  }
  if (q.ugc_type && q.ugc_type !== 'none') {
    laws.add('DMCA')
  }
  if ((q.marketing_channels ?? []).some(c => c.toLowerCase().includes('email'))) {
    laws.add('CAN_SPAM')
    if (laws.has('PIPEDA')) laws.add('CASL')
  }
  if ((q.marketing_channels ?? []).some(c => c.toLowerCase().includes('sms'))) {
    laws.add('TCPA')
  }
  if (hasPaid) {
    laws.add('FTC')
  }

  return Array.from(laws)
}

export function explainJurisdictions(
  laws: Jurisdiction[],
  q: Questionnaire
): Record<string, string> {
  const explanations: Record<string, string> = {}

  laws.forEach(law => {
    switch (law) {
      case 'GDPR':
        explanations[law] = `Activated: active_jurisdictions includes EU/European region or Global. Applies to all EU/EEA users.`
        break
      case 'UK_GDPR':
        explanations[law] = `Activated: active_jurisdictions includes United Kingdom. Post-Brexit equivalent of GDPR.`
        break
      case 'CCPA':
        explanations[law] = `Activated: active_jurisdictions includes California (US). Applies to consumers in California.`
        break
      case 'CPRA':
        explanations[law] = `Activated: CCPA active. CPRA (2020 amendment) extends and strengthens CCPA rights.`
        break
      case 'PIPEDA':
        explanations[law] = `Activated: active_jurisdictions includes Canada.`
        break
      case 'LGPD':
        explanations[law] = `Activated: active_jurisdictions includes Brazil.`
        break
      case 'PDPA':
        explanations[law] = `Activated: active_jurisdictions includes Singapore.`
        break
      case 'POPIA':
        explanations[law] = `Activated: active_jurisdictions includes South Africa.`
        break
      case 'AU_PRIVACY':
        explanations[law] = `Activated: active_jurisdictions includes Australia.`
        break
      case 'COPPA':
        explanations[law] = `Activated: minimum_age is '${q.minimum_age}'. US law protecting children under 13.`
        break
      case 'HIPAA':
        explanations[law] = `Activated: regulated_industry includes healthcare. US health data law.`
        break
      case 'DMCA':
        explanations[law] = `Activated: ugc_type is '${q.ugc_type}' (not 'none'). US copyright safe harbor.`
        break
      case 'CAN_SPAM':
        explanations[law] = `Activated: marketing_channels includes email. US commercial email law.`
        break
      case 'CASL':
        explanations[law] = `Activated: Canada jurisdiction + email marketing. Canadian anti-spam law.`
        break
      case 'TCPA':
        explanations[law] = `Activated: marketing_channels includes SMS. US telephone/SMS marketing law.`
        break
      case 'FTC':
        explanations[law] = `Activated: business_model includes paid product. US consumer protection.`
        break
      case 'EU_CRD':
        explanations[law] = `Activated: EU/UK jurisdiction + paid product. EU Consumer Rights Directive — 14-day withdrawal right.`
        break
      case 'CA_ARL':
        explanations[law] = `Activated: auto_renewal is 'yes' + California jurisdiction. California Auto-Renewal Law.`
        break
      case 'ePrivacy':
        explanations[law] = `Activated: EU/UK jurisdiction. EU ePrivacy Directive — governs cookies and tracking.`
        break
    }
  })

  return explanations
}
