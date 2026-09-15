import type { Tables } from "@/supabase/types";

export type ExerciseRow = Tables<"exercises">;
export type WorkoutRow = Tables<"workouts">;
export type WorkoutExerciseRow = Tables<"workout_exercises">;
export type WorkoutSetRow = Tables<"workout_sets">;
export type WorkoutPlanRow = Tables<"workout_plans">;
export type PlanDayRow = Tables<"workout_plan_days">;
export type PlannedExerciseRow = Tables<"planned_exercises">;
export type BodyWeightRow = Tables<"body_weight_logs">;
export type PersonalRecordRow = Tables<"personal_records">;

/** A workout_exercise with its ordered sets attached. */
export interface WorkoutExerciseWithSets extends WorkoutExerciseRow {
  workout_sets: WorkoutSetRow[];
}

/** A full workout with nested exercises and sets. */
export interface FullWorkout extends WorkoutRow {
  workout_exercises: WorkoutExerciseWithSets[];
}

/** A plan day with its ordered planned exercises. */
export interface PlanDayWithExercises extends PlanDayRow {
  planned_exercises: PlannedExerciseRow[];
}

/** A plan with nested days and planned exercises. */
export interface FullPlan extends WorkoutPlanRow {
  workout_plan_days: PlanDayWithExercises[];
}

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "cardio",
] as const;

export const EQUIPMENT_OPTIONS = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
  "other",
] as const;
