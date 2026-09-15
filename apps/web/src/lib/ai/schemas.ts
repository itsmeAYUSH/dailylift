import { z } from "zod";

/**
 * Zod schemas for validating AI-generated plans. The model is instructed to
 * return JSON in these exact shapes, but its output is never trusted — every
 * response is parsed through these schemas before it reaches the UI or the DB.
 *
 * Numeric fields use `z.coerce.number()` because models frequently return
 * numbers as strings (e.g. "320" or "2000").
 */

const warmupCooldownSchema = z.object({
  name: z.string(),
  duration: z.string(),
  description: z.string().default(""),
});

const exerciseSchema = z.object({
  name: z.string(),
  sets: z.coerce.number().int().min(1).max(20),
  reps: z.string(),
  rest: z.string(),
  description: z.string().default(""),
  muscle_group: z.string().default(""),
});

export const workoutPlanSchema = z.object({
  title: z.string(),
  duration: z.string(),
  calories_burn: z.coerce.number().min(0).max(5000),
  difficulty: z.string(),
  warmup: z.array(warmupCooldownSchema).default([]),
  exercises: z.array(exerciseSchema).min(1),
  cooldown: z.array(warmupCooldownSchema).default([]),
  tips: z.array(z.string()).default([]),
});

const mealSchema = z.object({
  type: z.string(),
  time: z.string().default(""),
  name: z.string(),
  calories: z.coerce.number().min(0).max(5000),
  protein: z.coerce.number().min(0).max(500),
  carbs: z.coerce.number().min(0).max(1000),
  fat: z.coerce.number().min(0).max(500),
  ingredients: z.array(z.string()).default([]),
  instructions: z.string().default(""),
  prep_time: z.string().default(""),
});

export const mealPlanSchema = z.object({
  title: z.string(),
  total_calories: z.coerce.number().min(0).max(20000),
  total_protein: z.coerce.number().min(0).max(2000),
  total_carbs: z.coerce.number().min(0).max(5000),
  total_fat: z.coerce.number().min(0).max(2000),
  meals: z.array(mealSchema).min(1),
  hydration: z.string().default(""),
  tips: z.array(z.string()).default([]),
});

export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;
export type MealPlan = z.infer<typeof mealPlanSchema>;

export const planTypeSchema = z.enum(["workout", "meal"]);
export type PlanType = z.infer<typeof planTypeSchema>;

/** Profile fields the generator is allowed to receive from the client. */
export const generateRequestSchema = z.object({
  type: planTypeSchema,
});
