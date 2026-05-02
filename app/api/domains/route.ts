import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/db/dal"

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, custom_domain } = body as {
      product_id: string
      custom_domain: string | null
    }

    if (!product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 })
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_REGEX.test(product_id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const dbUser = await getCurrentUser(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const supabase = createServiceClient()

    // Verify ownership — compare internal UUIDs, not Clerk ID vs DB UUID
    const { data: product } = await supabase
      .from("products")
      .select("id, user_id, slug")
      .eq("id", product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (product.user_id !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate domain format if setting (not clearing)
    if (custom_domain !== null && custom_domain !== "") {
      if (!DOMAIN_REGEX.test(custom_domain)) {
        return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
      }

      // Check uniqueness across other products
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .ilike("custom_domain", custom_domain)
        .neq("id", product_id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: "This domain is already registered to another product" },
          { status: 409 }
        )
      }
    }

    const domainValue = custom_domain === "" ? null : custom_domain

    const { data: updated, error } = await supabase
      .from("products")
      .update({
        custom_domain: domainValue,
        custom_domain_verified: false,
        custom_domain_verified_at: null,
      })
      .eq("id", product_id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This domain is already registered to another product" },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: updated })
  } catch (err) {
    console.error("[domains PATCH]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
