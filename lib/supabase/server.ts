/**
 * createSupabaseServerClient — authenticated Supabase client for server
 * components, Server Actions, and API route handlers.
 *
 * Uses @supabase/ssr so Next.js request URL path construction is handled
 * correctly. Injects the Clerk session JWT so Supabase RLS policies can
 * validate auth.uid() == users.clerk_id. Falls back to no Authorization
 * header when there is no active session (e.g. public pages).
 *
 * Note: auth() is async in Next.js 15 — always await it.
 */

import { createServerClient as _createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { auth } from "@clerk/nextjs/server"
import type { Database } from "@/types/supabase"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { getToken } = await auth()
  const token = await getToken({ template: "supabase" })

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie writes are ignored
          }
        },
      },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  )
}

// Alias used by DAL and route handlers — same function, familiar name.
export const createServerClient = createSupabaseServerClient
