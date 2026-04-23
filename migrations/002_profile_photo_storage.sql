-- =============================================
-- Migration 002: Profile Photo Storage
-- =============================================
-- Sets up the `avatars` Supabase Storage bucket and RLS policies so users
-- can upload a profile photo from their phone camera or library. The
-- `profiles.avatar_url` column already exists in schema 001, so no table
-- changes are needed here.
--
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kujakaketkyarfrhpwva/sql
--
-- Safe to re-run: bucket insert is ON CONFLICT DO NOTHING, policies are
-- DROP/CREATE so they converge to the latest definition.
-- =============================================

-- 1. Create the avatars bucket (public so img src=... works without signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB per photo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies on storage.objects for the avatars bucket
--    Path layout: avatars/<user_id>/<timestamp>.<ext>
--    -> first folder segment is the owner's auth.uid()

-- Public read
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated user can upload only into their own user_id folder
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can replace their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
