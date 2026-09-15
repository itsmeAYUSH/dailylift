-- ============================================================================
-- DailyLift — Phase 1: normalized workout-logging core
--
-- Adds the exercise library, structured workout plans, logged workout sessions
-- (workouts → workout_exercises → workout_sets), body-weight series, and
-- personal records. All user-owned tables get RLS so users only ever touch
-- their own rows. Child tables enforce ownership through their parent.
--
-- Non-destructive: existing tables (profiles, meal_plans, progress_logs) are
-- untouched; workout_plans is *extended* (its dead JSONB column is kept and
-- made optional for backward compatibility).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Exercise library (shared). Global rows have created_by = NULL and are
-- readable by every authenticated user; users may also add private custom
-- exercises (created_by = their id). Global rows are seeded via the service
-- role, which bypasses RLS.
-- ----------------------------------------------------------------------------
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT NOT NULL DEFAULT 'bodyweight',
  exercise_type TEXT NOT NULL DEFAULT 'compound'
    CHECK (exercise_type IN ('compound', 'isolation', 'cardio', 'mobility')),
  movement_pattern TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  environment TEXT NOT NULL DEFAULT 'both'
    CHECK (environment IN ('gym', 'home', 'both')),
  instructions TEXT[] NOT NULL DEFAULT '{}',
  common_mistakes TEXT[] NOT NULL DEFAULT '{}',
  safety_notes TEXT,
  is_unilateral BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_primary_muscle ON public.exercises (primary_muscle);
CREATE INDEX idx_exercises_equipment ON public.exercises (equipment);
CREATE INDEX idx_exercises_created_by ON public.exercises (created_by);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global or own exercises" ON public.exercises
  FOR SELECT USING (created_by IS NULL OR auth.uid() = created_by);
CREATE POLICY "Users can insert own custom exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own custom exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own custom exercises" ON public.exercises
  FOR DELETE USING (auth.uid() = created_by);

-- ----------------------------------------------------------------------------
-- Extend workout_plans into a proper plan header. Existing columns kept.
-- ----------------------------------------------------------------------------
ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS days_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'custom'
    CHECK (source IN ('ai', 'custom', 'template')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- The dead JSONB column and week_start_date are no longer required.
ALTER TABLE public.workout_plans ALTER COLUMN plan_data DROP NOT NULL;
ALTER TABLE public.workout_plans ALTER COLUMN week_start_date DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_plans_user_active
  ON public.workout_plans (user_id, is_active);

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing UPDATE policy (original migration only had select/insert/delete).
CREATE POLICY "Users can update own workout plans" ON public.workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Plan structure: days → planned exercises.
-- ----------------------------------------------------------------------------
CREATE TABLE public.workout_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  focus TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_plan_days_plan ON public.workout_plan_days (plan_id);
ALTER TABLE public.workout_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage days of own plans" ON public.workout_plan_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  );

CREATE TABLE public.planned_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES public.workout_plan_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_planned_exercises_day ON public.planned_exercises (plan_day_id);
ALTER TABLE public.planned_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage exercises of own plan days" ON public.planned_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plan_days d
      JOIN public.workout_plans p ON p.id = d.plan_id
      WHERE d.id = plan_day_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plan_days d
      JOIN public.workout_plans p ON p.id = d.plan_id
      WHERE d.id = plan_day_id AND p.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Logged sessions: workouts → workout_exercises → workout_sets.
-- ----------------------------------------------------------------------------
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  plan_day_id UUID REFERENCES public.workout_plan_days(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Workout',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workouts_user_started ON public.workouts (user_id, started_at DESC);
CREATE INDEX idx_workouts_user_status ON public.workouts (user_id, status);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workouts" ON public.workouts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  muscle_group TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workout_exercises_workout ON public.workout_exercises (workout_id);
CREATE INDEX idx_workout_exercises_exercise ON public.workout_exercises (exercise_id);
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage exercises of own workouts" ON public.workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_id AND w.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_id AND w.user_id = auth.uid()
    )
  );

CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL
    REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL DEFAULT 0,
  set_type TEXT NOT NULL DEFAULT 'working'
    CHECK (set_type IN ('warmup', 'working', 'drop', 'failure')),
  weight_kg NUMERIC,
  reps INTEGER,
  rpe NUMERIC,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  rest_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workout_sets_exercise ON public.workout_sets (workout_exercise_id);
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage sets of own workouts" ON public.workout_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Body-weight series (clean, chartable — separate from the boolean check-in in
-- progress_logs). One entry per day per user.
-- ----------------------------------------------------------------------------
CREATE TABLE public.body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  logged_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, logged_on)
);
CREATE INDEX idx_body_weight_user_date ON public.body_weight_logs (user_id, logged_on DESC);
ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own body weight logs" ON public.body_weight_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Personal records.
-- ----------------------------------------------------------------------------
CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  record_type TEXT NOT NULL
    CHECK (record_type IN ('max_weight', 'max_reps', 'est_1rm', 'max_volume')),
  value NUMERIC NOT NULL,
  unit TEXT,
  reps INTEGER,
  weight_kg NUMERIC,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  achieved_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_personal_records_user_exercise
  ON public.personal_records (user_id, exercise_id);
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own personal records" ON public.personal_records
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
