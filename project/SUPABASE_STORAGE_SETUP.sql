-- ================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- Run this after the main database setup
-- ================================================================

-- Create storage buckets for MeowPlay
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('audio-files', 'audio-files', true, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac']),
  ('cover-art', 'cover-art', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ================================================================
-- STORAGE POLICIES
-- ================================================================

-- Audio files bucket policies
DROP POLICY IF EXISTS "Public audio files are accessible to everyone" ON storage.objects;
CREATE POLICY "Public audio files are accessible to everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own audio files" ON storage.objects;
CREATE POLICY "Users can update their own audio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Cover art bucket policies
DROP POLICY IF EXISTS "Public cover art is accessible to everyone" ON storage.objects;
CREATE POLICY "Public cover art is accessible to everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover-art');

DROP POLICY IF EXISTS "Authenticated users can upload cover art" ON storage.objects;
CREATE POLICY "Authenticated users can upload cover art"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cover-art' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own cover art" ON storage.objects;
CREATE POLICY "Users can update their own cover art"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cover-art' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own cover art" ON storage.objects;
CREATE POLICY "Users can delete their own cover art"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cover-art' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatar bucket policies
DROP POLICY IF EXISTS "Public avatars are accessible to everyone" ON storage.objects;
CREATE POLICY "Public avatars are accessible to everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================================
-- STORAGE HELPER FUNCTIONS
-- ================================================================

-- Function to get signed URL for audio files
CREATE OR REPLACE FUNCTION public.get_audio_url(file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN bucket_id = 'audio-files' THEN 
          'https://' || (SELECT ref FROM supabase_settings LIMIT 1) || '.supabase.co/storage/v1/object/public/audio-files/' || name
        ELSE NULL
      END
    FROM storage.objects 
    WHERE name = file_path AND bucket_id = 'audio-files'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signed URL for cover art
CREATE OR REPLACE FUNCTION public.get_cover_art_url(file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN bucket_id = 'cover-art' THEN 
          'https://' || (SELECT ref FROM supabase_settings LIMIT 1) || '.supabase.co/storage/v1/object/public/cover-art/' || name
        ELSE NULL
      END
    FROM storage.objects 
    WHERE name = file_path AND bucket_id = 'cover-art'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Storage buckets and policies setup completed! 📁' as status;
