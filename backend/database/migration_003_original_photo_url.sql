-- migration_003: track the archived unblurred copy of each photo.
-- Run manually in Supabase SQL editor; backend works with or without it.
-- Idempotent: safe to run more than once.

ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS original_photo_url TEXT;
ALTER TABLE task_proof_photos ADD COLUMN IF NOT EXISTS original_photo_url TEXT;

COMMENT ON COLUMN report_photos.original_photo_url IS
  '<private-bucket>/<object path> of the unblurred archived copy (NULL when EgoBlur did not run or archiving failed). Never expose publicly.';
COMMENT ON COLUMN task_proof_photos.original_photo_url IS
  '<private-bucket>/<object path> of the unblurred archived copy (NULL when EgoBlur did not run or archiving failed). Never expose publicly.';
