/**
 * Supabase client factory for PolicyPen — client-side
 *
 *   useSupabaseClient()  → client components (authenticated, RLS enforced)
 *   createServiceClient()→ server-only: webhooks, cron jobs (bypasses RLS)
 *
 * For server components, Server Actions, and API route handlers use:
 *   createServerClient() from "@/lib/supabase/server"
 *
 * Auth model: Clerk issues JWTs passed as the Supabase Authorization header.
 * RLS policies compare auth.uid() against users.clerk_id.
 */

import { createClient } from "@supabase/supabase-js"
import { useAuth } from "@clerk/nextjs"
import { useMemo } from "react"
import type { Database } from "@/types/supabase"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─────────────────────────────────────────────────────────────
// 1. Authenticated client hook (client components)
//    Fetches a fresh Clerk JWT on every Supabase request so RLS works.
// ─────────────────────────────────────────────────────────────
export function useSupabaseClient() {
  const { getToken } = useAuth()

  return useMemo(
    () =>
      createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          fetch: async (url, options = {}) => {
            const token = await getToken({ template: "supabase" })
            return fetch(url, {
              ...options,
              headers: {
                ...((options.headers as Record<string, string>) ?? {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            })
          },
        },
      }),
    [getToken]
  )
}

// ─────────────────────────────────────────────────────────────
// 2. Service role client (BYPASSES RLS — trusted server contexts only)
//    Required for: Clerk webhooks, Dodo webhooks, cron jobs, admin ops.
//    Never call this from a client component.
// ─────────────────────────────────────────────────────────────
export function createServiceClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error(
      "[PolicyPen] Missing SUPABASE_SERVICE_ROLE_KEY — never expose this client-side"
    )
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
