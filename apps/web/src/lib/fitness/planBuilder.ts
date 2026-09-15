/**
 * Deterministic workout-plan builder. Given a training split and the exercise
 * library, it assembles a multi-day plan by mapping each day's focus to muscle
 * groups and picking real exercises (compound movements first). No AI required —
 * instant and explainable — and the result is fully editable afterwards.
 */
import { SPLITS, type TrainingSplit } from "./split";
import type { ExerciseRow } from "@/lib/db/types";

export interface BuiltExercise {
  exercise_id: string | null;
  name: string;
  muscle_group: string;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
}

export interface BuiltDay {
  name: string;
  focus: string;
  exercises: BuiltExercise[];
}

export interface BuiltPlan {
  name: string;
  description: string;
  split: TrainingSplit;
  daysPerWeek: number;
  days: BuiltDay[];
}

type Goal = "weight_loss" | "muscle_gain" | "endurance" | "flexibility" | "general_fitness" | string;

// Which muscle groups belong to each day "focus".
const FOCUS_MUSCLES: Record<string, string[]> = {
  full_body: ["quads", "chest", "back", "shoulders", "hamstrings", "core"],
  upper: ["chest", "back", "shoulders", "triceps", "biceps"],
  lower: ["quads", "hamstrings", "glutes", "calves", "core"],
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  chest: ["chest", "triceps"],
  back: ["back", "biceps"],
  shoulders: ["shoulders", "core"],
  arms: ["biceps", "triceps"],
};

function repScheme(goal: Goal): { min: number; max: number; sets: number; rest: number } {
  switch (goal) {
    case "muscle_gain":
      return { min: 8, max: 12, sets: 4, rest: 90 };
    case "weight_loss":
    case "endurance":
      return { min: 12, max: 20, sets: 3, rest: 45 };
    case "flexibility":
      return { min: 10, max: 15, sets: 3, rest: 60 };
    default:
      return { min: 8, max: 12, sets: 3, rest: 75 };
  }
}

function pickForMuscle(
  library: ExerciseRow[],
  muscle: string,
  environment: string,
  count: number,
  used: Set<string>,
): ExerciseRow[] {
  const matches = library
    .filter((e) => e.primary_muscle === muscle && !used.has(e.id))
    .filter((e) => e.environment === "both" || e.environment === environment)
    .sort((a, b) => {
      // Compound first, then beginner-friendly.
      if (a.exercise_type !== b.exercise_type) {
        return a.exercise_type === "compound" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  const chosen = matches.slice(0, count);
  chosen.forEach((e) => used.add(e.id));
  return chosen;
}

export function buildPlan(params: {
  split: TrainingSplit;
  daysPerWeek: number;
  goal: Goal;
  environment: string; // gym | home | outdoor | mixed
  library: ExerciseRow[];
}): BuiltPlan {
  const meta = SPLITS.find((s) => s.value === params.split) ?? SPLITS[0];
  const scheme = repScheme(params.goal);
  const env = params.environment === "gym" ? "gym" : params.environment === "home" ? "home" : "both";

  // Repeat the split template up to the requested days-per-week.
  const dayCount = Math.max(1, Math.min(7, Math.round(params.daysPerWeek)));
  const template = meta.dayTemplate;
  const days: BuiltDay[] = [];

  for (let i = 0; i < dayCount; i++) {
    const t = template[i % template.length];
    const muscles = FOCUS_MUSCLES[t.focus] ?? ["full_body"];
    const used = new Set<string>();
    const exercises: BuiltExercise[] = [];

    // Aim for ~5–6 exercises per session, weighted toward the first muscles.
    const perMuscle = muscles.length <= 3 ? 2 : 1;
    for (const muscle of muscles) {
      const picks = pickForMuscle(params.library, muscle, env, perMuscle, used);
      for (const ex of picks) {
        exercises.push({
          exercise_id: ex.id,
          name: ex.name,
          muscle_group: ex.primary_muscle,
          target_sets: scheme.sets,
          target_reps_min: scheme.min,
          target_reps_max: scheme.max,
          rest_seconds: scheme.rest,
        });
      }
      if (exercises.length >= 6) break;
    }

    days.push({
      name: template.length > 1 ? t.name : `${t.name} ${String.fromCharCode(65 + Math.floor(i / template.length))}`.trim(),
      focus: t.focus,
      exercises,
    });
  }

  return {
    name: `${meta.label} — ${dayCount}-day`,
    description: `${meta.description}`,
    split: params.split,
    daysPerWeek: dayCount,
    days,
  };
}
