DROP POLICY IF EXISTS "Users upsert own challenge progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users update own challenge progress" ON public.user_challenge_progress;

CREATE POLICY "Deny client inserts on user_challenge_progress"
  ON public.user_challenge_progress FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on user_challenge_progress"
  ON public.user_challenge_progress FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes on user_challenge_progress"
  ON public.user_challenge_progress FOR DELETE TO anon, authenticated
  USING (false);