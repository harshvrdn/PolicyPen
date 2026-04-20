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
    return new NextResponse("Not found", { status: 404 })
  }

  const { data: policies } = await supabase
    .from("policies")
    .select("policy_type")
    .eq("product_id", product.id)
    .eq("is_current_version", true)
    .eq("status", "active")
    .not("published_at", "is", null)

  const links = (policies ?? [])
    .map((p) => {
      const meta = POLICY_META[p.policy_type]
      if (!meta) return ""
      const url = `${appUrl}/p/${slug}/${meta.urlSlug}`
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#1a4a2e;text-decoration:none;font-size:12px;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${meta.label}</a>`
    })
    .filter(Boolean)

  const separators = links.reduce<string[]>((acc, link, i) => {
    acc.push(link)
    if (i < links.length - 1) {
      acc.push(`<span style="color:#d4cfc2;">·</span>`)
    }
    return acc
  }, [])

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #fefcf8;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    color: #7a7060;
    padding: 8px 16px;
  }
  .links {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .brand a {
    color: #7a7060;
    text-decoration: none;
  }
  .brand a:hover { text-decoration: underline; }
  .sep { color: #d4cfc2; }
</style>
</head>
<body>
<div class="links">
  ${separators.join("\n  ")}
  <span class="sep">|</span>
  <span class="brand"><a href="https://policypen.io" target="_blank" rel="noopener noreferrer">Powered by PolicyPen</a></span>
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
