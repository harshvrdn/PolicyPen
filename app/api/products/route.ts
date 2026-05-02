import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCurrentUser, createProduct, generateProductSlug, completeOnboarding } from "@/lib/db/dal"
import { createServiceClient } from "@/lib/supabase/client"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    let user = await getCurrentUser(userId).catch(() => null)

    // Safety net: Clerk webhook may not have fired yet (common during local dev /
    // initial setup). Auto-create a minimal user record so product creation works.
    if (!user) {
      console.warn(`[api/products] User ${userId} not in DB — attempting auto-create`)
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const email = clerkUser.primaryEmailAddress?.emailAddress ?? ""
      const fullName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null

      const svc = createServiceClient()
      const { error: insertErr } = await svc.from("users").insert({
        clerk_id: userId,
        email,
        full_name: fullName,
        plan: "free",
      })

      // 23505 = unique violation (already exists — race condition). Either way, re-fetch.
      if (insertErr && insertErr.code !== "23505") {
        console.error("[api/products] Auto-create user failed:", insertErr.message)
        return NextResponse.json(
          { error: "Could not create user profile. Please sign out and back in." },
          { status: 500 }
        )
      }

      // Use service client here — getCurrentUser goes through RLS which requires a
      // configured Clerk JWT template; bypass that for this one safety-net read.
      const { data: fetchedUser, error: fetchErr } = await svc
        .from("users")
        .select("*")
        .eq("clerk_id", userId)
        .single()

      if (fetchErr || !fetchedUser) {
        console.error("[api/products] Re-fetch user failed:", fetchErr?.message)
        return NextResponse.json(
          { error: "User profile not found. Please sign out and back in." },
          { status: 404 }
        )
      }
      user = fetchedUser
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
      slug: clientSlug,
      website_url,
      description,
      business_type,
      primary_jurisdiction,
      company_legal_name,
      company_address,
      contact_email,
      questionnaire_data,
    } = body as Record<string, unknown>

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 })
    }
    if (typeof name === "string" && name.length > 200) {
      return NextResponse.json({ error: "Product name must be 200 characters or fewer." }, { status: 400 })
    }
    if (description && typeof description === "string" && description.length > 2000) {
      return NextResponse.json({ error: "Description must be 2000 characters or fewer." }, { status: 400 })
    }
    if (website_url && typeof website_url === "string" && website_url.length > 500) {
      return NextResponse.json({ error: "website_url must be 500 characters or fewer." }, { status: 400 })
    }
    if (company_legal_name && typeof company_legal_name === "string" && company_legal_name.length > 300) {
      return NextResponse.json({ error: "company_legal_name must be 300 characters or fewer." }, { status: 400 })
    }
    if (company_address && typeof company_address === "string" && company_address.length > 500) {
      return NextResponse.json({ error: "company_address must be 500 characters or fewer." }, { status: 400 })
    }

    if (contact_email && typeof contact_email === "string" && contact_email.trim()) {
      if (!EMAIL_REGEX.test(contact_email.trim())) {
        return NextResponse.json({ error: "Invalid email format for contact_email." }, { status: 400 })
      }
    }

    // Use client-generated slug when provided (belt-and-suspenders); otherwise
    // try the DB RPC, falling back to local slugify.
    let slug: string
    if (clientSlug && typeof clientSlug === "string" && clientSlug.trim()) {
      slug = clientSlug.trim()
    } else {
      try {
        slug = await generateProductSlug(name)
      } catch {
        slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6)
      }
    }

    const product = await createProduct({
      name: (name as string).trim(),
      slug,
      user_id: user.id,
      website_url: (website_url as string)?.trim() || null,
      description: (description as string)?.trim() || null,
      business_type: (business_type as string) || null,
      primary_jurisdiction: (primary_jurisdiction as string) || "US",
      company_legal_name: (company_legal_name as string)?.trim() || null,
      company_address: (company_address as string)?.trim() || null,
      contact_email: (contact_email as string)?.trim() || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questionnaire_data: (questionnaire_data as any) ?? null,
      questionnaire_completed_at: questionnaire_data ? new Date().toISOString() : null,
      is_active: true,
    })

    const supabase = createServiceClient()
    await supabase
      .from("users")
      .update({ products_count: user.products_count + 1 })
      .eq("clerk_id", userId)

    // Mark onboarding complete on first product creation
    if (!user.onboarding_completed) {
      await completeOnboarding(userId).catch(() => {})
    }

    return NextResponse.json({
      product: { id: product.id, slug: product.slug, name: product.name },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create product."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
