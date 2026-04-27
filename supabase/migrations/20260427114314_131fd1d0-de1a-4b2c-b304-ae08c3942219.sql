
DROP POLICY IF EXISTS "User badges readable by authenticated" ON public.user_badges;

CREATE POLICY "Users read own user_badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
