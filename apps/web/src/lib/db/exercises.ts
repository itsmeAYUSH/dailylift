import { supabase } from "@/supabase/client";
import type { ExerciseRow } from "./types";

/** Fetch the whole exercise library (global + the user's own customs via RLS). */
export async function fetchExercises(): Promise<ExerciseRow[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchExercise(id: string): Promise<ExerciseRow | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Suggest alternative exercises: same primary muscle, excluding the current one. */
export async function fetchAlternatives(
  exercise: Pick<ExerciseRow, "id" | "primary_muscle">,
): Promise<ExerciseRow[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("primary_muscle", exercise.primary_muscle)
    .neq("id", exercise.id)
    .limit(8);
  if (error) throw error;
  return data ?? [];
}
