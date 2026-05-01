-- Recreate public_profiles as SECURITY DEFINER view so leaderboard shows all users
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
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