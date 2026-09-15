-- ============================================================================
-- DailyLift — consolidated, idempotent core schema.
--
-- Creates every table the app needs EXCEPT profiles (handled by the repair
-- migration): the remaining base tables (workout_plans, meal_plans,
-- progress_logs) plus the Phase 1 workout-logging core (exercises, plans,
-- logged sessions, body-weight series, personal records). RLS, policies,
-- triggers, indexes, grants, and a PostgREST cache reload are all included.
--
-- Fully idempotent: CREATE ... IF NOT EXISTS, DROP POLICY IF EXISTS before
-- CREATE POLICY, DROP TRIGGER IF EXISTS before CREATE TRIGGER. Safe to re-run.
-- Assumes the enum types and public.update_updated_at_column() already exist
-- (they do once profiles exists); enum guards below make it safe standalone.
-- ============================================================================

-- Enum guards (no-ops if the types already exist).
DO $$ BEGIN
  CREATE TYPE public.fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.fitness_goal AS ENUM ('weight_loss','muscle_gain','endurance','flexibility','general_fitness');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.workout_preference AS ENUM ('home','gym','outdoor','mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

-- ----------------------------------------------------------------------------
-- Base table: workout_plans (created fully-formed with the extended columns).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB,
  week_start_date DATE,
  name TEXT,
  description TEXT,
  goal TEXT,
  days_per_week INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('ai','custom','template')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_active ON public.workout_plans (user_id, is_active);
DROP TRIGGER IF EXISTS update_workout_plans_updated_at ON public.workout_plans;
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Users can view own workout plans" ON public.workout_plans;
CREATE POLICY "Users can view own workout plans" ON public.workout_plans
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own workout plans" ON public.workout_plans;
CREATE POLICY "Users can insert own workout plans" ON public.workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own workout plans" ON public.workout_plans;
CREATE POLICY "Users can update own workout plans" ON public.workout_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own workout plans" ON public.workout_plans;
CREATE POLICY "Users can delete own workout plans" ON public.workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Base table: meal_plans.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB NOT NULL,
  plan_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON public.meal_plans (user_id, plan_date DESC);

DROP POLICY IF EXISTS "Users can view own meal plans" ON public.meal_plans;
CREATE POLICY "Users can view own meal plans" ON public.meal_plans
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own meal plans" ON public.meal_plans;
CREATE POLICY "Users can insert own meal plans" ON public.meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own meal plans" ON public.meal_plans;
CREATE POLICY "Users can delete own meal plans" ON public.meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Base table: progress_logs.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC,
  workout_completed BOOLEAN DEFAULT FALSE,
  meals_followed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_progress_logs_user_date ON public.progress_logs (user_id, log_date DESC);

DROP POLICY IF EXISTS "Users can view own progress logs" ON public.progress_logs;
CREATE POLICY "Users can view own progress logs" ON public.progress_logs
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own progress logs" ON public.progress_logs;
CREATE POLICY "Users can insert own progress logs" ON public.progress_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own progress logs" ON public.progress_logs;
CREATE POLICY "Users can update own progress logs" ON public.progress_logs
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own progress logs" ON public.progress_logs;
CREATE POLICY "Users can delete own progress logs" ON public.progress_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Exercise library (shared globals with created_by NULL + private customs).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT NOT NULL DEFAULT 'bodyweight',
  exercise_type TEXT NOT NULL DEFAULT 'compound'
    CHECK (exercise_type IN ('compound','isolation','cardio','mobility')),
  movement_pattern TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner','intermediate','advanced')),
  environment TEXT NOT NULL DEFAULT 'both'
    CHECK (environment IN ('gym','home','both')),
  instructions TEXT[] NOT NULL DEFAULT '{}',
  common_mistakes TEXT[] NOT NULL DEFAULT '{}',
  safety_notes TEXT,
  is_unilateral BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON public.exercises (primary_muscle);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises (equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON public.exercises (created_by);

DROP POLICY IF EXISTS "Anyone can view global or own exercises" ON public.exercises;
CREATE POLICY "Anyone can view global or own exercises" ON public.exercises
  FOR SELECT USING (created_by IS NULL OR auth.uid() = created_by);
DROP POLICY IF EXISTS "Users can insert own custom exercises" ON public.exercises;
CREATE POLICY "Users can insert own custom exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Users can update own custom exercises" ON public.exercises;
CREATE POLICY "Users can update own custom exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Users can delete own custom exercises" ON public.exercises;
CREATE POLICY "Users can delete own custom exercises" ON public.exercises
  FOR DELETE USING (auth.uid() = created_by);

-- ----------------------------------------------------------------------------
-- Plan structure: days → planned exercises.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  focus TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workout_plan_days ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_plan_days_plan ON public.workout_plan_days (plan_id);
DROP POLICY IF EXISTS "Users manage days of own plans" ON public.workout_plan_days;
CREATE POLICY "Users manage days of own plans" ON public.workout_plan_days
  FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.planned_exercises (
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
ALTER TABLE public.planned_exercises ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_planned_exercises_day ON public.planned_exercises (plan_day_id);
DROP POLICY IF EXISTS "Users manage exercises of own plan days" ON public.planned_exercises;
CREATE POLICY "Users manage exercises of own plan days" ON public.planned_exercises
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.workout_plan_days d JOIN public.workout_plans p ON p.id = d.plan_id
    WHERE d.id = plan_day_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_plan_days d JOIN public.workout_plans p ON p.id = d.plan_id
    WHERE d.id = plan_day_id AND p.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- Logged sessions: workouts → workout_exercises → workout_sets.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  plan_day_id UUID REFERENCES public.workout_plan_days(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Workout',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_workouts_user_started ON public.workouts (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_status ON public.workouts (user_id, status);
DROP TRIGGER IF EXISTS update_workouts_updated_at ON public.workouts;
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP POLICY IF EXISTS "Users manage own workouts" ON public.workouts;
CREATE POLICY "Users manage own workouts" ON public.workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  muscle_group TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON public.workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON public.workout_exercises (exercise_id);
DROP POLICY IF EXISTS "Users manage exercises of own workouts" ON public.workout_exercises;
CREATE POLICY "Users manage exercises of own workouts" ON public.workout_exercises
  FOR ALL USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL DEFAULT 0,
  set_type TEXT NOT NULL DEFAULT 'working'
    CHECK (set_type IN ('warmup','working','drop','failure')),
  weight_kg NUMERIC,
  reps INTEGER,
  rpe NUMERIC,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  rest_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON public.workout_sets (workout_exercise_id);
DROP POLICY IF EXISTS "Users manage sets of own workouts" ON public.workout_sets;
CREATE POLICY "Users manage sets of own workouts" ON public.workout_sets
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- Body-weight series + personal records.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  logged_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, logged_on)
);
ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_body_weight_user_date ON public.body_weight_logs (user_id, logged_on DESC);
DROP POLICY IF EXISTS "Users manage own body weight logs" ON public.body_weight_logs;
CREATE POLICY "Users manage own body weight logs" ON public.body_weight_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('max_weight','max_reps','est_1rm','max_volume')),
  value NUMERIC NOT NULL,
  unit TEXT,
  reps INTEGER,
  weight_kg NUMERIC,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  achieved_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise ON public.personal_records (user_id, exercise_id);
DROP POLICY IF EXISTS "Users manage own personal records" ON public.personal_records;
CREATE POLICY "Users manage own personal records" ON public.personal_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Grants (row access still gated by RLS) + PostgREST cache reload.
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
