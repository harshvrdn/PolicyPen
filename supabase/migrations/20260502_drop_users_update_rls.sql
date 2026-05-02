-- Drop the overly permissive users UPDATE RLS policy.
--
-- The original policy allowed any authenticated user to UPDATE any column in
-- their own users row, including sensitive billing fields (plan, subscription_status,
-- max_products, dodo_customer_id, ai_tokens_used_month, etc.).
--
-- All legitimate writes to the users table go through service-role callers:
--   - Clerk webhook (/api/webhooks/clerk)  → createServiceClient()
--   - Dodo Payments webhook (/api/webhooks/dodo) → createServiceClient()
--   - Product creation safety-net (/api/products) → createServiceClient()
--
-- No application code uses an authenticated (JWT-scoped) Supabase client to
-- write to the users table, so removing this policy has no functional impact
-- while eliminating the privilege-escalation surface.

DROP POLICY IF EXISTS "users_update_own" ON public.users;
