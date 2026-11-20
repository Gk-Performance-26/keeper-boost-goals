ALTER TABLE public.profiles ADD COLUMN bio text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_bio_max_length CHECK (char_length(bio) <= 500);