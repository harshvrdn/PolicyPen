import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/client"
import dns from "dns"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id } = body as { product_id: string }

    if (!product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify ownership and fetch current domain
    const { data: product } = await supabase
      .from("products")
      .select("id, user_id, custom_domain")
      .eq("id", product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (product.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (!product.custom_domain) {
      return NextResponse.json(
        { error: "No custom domain set for this product", verified: false },
        { status: 400 }
      )
    }

    const txtHost = `_policypen.${product.custom_domain}`
    const expectedTxt = `policypen-verify=${product_id}`

    let verified = false
    try {
      const records = await dns.promises.resolveTxt(txtHost)
      verified = records.some((chunks) => chunks.join("") === expectedTxt)
    } catch {
      // DNS lookup failed — domain not found or TXT record absent
      verified = false
    }

    if (verified) {
      await supabase
        .from("products")
        .update({
          custom_domain_verified: true,
          custom_domain_verified_at: new Date().toISOString(),
        })
        .eq("id", product_id)

      return NextResponse.json({
        verified: true,
        message: "Domain verified successfully.",
      })
    }

    return NextResponse.json({
      verified: false,
      message: `TXT record not found. Add a TXT record for ${txtHost} with value: ${expectedTxt}`,
    })
  } catch (err) {
    console.error("[domains/verify POST]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
