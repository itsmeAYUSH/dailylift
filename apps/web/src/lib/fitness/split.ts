/**
 * Deterministic training-split recommendation. This is intentionally NOT an AI
 * call — the logic is explainable and instant. Onboarding can offer a "Suggest
 * for me" button backed by this, and the user can always override the result.
 */

export type TrainingSplit =
  | "full_body"
  | "upper_lower"
  | "push_pull_legs"
  | "bro_split";

export interface SplitMeta {
  value: TrainingSplit;
  label: string;
  tagline: string;
  description: string;
  /** Weekly session counts this split works well with. */
  idealDays: number[];
  /** The rotation of training days, used to seed a plan skeleton. */
  dayTemplate: { name: string; focus: string }[];
}

export const SPLITS: SplitMeta[] = [
  {
    value: "full_body",
    label: "Full Body",
    tagline: "Everything, every session",
    description:
      "Train the whole body each session. The most efficient choice for beginners or anyone training 2–3 days a week.",
    idealDays: [2, 3],
    dayTemplate: [
      { name: "Full Body A", focus: "full_body" },
      { name: "Full Body B", focus: "full_body" },
      { name: "Full Body C", focus: "full_body" },
    ],
  },
  {
    value: "upper_lower",
    label: "Upper / Lower",
    tagline: "Split by half",
    description:
      "Alternate upper-body and lower-body days. A balanced step up from full body for 4 sessions a week.",
    idealDays: [4],
    dayTemplate: [
      { name: "Upper A", focus: "upper" },
      { name: "Lower A", focus: "lower" },
      { name: "Upper B", focus: "upper" },
      { name: "Lower B", focus: "lower" },
    ],
  },
  {
    value: "push_pull_legs",
    label: "Push / Pull / Legs",
    tagline: "The hypertrophy classic",
    description:
      "Group by movement: pushing muscles, pulling muscles, then legs. Scales from 3 to 6 days and is the go-to for gym-based muscle building.",
    idealDays: [3, 5, 6],
    dayTemplate: [
      { name: "Push", focus: "push" },
      { name: "Pull", focus: "pull" },
      { name: "Legs", focus: "legs" },
    ],
  },
  {
    value: "bro_split",
    label: "Bro Split",
    tagline: "One muscle group a day",
    description:
      "Dedicate each day to a single muscle group. High per-session volume — best for advanced lifters training 5 days a week.",
    idealDays: [5],
    dayTemplate: [
      { name: "Chest", focus: "chest" },
      { name: "Back", focus: "back" },
      { name: "Shoulders", focus: "shoulders" },
      { name: "Arms", focus: "arms" },
      { name: "Legs", focus: "legs" },
    ],
  },
];

export function getSplitMeta(value: TrainingSplit): SplitMeta {
  return SPLITS.find((s) => s.value === value) ?? SPLITS[0];
}

export type Experience = "beginner" | "intermediate" | "advanced" | string;

export interface SplitInput {
  experience: Experience;
  daysPerWeek: number;
  goal?: string | null;
  /** workout_preference: gym / home / outdoor / mixed */
  location?: string | null;
}

export interface SplitRecommendation {
  split: TrainingSplit;
  rationale: string;
}

/**
 * Recommend a split from experience, weekly frequency, goal, and location.
 * Rules (most specific first):
 *  - Limited-equipment settings (home/outdoor) favor full body or upper/lower.
 *  - Beginners default to full body until they train ≥4 days.
 *  - 4 days → upper/lower; 5–6 days → PPL; advanced + muscle gain at 5 → bro split.
 */
export function recommendSplit({
  experience,
  daysPerWeek,
  goal,
  location,
}: SplitInput): SplitRecommendation {
  const days = Math.max(1, Math.min(7, Math.round(daysPerWeek || 3)));
  const limitedEquipment = location === "home" || location === "outdoor";

  if (limitedEquipment) {
    if (days >= 4) {
      return {
        split: "upper_lower",
        rationale: `With ${days} days a week and minimal equipment, an upper/lower split gives each half enough recovery while staying doable at home.`,
      };
    }
    return {
      split: "full_body",
      rationale: `Training at home ${days} day${days > 1 ? "s" : ""} a week, full-body sessions get you the most stimulus per workout without needing much gear.`,
    };
  }

  if (experience === "beginner" && days <= 3) {
    return {
      split: "full_body",
      rationale: `As a beginner training ${days} day${days > 1 ? "s" : ""} a week, full body lets you practice each movement often and recover easily.`,
    };
  }

  if (days <= 3) {
    return {
      split: "push_pull_legs",
      rationale: `Three focused push / pull / legs days cover the whole body once each week with room to push intensity.`,
    };
  }

  if (days === 4) {
    return {
      split: "upper_lower",
      rationale: `Four days a week fits an upper/lower split perfectly — two upper and two lower sessions with balanced volume.`,
    };
  }

  // 5–6 days
  if (experience === "advanced" && days === 5 && goal === "muscle_gain") {
    return {
      split: "bro_split",
      rationale: `Five days as an advanced lifter chasing size lets you hammer one muscle group per day with high volume and full recovery.`,
    };
  }

  return {
    split: "push_pull_legs",
    rationale: `At ${days} days a week, running push / pull / legs twice through the week maximizes weekly volume for each muscle.`,
  };
}
