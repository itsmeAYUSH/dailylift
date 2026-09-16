import { supabase } from "@/supabase/client";
import { startOfWeek } from "date-fns";
import { todayLocalISODate } from "@/lib/date";
import type { BodyWeightRow, PersonalRecordRow } from "./types";

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You are signed out. Please sign in again.");
  return data.user.id;
}

/* ------------------------------ body weight ------------------------------ */

export async function fetchBodyWeightLogs(limit = 365): Promise<BodyWeightRow[]> {
  const { data, error } = await supabase
    .from("body_weight_logs")
    .select("*")
    .order("logged_on", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Log (or overwrite) today's — or a given day's — body weight. */
export async function logBodyWeight(weightKg: number, loggedOn?: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("body_weight_logs").upsert(
    {
      user_id: userId,
      weight_kg: weightKg,
      logged_on: loggedOn ?? todayLocalISODate(),
    },
    { onConflict: "user_id,logged_on" },
  );
  if (error) throw error;
  // Keep the profile's current weight in sync for calculators.
  await supabase.from("profiles").update({ weight_kg: weightKg }).eq("user_id", userId);
}

/* --------------------------- personal records ---------------------------- */

export async function fetchPersonalRecords(): Promise<PersonalRecordRow[]> {
  const { data, error } = await supabase
    .from("personal_records")
    .select("*")
    .order("achieved_on", { ascending: false })
    .limit(200);
  if (error) throw error;

  // The table is an append log of every PR improvement. Collapse it to the
  // single current best per exercise + record type so the UI shows one row per
  // record instead of every historical bump. Historical rows are preserved.
  const best = new Map<string, PersonalRecordRow>();
  for (const pr of data ?? []) {
    const key = `${pr.exercise_id ?? pr.exercise_name}|${pr.record_type}`;
    const current = best.get(key);
    if (!current || Number(pr.value) > Number(current.value)) best.set(key, pr);
  }
  return Array.from(best.values()).sort(
    (a, b) => new Date(b.achieved_on).getTime() - new Date(a.achieved_on).getTime(),
  );
}

/* ------------------------------ dashboard -------------------------------- */

export interface DashboardData {
  workoutsThisWeek: number;
  weeklyVolumeKg: number;
  streakDays: number;
  latestWeight: number | null;
  weightChange: number | null; // vs. ~30 days ago
  recentPRs: PersonalRecordRow[];
  totalCompletedWorkouts: number;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const [{ data: workouts }, weights, prs] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, started_at, workout_exercises(workout_sets(weight_kg, reps, is_completed))")
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(200),
    fetchBodyWeightLogs(),
    fetchPersonalRecords(),
  ]);

  const list = workouts ?? [];
  const thisWeek = list.filter((w) => new Date(w.started_at) >= weekStart);

  const weeklyVolume = thisWeek.reduce((sum, w) => {
    const wExs = (w.workout_exercises ?? []) as { workout_sets: { weight_kg: number | null; reps: number | null; is_completed: boolean }[] }[];
    return (
      sum +
      wExs.reduce(
        (s, we) =>
          s +
          we.workout_sets
            .filter((set) => set.is_completed)
            .reduce((v, set) => v + (set.weight_kg ?? 0) * (set.reps ?? 0), 0),
        0,
      )
    );
  }, 0);

  // Streak: count back consecutive calendar days with a completed workout.
  // Uses local dates so an evening session isn't bucketed into the wrong day.
  const days = new Set(list.map((w) => todayLocalISODate(new Date(w.started_at))));
  let streak = 0;
  const cursor = new Date();
  // Allow today to be missing (streak still counts from yesterday).
  if (!days.has(todayLocalISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(todayLocalISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const latestWeight = weights.length ? weights[weights.length - 1].weight_kg : null;
  let weightChange: number | null = null;
  if (weights.length >= 2) {
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    const past = [...weights].reverse().find((w) => new Date(w.logged_on).getTime() <= cutoff) ?? weights[0];
    if (latestWeight != null) weightChange = Math.round((latestWeight - past.weight_kg) * 10) / 10;
  }

  return {
    workoutsThisWeek: thisWeek.length,
    weeklyVolumeKg: Math.round(weeklyVolume),
    streakDays: streak,
    latestWeight,
    weightChange,
    recentPRs: prs.slice(0, 5),
    totalCompletedWorkouts: list.length,
  };
}
