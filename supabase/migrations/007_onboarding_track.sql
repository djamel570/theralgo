-- Add selected_track column to onboarding_progress table
-- This tracks which onboarding path the therapist chose: 'acquisition', 'digital_products', or 'both'

ALTER TABLE onboarding_progress
ADD COLUMN IF NOT EXISTS selected_track TEXT
DEFAULT NULL
CHECK (selected_track IN ('acquisition', 'digital_products', 'both'));

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_track
  ON onboarding_progress(selected_track);
