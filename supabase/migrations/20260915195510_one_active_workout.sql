-- ============================================================================
-- DailyLift — guarantee at most one active (in-progress) workout per user, even
-- under concurrent "Start" requests. The app cancels the prior in-progress
-- session before inserting a new one, but without a DB constraint two
-- simultaneous requests could each insert an in-progress row (TOCTOU). A
-- partial unique index makes the DB the final arbiter: the second concurrent
-- insert fails with a unique violation instead of creating a duplicate.
--
-- Non-destructive: first supersede any *pre-existing* duplicate in-progress
-- rows (keep the most recent per user) so the index can be created cleanly.
-- Superseded rows are marked 'cancelled', not deleted. Idempotent.
-- ============================================================================

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id ORDER BY started_at DESC, created_at DESC
         ) AS rn
  FROM public.workouts
  WHERE status = 'in_progress'
)
UPDATE public.workouts w
SET status = 'cancelled', completed_at = NOW()
FROM ranked r
WHERE w.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS workouts_one_active_per_user_uidx
  ON public.workouts (user_id)
  WHERE status = 'in_progress';

NOTIFY pgrst, 'reload schema';
