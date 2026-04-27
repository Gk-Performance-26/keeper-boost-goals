-- Enum for the two stretching parent groups
DO $$ BEGIN
  CREATE TYPE public.stretching_parent AS ENUM ('alongamentos', 'recuperacao');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Subcategories table
CREATE TABLE IF NOT EXISTS public.stretching_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  parent public.stretching_parent NOT NULL,
  icon text NOT NULL DEFAULT 'Flower2',
  color_token text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stretching_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stretching subcategories public read"
  ON public.stretching_subcategories FOR SELECT TO public USING (true);

CREATE POLICY "Admins insert stretching subcategories"
  ON public.stretching_subcategories FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update stretching subcategories"
  ON public.stretching_subcategories FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete stretching subcategories"
  ON public.stretching_subcategories FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.stretching_subcategories (slug, name, parent, icon, sort_order) VALUES
  ('alongamentos-dinamicos', 'Alongamentos Dinâmicos', 'alongamentos', 'Activity', 1),
  ('alongamentos-estaticos', 'Alongamentos Estáticos', 'alongamentos', 'Flower2', 2),
  ('mobilidade-ancas-tornozelos', 'Mobilidade de Ancas e Tornozelos', 'alongamentos', 'Move', 3),
  ('core-estabilidade', 'Core e Estabilidade', 'recuperacao', 'Shield', 10),
  ('prevencao-lesoes', 'Prevenção de Lesões', 'recuperacao', 'HeartPulse', 11),
  ('recuperacao-relaxamento', 'Recuperação e Relaxamento', 'recuperacao', 'Moon', 12),
  ('rotina-pos-treino', 'Rotina Pós-Treino', 'recuperacao', 'ClipboardList', 13),
  ('coordenacao-mao-olho', 'Coordenação Mão-Olho', 'recuperacao', 'Eye', 14)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS stretching_subcategory_id uuid REFERENCES public.stretching_subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trainings_stretching_subcategory ON public.trainings(stretching_subcategory_id);