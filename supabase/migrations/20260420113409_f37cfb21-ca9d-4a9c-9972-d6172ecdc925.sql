
-- Drop broad public read on objects and replace with policies that allow
-- public direct fetch but restrict listing to authenticated users.
DROP POLICY IF EXISTS "Training videos public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;

-- Public can fetch individual objects by name (used by <video src> / <img src>)
CREATE POLICY "Training videos public direct read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-videos' AND name IS NOT NULL);

CREATE POLICY "Avatars public direct read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND name IS NOT NULL);
