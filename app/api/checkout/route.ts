/**
 * POST /api/checkout
 *
 * Creates a Dodo Payments checkout session for a given plan.
 * Passes clerk_user_id in metadata so the webhook can activate the subscription.
 *
 * Body: { plan: "starter" | "builder" | "studio" }
 * Returns: { checkout_url: string }
 */

import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import DodoPayments from "dodopayments"

const PRICE_IDS: Record<string, string> = {
  starter: process.env.DODO_PRICE_ID_STARTER!,
  builder: process.env.DODO_PRICE_ID_BUILDER!,
  studio:  process.env.DODO_PRICE_ID_STUDIO!,
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { plan: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { plan } = body
  const productId = PRICE_IDS[plan]
  if (!productId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ""
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "Customer"

  const client = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    environment: (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "live_mode") as "live_mode" | "test_mode",
  })

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (client.checkoutSessions as any).create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email, name },
      metadata: { clerk_user_id: userId },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?plan=${plan}`,
    })

    return NextResponse.json({ checkout_url: session.checkout_url })
  } catch (err) {
    console.error("[checkout] Dodo session creation failed:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
