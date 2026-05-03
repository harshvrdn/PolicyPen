/**
 * GET /api/debug/supabase
 * Temporary diagnostic endpoint — shows Supabase connectivity status.
 * Requires authentication.
 */
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  const info: Record<string, unknown> = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL:      url     ? url              : "❌ MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon    ? anon.slice(0, 20) + "…" : "❌ MISSING",
      SUPABASE_SERVICE_ROLE_KEY:     service ? service.slice(0, 20) + "…" : "❌ MISSING",
    },
  }

  if (!url || !service) {
    return NextResponse.json({ ...info, result: "Cannot test — env vars missing" }, { status: 200 })
  }

  // Test 1: service client query
  try {
    const svc = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await svc.from("users").select("clerk_id").limit(1)
    info.service_client = error
      ? { ok: false, code: error.code, message: error.message, details: error.details }
      : { ok: true, rows: data?.length ?? 0 }
  } catch (e) {
    info.service_client = { ok: false, thrown: e instanceof Error ? e.message : String(e) }
  }

  // Test 2: anon client query (no auth)
  try {
    const anon_client = createClient(url, anon!, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await anon_client.from("users").select("clerk_id").limit(1)
    info.anon_client = error
      ? { ok: false, code: error.code, message: error.message, details: error.details }
      : { ok: true, rows: data?.length ?? 0 }
  } catch (e) {
    info.anon_client = { ok: false, thrown: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json(info, { status: 200 })
}
