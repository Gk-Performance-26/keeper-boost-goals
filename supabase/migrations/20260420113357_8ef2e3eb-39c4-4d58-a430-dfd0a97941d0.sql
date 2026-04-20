
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'pro');
CREATE TYPE public.video_source_type AS ENUM ('upload', 'youtube', 'vimeo');
CREATE TYPE public.dominant_hand AS ENUM ('left', 'right', 'both');

-- =========================================================
-- updated_at helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  experience_level public.experience_level DEFAULT 'beginner' NOT NULL,
  age_group TEXT,
  dominant_hand public.dominant_hand DEFAULT 'right',
  training_goal TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_training_date DATE,
  daily_xp_goal INTEGER NOT NULL DEFAULT 50,
  freeze_tokens INTEGER NOT NULL DEFAULT 1,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color_token TEXT NOT NULL DEFAULT 'primary',
  icon TEXT NOT NULL DEFAULT 'Target',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);

-- =========================================================
-- TRAININGS
-- =========================================================
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  level public.experience_level NOT NULL DEFAULT 'beginner',
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  video_url TEXT NOT NULL,
  video_type public.video_source_type NOT NULL DEFAULT 'youtube',
  thumbnail_url TEXT,
  equipment TEXT[],
  drills JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainings public read" ON public.trainings FOR SELECT USING (is_published = true);
CREATE TRIGGER trg_trainings_updated_at
  BEFORE UPDATE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- COMPLETED SESSIONS
-- =========================================================
CREATE TABLE public.completed_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.completed_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sessions"
  ON public.completed_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions"
  ON public.completed_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_completed ON public.completed_sessions(user_id, completed_at DESC);

-- =========================================================
-- SKILL SCORES
-- =========================================================
CREATE TABLE public.skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.completed_sessions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skill_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own skill scores"
  ON public.skill_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own skill scores"
  ON public.skill_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_skill_scores_user_cat ON public.skill_scores(user_id, category_id, recorded_at DESC);

-- =========================================================
-- BADGES
-- =========================================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Award',
  color_token TEXT NOT NULL DEFAULT 'primary',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges public read" ON public.badges FOR SELECT USING (true);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges readable by authenticated"
  ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own user_badges"
  ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- WEEKLY CHALLENGES
-- =========================================================
CREATE TABLE public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  target_count INTEGER NOT NULL DEFAULT 5,
  xp_bonus INTEGER NOT NULL DEFAULT 200,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges public read" ON public.weekly_challenges FOR SELECT USING (true);

CREATE TABLE public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, challenge_id)
);
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own challenge progress"
  ON public.user_challenge_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own challenge progress"
  ON public.user_challenge_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own challenge progress"
  ON public.user_challenge_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('training-videos', 'training-videos', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Training videos public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'training-videos');
CREATE POLICY "Authenticated upload training videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'training-videos');

CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================================
-- SEED: CATEGORIES
-- =========================================================
INSERT INTO public.categories (slug, name, description, color_token, icon, sort_order) VALUES
  ('reflexes', 'Reflexes', 'Sharpen reaction speed and explosive saves', 'skill-reflexes', 'Zap', 1),
  ('positioning', 'Positioning', 'Read the play, take the right angles', 'skill-positioning', 'Crosshair', 2),
  ('footwork', 'Footwork', 'Quick feet, balanced base, smooth movement', 'skill-footwork', 'Footprints', 3),
  ('diving', 'Diving', 'Powerful, technical, low-to-high dives', 'skill-diving', 'ArrowDownRight', 4),
  ('distribution', 'Distribution', 'Throws, kicks, and starting attacks', 'skill-distribution', 'Send', 5),
  ('highballs', 'High Balls', 'Crosses, claims and punches with confidence', 'skill-highballs', 'ArrowUp', 6),
  ('onev1', '1v1 Situations', 'Win the duel, smother the shot', 'skill-onev1', 'Swords', 7);

-- =========================================================
-- SEED: TRAININGS  (15 sessions across categories & levels)
-- =========================================================
INSERT INTO public.trainings (title, description, category_id, level, duration_minutes, xp_reward, video_url, video_type, equipment, drills) VALUES
  ('Reaction Wall Basics',
   'Quick rebound saves against a wall to fire up your reflexes.',
   (SELECT id FROM public.categories WHERE slug='reflexes'), 'beginner', 15, 60,
   'https://www.youtube.com/embed/5qap5aO4i9A', 'youtube',
   ARRAY['Ball','Wall','Gloves'],
   '[{"title":"Two-handed wall rebounds","reps":"3 x 30s"},{"title":"One-hand catch (left)","reps":"3 x 20s"},{"title":"One-hand catch (right)","reps":"3 x 20s"},{"title":"Random hand call-out","reps":"3 x 30s"}]'::jsonb),

  ('Explosive Reflex Ladder',
   'High-intensity reflex circuit with partner-fed shots.',
   (SELECT id FROM public.categories WHERE slug='reflexes'), 'advanced', 25, 120,
   'https://www.youtube.com/embed/dQw4w9WgXcQ', 'youtube',
   ARRAY['Partner','3 Balls','Cones'],
   '[{"title":"Sit-to-save","reps":"3 x 8 reps"},{"title":"Spin-and-react","reps":"3 x 6 reps"},{"title":"Double save sequence","reps":"4 x 5 reps"}]'::jsonb),

  ('Angle Control 101',
   'Learn to take the right angle on the ball, every time.',
   (SELECT id FROM public.categories WHERE slug='positioning'), 'beginner', 12, 50,
   'https://www.youtube.com/embed/aqz-KE-bpKQ', 'youtube',
   ARRAY['Cones','Ball'],
   '[{"title":"Walk the arc","reps":"5 mins"},{"title":"Set position from cones","reps":"3 x 10 reps"}]'::jsonb),

  ('Reading Crosses & Cutbacks',
   'Pro positioning patterns vs wide play.',
   (SELECT id FROM public.categories WHERE slug='positioning'), 'intermediate', 20, 90,
   'https://www.youtube.com/embed/M7FIvfx5J10', 'youtube',
   ARRAY['Cones','Partner','Ball'],
   '[{"title":"Step & set on cross","reps":"3 x 8 reps"},{"title":"Cutback recovery","reps":"3 x 6 reps"}]'::jsonb),

  ('Footwork Foundations',
   'Side shuffles, drop steps and recovery basics.',
   (SELECT id FROM public.categories WHERE slug='footwork'), 'beginner', 10, 40,
   'https://www.youtube.com/embed/3JZ_D3ELwOQ', 'youtube',
   ARRAY['Cones'],
   '[{"title":"Lateral shuffle","reps":"4 x 30s"},{"title":"Drop step + push","reps":"3 x 8 reps"}]'::jsonb),

  ('Speed Ladder Footwork',
   'Agility ladder routine for fast feet.',
   (SELECT id FROM public.categories WHERE slug='footwork'), 'intermediate', 18, 80,
   'https://www.youtube.com/embed/V-_O7nl0Ii0', 'youtube',
   ARRAY['Speed Ladder'],
   '[{"title":"In-in-out-out","reps":"4 sets"},{"title":"Lateral high knees","reps":"4 sets"},{"title":"Ickey shuffle","reps":"4 sets"}]'::jsonb),

  ('Pro Footwork Circuit',
   'Hurdles, ladder and reactive sprints.',
   (SELECT id FROM public.categories WHERE slug='footwork'), 'pro', 30, 160,
   'https://www.youtube.com/embed/L_jWHffIx5E', 'youtube',
   ARRAY['Hurdles','Ladder','Cones','Partner'],
   '[{"title":"Hurdle hops + save","reps":"4 x 6"},{"title":"Reactive sprint","reps":"4 x 20m"}]'::jsonb),

  ('Diving Technique Builder',
   'Low dive technique broken down step by step.',
   (SELECT id FROM public.categories WHERE slug='diving'), 'beginner', 15, 60,
   'https://www.youtube.com/embed/eY52Zsg-KVI', 'youtube',
   ARRAY['Ball','Soft Surface'],
   '[{"title":"Kneeling dive","reps":"3 x 5 each side"},{"title":"Squat dive","reps":"3 x 5 each side"}]'::jsonb),

  ('Power Diving Saves',
   'High-intensity diving with full extension.',
   (SELECT id FROM public.categories WHERE slug='diving'), 'advanced', 22, 110,
   'https://www.youtube.com/embed/Sagg08DrO5U', 'youtube',
   ARRAY['Ball','Partner'],
   '[{"title":"Top corner extension","reps":"4 x 4 each side"},{"title":"Double dive","reps":"3 x 4"}]'::jsonb),

  ('Throwing & Rolling Basics',
   'Accurate distribution from the hands.',
   (SELECT id FROM public.categories WHERE slug='distribution'), 'beginner', 12, 50,
   'https://www.youtube.com/embed/bx1Bh8ZvH84', 'youtube',
   ARRAY['Ball','Cones','Partner'],
   '[{"title":"Bowled roll to target","reps":"3 x 10"},{"title":"Overarm throw","reps":"3 x 10"}]'::jsonb),

  ('Long Kicking Accuracy',
   'Goal kicks and drop kicks to a target.',
   (SELECT id FROM public.categories WHERE slug='distribution'), 'intermediate', 20, 90,
   'https://www.youtube.com/embed/HIcSWuKMwOw', 'youtube',
   ARRAY['Balls x5','Cones'],
   '[{"title":"Drop kick to zone","reps":"5 x 5"},{"title":"Goal kick wide","reps":"5 x 5"}]'::jsonb),

  ('Crosses Catching Clinic',
   'Time your jump and claim the high ball.',
   (SELECT id FROM public.categories WHERE slug='highballs'), 'intermediate', 18, 80,
   'https://www.youtube.com/embed/9bZkp7q19f0', 'youtube',
   ARRAY['Partner','Ball'],
   '[{"title":"Static high catch","reps":"3 x 8"},{"title":"Stepping cross claim","reps":"3 x 6"}]'::jsonb),

  ('Punching Under Pressure',
   'When to punch and how to clear with power.',
   (SELECT id FROM public.categories WHERE slug='highballs'), 'advanced', 20, 100,
   'https://www.youtube.com/embed/kJQP7kiw5Fk', 'youtube',
   ARRAY['Partner','Ball','Mannequins'],
   '[{"title":"One-hand punch under traffic","reps":"3 x 6"},{"title":"Two-hand power punch","reps":"3 x 6"}]'::jsonb),

  ('1v1 Spreading Saves',
   'Master the spread, narrow the angle, smother the shot.',
   (SELECT id FROM public.categories WHERE slug='onev1'), 'intermediate', 18, 90,
   'https://www.youtube.com/embed/RgKAFK5djSk', 'youtube',
   ARRAY['Ball','Partner','Cones'],
   '[{"title":"Walk-through spread","reps":"3 x 6"},{"title":"Live 1v1 reps","reps":"4 x 4"}]'::jsonb),

  ('Pro 1v1 Decision Making',
   'When to come, when to stay — read the striker.',
   (SELECT id FROM public.categories WHERE slug='onev1'), 'pro', 25, 140,
   'https://www.youtube.com/embed/OPf0YbXqDm0', 'youtube',
   ARRAY['Ball','2 Strikers','Cones'],
   '[{"title":"Smother angle","reps":"4 x 5"},{"title":"Hold + react","reps":"4 x 5"},{"title":"Live 1v1","reps":"6 reps"}]'::jsonb);

-- =========================================================
-- SEED: BADGES
-- =========================================================
INSERT INTO public.badges (slug, name, description, icon, color_token, requirement_type, requirement_value) VALUES
  ('first_save', 'First Save', 'Complete your first training session', 'Award', 'primary', 'sessions_count', 1),
  ('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'secondary', 'streak_days', 7),
  ('month_master', 'Month Master', 'Maintain a 30-day streak', 'Flame', 'secondary', 'streak_days', 30),
  ('reflex_rookie', 'Reflex Rookie', 'Complete 5 reflex sessions', 'Zap', 'skill-reflexes', 'category_reflexes', 5),
  ('footwork_fanatic', 'Footwork Fanatic', 'Complete 5 footwork sessions', 'Footprints', 'skill-footwork', 'category_footwork', 5),
  ('diver', 'The Diver', 'Complete 5 diving sessions', 'ArrowDownRight', 'skill-diving', 'category_diving', 5),
  ('positional_pro', 'Positional Pro', 'Complete 5 positioning sessions', 'Crosshair', 'skill-positioning', 'category_positioning', 5),
  ('air_marshal', 'Air Marshal', 'Complete 5 high-ball sessions', 'ArrowUp', 'skill-highballs', 'category_highballs', 5),
  ('distributor', 'Distributor', 'Complete 5 distribution sessions', 'Send', 'skill-distribution', 'category_distribution', 5),
  ('one_v_one_king', '1v1 King', 'Complete 5 one-on-one sessions', 'Swords', 'skill-onev1', 'category_onev1', 5),
  ('level_10', 'Level 10', 'Reach level 10', 'Trophy', 'primary', 'level_reached', 10),
  ('all_rounder', 'All-Rounder', 'Train every category at least once', 'Globe', 'accent', 'all_categories', 7);

-- =========================================================
-- SEED: a current weekly challenge (Mon..Sun of current week)
-- =========================================================
INSERT INTO public.weekly_challenges (title, description, category_id, target_count, xp_bonus, week_start, week_end)
VALUES (
  'Footwork Week',
  'Complete 5 footwork sessions before Sunday for a 200 XP bonus',
  (SELECT id FROM public.categories WHERE slug='footwork'),
  5, 200,
  date_trunc('week', CURRENT_DATE)::date,
  (date_trunc('week', CURRENT_DATE) + interval '6 days')::date
);
