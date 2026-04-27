-- Drop the overly permissive INSERT policy on skill_scores.
-- The complete_session SECURITY DEFINER RPC is the legitimate path to create scores.
DROP POLICY IF EXISTS "Users insert own skill scores" ON public.skill_scores;

-- Replace with a strict INSERT policy that also validates session ownership.
-- This protects against rogue clients while still allowing the SECURITY DEFINER
-- RPC (which runs as the function owner) to insert without restriction.
CREATE POLICY "Users insert own skill scores with valid session"
ON public.skill_scores
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    session_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.completed_sessions cs
      WHERE cs.id = skill_scores.session_id
        AND cs.user_id = auth.uid()
    )
  )
);

-- Explicitly deny UPDATE/DELETE for non-admins (defense in depth; default-deny already applies).
CREATE POLICY "Only admins can update skill_scores"
ON public.skill_scores
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete skill_scores"
ON public.skill_scores
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));