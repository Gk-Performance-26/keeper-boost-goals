-- Explicit deny policies for INSERT/UPDATE/DELETE on subscriptions for authenticated and anon users.
-- Subscription rows are managed exclusively by the Paddle webhook using the service role,
-- which bypasses RLS. These policies make that intent explicit and prevent accidental exposure.

CREATE POLICY "Deny client inserts on subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny client updates on subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny client deletes on subscriptions"
ON public.subscriptions
FOR DELETE
TO authenticated, anon
USING (false);