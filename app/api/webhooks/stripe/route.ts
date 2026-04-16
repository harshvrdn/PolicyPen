/**
 * POST /api/webhooks/stripe
 *
 * Syncs Stripe subscription lifecycle → Supabase users.plan
 *
 * Events handled:
 *   checkout.session.completed     → link Stripe customer to user, activate plan
 *   customer.subscription.updated  → plan change, renewal
 *   customer.subscription.deleted  → cancellation → downgrade to free
 *   invoice.payment_failed         → mark subscription as past_due
 *
 * Setup:
 *   1. Stripe Dashboard → Webhooks → Add endpoint:
 *      https://yourdomain.com/api/webhooks/stripe
 *   2. Subscribe to above events
 *   3. Copy "Signing secret" → STRIPE_WEBHOOK_SECRET env var
 */

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/client"
import type { PlanTier } from "@/types/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Map Stripe Price IDs → PolicyPen plan tiers
const PRICE_TO_PLAN: Record<string, PlanTier> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY!]: "starter",
  [process.env.STRIPE_PRICE_BUILDER_MONTHLY!]: "builder",
  [process.env.STRIPE_PRICE_STUDIO_MONTHLY!]: "studio",
}

export async function POST(request: Request) {
  const body = await request.text()
  const headerPayload = await headers()
  const sig = headerPayload.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription") break

        const clerkId = session.metadata?.clerk_id
        if (!clerkId) {
          console.error("[stripe-webhook] checkout.session missing clerk_id metadata")
          break
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        const priceId = subscription.items.data[0]?.price.id
        const plan = PRICE_TO_PLAN[priceId] ?? "starter"

        const { error } = await supabase
          .from("users")
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("clerk_id", clerkId)

        if (error) throw error
        console.log(`[stripe-webhook] checkout.completed: ${clerkId} → ${plan}`)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const priceId = subscription.items.data[0]?.price.id
        const plan = PRICE_TO_PLAN[priceId] ?? "free"

        const { error } = await supabase
          .from("users")
          .update({
            plan,
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
            plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_customer_id", customerId)

        if (error) throw error
        console.log(`[stripe-webhook] subscription.updated: ${customerId} → ${plan} (${subscription.status})`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { error } = await supabase
          .from("users")
          .update({
            plan: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            plan_expires_at: null,
          })
          .eq("stripe_customer_id", customerId)

        if (error) throw error
        console.log(`[stripe-webhook] subscription.deleted: ${customerId} → downgraded to free`)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { error } = await supabase
          .from("users")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId)

        if (error) throw error
        console.log(`[stripe-webhook] payment_failed: ${customerId} → past_due`)
        break
      }

      default:
        console.log(`[stripe-webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error("[stripe-webhook] DB operation failed:", err)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
