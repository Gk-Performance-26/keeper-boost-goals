-- Revert view to security_invoker (safe default)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
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

-- Create a SECURITY DEFINER function that returns leaderboard rows for all users
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_xp int,
  current_streak int,
  current_level int,
  experience_level experience_level
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.total_xp,
    p.current_streak,
    p.current_level,
    p.experience_level
  FROM public.profiles p
  ORDER BY p.total_xp DESC
  LIMIT GREATEST(_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated, anon;