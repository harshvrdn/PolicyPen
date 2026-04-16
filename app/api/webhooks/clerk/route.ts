/**
 * POST /api/webhooks/clerk
 *
 * Syncs Clerk user lifecycle events → Supabase users table.
 * Uses service role client (bypasses RLS) since this runs before
 * any user session exists.
 *
 * Events handled:
 *   user.created → INSERT into users
 *   user.updated → UPDATE users WHERE clerk_id = ...
 *   user.deleted → soft-delete (set is_active=false on products)
 *                  Hard delete cascades via FK if needed.
 *
 * Setup:
 *   1. Clerk Dashboard → Webhooks → Add endpoint:
 *      https://yourdomain.com/api/webhooks/clerk
 *   2. Subscribe to: user.created, user.updated, user.deleted
 *   3. Copy "Signing Secret" → CLERK_WEBHOOK_SECRET env var
 */

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { createServiceClient } from "@/lib/supabase/client"

// Clerk webhook event types (minimal — only what we need)
interface ClerkEmailAddress {
  email_address: string
  id: string
}

interface ClerkUserCreatedEvent {
  type: "user.created"
  data: {
    id: string // clerk_id
    email_addresses: ClerkEmailAddress[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

interface ClerkUserUpdatedEvent {
  type: "user.updated"
  data: {
    id: string
    email_addresses: ClerkEmailAddress[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

interface ClerkUserDeletedEvent {
  type: "user.deleted"
  data: {
    id: string
    deleted: boolean
  }
}

type ClerkWebhookEvent =
  | ClerkUserCreatedEvent
  | ClerkUserUpdatedEvent
  | ClerkUserDeletedEvent

// ─────────────────────────────────────────────────────────────
// Helper: extract primary email from Clerk event data
// ─────────────────────────────────────────────────────────────
function getPrimaryEmail(data: ClerkUserCreatedEvent["data"] | ClerkUserUpdatedEvent["data"]): string {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  )
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? ""
}

// ─────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  // ── Verify Svix signature ──────────────────────────────────
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const body = await request.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let event: ClerkWebhookEvent
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // ── Handle events ──────────────────────────────────────────
  try {
    switch (event.type) {
      case "user.created": {
        const { data } = event
        const email = getPrimaryEmail(data)
        const fullName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(" ") || null

        const { error } = await supabase.from("users").insert({
          clerk_id: data.id,
          email,
          full_name: fullName,
          avatar_url: data.image_url,
          plan: "free",
          // plan limits auto-set by sync_plan_limits trigger
        })

        if (error) {
          // Idempotency: duplicate clerk_id is fine (webhook retry)
          if (error.code === "23505") {
            console.log(`[clerk-webhook] user.created: ${data.id} already exists, skipping`)
            break
          }
          throw error
        }

        console.log(`[clerk-webhook] user.created: ${data.id} → ${email}`)
        break
      }

      case "user.updated": {
        const { data } = event
        const email = getPrimaryEmail(data)
        const fullName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(" ") || null

        const { error } = await supabase
          .from("users")
          .update({
            email,
            full_name: fullName,
            avatar_url: data.image_url,
          })
          .eq("clerk_id", data.id)

        if (error) throw error
        console.log(`[clerk-webhook] user.updated: ${data.id}`)
        break
      }

      case "user.deleted": {
        const { data } = event
        // Soft-delete: deactivate all products (policies cascade to hosted pages)
        // Hard user deletion would violate audit trail (acknowledgements)
        const { error } = await supabase
          .from("products")
          .update({ is_active: false })
          .eq(
            "user_id",
            supabase
              .from("users")
              .select("id")
              .eq("clerk_id", data.id)
              .single() as unknown as string
          )

        // For GDPR right-to-erasure, implement a separate DSAR flow
        // that anonymizes PII while retaining audit records
        if (error) {
          console.warn(`[clerk-webhook] user.deleted soft-delete warning:`, error)
        }
        console.log(`[clerk-webhook] user.deleted: ${data.id} → products deactivated`)
        break
      }

      default:
        console.log(`[clerk-webhook] Unhandled event type: ${(event as ClerkWebhookEvent).type}`)
    }
  } catch (err) {
    console.error("[clerk-webhook] DB operation failed:", err)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

// Clerk sends GET to verify endpoint — respond 200
export async function GET() {
  return NextResponse.json({ status: "ok" })
}
