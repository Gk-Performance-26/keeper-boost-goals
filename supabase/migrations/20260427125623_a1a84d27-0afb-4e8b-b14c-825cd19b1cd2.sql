-- Explicit deny-by-default write policies on user_badges.
-- Badges are only ever awarded server-side via public.award_badge() which
-- runs as SECURITY DEFINER and bypasses RLS. These policies make the
-- intent explicit for security scanners and provide defense in depth.

-- Block all client INSERTs (only admins, who almost never need this, can insert)
CREATE POLICY "Only admins can insert user_badges"
ON public.user_badges
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Block all client UPDATEs
CREATE POLICY "Only admins can update user_badges"
ON public.user_badges
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Block all client DELETEs
CREATE POLICY "Only admins can delete user_badges"
ON public.user_badges
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));