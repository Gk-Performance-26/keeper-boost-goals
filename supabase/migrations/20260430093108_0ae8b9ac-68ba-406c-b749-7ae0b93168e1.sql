-- Explicit SELECT policy on the private training-videos bucket.
-- End users never read directly: the sign-training-video edge function uses the
-- service role to issue short-lived signed URLs after authorization checks.
-- This policy makes intent unambiguous: only admins can read objects directly.
CREATE POLICY "Admins can read training videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'training-videos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);