-- ============================================================
-- PolicyPen — Supabase Schema (Full Production Schema)
-- Project: kbgzqchlmstzetdapujj | Region: ap-south-1
-- Last updated: 2026-04-26
--
-- DO NOT run this manually — migrations are applied via
-- Supabase MCP. This file is the canonical reference.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'builder', 'studio');
CREATE TYPE policy_type AS ENUM ('privacy_policy', 'terms_of_service', 'cookie_policy', 'refund_policy', 'dpa');
CREATE TYPE policy_status AS ENUM ('draft', 'generating', 'active', 'archived', 'error');
CREATE TYPE law_update_severity AS ENUM ('info', 'minor', 'major', 'critical');
CREATE TYPE dsar_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan plan_tier NOT NULL DEFAULT 'free',
  dodo_customer_id TEXT UNIQUE,
  dodo_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive',
  trial_ends_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  products_count INT NOT NULL DEFAULT 0,
  policies_generated_total INT NOT NULL DEFAULT 0,
  ai_tokens_used_month INT NOT NULL DEFAULT 0,
  tokens_reset_at TIMESTAMPTZ DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month',
  max_products INT NOT NULL DEFAULT 1,
  max_policies_per_product INT NOT NULL DEFAULT 4,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  business_type TEXT,
  business_model TEXT,
  company_legal_name TEXT,
  company_address TEXT,
  contact_email TEXT,
  primary_jurisdiction TEXT NOT NULL DEFAULT 'US',
  additional_jurisdictions TEXT[] DEFAULT '{}',
  active_regulations TEXT[] DEFAULT '{}',
  questionnaire_data JSONB DEFAULT '{}',
  questionnaire_version INT NOT NULL DEFAULT 1,
  questionnaire_completed_at TIMESTAMPTZ,
  custom_domain TEXT UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  custom_domain_verified_at TIMESTAMPTZ,
  embed_widget_enabled BOOLEAN DEFAULT TRUE,
  embed_accent_color TEXT DEFAULT '#0052CC',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  policy_type policy_type NOT NULL,
  version INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content_html TEXT,
  content_markdown TEXT,
  content_hash TEXT,
  word_count INT,
  status policy_status NOT NULL DEFAULT 'draft',
  jurisdiction_codes TEXT[] DEFAULT '{}',
  clauses_used TEXT[] DEFAULT '{}',
  prompt_version TEXT,
  ai_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  generation_tokens_used INT DEFAULT 0,
  generation_cost_usd NUMERIC(10, 6) DEFAULT 0,
  generated_at TIMESTAMPTZ,
  generation_error TEXT,
  questionnaire_snapshot JSONB DEFAULT '{}',
  previous_version_id UUID REFERENCES public.policies(id),
  is_current_version BOOLEAN NOT NULL DEFAULT TRUE,
  superseded_at TIMESTAMPTZ,
  update_reason TEXT,
  published_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  cdn_invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
);

-- Only one "current" version per policy type per product is allowed.
-- Historical versions (is_current_version = false) are unlimited.
CREATE UNIQUE INDEX IF NOT EXISTS policies_one_current_version_per_type
  ON public.policies(product_id, policy_type)
  WHERE is_current_version = true;

-- Performance indexes for high-frequency query paths.
-- products.slug and products.custom_domain are UNIQUE and already have
-- implicit btree indexes; no need to add them again.
CREATE INDEX IF NOT EXISTS idx_products_user_id      ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_product_id   ON public.policies(product_id);
CREATE INDEX IF NOT EXISTS idx_policies_user_id      ON public.policies(user_id);
CREATE INDEX IF NOT EXISTS idx_law_updates_is_published ON public.law_updates(is_published);

-- Law updates table
CREATE TABLE public.law_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regulation TEXT NOT NULL,
  jurisdiction_codes TEXT[] NOT NULL DEFAULT '{}',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_details TEXT,
  source_url TEXT,
  effective_date DATE,
  severity law_update_severity NOT NULL DEFAULT 'minor',
  affected_policy_types policy_type[] DEFAULT '{}',
  affected_clauses TEXT[] DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  policies_updated_count INT DEFAULT 0,
  published_by TEXT DEFAULT 'system',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Policy acknowledgements table
CREATE TABLE public.policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  end_user_id TEXT,
  end_user_email TEXT,
  policy_hash TEXT NOT NULL,
  policy_version INT NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  cookie_consent_analytics BOOLEAN DEFAULT NULL,
  cookie_consent_marketing BOOLEAN DEFAULT NULL,
  cookie_consent_functional BOOLEAN DEFAULT TRUE,
  dsar_requested_at TIMESTAMPTZ,
  dsar_status dsar_status DEFAULT NULL,
  dsar_completed_at TIMESTAMPTZ,
  dsar_sla_days INT DEFAULT 30,
  ip_address INET,
  user_agent TEXT,
  jurisdiction_detected TEXT,
  is_gdpr_jurisdiction BOOLEAN DEFAULT FALSE,
  is_ccpa_jurisdiction BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_acknowledgements ENABLE ROW LEVEL SECURITY;

-- ─── users ───────────────────────────────────────────────────
-- Users can only read and update their own row (matched via clerk_id = auth.uid())
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (clerk_id = auth.uid()::text);

-- users UPDATE policy intentionally omitted: all writes to this table go through
-- service-role callers (Clerk/Dodo webhooks, product-creation safety-net) that
-- bypass RLS. An authenticated UPDATE policy would let users self-escalate their
-- own plan, subscription_status, and max_products fields.

-- Service role (Clerk webhook, billing) bypasses RLS — no INSERT/DELETE policy needed for anon/authenticated

-- ─── products ────────────────────────────────────────────────
-- Users can CRUD only their own products (joined via users.clerk_id)
CREATE POLICY "products_select_own" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = products.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = products.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = products.user_id
        AND u.clerk_id = auth.uid()::text
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = products.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = products.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

-- ─── policies ────────────────────────────────────────────────
-- Users can CRUD only their own generated policies (via user_id)
CREATE POLICY "policies_select_own" ON public.policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = policies.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "policies_insert_own" ON public.policies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = policies.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "policies_update_own" ON public.policies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = policies.user_id
        AND u.clerk_id = auth.uid()::text
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = policies.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "policies_delete_own" ON public.policies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = policies.user_id
        AND u.clerk_id = auth.uid()::text
    )
  );

-- ─── law_updates ─────────────────────────────────────────────
-- Authenticated users can SELECT only — writes are service-role only
CREATE POLICY "law_updates_select_authenticated" ON public.law_updates
  FOR SELECT TO authenticated USING (true);

-- ─── policy_acknowledgements ─────────────────────────────────
-- Users can only read acknowledgements for products they own
CREATE POLICY "policy_acknowledgements_select_own" ON public.policy_acknowledgements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.users u ON u.id = p.user_id
      WHERE p.id = policy_acknowledgements.product_id
        AND u.clerk_id = auth.uid()::text
    )
  );

-- Block direct inserts from authenticated JWT holders;
-- all writes go through the service-role /api/ack route.
CREATE POLICY "policy_acknowledgements_insert_deny_direct"
  ON public.policy_acknowledgements
  FOR INSERT
  WITH CHECK (false);

-- Product owners can delete acknowledgements for their own products
CREATE POLICY "policy_acknowledgements_delete_own"
  ON public.policy_acknowledgements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.users u ON u.id = p.user_id
      WHERE p.id = policy_acknowledgements.product_id
        AND u.clerk_id = auth.uid()::text
    )
  );
