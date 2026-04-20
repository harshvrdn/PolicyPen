import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/client"
import { recordAcknowledgement } from "@/lib/db/dal"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ product_id: string }> }
) {
  const { product_id } = await params

  let body: {
    policy_id: string
    end_user_email?: string
    cookie_consent_analytics?: boolean
    cookie_consent_marketing?: boolean
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { policy_id, end_user_email, cookie_consent_analytics, cookie_consent_marketing } = body

  if (!policy_id) {
    return NextResponse.json({ error: "policy_id is required" }, { status: 400 })
  }

  // Fetch policy to get hash and version (required by recordAcknowledgement)
  const supabase = createServiceClient()
  const { data: policy, error: policyErr } = await supabase
    .from("policies")
    .select("id, content_hash, version, product_id")
    .eq("id", policy_id)
    .eq("product_id", product_id)
    .single()

  if (policyErr || !policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 })
  }

  // Extract IP from headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip_address = forwarded?.split(",")[0]?.trim() ?? realIp ?? undefined
  const user_agent = request.headers.get("user-agent") ?? undefined

  try {
    const id = await recordAcknowledgement({
      policy_id,
      product_id,
      policy_hash: policy.content_hash ?? "",
      policy_version: policy.version,
      end_user_email,
      ip_address,
      user_agent,
      cookie_consent_analytics,
      cookie_consent_marketing,
    })

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error("[ack] recordAcknowledgement error:", err)
    return NextResponse.json({ error: "Failed to record acknowledgement" }, { status: 500 })
  }
}
