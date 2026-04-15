-- ============================================================
-- PolicyPen — Supabase Schema
-- Run this in Supabase SQL Editor to initialize the database
-- ============================================================

-- Generated policy documents, versioned per user + product + policy type
CREATE TABLE IF NOT EXISTS policies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_name text        NOT NULL,
  policy_type  text        NOT NULL CHECK (policy_type IN ('privacy', 'tos', 'cookie', 'refund')),
  content_html text        NOT NULL,
  version      integer     NOT NULL DEFAULT 1,
  tokens_used  integer,
  cost_usd     numeric(8, 4),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for fast cache lookups: user + product + type + recency
CREATE INDEX IF NOT EXISTS idx_policies_user_product_type
  ON policies (user_id, product_name, policy_type, created_at DESC);

-- Row-level security: users can only access their own policies
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own policies"
  ON policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own policies"
  ON policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own policies"
  ON policies FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Law update events — used to invalidate the 24h cache when
-- a relevant regulation changes. Insert a row here to force
-- regeneration for affected policy types.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS law_updates (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction         text        NOT NULL,
  description          text,
  affects_policy_types text[]      NOT NULL DEFAULT ARRAY['privacy', 'tos', 'cookie', 'refund'],
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Only service role can insert law_updates (no user-facing RLS)
ALTER TABLE law_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage law_updates"
  ON law_updates
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read law_updates (needed for cache check in route.ts)
CREATE POLICY "Authenticated users can read law_updates"
  ON law_updates FOR SELECT
  TO authenticated
  USING (true);
