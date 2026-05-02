-- Add missing INSERT and DELETE RLS policies for policy_acknowledgements.
-- The /api/ack endpoint uses the service role (bypasses RLS) for INSERTs,
-- so blocking direct authenticated inserts is pure defense-in-depth.
-- Product owners can delete acknowledgements for their own products.

-- Prevent authenticated JWT holders from directly inserting acknowledgements
-- (all writes go through the service-role API route)
CREATE POLICY "policy_acknowledgements_insert_deny_direct"
  ON public.policy_acknowledgements
  FOR INSERT
  WITH CHECK (false);

-- Allow product owners to delete acknowledgements for products they own
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
