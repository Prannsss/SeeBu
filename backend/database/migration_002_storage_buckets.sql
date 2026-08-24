-- ============================================================
-- Migration 002: Create Supabase Storage Buckets
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor).
-- ============================================================

-- Public bucket: stores blurred/processed photos served to clients
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,
  5242880, -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Private bucket: archives unblurred originals (evidence), never publicly accessible
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos-originals',
  'report-photos-originals',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS Policies for report-photos (public read, service-role write)
-- ============================================================

-- Anyone can read public report photos
CREATE POLICY "Public read report-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

-- Only the service role (backend) can upload
CREATE POLICY "Service role insert report-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-photos');

-- Only the service role can delete
CREATE POLICY "Service role delete report-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'report-photos');
