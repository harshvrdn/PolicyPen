/**
 * POST /api/webhooks/dodo
 *
 * Verifies Dodo Payments webhook signature via Svix and handles subscription
 * lifecycle events to keep public.users in sync.
 *
 * Dodo uses Svix headers: svix-id, svix-timestamp, svix-signature
 *
 * Env required:
 *   DODO_PAYMENTS_WEBHOOK_KEY   — signing secret from Dodo Dashboard → Developer → Webhooks
 *   DODO_PRICE_ID_STARTER       — Dodo product_id for the Starter plan ($9)
 *   DODO_PRICE_ID_BUILDER       — Dodo product_id for the Builder plan ($29)
 *   DODO_PRICE_ID_STUDIO        — Dodo product_id for the Studio plan ($59)
 */

import { Webhook } from "svix"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/client"
import { sendPaymentConfirmationEmail } from "@/lib/email"

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

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const rawBody = await request.text()

  const svixId        = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[dodo-webhook] Missing svix headers")
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const wh = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!)

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = wh.verify(rawBody, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> }
  } catch (err) {
    console.error("[dodo-webhook] Verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log(`[dodo-webhook] Received event: ${event.type}`)

  const supabase = createServiceClient()

  // ─── Event handlers ────────────────────────────────────────────────────

  switch (event.type) {
    case "payment.succeeded": {
      const customerId     = event.data.customer_id as string | undefined
      const subscriptionId = event.data.subscription_id as string | undefined
      const productId      = event.data.product_id as string | undefined
      const metadata       = event.data.metadata as Record<string, string> | undefined
      const clerkUserId    = metadata?.clerk_user_id

      if (!productId) {
        console.error("[dodo-webhook] payment.succeeded: missing product_id", event.data)
        break
      }

      const plan = getPlanFromProductId(productId)
      if (!plan) {
        console.warn(`[dodo-webhook] payment.succeeded: unrecognised product_id "${productId}" — skipping`)
        break
      }

      const updates = {
        plan: plan.tier,
        subscription_status: "active",
        ...(customerId ? { dodo_customer_id: customerId } : {}),
        ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
        max_products: plan.maxProducts,
        plan_expires_at: null,
        updated_at: new Date().toISOString(),
      }

      // Prefer matching by clerk_id from checkout metadata (works for new customers
      // who don't have dodo_customer_id set yet); fall back to dodo_customer_id.
      const query = clerkUserId
        ? supabase.from("users").update(updates).eq("clerk_id", clerkUserId)
        : supabase.from("users").update(updates).eq("dodo_customer_id", customerId!)

      const { error } = await query

      if (error) {
        console.error("[dodo-webhook] payment.succeeded: DB update failed", error)
      } else {
        console.log(`[dodo-webhook] payment.succeeded: ${clerkUserId ?? customerId} → plan ${plan.tier}`)

        // Send payment confirmation email
        const lookupCol = clerkUserId ? "clerk_id" : "dodo_customer_id"
        const lookupVal = clerkUserId ?? customerId!
        const { data: userData } = await supabase
          .from("users")
          .select("email, full_name")
          .eq(lookupCol, lookupVal)
          .single()

        if (userData?.email) {
          const firstName = userData.full_name?.split(" ")[0] ?? null
          sendPaymentConfirmationEmail(userData.email, firstName, plan.tier).catch(() => {})
        }
      }
      break
    }

    case "subscription.active": {
      const customerId     = event.data.customer_id as string | undefined
      const subscriptionId = event.data.subscription_id as string | undefined
      const productId      = event.data.product_id as string | undefined
      const metadata       = event.data.metadata as Record<string, string> | undefined
      const clerkUserId    = metadata?.clerk_user_id

      if (!productId) {
        console.error("[dodo-webhook] subscription.active: missing product_id", event.data)
        break
      }

      const plan = getPlanFromProductId(productId)
      if (!plan) {
        console.warn(`[dodo-webhook] subscription.active: unrecognised product_id "${productId}" — skipping`)
        break
      }

      const updates = {
        plan: plan.tier,
        subscription_status: "active",
        ...(customerId ? { dodo_customer_id: customerId } : {}),
        ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
        max_products: plan.maxProducts,
        plan_expires_at: null,
        updated_at: new Date().toISOString(),
      }

      const query = clerkUserId
        ? supabase.from("users").update(updates).eq("clerk_id", clerkUserId)
        : supabase.from("users").update(updates).eq("dodo_customer_id", customerId!)

      const { error } = await query

      if (error) {
        console.error("[dodo-webhook] subscription.active: DB update failed", error)
      } else {
        console.log(`[dodo-webhook] subscription.active: ${clerkUserId ?? customerId} → plan ${plan.tier}`)
      }
      break
    }

    case "subscription.cancelled": {
      const subscriptionId  = event.data.subscription_id as string | undefined
      // Use current_period_end from the event so the user retains access until
      // the period they already paid for ends, not at the moment of cancellation.
      const periodEnd = (event.data.current_period_end ?? event.data.next_billing_date) as string | undefined

      if (!subscriptionId) {
        console.error("[dodo-webhook] subscription.cancelled: missing subscription_id", event.data)
        break
      }

      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "cancelled",
          plan_expires_at: periodEnd ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscriptionId)

      if (error) {
        console.error("[dodo-webhook] subscription.cancelled: DB update failed", error)
      } else {
        console.log(`[dodo-webhook] subscription.cancelled: subscription ${subscriptionId} expires ${periodEnd ?? "at natural end"}`)
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
      console.log(`[dodo-webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
