/**
 * Deterministic progressive-overload engine. Intentionally NOT an AI call: the
 * logic is explainable, instant, and works with AI turned off. Every result is
 * labelled a *suggestion* — the user can always override it in the logger.
 */

export interface CompletedSet {
  weight_kg: number | null;
  reps: number | null;
  set_type?: string | null;
}

export interface OverloadContext {
  /** Sets performed in the most recent session for this exercise. */
  lastSets: CompletedSet[];
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
}

export interface OverloadSuggestion {
  /** Suggested working weight for the next session (kg). */
  weightKg: number | null;
  /** Suggested rep target per set. */
  reps: number | null;
  /** Short, plain-language reason. */
  message: string;
  action: "increase_weight" | "add_reps" | "hold" | "reduce" | "none";
}

/** Epley estimated one-rep max. Returns 0 for invalid input. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (!weightKg || !reps || reps < 1) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/** Total volume (Σ weight × reps) over working sets. */
export function sessionVolume(sets: CompletedSet[]): number {
  return sets.reduce(
    (sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0),
    0,
  );
}

/** Best estimated 1RM across a session's working sets (0 if none usable). */
export function sessionBest1RM(sets: CompletedSet[]): number {
  return sets
    .filter((s) => (s.set_type ?? "working") === "working")
    .reduce((m, s) => Math.max(m, estimateOneRepMax(s.weight_kg ?? 0, s.reps ?? 0)), 0);
}

export type ProgressDirection = "up" | "same" | "down" | "baseline";

/**
 * Deterministic progress direction between the current and previous session for
 * one exercise, judged by best estimated 1RM. Returns "baseline" when there is
 * no comparable prior data.
 */
export function compareProgress(
  current: CompletedSet[],
  previous: CompletedSet[],
): ProgressDirection {
  const c = sessionBest1RM(current);
  const p = sessionBest1RM(previous);
  if (c <= 0 || p <= 0) return "baseline";
  if (c > p) return "up";
  if (c < p) return "down";
  return "same";
}

/**
 * Suggest the next session's load. Rules, most specific first:
 *  - No usable history → no suggestion.
 *  - Hit the top of the rep range on every working set → bump weight ~2.5 kg
 *    (barbell) / round sensibly, reset reps to the bottom of the range.
 *  - Reached bottom-to-mid of the range → keep weight, aim for +1 rep.
 *  - Fell below the bottom of the range → hold or reduce slightly.
 */
export function suggestProgression(ctx: OverloadContext): OverloadSuggestion {
  const working = ctx.lastSets.filter(
    (s) => (s.set_type ?? "working") === "working" && s.reps != null,
  );
  if (working.length === 0) {
    return { weightKg: null, reps: null, message: "", action: "none" };
  }

  const topWeight = Math.max(...working.map((s) => s.weight_kg ?? 0));
  const repsAtTop = working
    .filter((s) => (s.weight_kg ?? 0) === topWeight)
    .map((s) => s.reps ?? 0);
  const minReps = Math.min(...repsAtTop);

  const repMax = ctx.targetRepsMax ?? null;
  const repMin = ctx.targetRepsMin ?? null;

  // Default rep target if none provided.
  const bottom = repMin ?? 8;
  const top = repMax ?? 12;

  if (repMax != null && minReps >= repMax) {
    const increment = topWeight >= 40 ? 5 : 2.5;
    const next = topWeight + increment;
    return {
      weightKg: next,
      reps: bottom,
      action: "increase_weight",
      message: `You hit the top of your rep range on every set. Try ${formatKg(next)} for ${bottom} reps next time.`,
    };
  }

  if (minReps >= bottom) {
    return {
      weightKg: topWeight,
      reps: Math.min(minReps + 1, top),
      action: "add_reps",
      message: `Keep ${formatKg(topWeight)} and aim for ${Math.min(minReps + 1, top)} reps to build toward a weight increase.`,
    };
  }

  return {
    weightKg: topWeight,
    reps: bottom,
    action: "hold",
    message: `Repeat ${formatKg(topWeight)} and focus on hitting ${bottom}+ clean reps before adding load.`,
  };
}

export function formatKg(kg: number): string {
  return Number.isInteger(kg) ? `${kg} kg` : `${kg.toFixed(1)} kg`;
}

/** "40 kg × 10, 10, 8" summary of a set list, for the "last session" hint. */
export function summarizeSets(sets: CompletedSet[]): string {
  const done = sets.filter((s) => s.reps != null);
  if (done.length === 0) return "";
  const byWeight = done.every((s) => s.weight_kg === done[0].weight_kg);
  const reps = done.map((s) => s.reps).join(", ");
  if (byWeight && done[0].weight_kg != null) {
    return `${formatKg(done[0].weight_kg)} × ${reps}`;
  }
  return done
    .map((s) => `${s.weight_kg != null ? formatKg(s.weight_kg) : "BW"}×${s.reps}`)
    .join(", ");
}
