-- ============================================================
-- Migration: 20260428_fix_policies_unique_constraint
-- Fix: Replace the full unique constraint on
--   (product_id, policy_type, is_current_version) with a
--   PARTIAL unique index that only enforces uniqueness when
--   is_current_version = true.
--
-- Problem with the old constraint:
--   UNIQUE(product_id, policy_type, is_current_version) allows
--   at most ONE row per (product_id, policy_type) for BOTH the
--   true and false values, making version history impossible.
--
-- The partial index allows unlimited historical versions
--   (is_current_version = false) while still guaranteeing that
--   at most one "current" version exists per policy type.
-- ============================================================

-- Drop the old full unique constraint
ALTER TABLE public.policies
  DROP CONSTRAINT IF EXISTS policies_product_id_policy_type_is_current_version_key;

-- Create a partial unique index — only one current version allowed
CREATE UNIQUE INDEX IF NOT EXISTS policies_one_current_version_per_type
  ON public.policies(product_id, policy_type)
  WHERE is_current_version = true;
