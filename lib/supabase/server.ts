/**
 * createSupabaseServerClient — authenticated Supabase client for server
 * components, Server Actions, and API route handlers.
 *
 * Injects the Clerk session JWT so Supabase RLS policies can validate
 * auth.uid() == users.clerk_id. Falls back to no Authorization header
 * when there is no active session (e.g. public pages).
 *
 * Note: auth() is async in Next.js 15 — always await it.
 */

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import type { Database } from "@/types/supabase"

export async function createSupabaseServerClient() {
  const { getToken } = await auth()
  const token = await getToken({ template: "supabase" })

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
