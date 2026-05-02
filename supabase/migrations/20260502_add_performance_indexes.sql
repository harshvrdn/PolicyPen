-- Performance indexes for high-frequency query paths.
-- products.slug and products.custom_domain are UNIQUE and already have
-- implicit btree indexes; no need to add them again.

-- All product queries filtered by owner (dashboard, plan gating, generate endpoint)
CREATE INDEX IF NOT EXISTS idx_products_user_id
  ON public.products(user_id);

-- All policy queries filtered by product (policy listing, public pages, widget)
CREATE INDEX IF NOT EXISTS idx_policies_product_id
  ON public.policies(product_id);

-- Policy RLS checks and user-scoped policy queries
CREATE INDEX IF NOT EXISTS idx_policies_user_id
  ON public.policies(user_id);

-- Law update listing filtered to published rows only
CREATE INDEX IF NOT EXISTS idx_law_updates_is_published
  ON public.law_updates(is_published);
