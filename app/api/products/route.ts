import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCurrentUser, createProduct, generateProductSlug } from "@/lib/db/dal"
import { createServiceClient } from "@/lib/supabase/client"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getCurrentUser(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found. Try signing out and back in." }, { status: 404 })
    }

    if (user.max_products != null && user.products_count >= user.max_products) {
      return NextResponse.json(
        { error: "Product limit reached. Upgrade your plan to add more products." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      website_url,
      description,
      business_type,
      primary_jurisdiction,
      company_legal_name,
      company_address,
      contact_email,
    } = body as Record<string, string>

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 })
    }

    let slug: string
    try {
      slug = await generateProductSlug(name)
    } catch {
      slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6)
    }

    const product = await createProduct({
      name: name.trim(),
      slug,
      user_id: user.id,
      website_url: website_url?.trim() || null,
      description: description?.trim() || null,
      business_type: business_type || null,
      primary_jurisdiction: primary_jurisdiction || "US",
      company_legal_name: company_legal_name?.trim() || null,
      company_address: company_address?.trim() || null,
      contact_email: contact_email?.trim() || null,
      is_active: true,
    })

    const supabase = createServiceClient()
    await supabase
      .from("users")
      .update({ products_count: user.products_count + 1 })
      .eq("clerk_id", userId)

    return NextResponse.json({
      product: { id: product.id, slug: product.slug, name: product.name },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create product."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
