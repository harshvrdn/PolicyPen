export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      law_updates: {
        Row: {
          affected_clauses: string[] | null
          affected_policy_types: Database["public"]["Enums"]["policy_type"][] | null
          created_at: string
          effective_date: string | null
          full_details: string | null
          id: string
          is_published: boolean
          jurisdiction_codes: string[]
          policies_updated_count: number | null
          processed: boolean
          processed_at: string | null
          published_by: string | null
          regulation: string
          severity: Database["public"]["Enums"]["law_update_severity"]
          source_url: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_clauses?: string[] | null
          affected_policy_types?: Database["public"]["Enums"]["policy_type"][] | null
          created_at?: string
          effective_date?: string | null
          full_details?: string | null
          id?: string
          is_published?: boolean
          jurisdiction_codes?: string[]
          policies_updated_count?: number | null
          processed?: boolean
          processed_at?: string | null
          published_by?: string | null
          regulation: string
          severity?: Database["public"]["Enums"]["law_update_severity"]
          source_url?: string | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_clauses?: string[] | null
          affected_policy_types?: Database["public"]["Enums"]["policy_type"][] | null
          created_at?: string
          effective_date?: string | null
          full_details?: string | null
          id?: string
          is_published?: boolean
          jurisdiction_codes?: string[]
          policies_updated_count?: number | null
          processed?: boolean
          processed_at?: string | null
          published_by?: string | null
          regulation?: string
          severity?: Database["public"]["Enums"]["law_update_severity"]
          source_url?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          ai_model: string | null
          cdn_invalidated_at: string | null
          clauses_used: string[] | null
          content_hash: string | null
          content_html: string | null
          content_markdown: string | null
          created_at: string
          generated_at: string | null
          generation_cost_usd: number | null
          generation_error: string | null
          generation_tokens_used: number | null
          id: string
          is_current_version: boolean
          jurisdiction_codes: string[] | null
          last_reviewed_at: string | null
          policy_type: Database["public"]["Enums"]["policy_type"]
          previous_version_id: string | null
          product_id: string
          prompt_version: string | null
          published_at: string | null
          questionnaire_snapshot: Json | null
          status: Database["public"]["Enums"]["policy_status"]
          superseded_at: string | null
          title: string
          update_reason: string | null
          updated_at: string
          user_id: string
          version: number
          word_count: number | null
        }
        Insert: {
          ai_model?: string | null
          cdn_invalidated_at?: string | null
          clauses_used?: string[] | null
          content_hash?: string | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          generated_at?: string | null
          generation_cost_usd?: number | null
          generation_error?: string | null
          generation_tokens_used?: number | null
          id?: string
          is_current_version?: boolean
          jurisdiction_codes?: string[] | null
          last_reviewed_at?: string | null
          policy_type: Database["public"]["Enums"]["policy_type"]
          previous_version_id?: string | null
          product_id: string
          prompt_version?: string | null
          published_at?: string | null
          questionnaire_snapshot?: Json | null
          status?: Database["public"]["Enums"]["policy_status"]
          superseded_at?: string | null
          title: string
          update_reason?: string | null
          updated_at?: string
          user_id: string
          version?: number
          word_count?: number | null
        }
        Update: {
          ai_model?: string | null
          cdn_invalidated_at?: string | null
          clauses_used?: string[] | null
          content_hash?: string | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          generated_at?: string | null
          generation_cost_usd?: number | null
          generation_error?: string | null
          generation_tokens_used?: number | null
          id?: string
          is_current_version?: boolean
          jurisdiction_codes?: string[] | null
          last_reviewed_at?: string | null
          policy_type?: Database["public"]["Enums"]["policy_type"]
          previous_version_id?: string | null
          product_id?: string
          prompt_version?: string | null
          published_at?: string | null
          questionnaire_snapshot?: Json | null
          status?: Database["public"]["Enums"]["policy_status"]
          superseded_at?: string | null
          title?: string
          update_reason?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          word_count?: number | null
        }
        Relationships: []
      }
      policy_acknowledgements: {
        Row: {
          acknowledged_at: string
          consent_given: boolean
          cookie_consent_analytics: boolean | null
          cookie_consent_functional: boolean | null
          cookie_consent_marketing: boolean | null
          created_at: string
          dsar_completed_at: string | null
          dsar_requested_at: string | null
          dsar_sla_days: number | null
          dsar_status: Database["public"]["Enums"]["dsar_status"] | null
          end_user_email: string | null
          end_user_id: string | null
          id: string
          ip_address: unknown
          is_ccpa_jurisdiction: boolean | null
          is_gdpr_jurisdiction: boolean | null
          jurisdiction_detected: string | null
          policy_hash: string
          policy_id: string
          policy_version: number
          product_id: string
          user_agent: string | null
        }
        Insert: {
          acknowledged_at?: string
          consent_given?: boolean
          cookie_consent_analytics?: boolean | null
          cookie_consent_functional?: boolean | null
          cookie_consent_marketing?: boolean | null
          created_at?: string
          dsar_completed_at?: string | null
          dsar_requested_at?: string | null
          dsar_sla_days?: number | null
          dsar_status?: Database["public"]["Enums"]["dsar_status"] | null
          end_user_email?: string | null
          end_user_id?: string | null
          id?: string
          ip_address?: unknown
          is_ccpa_jurisdiction?: boolean | null
          is_gdpr_jurisdiction?: boolean | null
          jurisdiction_detected?: string | null
          policy_hash: string
          policy_id: string
          policy_version: number
          product_id: string
          user_agent?: string | null
        }
        Update: {
          acknowledged_at?: string
          consent_given?: boolean
          cookie_consent_analytics?: boolean | null
          cookie_consent_functional?: boolean | null
          cookie_consent_marketing?: boolean | null
          created_at?: string
          dsar_completed_at?: string | null
          dsar_requested_at?: string | null
          dsar_sla_days?: number | null
          dsar_status?: Database["public"]["Enums"]["dsar_status"] | null
          end_user_email?: string | null
          end_user_id?: string | null
          id?: string
          ip_address?: unknown
          is_ccpa_jurisdiction?: boolean | null
          is_gdpr_jurisdiction?: boolean | null
          jurisdiction_detected?: string | null
          policy_hash?: string
          policy_id?: string
          policy_version?: number
          product_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active_regulations: string[] | null
          additional_jurisdictions: string[] | null
          business_model: string | null
          business_type: string | null
          company_address: string | null
          company_legal_name: string | null
          contact_email: string | null
          created_at: string
          custom_domain: string | null
          custom_domain_verified: boolean | null
          custom_domain_verified_at: string | null
          description: string | null
          embed_accent_color: string | null
          embed_widget_enabled: boolean | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_jurisdiction: string
          questionnaire_completed_at: string | null
          questionnaire_data: Json | null
          questionnaire_version: number
          slug: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          active_regulations?: string[] | null
          additional_jurisdictions?: string[] | null
          business_model?: string | null
          business_type?: string | null
          company_address?: string | null
          company_legal_name?: string | null
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          custom_domain_verified_at?: string | null
          description?: string | null
          embed_accent_color?: string | null
          embed_widget_enabled?: boolean | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_jurisdiction?: string
          questionnaire_completed_at?: string | null
          questionnaire_data?: Json | null
          questionnaire_version?: number
          slug: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          active_regulations?: string[] | null
          additional_jurisdictions?: string[] | null
          business_model?: string | null
          business_type?: string | null
          company_address?: string | null
          company_legal_name?: string | null
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          custom_domain_verified_at?: string | null
          description?: string | null
          embed_accent_color?: string | null
          embed_widget_enabled?: boolean | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_jurisdiction?: string
          questionnaire_completed_at?: string | null
          questionnaire_data?: Json | null
          questionnaire_version?: number
          slug?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          ai_tokens_used_month: number
          avatar_url: string | null
          clerk_id: string
          created_at: string
          email: string
          full_name: string | null
          id: string
          max_policies_per_product: number
          max_products: number
          onboarding_completed: boolean
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_expires_at: string | null
          policies_generated_total: number
          products_count: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          tokens_reset_at: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          ai_tokens_used_month?: number
          avatar_url?: string | null
          clerk_id: string
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          max_policies_per_product?: number
          max_products?: number
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_expires_at?: string | null
          policies_generated_total?: number
          products_count?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tokens_reset_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          ai_tokens_used_month?: number
          avatar_url?: string | null
          clerk_id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          max_policies_per_product?: number
          max_products?: number
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_expires_at?: string | null
          policies_generated_total?: number
          products_count?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tokens_reset_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_policy_status: {
        Row: {
          content_hash: string | null
          display_status: string | null
          generated_at: string | null
          jurisdiction_codes: string[] | null
          policy_id: string | null
          policy_type: Database["public"]["Enums"]["policy_type"] | null
          product_id: string | null
          product_name: string | null
          published_at: string | null
          slug: string | null
          status: Database["public"]["Enums"]["policy_status"] | null
          title: string | null
          user_id: string | null
          version: number | null
          word_count: number | null
        }
        Relationships: []
      }
      user_dashboard: {
        Row: {
          active_policies: number | null
          active_products: number | null
          ai_tokens_used_month: number | null
          clerk_id: string | null
          draft_policies: number | null
          email: string | null
          full_name: string | null
          id: string | null
          last_policy_generated_at: string | null
          max_products: number | null
          plan: Database["public"]["Enums"]["plan_tier"] | null
          plan_expires_at: string | null
          policies_generated_total: number | null
          products_count: number | null
          subscription_status: string | null
          total_ai_cost_usd: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_user_generate_policy: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: Json
      }
      generate_slug: { Args: { name: string }; Returns: string }
      get_current_policy: {
        Args: {
          p_policy_type: Database["public"]["Enums"]["policy_type"]
          p_product_id: string
        }
        Returns: Database["public"]["Tables"]["policies"]["Row"]
      }
    }
    Enums: {
      dsar_status: "pending" | "in_progress" | "completed" | "rejected"
      law_update_severity: "info" | "minor" | "major" | "critical"
      plan_tier: "free" | "starter" | "builder" | "studio"
      policy_status: "draft" | "generating" | "active" | "archived" | "error"
      policy_type:
        | "privacy_policy"
        | "terms_of_service"
        | "cookie_policy"
        | "refund_policy"
        | "dpa"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

// ─── Convenience aliases ───────────────────────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

// ─── Named row types ───────────────────────────────────────────────────────
export type User = Tables<"users">
export type Product = Tables<"products">
export type Policy = Tables<"policies">
export type LawUpdate = Tables<"law_updates">
export type PolicyAcknowledgement = Tables<"policy_acknowledgements">

// ─── Enum types ────────────────────────────────────────────────────────────
export type PlanTier = Enums<"plan_tier">
export type PolicyType = Enums<"policy_type">
export type PolicyStatus = Enums<"policy_status">
export type LawUpdateSeverity = Enums<"law_update_severity">
export type DsarStatus = Enums<"dsar_status">

// ─── View types ────────────────────────────────────────────────────────────
export type UserDashboard = Database["public"]["Views"]["user_dashboard"]["Row"]
export type ProductPolicyStatus = Database["public"]["Views"]["product_policy_status"]["Row"]
