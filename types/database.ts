// PolicyPen database types
// Replace this file by running: npx supabase gen types typescript --local > types/database.ts

export type Database = {
  public: {
    Tables: {
      policies: {
        Row: {
          id: string
          user_id: string
          product_name: string
          policy_type: 'privacy' | 'tos' | 'cookie' | 'refund'
          content_html: string
          version: number
          tokens_used: number | null
          cost_usd: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_name: string
          policy_type: 'privacy' | 'tos' | 'cookie' | 'refund'
          content_html: string
          version?: number
          tokens_used?: number | null
          cost_usd?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_name?: string
          policy_type?: 'privacy' | 'tos' | 'cookie' | 'refund'
          content_html?: string
          version?: number
          tokens_used?: number | null
          cost_usd?: number | null
          created_at?: string
        }
        Relationships: []
      }
      law_updates: {
        Row: {
          id: string
          jurisdiction: string
          description: string | null
          affects_policy_types: string[]
          created_at: string
        }
        Insert: {
          id?: string
          jurisdiction: string
          description?: string | null
          affects_policy_types?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          jurisdiction?: string
          description?: string | null
          affects_policy_types?: string[]
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
