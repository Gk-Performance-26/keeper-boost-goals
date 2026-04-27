-- Enum for the two warmup parent groups
DO $$ BEGIN
  CREATE TYPE public.warmup_parent AS ENUM ('geral', 'gk');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Subcategories table
CREATE TABLE IF NOT EXISTS public.warmup_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  parent public.warmup_parent NOT NULL,
  icon text NOT NULL DEFAULT 'Flame',
  color_token text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warmup_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warmup subcategories public read"
  ON public.warmup_subcategories FOR SELECT TO public USING (true);

CREATE POLICY "Admins insert warmup subcategories"
  ON public.warmup_subcategories FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update warmup subcategories"
  ON public.warmup_subcategories FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete warmup subcategories"
  ON public.warmup_subcategories FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed subcategories
INSERT INTO public.warmup_subcategories (slug, name, parent, icon, sort_order) VALUES
  ('coordenacao-reacao', 'Coordenação e Reação', 'geral', 'Activity', 1),
  ('mobilidade-dinamica', 'Mobilidade Dinâmica', 'geral', 'Move', 2),
  ('ativacao-muscular', 'Ativação Muscular', 'geral', 'Flame', 3),
  ('footwork', 'Trabalho de Pés (Footwork)', 'gk', 'Footprints', 10),
  ('explosao-saltos', 'Explosão e Saltos', 'gk', 'ArrowUp', 11),
  ('diving', 'Mergulhos (Diving)', 'gk', 'ArrowDownRight', 12),
  ('reflexos-rapidos', 'Reflexos Rápidos', 'gk', 'Zap', 13),
  ('rotina-pre-jogo', 'Rotina Pré-Jogo', 'gk', 'ClipboardList', 14),
  ('aquecimento-com-bola', 'Aquecimento com Bola', 'gk', 'Circle', 15),
  ('velocidade-reacao', 'Velocidade de Reação', 'gk', 'Timer', 16)
ON CONFLICT (slug) DO NOTHING;

-- Link trainings to a warmup subcategory (nullable)
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS warmup_subcategory_id uuid REFERENCES public.warmup_subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trainings_warmup_subcategory ON public.trainings(warmup_subcategory_id);