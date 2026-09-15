/**
 * Shared, deterministic fitness math. Used by the dashboard, calculators, meal
 * generation, and the meal-plan route so every surface agrees on the numbers.
 * These are estimates, not medical advice.
 */

export type Sex = "male" | "female" | "other" | string | null | undefined;

export interface BmrInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
}

/** Mifflin–St Jeor basal metabolic rate (kcal/day). */
export function calculateBMR({ weightKg, heightCm, age, sex }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  // Male +5, female −161. "other"/unknown uses the average of the two offsets.
  const offset = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  return Math.round(base + offset);
}

/** Named activity levels mapped to standard TDEE multipliers. */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_MULTIPLIERS;

/**
 * Rough activity level inferred from the workout-location preference, used as a
 * fallback until we collect an explicit activity level in onboarding.
 */
export function activityFromWorkoutPreference(
  preference: string | null | undefined,
): ActivityLevel {
  switch (preference) {
    case "gym":
      return "moderate";
    case "outdoor":
      return "active";
    case "home":
    case "mixed":
    default:
      return "light";
  }
}

/** Total daily energy expenditure (kcal/day). */
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

export type FitnessGoal =
  | "weight_loss"
  | "muscle_gain"
  | "endurance"
  | "flexibility"
  | "general_fitness"
  | string;

/**
 * Daily calorie target from TDEE, adjusted for goal with conservative,
 * non-extreme deltas (−500 cut / +300 lean bulk).
 */
export function calorieTargetForGoal(tdee: number, goal: FitnessGoal): number {
  if (goal === "weight_loss") return Math.max(1200, tdee - 500);
  if (goal === "muscle_gain") return tdee + 300;
  return tdee;
}

export interface ProfileLike {
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: Sex;
  workout_preference?: string | null;
  fitness_goal?: FitnessGoal | null;
}

/**
 * Convenience: derive a daily calorie target straight from a profile row.
 * Returns `null` when height/weight are missing so callers can fall back.
 */
export function dailyCalorieTargetFromProfile(
  profile: ProfileLike,
): number | null {
  if (!profile.weight_kg || !profile.height_cm) return null;
  const bmr = calculateBMR({
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    age: profile.age ?? 25,
    sex: profile.gender,
  });
  const tdee = calculateTDEE(
    bmr,
    activityFromWorkoutPreference(profile.workout_preference),
  );
  return calorieTargetForGoal(tdee, profile.fitness_goal ?? "general_fitness");
}
