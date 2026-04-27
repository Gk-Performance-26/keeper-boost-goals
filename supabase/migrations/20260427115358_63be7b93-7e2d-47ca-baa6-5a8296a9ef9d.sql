
-- 1. Remove the client-side INSERT policy on user_badges.
-- Badges may now only be inserted by the server-side award_badge() function,
-- which validates the badge's earning criteria against the user's real stats.
DROP POLICY IF EXISTS "Users insert own user_badges" ON public.user_badges;

-- (No UPDATE / DELETE policies exist on user_badges — leave them off so
--  RLS denies all such writes from clients.)

-- 2. Server-side badge awarding with criteria validation.
CREATE OR REPLACE FUNCTION public.award_badge(_badge_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _badge record;
  _stat numeric := 0;
  _eligible boolean := false;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, requirement_type, requirement_value
    INTO _badge
    FROM public.badges
    WHERE slug = _badge_slug;

  IF _badge.id IS NULL THEN
    RAISE EXCEPTION 'Unknown badge: %', _badge_slug;
  END IF;

  -- Already earned? No-op.
  IF EXISTS (
    SELECT 1 FROM public.user_badges
    WHERE user_id = _user AND badge_id = _badge.id
  ) THEN
    RETURN false;
  END IF;

  -- Resolve the user's current value for the requirement_type.
  IF _badge.requirement_type = 'total_xp' THEN
    SELECT COALESCE(total_xp, 0) INTO _stat
      FROM public.profiles WHERE user_id = _user;
  ELSIF _badge.requirement_type = 'current_streak' THEN
    SELECT COALESCE(current_streak, 0) INTO _stat
      FROM public.profiles WHERE user_id = _user;
  ELSIF _badge.requirement_type = 'longest_streak' THEN
    SELECT COALESCE(longest_streak, 0) INTO _stat
      FROM public.profiles WHERE user_id = _user;
  ELSIF _badge.requirement_type = 'current_level' THEN
    SELECT COALESCE(current_level, 0) INTO _stat
      FROM public.profiles WHERE user_id = _user;
  ELSIF _badge.requirement_type = 'completed_sessions' THEN
    SELECT COUNT(*) INTO _stat
      FROM public.completed_sessions WHERE user_id = _user;
  ELSIF _badge.requirement_type = 'completed_goals' THEN
    SELECT COUNT(*) INTO _stat
      FROM public.user_goals
      WHERE user_id = _user AND completed_at IS NOT NULL;
  ELSE
    -- Unknown requirement type — refuse to award.
    RAISE EXCEPTION 'Unsupported badge requirement_type: %', _badge.requirement_type;
  END IF;

  _eligible := _stat >= _badge.requirement_value;
  IF NOT _eligible THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (_user, _badge.id)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.award_badge(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_badge(text) TO authenticated;

-- 3. user_roles: drop the redundant SELECT policy. The "Admins can manage roles"
--    policy (FOR ALL) already covers SELECT for admins, and "Users can view
--    their own roles" covers self-reads. No non-admin write path exists.
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
