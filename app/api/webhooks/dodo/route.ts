/**
 * POST /api/webhooks/dodo
 *
 * Verifies Dodo Payments webhook signature and handles subscription lifecycle
 * events to keep public.users in sync.
 *
 * Dodo follows the Standard Webhooks spec (https://standardwebhooks.com/):
 *   - Headers: webhook-id, webhook-timestamp, webhook-signature
 *   - Signed message: "<webhook-id>.<webhook-timestamp>.<raw-body>"
 *   - Signature: HMAC-SHA256 of the signed message, base64-encoded
 *   - Header format: "v1,<base64-signature>" (strip "v1," prefix before comparing)
 *   - Secret: base64-encoded in the dashboard; decode before use
 *
 * Env required:
 *   DODO_PAYMENTS_WEBHOOK_KEY   — signing secret from Dodo Dashboard → Developer → Webhooks
 *   DODO_PRICE_ID_STARTER       — Dodo product_id for the Starter plan ($9)
 *   DODO_PRICE_ID_BUILDER       — Dodo product_id for the Builder plan ($29)
 *   DODO_PRICE_ID_STUDIO        — Dodo product_id for the Studio plan ($59)
 */

import { headers } from "next/headers"
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
// Standard Webhooks spec: https://standardwebhooks.com/
//
// 1. Signed message = "<webhook-id>.<webhook-timestamp>.<raw-body>"
// 2. Secret is base64-encoded in Dodo dashboard — decode before use
// 3. Compute HMAC-SHA256 of signed message using decoded secret
// 4. Base64-encode result and compare to signature (after stripping "v1," prefix)

async function verifySignature(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  sigHeader: string
): Promise<boolean> {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY
  if (!secret) {
    console.error("[dodo-webhook] DODO_PAYMENTS_WEBHOOK_KEY is not set")
    return false
  }

  // Dodo sends: "v1,<base64-signature>" — strip the prefix
  const signatureB64 = sigHeader.replace(/^v1,/, "")
  if (!signatureB64) {
    console.error("[dodo-webhook] Unexpected signature header format:", sigHeader)
    return false
  }

  // Standard Webhooks signed message
  const signedMessage = `${webhookId}.${webhookTimestamp}.${body}`

  // Secret is base64-encoded in the Dodo dashboard
  const secretBytes = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedMessage)
  )

  const computedB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))

  return computedB64 === signatureB64
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.text()
  const headerPayload = await headers()

  // Standard Webhooks headers
  const webhookId        = headerPayload.get("webhook-id")
  const webhookTimestamp = headerPayload.get("webhook-timestamp")
  const webhookSig       = headerPayload.get("webhook-signature")

  if (!webhookId || !webhookTimestamp || !webhookSig) {
    console.error("[dodo-webhook] Missing required webhook headers", {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSig,
    })
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 })
  }

  const isValid = await verifySignature(body, webhookId, webhookTimestamp, webhookSig)
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

  const supabase = createServiceClient()

  // ─── Event handlers ────────────────────────────────────────────────────

  switch (event.type) {
    case "payment.succeeded": {
      /*
       * Expected payload shape:
       *   event.data.customer_id       — Dodo customer ID
       *   event.data.subscription_id   — Dodo subscription ID
       *   event.data.product_id        — Dodo product/price ID (matched to plan tier)
       */
      const customerId    = event.data.customer_id as string | undefined
      const subscriptionId = event.data.subscription_id as string | undefined
      const productId     = event.data.product_id as string | undefined

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
      /*
       * Expected payload shape:
       *   event.data.customer_id       — Dodo customer ID
       *   event.data.subscription_id   — Dodo subscription ID
       *   event.data.product_id        — Dodo product/price ID
       */
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
      /*
       * Expected payload shape:
       *   event.data.subscription_id   — Dodo subscription ID
       *
       * Plan is NOT downgraded immediately — user keeps access until plan_expires_at.
       * A separate cleanup job (or next login check) should downgrade after expiry.
       */
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
      /*
       * Expected payload shape:
       *   event.data.subscription_id   — Dodo subscription ID
       *
       * Re-activates the subscription and resets monthly token usage.
       */
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
      // Log only — no plan change on payment failure (Dodo will retry)
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
