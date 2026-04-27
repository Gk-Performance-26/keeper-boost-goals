-- =========================================================
-- 1. Lock down SECURITY DEFINER functions: revoke from anon
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.award_badge(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_feedback() FROM PUBLIC, anon, authenticated;

-- Grant only what is needed
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge(text) TO authenticated;

-- =========================================================
-- 2. Revoke direct INSERT on completed_sessions: must go via RPC
-- =========================================================
DROP POLICY IF EXISTS "Users insert own sessions" ON public.completed_sessions;

-- =========================================================
-- 3. Restrict profile UPDATE: prevent users from editing
--    XP/level/streak/freeze columns via direct table update.
-- =========================================================
-- Trigger that blocks privileged columns from user updates.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
BEGIN
  -- Allow trigger context with no auth (e.g. internal RPCs running as definer)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  IF _is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.total_xp IS DISTINCT FROM OLD.total_xp
     OR NEW.current_level IS DISTINCT FROM OLD.current_level
     OR NEW.current_streak IS DISTINCT FROM OLD.current_streak
     OR NEW.longest_streak IS DISTINCT FROM OLD.longest_streak
     OR NEW.freeze_tokens IS DISTINCT FROM OLD.freeze_tokens
     OR NEW.last_training_date IS DISTINCT FROM OLD.last_training_date THEN
    RAISE EXCEPTION 'Cannot directly modify XP/streak/level columns. Use complete_session RPC.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- =========================================================
-- 4. Server-side RPC: complete_session
--    Reads xp_reward from trainings (server-trusted),
--    inserts session, updates profile atomically.
-- =========================================================
CREATE OR REPLACE FUNCTION public.complete_session(
  _training_id uuid,
  _rating integer DEFAULT NULL,
  _notes text DEFAULT NULL,
  _skill_scores jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _training record;
  _profile record;
  _has_sub boolean;
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _last date;
  _diff integer;
  _new_streak integer;
  _new_freeze integer;
  _new_total_xp integer;
  _new_longest integer;
  _session_id uuid;
  _score jsonb;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _rating IS NOT NULL AND (_rating < 1 OR _rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  IF _notes IS NOT NULL AND length(_notes) > 500 THEN
    RAISE EXCEPTION 'Notes too long';
  END IF;

  -- Fetch training (server-trusted XP)
  SELECT id, xp_reward, duration_minutes, is_premium, is_published
    INTO _training
    FROM public.trainings
    WHERE id = _training_id;

  IF _training.id IS NULL OR NOT _training.is_published THEN
    RAISE EXCEPTION 'Training not available';
  END IF;

  -- Premium gate
  IF _training.is_premium THEN
    _has_sub := public.has_active_subscription(_user)
                OR public.has_role(_user, 'admin'::app_role);
    IF NOT _has_sub THEN
      RAISE EXCEPTION 'Subscription required for this training';
    END IF;
  END IF;

  -- Lock profile row to compute streak atomically
  SELECT total_xp, current_streak, longest_streak, freeze_tokens, last_training_date
    INTO _profile
    FROM public.profiles
    WHERE user_id = _user
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  _last := _profile.last_training_date;
  _new_freeze := _profile.freeze_tokens;
  IF _last IS NULL THEN
    _new_streak := 1;
  ELSE
    _diff := _today - _last;
    IF _diff <= 0 THEN
      _new_streak := _profile.current_streak;
    ELSIF _diff = 1 THEN
      _new_streak := _profile.current_streak + 1;
    ELSIF _diff = 2 AND _profile.freeze_tokens > 0 THEN
      _new_streak := _profile.current_streak + 1;
      _new_freeze := _profile.freeze_tokens - 1;
    ELSE
      _new_streak := 1;
    END IF;
  END IF;

  _new_total_xp := _profile.total_xp + _training.xp_reward;
  _new_longest := GREATEST(_profile.longest_streak, _new_streak);

  -- Insert session
  INSERT INTO public.completed_sessions
    (user_id, training_id, notes, rating, duration_minutes, xp_earned)
  VALUES
    (_user, _training.id, _notes, _rating, _training.duration_minutes, _training.xp_reward)
  RETURNING id INTO _session_id;

  -- Insert skill scores (validated)
  IF jsonb_typeof(_skill_scores) = 'array' THEN
    FOR _score IN SELECT * FROM jsonb_array_elements(_skill_scores) LOOP
      IF (_score->>'category_id') IS NOT NULL
         AND (_score->>'score') IS NOT NULL
         AND (_score->>'score')::int BETWEEN 0 AND 10 THEN
        INSERT INTO public.skill_scores (user_id, session_id, category_id, score)
        VALUES (
          _user,
          _session_id,
          (_score->>'category_id')::uuid,
          (_score->>'score')::int
        );
      END IF;
    END LOOP;
  END IF;

  -- Update profile (bypasses our protective trigger via SECURITY DEFINER + admin? No,
  -- the trigger checks auth.uid(); we are still that user. We need the trigger to allow
  -- this path. Set a session-level flag the trigger recognizes.)
  PERFORM set_config('app.allow_privileged_profile_update', 'true', true);
  UPDATE public.profiles
  SET total_xp = _new_total_xp,
      current_streak = _new_streak,
      longest_streak = _new_longest,
      freeze_tokens = _new_freeze,
      last_training_date = _today,
      updated_at = now()
  WHERE user_id = _user;
  PERFORM set_config('app.allow_privileged_profile_update', 'false', true);

  RETURN jsonb_build_object(
    'session_id', _session_id,
    'xp_earned', _training.xp_reward,
    'total_xp', _new_total_xp,
    'current_streak', _new_streak,
    'longest_streak', _new_longest,
    'freeze_tokens', _new_freeze
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_session(uuid, integer, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_session(uuid, integer, text, jsonb) TO authenticated;

-- Update protect trigger to honor the session flag set by complete_session
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _bypass text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bypass when called from trusted RPC (set_config inside complete_session)
  BEGIN
    _bypass := current_setting('app.allow_privileged_profile_update', true);
  EXCEPTION WHEN OTHERS THEN
    _bypass := NULL;
  END;
  IF _bypass = 'true' THEN
    RETURN NEW;
  END IF;

  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  IF _is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.total_xp IS DISTINCT FROM OLD.total_xp
     OR NEW.current_level IS DISTINCT FROM OLD.current_level
     OR NEW.current_streak IS DISTINCT FROM OLD.current_streak
     OR NEW.longest_streak IS DISTINCT FROM OLD.longest_streak
     OR NEW.freeze_tokens IS DISTINCT FROM OLD.freeze_tokens
     OR NEW.last_training_date IS DISTINCT FROM OLD.last_training_date THEN
    RAISE EXCEPTION 'Cannot directly modify XP/streak/level columns. Use complete_session RPC.';
  END IF;

  RETURN NEW;
END;
$$;