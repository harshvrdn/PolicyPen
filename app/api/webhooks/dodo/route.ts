/**
 * POST /api/webhooks/dodo
 *
 * Verifies Dodo Payments webhook signature and handles subscription lifecycle
 * events to keep public.users in sync.
 *
 * Signature scheme:
 *   Header: webhook-signature: v1,<hex-hmac-sha256>
 *   Strip "v1," prefix, compute HMAC-SHA256(rawBody) as hex, compare with timingSafeEqual.
 *
 * Env required:
 *   DODO_PAYMENTS_WEBHOOK_KEY   — signing secret from Dodo Dashboard → Developer → Webhooks
 *   DODO_PRICE_ID_STARTER       — Dodo product_id for the Starter plan ($9)
 *   DODO_PRICE_ID_BUILDER       — Dodo product_id for the Builder plan ($29)
 *   DODO_PRICE_ID_STUDIO        — Dodo product_id for the Studio plan ($59)
 */

import crypto from "crypto"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/client"

// ─── Plan config ───────────────────────────────────────────────────────────

type PlanTier = "starter" | "builder" | "studio"

interface PlanConfig {
  tier: PlanTier
  maxProducts: number
}

function getPlanFromProductId(productId: string): PlanConfig | null {
  const { DODO_PRICE_ID_STARTER, DODO_PRICE_ID_BUILDER, DODO_PRICE_ID_STUDIO } = process.env

  if (productId === DODO_PRICE_ID_STARTER) return { tier: "starter", maxProducts: 1 }
  if (productId === DODO_PRICE_ID_BUILDER) return { tier: "builder", maxProducts: 5 }
  if (productId === DODO_PRICE_ID_STUDIO)  return { tier: "studio",  maxProducts: 999 }

  return null
}

// ─── Signature verification ────────────────────────────────────────────────

function verifySignature(rawBody: string, sigHeader: string): boolean {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY
  if (!secret) {
    console.error("[dodo-webhook] DODO_PAYMENTS_WEBHOOK_KEY is not set")
    return false
  }

  // Header format: "v1,<hex-hmac-sha256>" — strip the prefix
  const receivedSignature = sigHeader.replace("v1,", "").trim()
  if (!receivedSignature) {
    console.error("[dodo-webhook] Signature header is empty after stripping prefix")
    return false
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")

  const sigBuffer      = Buffer.from(receivedSignature, "hex")
  const expectedBuffer = Buffer.from(expectedSignature, "hex")

  if (sigBuffer.length === 0 || sigBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Read body once — do NOT call request.json()
  const rawBody = await request.text()

  const sigHeader = request.headers.get("webhook-signature") ?? ""

  if (!sigHeader) {
    console.error("[dodo-webhook] Missing webhook-signature header")
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 })
  }

  if (!verifySignature(rawBody, sigHeader)) {
    console.error("[dodo-webhook] Signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    console.error("[dodo-webhook] Failed to parse JSON body")
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.log(`[dodo-webhook] Received event: ${event.type}`)

  const supabase = createServiceClient()

  // ─── Event handlers ────────────────────────────────────────────────────

  switch (event.type) {
    case "payment.succeeded": {
      const customerId     = event.data.customer_id as string | undefined
      const subscriptionId = event.data.subscription_id as string | undefined
      const productId      = event.data.product_id as string | undefined

      if (!customerId || !productId) {
        console.error("[dodo-webhook] payment.succeeded: missing customer_id or product_id", event.data)
        break
      }

      const plan = getPlanFromProductId(productId)
      if (!plan) {
        console.warn(`[dodo-webhook] payment.succeeded: unrecognised product_id "${productId}" — skipping`)
        break
      }

      const { error } = await supabase
        .from("users")
        .update({
          plan: plan.tier,
          subscription_status: "active",
          dodo_customer_id: customerId,
          ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
          max_products: plan.maxProducts,
          plan_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("dodo_customer_id", customerId)

      if (error) {
        console.error("[dodo-webhook] payment.succeeded: DB update failed", error)
      } else {
        console.log(`[dodo-webhook] payment.succeeded: customer ${customerId} → plan ${plan.tier}`)
      }
      break
    }

    case "subscription.active": {
      const customerId     = event.data.customer_id as string | undefined
      const subscriptionId = event.data.subscription_id as string | undefined
      const productId      = event.data.product_id as string | undefined

      if (!customerId || !productId) {
        console.error("[dodo-webhook] subscription.active: missing customer_id or product_id", event.data)
        break
      }

      const plan = getPlanFromProductId(productId)
      if (!plan) {
        console.warn(`[dodo-webhook] subscription.active: unrecognised product_id "${productId}" — skipping`)
        break
      }

      const { error } = await supabase
        .from("users")
        .update({
          plan: plan.tier,
          subscription_status: "active",
          dodo_customer_id: customerId,
          ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
          max_products: plan.maxProducts,
          plan_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("dodo_customer_id", customerId)

      if (error) {
        console.error("[dodo-webhook] subscription.active: DB update failed", error)
      } else {
        console.log(`[dodo-webhook] subscription.active: customer ${customerId} → plan ${plan.tier}`)
      }
      break
    }

    case "subscription.cancelled": {
      const subscriptionId = event.data.subscription_id as string | undefined

      if (!subscriptionId) {
        console.error("[dodo-webhook] subscription.cancelled: missing subscription_id", event.data)
        break
      }

      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "cancelled",
          plan_expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscriptionId)

      if (error) {
        console.error("[dodo-webhook] subscription.cancelled: DB update failed", error)
      } else {
        console.log(`[dodo-webhook] subscription.cancelled: subscription ${subscriptionId} marked cancelled`)
      }
      break
    }

    case "subscription.renewed": {
      const subscriptionId = event.data.subscription_id as string | undefined

      if (!subscriptionId) {
        console.error("[dodo-webhook] subscription.renewed: missing subscription_id", event.data)
        break
      }

      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "active",
          plan_expires_at: null,
          ai_tokens_used_month: 0,
          tokens_reset_at: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            1
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscriptionId)

      if (error) {
        console.error("[dodo-webhook] subscription.renewed: DB update failed", error)
      } else {
        console.log(`[dodo-webhook] subscription.renewed: subscription ${subscriptionId} renewed`)
      }
      break
    }

    case "payment.failed": {
      const customerId = event.data.customer_id as string | undefined
      console.warn(`[dodo-webhook] payment.failed: customer ${customerId ?? "unknown"}`)
      break
    }

    default:
      // Return 200 so Dodo stops retrying unrecognised event types
      console.log(`[dodo-webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
