-- ============================================================================
-- DailyLift — ensure Data API access after the core migration.
--
-- Symptom this fixes: PostgREST returns PGRST205 ("could not find the table in
-- the schema cache") for the anon/authenticated roles even though the tables
-- exist. This asserts RLS is on, grants the standard Supabase table privileges
-- to the API roles (row access is still gated by RLS policies), and reloads the
-- PostgREST schema cache. Fully idempotent — safe to run more than once.
-- ============================================================================

-- 1. Make sure RLS is enabled on every user-facing table before granting broad
--    table privileges to anon/authenticated (RLS is what actually filters rows).
--    Some environments may not yet have received all schema migrations, so do
--    not fail the entire grants/cache-reload migration for a missing table.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles',
    'workout_plans',
    'meal_plans',
    'progress_logs',
    'exercises',
    'workout_plan_days',
    'planned_exercises',
    'workouts',
    'workout_exercises',
    'workout_sets',
    'body_weight_logs',
    'personal_records'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    ELSE
      RAISE NOTICE 'Skipping RLS: public.% does not exist', table_name;
    END IF;
  END LOOP;
END $$;

-- 2. Standard Supabase grants (these mirror what the dashboard sets up). Row
--    visibility is still controlled by the RLS policies defined earlier.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public
  TO anon, authenticated, service_role;

-- Future tables/sequences created by postgres get the same grants automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 3. Tell PostgREST to rebuild its schema cache now.
NOTIFY pgrst, 'reload schema';
