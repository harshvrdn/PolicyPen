import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/client"

const POLICY_META: Record<string, { label: string; urlSlug: string }> = {
  privacy_policy:    { label: "Privacy Policy",    urlSlug: "privacy-policy" },
  terms_of_service:  { label: "Terms of Service",  urlSlug: "terms-of-service" },
  cookie_policy:     { label: "Cookie Policy",      urlSlug: "cookie-policy" },
  refund_policy:     { label: "Refund Policy",      urlSlug: "refund-policy" },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://policypen.io"
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: policies } = await supabase
    .from("policies")
    .select("policy_type")
    .eq("product_id", product.id)
    .eq("is_current_version", true)
    .eq("status", "active")
    .not("published_at", "is", null)

  const policyList = (policies ?? [])
    .map((p) => {
      const meta = POLICY_META[p.policy_type]
      if (!meta) return null
      return {
        type: p.policy_type,
        label: meta.label,
        url: `${appUrl}/p/${slug}/${meta.urlSlug}`,
      }
    })
    .filter(Boolean)

  return NextResponse.json(
    { product: { name: product.name, slug: product.slug }, policies: policyList },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  )
}
