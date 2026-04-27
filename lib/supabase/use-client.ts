"use client"

/**
 * useSupabaseClient — authenticated Supabase client for client components.
 *
 * Uses Clerk's useAuth() hook to inject a fresh JWT on every request so
 * Supabase RLS policies can validate auth.uid() == users.clerk_id.
 *
 * Usage (client components only):
 *   const supabase = useSupabaseClient()
 *   const { data } = await supabase.from('products').select('*')
 */

import { useMemo } from "react"
import { useAuth } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
