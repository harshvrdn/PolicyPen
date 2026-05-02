// ============================================================
// PolicyPen — Hosted Policy Page System
// app/p/[slug]/page.tsx  (Next.js ISR)
// ============================================================

// FILE: app/p/[slug]/page.tsx
// ─────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PolicyPageClient } from '@/components/policy-page/PolicyPageClient'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
  searchParams: { doc?: string }
}

// ISR: revalidate every 24h, revalidate on-demand on policy update
export const revalidate = 86400

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  const { data: product } = await supabase
    .from('products')
    .select('product_name, company_name')
    .eq('slug', params.slug)
    .single()

  if (!product) return { title: 'Policy Page' }

  return {
    title: `Legal Policies — ${product.product_name}`,
    description: `Privacy Policy, Terms of Service, Cookie Policy, and Refund Policy for ${product.product_name} by ${product.company_name}`,
    robots: { index: true, follow: false }, // Policies shouldn't outrank the main product
  }
}

export default async function PolicyPage({ params, searchParams }: Props) {
  const supabase = createSupabaseServerClient()

  // Load product
  const { data: product } = await supabase
    .from('products')
    .select('id, product_name, company_name, website_url, contact_email, slug, questionnaire')
    .eq('slug', params.slug)
    .single()

  if (!product) notFound()

  // Load all policies for this product
  const { data: policies } = await supabase
    .from('policies')
    .select('id, policy_type, content_html, version, generated_at, jurisdictions')
    .eq('product_id', product.id)
    .order('version', { ascending: false })

  // Latest version of each policy type
  const policyMap: Record<string, typeof policies[0]> = {}
  ;(policies || []).forEach(p => {
    if (!policyMap[p.policy_type]) policyMap[p.policy_type] = p
  })

  const activeDoc = searchParams.doc || 'privacy'

  return (
    <PolicyPageClient
      product={product}
      policies={policyMap}
      activeDoc={activeDoc}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// FILE: app/p/[slug]/not-found.tsx
// ─────────────────────────────────────────────────────────────

/*
export default function NotFound() {
  return (
    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
      <h1>Policy page not found</h1>
      <p>This policy page may have been deleted or the link is incorrect.</p>
    </div>
  )
}
*/

// ─────────────────────────────────────────────────────────────
// FILE: lib/embed-widget.ts
// ─────────────────────────────────────────────────────────────

export const EMBED_WIDGET_SCRIPT = (slug: string, theme: 'light' | 'dark' = 'light') => `
<!-- PolicyPen Widget — paste before </body> -->
<script>
(function() {
  var slug = ${JSON.stringify(slug)};
  var theme = ${JSON.stringify(theme)};
  var base = 'https://policypen.io';

  // Create widget container
  var container = document.createElement('div');
  container.id = 'policypen-widget';
  container.style.cssText = 'font-family: -apple-system, sans-serif; font-size: 13px;';

  // Policy links
  var links = [
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'tos',     label: 'Terms of Service' },
    { key: 'cookie',  label: 'Cookie Policy' },
    { key: 'refund',  label: 'Refund Policy' },
  ];

  var linkHtml = links.map(function(l) {
    return '<a href="' + base + '/p/' + slug + '?doc=' + l.key + '" '
      + 'target="_blank" rel="noopener noreferrer" '
      + 'style="color: inherit; text-decoration: underline; margin-right: 16px;">'
      + l.label + '</a>';
  }).join('');

  container.innerHTML = '<div style="padding: 12px 0; color: #888; border-top: 1px solid #eee;">'
    + linkHtml
    + '<span style="float: right; font-size: 11px; color: #bbb;">Powered by <a href="https://policypen.io" target="_blank" style="color: inherit;">PolicyPen</a></span>'
    + '</div>';

  document.currentScript.parentNode.insertBefore(container, document.currentScript);
})();
</script>
<!-- End PolicyPen Widget -->
`

// Inline embed: renders specific policy document in an iframe
export const IFRAME_EMBED = (slug: string, docType: string) => {
  const safeSlug    = encodeURIComponent(slug)
  const safeDocType = encodeURIComponent(docType)
  return `<iframe
  src="https://policypen.io/p/${safeSlug}?doc=${safeDocType}&embed=1"
  style="width: 100%; border: none; min-height: 600px;"
  title="${safeDocType} policy"
  loading="lazy"
  onload="this.style.minHeight = this.contentDocument.body.scrollHeight + 'px'"
></iframe>
`}

// ─────────────────────────────────────────────────────────────
// FILE: lib/policy-version.ts
// Policy versioning and on-demand ISR revalidation
// ─────────────────────────────────────────────────────────────

export async function revalidatePolicyPage(slug: string) {
  // On-demand ISR revalidation after policy update
  const response = await fetch(
    \`\${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.REVALIDATION_SECRET}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    }
  )
  return response.ok
}

// FILE: app/api/revalidate/route.ts
export async function revalidateRoute(req: Request) {
  const { slug } = await req.json()
  const { revalidatePath } = await import('next/cache')
  revalidatePath(\`/p/\${slug}\`)
  return new Response(JSON.stringify({ revalidated: true, slug }))
}

export {}
