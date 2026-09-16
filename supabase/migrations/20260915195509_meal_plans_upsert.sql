-- ============================================================================
-- DailyLift — enable reliable per-day meal-plan persistence.
--
-- 1. Unique index on (user_id, plan_date) so the app can UPSERT one plan per
--    user per day (onConflict target). Non-destructive: fails loudly only if
--    pre-existing duplicates exist (the feature never persisted before, so the
--    table is expected to be empty).
-- 2. Add the missing UPDATE RLS policy — an UPSERT that hits the conflict path
--    performs an UPDATE, which the existing insert/select/delete policies do
--    not cover. Scoped to the owner, so users still touch only their own rows.
--
-- Idempotent and safe to re-run.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS meal_plans_user_date_uidx
  ON public.meal_plans (user_id, plan_date);

DROP POLICY IF EXISTS "Users can update own meal plans" ON public.meal_plans;
CREATE POLICY "Users can update own meal plans" ON public.meal_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
