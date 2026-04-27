
-- Create feedback table for user feedback submissions
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  rating INTEGER,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can submit their own feedback
CREATE POLICY "Users insert own feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users read own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all feedback
CREATE POLICY "Admins read all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Validation trigger: enforce length and rating bounds
CREATE OR REPLACE FUNCTION public.validate_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(trim(NEW.message)) < 3 THEN
    RAISE EXCEPTION 'Feedback message too short';
  END IF;
  IF length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Feedback message too long';
  END IF;
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NEW.category NOT IN ('general', 'bug', 'feature', 'praise') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_feedback_before_insert
BEFORE INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.validate_feedback();

CREATE INDEX idx_feedback_user_created ON public.feedback(user_id, created_at DESC);
