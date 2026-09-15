-- ============================================================================
-- DailyLift — store training-split preferences on the profile so onboarding can
-- capture the user's split, weekly frequency, and activity level. Idempotent.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_split TEXT,
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS activity_level TEXT;

NOTIFY pgrst, 'reload schema';
