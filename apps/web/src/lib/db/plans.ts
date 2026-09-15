import { supabase } from "@/supabase/client";
import type { BuiltPlan } from "@/lib/fitness/planBuilder";
import type { FullPlan, WorkoutPlanRow } from "./types";

const PLAN_SELECT =
  "*, workout_plan_days(*, planned_exercises(*))";

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You are signed out. Please sign in again.");
  return data.user.id;
}

function sortPlan(p: FullPlan): FullPlan {
  p.workout_plan_days.sort((a, b) => a.day_index - b.day_index);
  for (const d of p.workout_plan_days) {
    d.planned_exercises.sort((a, b) => a.order_index - b.order_index);
  }
  return p;
}

export async function fetchPlans(): Promise<WorkoutPlanRow[]> {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPlan(id: string): Promise<FullPlan | null> {
  const { data, error } = await supabase
    .from("workout_plans")
    .select(PLAN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? sortPlan(data as FullPlan) : null;
}

export async function fetchActivePlan(): Promise<FullPlan | null> {
  const { data, error } = await supabase
    .from("workout_plans")
    .select(PLAN_SELECT)
    .eq("is_active", true)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? sortPlan(data as FullPlan) : null;
}

/** Persist a built plan (days + exercises) and mark it the active plan. */
export async function savePlan(
  built: BuiltPlan,
  opts: { source?: "ai" | "custom" | "template"; goal?: string | null } = {},
): Promise<string> {
  const userId = await requireUserId();

  // Deactivate other plans first so only one is active.
  await supabase
    .from("workout_plans")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  const { data: plan, error } = await supabase
    .from("workout_plans")
    .insert({
      user_id: userId,
      name: built.name,
      description: built.description,
      goal: opts.goal ?? null,
      days_per_week: built.daysPerWeek,
      is_active: true,
      source: opts.source ?? "custom",
    })
    .select("id")
    .single();
  if (error) throw error;

  for (let d = 0; d < built.days.length; d++) {
    const day = built.days[d];
    const { data: dayRow, error: dayError } = await supabase
      .from("workout_plan_days")
      .insert({
        plan_id: plan.id,
        day_index: d,
        name: day.name,
        focus: day.focus,
      })
      .select("id")
      .single();
    if (dayError) throw dayError;

    if (day.exercises.length > 0) {
      const rows = day.exercises.map((ex, i) => ({
        plan_day_id: dayRow.id,
        exercise_id: ex.exercise_id,
        name: ex.name,
        order_index: i,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        rest_seconds: ex.rest_seconds,
      }));
      const { error: exError } = await supabase.from("planned_exercises").insert(rows);
      if (exError) throw exError;
    }
  }

  return plan.id;
}

export async function setActivePlan(id: string): Promise<void> {
  const userId = await requireUserId();
  await supabase
    .from("workout_plans")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);
  const { error } = await supabase
    .from("workout_plans")
    .update({ is_active: true, is_archived: false })
    .eq("id", id);
  if (error) throw error;
}

export async function archivePlan(id: string): Promise<void> {
  const { error } = await supabase
    .from("workout_plans")
    .update({ is_archived: true, is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from("workout_plans").delete().eq("id", id);
  if (error) throw error;
}
