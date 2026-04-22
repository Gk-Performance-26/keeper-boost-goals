ALTER TABLE public.trainings
ADD COLUMN intro_video_url text,
ADD COLUMN intro_video_type video_source_type DEFAULT 'upload'::video_source_type;