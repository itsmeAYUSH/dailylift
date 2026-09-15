import { supabase } from "@/supabase/client";
import { estimateOneRepMax } from "@/lib/fitness/overload";
import type {
  FullWorkout,
  WorkoutExerciseRow,
  WorkoutRow,
  WorkoutSetRow,
} from "./types";

const WORKOUT_SELECT =
  "*, workout_exercises(*, workout_sets(*))";

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You are signed out. Please sign in again.");
  return data.user.id;
}

function sortWorkout(w: FullWorkout): FullWorkout {
  w.workout_exercises.sort((a, b) => a.order_index - b.order_index);
  for (const we of w.workout_exercises) {
    we.workout_sets.sort((a, b) => a.set_index - b.set_index);
  }
  return w;
}

/** The user's current in-progress workout, if any (for refresh recovery). */
export async function fetchActiveWorkout(): Promise<FullWorkout | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_SELECT)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? sortWorkout(data as FullWorkout) : null;
}

export async function fetchWorkout(id: string): Promise<FullWorkout | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? sortWorkout(data as FullWorkout) : null;
}

export interface WorkoutListItem extends WorkoutRow {
  workout_exercises: { id: string; workout_sets: { id: string; reps: number | null; weight_kg: number | null; is_completed: boolean }[] }[];
}

export async function fetchWorkoutHistory(limit = 50): Promise<WorkoutListItem[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_exercises(id, workout_sets(id, reps, weight_kg, is_completed))")
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WorkoutListItem[];
}

export interface NewExerciseInput {
  exercise_id?: string | null;
  name: string;
  muscle_group?: string | null;
  target_sets?: number | null;
  target_reps_min?: number | null;
  target_reps_max?: number | null;
  rest_seconds?: number | null;
}

/** Create a workout, optionally seeded with exercises (from a plan or blank). */
export async function startWorkout(input: {
  name: string;
  planId?: string | null;
  planDayId?: string | null;
  exercises?: NewExerciseInput[];
}): Promise<FullWorkout> {
  const userId = await requireUserId();
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      name: input.name,
      plan_id: input.planId ?? null,
      plan_day_id: input.planDayId ?? null,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (error) throw error;

  const seeds = input.exercises ?? [];
  for (let i = 0; i < seeds.length; i++) {
    await addWorkoutExercise(workout.id, seeds[i], i);
  }

  const full = await fetchWorkout(workout.id);
  if (!full) throw new Error("Failed to create workout");
  return full;
}

/** Add an exercise (and its empty target sets) to a workout. */
export async function addWorkoutExercise(
  workoutId: string,
  input: NewExerciseInput,
  orderIndex?: number,
): Promise<WorkoutExerciseRow> {
  let order = orderIndex;
  if (order == null) {
    const { count } = await supabase
      .from("workout_exercises")
      .select("id", { count: "exact", head: true })
      .eq("workout_id", workoutId);
    order = count ?? 0;
  }

  const { data: we, error } = await supabase
    .from("workout_exercises")
    .insert({
      workout_id: workoutId,
      exercise_id: input.exercise_id ?? null,
      name: input.name,
      muscle_group: input.muscle_group ?? null,
      order_index: order,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Pre-create target sets so the user just fills weight/reps.
  const setCount = Math.max(1, input.target_sets ?? 3);
  const rows = Array.from({ length: setCount }, (_, i) => ({
    workout_exercise_id: we.id,
    set_index: i,
    set_type: "working",
    rest_seconds: input.rest_seconds ?? null,
  }));
  const { error: setError } = await supabase.from("workout_sets").insert(rows);
  if (setError) throw setError;

  return we;
}

export async function removeWorkoutExercise(id: string): Promise<void> {
  const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function addSet(
  workoutExerciseId: string,
  input: Partial<Pick<WorkoutSetRow, "set_type" | "weight_kg" | "reps" | "rest_seconds">> = {},
): Promise<WorkoutSetRow> {
  const { count } = await supabase
    .from("workout_sets")
    .select("id", { count: "exact", head: true })
    .eq("workout_exercise_id", workoutExerciseId);
  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      workout_exercise_id: workoutExerciseId,
      set_index: count ?? 0,
      set_type: input.set_type ?? "working",
      weight_kg: input.weight_kg ?? null,
      reps: input.reps ?? null,
      rest_seconds: input.rest_seconds ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<WorkoutSetRow, "weight_kg" | "reps" | "rpe" | "set_type" | "is_completed" | "completed_at">>,
): Promise<void> {
  const { error } = await supabase.from("workout_sets").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from("workout_sets").delete().eq("id", id);
  if (error) throw error;
}

export async function updateWorkout(
  id: string,
  patch: Partial<Pick<WorkoutRow, "name" | "notes">>,
): Promise<void> {
  const { error } = await supabase.from("workouts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw error;
}

export async function cancelWorkout(id: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export interface FinishResult {
  newPRs: { exercise_name: string; record_type: string; value: number }[];
}

/**
 * Mark a workout complete, stamp its duration, and detect new personal records
 * from its completed sets (max weight and estimated 1RM per exercise).
 */
export async function finishWorkout(id: string): Promise<FinishResult> {
  const userId = await requireUserId();
  const full = await fetchWorkout(id);
  if (!full) throw new Error("Workout not found");

  const duration = Math.max(
    0,
    Math.round((Date.now() - new Date(full.started_at).getTime()) / 1000),
  );
  const { error } = await supabase
    .from("workouts")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: duration,
    })
    .eq("id", id);
  if (error) throw error;

  return detectPersonalRecords(userId, id, full);
}

async function detectPersonalRecords(
  userId: string,
  workoutId: string,
  full: FullWorkout,
): Promise<FinishResult> {
  const newPRs: FinishResult["newPRs"] = [];

  for (const we of full.workout_exercises) {
    const done = we.workout_sets.filter(
      (s) => s.is_completed && s.reps != null && s.weight_kg != null && (s.weight_kg ?? 0) > 0,
    );
    if (done.length === 0) continue;

    const maxWeight = Math.max(...done.map((s) => s.weight_kg ?? 0));
    const best1rm = Math.max(
      ...done.map((s) => estimateOneRepMax(s.weight_kg ?? 0, s.reps ?? 0)),
    );

    const candidates: { type: "max_weight" | "est_1rm"; value: number }[] = [
      { type: "max_weight", value: maxWeight },
      { type: "est_1rm", value: best1rm },
    ];

    for (const c of candidates) {
      if (c.value <= 0) continue;
      // Existing best for this exercise + type.
      let existingQuery = supabase
        .from("personal_records")
        .select("value")
        .eq("user_id", userId)
        .eq("record_type", c.type)
        .order("value", { ascending: false })
        .limit(1);
      existingQuery = we.exercise_id
        ? existingQuery.eq("exercise_id", we.exercise_id)
        : existingQuery.eq("exercise_name", we.name);
      const { data: existing } = await existingQuery.maybeSingle();

      if (!existing || c.value > Number(existing.value)) {
        await supabase.from("personal_records").insert({
          user_id: userId,
          exercise_id: we.exercise_id,
          exercise_name: we.name,
          record_type: c.type,
          value: c.value,
          unit: "kg",
          workout_id: workoutId,
        });
        newPRs.push({ exercise_name: we.name, record_type: c.type, value: c.value });
      }
    }
  }

  return { newPRs };
}

/**
 * Previous completed sets for an exercise (by id, falling back to name), used
 * for the "last session" hint and progressive-overload suggestions.
 */
export async function fetchLastPerformance(params: {
  exerciseId?: string | null;
  name: string;
  excludeWorkoutId?: string;
}): Promise<WorkoutSetRow[]> {
  let query = supabase
    .from("workout_exercises")
    .select("id, name, exercise_id, workout:workouts!inner(id, started_at, status), workout_sets(*)")
    .eq("workout.status", "completed")
    .limit(25);
  query = params.exerciseId
    ? query.eq("exercise_id", params.exerciseId)
    : query.eq("name", params.name);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    id: string;
    workout: { id: string; started_at: string };
    workout_sets: WorkoutSetRow[];
  }[];

  const match = rows
    .filter((r) => r.workout?.id !== params.excludeWorkoutId)
    .sort(
      (a, b) => new Date(b.workout.started_at).getTime() - new Date(a.workout.started_at).getTime(),
    )[0];
  if (!match) return [];
  return match.workout_sets
    .filter((s) => s.is_completed)
    .sort((a, b) => a.set_index - b.set_index);
}
