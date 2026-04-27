-- Create training group enum
DO $$ BEGIN
  CREATE TYPE public.training_group AS ENUM ('fisico', 'tecnico', 'aquecimento', 'alongamento');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add training_group column with default 'tecnico'
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS training_group public.training_group NOT NULL DEFAULT 'tecnico';

-- Map existing trainings: Physical category -> 'fisico'
UPDATE public.trainings t
SET training_group = 'fisico'
FROM public.categories c
WHERE t.category_id = c.id AND c.slug = 'fisico';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_trainings_training_group ON public.trainings(training_group);