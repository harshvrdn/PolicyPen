/**
 * Supabase client factory for PolicyPen
 *
 * Four clients — use the right one:
 *
 *   createBrowserClient()   → React components / client components
 *   createServerClient()    → Server components, Server Actions, Route Handlers
 *   createMiddlewareClient()→ middleware.ts ONLY
 *   createServiceClient()   → Clerk webhooks, Stripe webhooks, cron jobs (bypasses RLS)
 *
 * Auth model: Clerk issues JWTs. We pass the Clerk session token as the
 * Supabase Authorization header. RLS policies compare auth.uid() against
 * users.clerk_id. No Supabase Auth users are created.
 */

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr"
import { createServerClient as _createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import type { Database } from "@/types/supabase"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("[PolicyPen] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// ─────────────────────────────────────────────────────────────
// 1. Browser client (client components)
// ─────────────────────────────────────────────────────────────
export function createBrowserClient() {
  return _createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// ─────────────────────────────────────────────────────────────
// 2. Server client (server components, server actions, route handlers)
//    Automatically injects Clerk JWT so RLS works.
// ─────────────────────────────────────────────────────────────
export async function createServerClient() {
  const cookieStore = await cookies()

  // Get Clerk session token — used as Supabase auth bearer
  const { getToken } = await auth()
  const clerkToken = await getToken({ template: "supabase" })

  return _createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: clerkToken
        ? { Authorization: `Bearer ${clerkToken}` }
        : {},
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server component — cookies are read-only, ignore
        }
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────
// 3. Middleware client
//    Used in middleware.ts to refresh sessions. Does NOT inject
//    Clerk token (Clerk middleware handles that separately).
// ─────────────────────────────────────────────────────────────
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return _createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────
// 4. Service role client (BYPASSES RLS — use only in trusted server contexts)
//    Required for: Clerk webhooks, Stripe webhooks, cron jobs, admin ops
// ─────────────────────────────────────────────────────────────
export function createServiceClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error("[PolicyPen] Missing SUPABASE_SERVICE_ROLE_KEY — never expose this client-side")
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
