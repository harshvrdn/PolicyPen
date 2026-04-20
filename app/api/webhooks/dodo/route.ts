/**
 * POST /api/webhooks/dodo
 *
 * Syncs Dodo Payments subscription lifecycle → Supabase user_subscriptions
 *
 * Events handled:
 *   payment.succeeded        → activate subscription, set plan tier
 *   subscription.cancelled   → mark cancelled, downgrade user
 *   subscription.renewed     → extend current_period_end
 *
 * Setup:
 *   1. Dodo Dashboard → Webhooks → Add endpoint:
 *      https://yourdomain.com/api/webhooks/dodo
 *   2. Subscribe to above events
 *   3. Copy signing secret → DODO_WEBHOOK_SECRET env var
 */

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/client"

const PLAN_FROM_PRICE: Record<string, string> = {
  [process.env.NEXT_PUBLIC_PRICE_ID_STARTER!]: "starter",
  [process.env.NEXT_PUBLIC_PRICE_ID_BUILDER!]: "builder",
  [process.env.NEXT_PUBLIC_PRICE_ID_STUDIO!]: "studio",
}

async function verifySignature(body: string, sig: string): Promise<boolean> {
  const secret = process.env.DODO_WEBHOOK_SECRET
  if (!secret) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )

  const [, signatureHex] = sig.split("=")
  if (!signatureHex) return false

  const signatureBytes = Uint8Array.from(
    signatureHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  )

  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body))
}

export async function POST(request: Request) {
  const body = await request.text()
  const headerPayload = await headers()
  const sig = headerPayload.get("webhook-signature") ?? headerPayload.get("x-dodo-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 })
  }

  const isValid = await verifySignature(body, sig)
  if (!isValid) {
    console.error("[dodo-webhook] Signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any

  try {
    switch (event.type) {
      case "payment.succeeded": {
        const data = event.data
        const metadata = data.metadata as Record<string, unknown> | undefined
        const clerkUserId = metadata?.clerk_user_id as string | undefined
        if (!clerkUserId) {
          console.error("[dodo-webhook] payment.succeeded missing clerk_user_id in metadata")
          break
        }

        const priceId = data.price_id as string | undefined
        const plan = (priceId && PLAN_FROM_PRICE[priceId]) ?? "starter"

        const { error } = await supabase
          .from("user_subscriptions")
          .upsert(
            {
              user_id: clerkUserId,
              dodo_customer_id: data.customer_id as string,
              dodo_subscription_id: data.subscription_id as string,
              plan,
              status: "active",
              current_period_end: (data.current_period_end as string) ?? null,
            },
            { onConflict: "user_id" }
          )

        if (error) throw error
        console.log(`[dodo-webhook] payment.succeeded: ${clerkUserId} → ${plan}`)
        break
      }

      case "subscription.cancelled": {
        const data = event.data
        const subscriptionId = data.subscription_id as string

        const { error } = await supabase
          .from("user_subscriptions")
          .update({ status: "cancelled", current_period_end: (data.current_period_end as string) ?? null })
          .eq("dodo_subscription_id", subscriptionId)

        if (error) throw error
        console.log(`[dodo-webhook] subscription.cancelled: ${subscriptionId}`)
        break
      }

      case "subscription.renewed": {
        const data = event.data
        const subscriptionId = data.subscription_id as string

        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            status: "active",
            current_period_end: data.current_period_end as string,
          })
          .eq("dodo_subscription_id", subscriptionId)

        if (error) throw error
        console.log(`[dodo-webhook] subscription.renewed: ${subscriptionId}`)
        break
      }

      default:
        console.log(`[dodo-webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error("[dodo-webhook] DB operation failed:", err)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
