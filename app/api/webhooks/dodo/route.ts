/**
 * POST /api/webhooks/dodo
 *
 * Verifies Dodo Payments HMAC-SHA256 webhook signature,
 * logs the event type, and stubs fulfillment logic.
 *
 * Env required:
 *   DODO_PAYMENTS_WEBHOOK_KEY — signing secret from Dodo Dashboard → Developer → Webhooks
 */

import { headers } from "next/headers"
import { NextResponse } from "next/server"

// ─── Signature verification ────────────────────────────────────────────────

async function verifySignature(body: string, sig: string): Promise<boolean> {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY
  if (!secret) {
    console.error("[dodo-webhook] DODO_PAYMENTS_WEBHOOK_KEY is not set")
    return false
  }

  // Dodo sends: "sha256=<hex-digest>"
  const [scheme, signatureHex] = sig.split("=")
  if (scheme !== "sha256" || !signatureHex) {
    console.error("[dodo-webhook] Unexpected signature format:", sig)
    return false
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )

  const signatureBytes = Uint8Array.from(
    signatureHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  )

  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body))
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.text()
  const headerPayload = await headers()

  // Dodo may send either header name
  const sig =
    headerPayload.get("webhook-signature") ??
    headerPayload.get("x-dodo-signature")

  if (!sig) {
    console.error("[dodo-webhook] Missing signature header")
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
    console.error("[dodo-webhook] Failed to parse JSON body")
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.log(`[dodo-webhook] Received event: ${event.type}`)

  // ─── Event handlers (stubbed) ──────────────────────────────────────────

  switch (event.type) {
    case "payment.succeeded": {
      // TODO: activate subscription in Supabase
      // const { clerk_user_id } = event.data.metadata
      // const plan = PLAN_FROM_PRICE[event.data.price_id]
      // await upsert user_subscriptions: { user_id, plan, status: "active", ... }
      console.log("[dodo-webhook] STUB payment.succeeded — fulfillment pending")
      break
    }

    case "subscription.active": {
      // TODO: same as payment.succeeded — mark subscription active
      console.log("[dodo-webhook] STUB subscription.active — fulfillment pending")
      break
    }

    case "subscription.cancelled": {
      // TODO: update user_subscriptions: { status: "cancelled" }
      // downgrade user plan to "free" after current_period_end
      console.log("[dodo-webhook] STUB subscription.cancelled — fulfillment pending")
      break
    }

    case "subscription.renewed": {
      // TODO: update user_subscriptions: { status: "active", current_period_end: ... }
      console.log("[dodo-webhook] STUB subscription.renewed — fulfillment pending")
      break
    }

    case "payment.failed": {
      // TODO: notify user, optionally pause access
      console.log("[dodo-webhook] STUB payment.failed — fulfillment pending")
      break
    }

    default:
      console.log(`[dodo-webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
