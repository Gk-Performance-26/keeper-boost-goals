
-- 1. Restrict profiles SELECT to owner only
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Create a safe public_profiles view for leaderboard (only safe columns)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  user_id,
  display_name,
  avatar_url,
  total_xp,
  current_streak,
  current_level,
  experience_level
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Tighten trainings RLS: split free vs premium
DROP POLICY IF EXISTS "Trainings public read" ON public.trainings;

CREATE POLICY "Non-premium trainings readable by all"
  ON public.trainings FOR SELECT
  USING (is_published = true AND is_premium = false);

CREATE POLICY "Premium trainings readable by subscribers and admins"
  ON public.trainings FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND is_premium = true
    AND (
      public.has_active_subscription(auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 4. Remove overly broad storage upload policy
DROP POLICY IF EXISTS "Authenticated upload training videos" ON storage.objects;
