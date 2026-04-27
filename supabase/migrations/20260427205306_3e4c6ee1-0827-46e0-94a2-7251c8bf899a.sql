UPDATE public.trainings
SET video_type = 'youtube'
WHERE video_type = 'upload'
  AND video_url ~* '(youtube\.com|youtu\.be|vimeo\.com)';

UPDATE public.trainings
SET intro_video_type = CASE
  WHEN intro_video_url ~* '(youtube\.com|youtu\.be)' THEN 'youtube'
  WHEN intro_video_url ~* 'vimeo\.com' THEN 'vimeo'
  ELSE intro_video_type
END
WHERE intro_video_type = 'upload'
  AND intro_video_url ~* '(youtube\.com|youtu\.be|vimeo\.com)';