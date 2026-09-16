import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { geminiGenerate, GeminiError } from "@/lib/ai/gemini";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import {
  workoutPlanSchema,
  mealPlanSchema,
  planTypeSchema,
  type PlanType,
} from "@/lib/ai/schemas";
import { dailyCalorieTargetFromProfile } from "@/lib/fitness/calculations";

// Long-form generation — keep this on the Node runtime, not edge.
export const runtime = "nodejs";
export const maxDuration = 60;

/** Profile shape read server-side from the DB — the client never supplies it. */
interface Profile {
  fitness_level?: string | null;
  fitness_goal?: string | null;
  workout_preference?: string | null;
  available_time_minutes?: number | null;
  age?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  gender?: string | null;
  dietary_preference?: string | null;
}

function buildPrompts(type: PlanType, profile: Profile, dailyCalories: number) {
  if (type === "workout") {
    return {
      system:
        "You are an expert fitness coach. Generate a detailed, personalized workout plan based on the user's profile. Be specific with exercises, sets, reps, and rest times. Include warm-up and cool-down. Respond with ONLY a JSON object, no prose and no markdown fences.",
      user: `Create a workout plan for today for someone with:
- Fitness Level: ${profile.fitness_level}
- Goal: ${profile.fitness_goal?.replace("_", " ")}
- Workout Preference: ${profile.workout_preference}
- Available Time: ${profile.available_time_minutes} minutes
- Age: ${profile.age}
- Weight: ${profile.weight_kg}kg

Return a JSON object with this exact structure:
{
  "title": "Today's Workout Title",
  "duration": "X minutes",
  "calories_burn": estimated calories,
  "difficulty": "beginner/intermediate/advanced",
  "warmup": [
    {"name": "exercise", "duration": "X min", "description": "brief description"}
  ],
  "exercises": [
    {
      "name": "exercise name",
      "sets": number,
      "reps": "rep range or duration",
      "rest": "rest time",
      "description": "how to perform",
      "muscle_group": "primary muscle"
    }
  ],
  "cooldown": [
    {"name": "exercise", "duration": "X min", "description": "brief description"}
  ],
  "tips": ["tip1", "tip2", "tip3"]
}`,
    };
  }

  return {
    system:
      "You are an expert nutritionist. Generate a detailed, personalized meal plan based on the user's profile and dietary preferences. Include exact portions, calories, and macros for each meal. Respond with ONLY a JSON object, no prose and no markdown fences.",
    user: `Create a full day meal plan for someone with:
- Goal: ${profile.fitness_goal?.replace("_", " ")}
- Dietary Preference: ${profile.dietary_preference || "non_vegetarian"}
- Daily Calorie Target: ${dailyCalories} calories
- Weight: ${profile.weight_kg}kg

Return a JSON object with this exact structure:
{
  "title": "Today's Meal Plan",
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "meals": [
    {
      "type": "Breakfast/Lunch/Dinner/Snack",
      "time": "suggested time",
      "name": "meal name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": "brief cooking instructions",
      "prep_time": "X min"
    }
  ],
  "hydration": "daily water intake recommendation",
  "tips": ["nutrition tip 1", "tip 2", "tip 3"]
}`,
  };
}

/** Pull a JSON object out of the model's text, tolerating stray prose or fences. */
function extractJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return JSON.parse(fenced[1].trim());
    const obj = content.match(/\{[\s\S]*\}/);
    if (obj) return JSON.parse(obj[0]);
    throw new Error("Could not parse plan from AI response");
  }
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate — never trust a client-supplied user id or profile.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit expensive generation per user.
    const limit = checkRateLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    // 3. Validate the request body (only the plan type comes from the client).
    const body = await req.json().catch(() => null);
    const parsedType = planTypeSchema.safeParse(body?.type);
    if (!parsedType.success) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 },
      );
    }
    const type = parsedType.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI generation is not configured on the server." },
        { status: 503 },
      );
    }

    // 4. Load the profile from the DB for the authenticated user.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "fitness_level, fitness_goal, workout_preference, available_time_minutes, age, weight_kg, height_cm, gender, dietary_preference",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Complete your profile before generating a plan." },
        { status: 400 },
      );
    }

    const dailyCalories =
      dailyCalorieTargetFromProfile(profile) ?? 2000;
    const prompts = buildPrompts(type, profile, dailyCalories);

    // 5. Call the model (Gemini, constrained to JSON output).
    const text = await geminiGenerate({
      apiKey,
      system: prompts.system,
      user: prompts.user,
      json: true,
      maxOutputTokens: 4000,
    });

    // 6. Validate the AI output before returning it.
    const raw = extractJson(text);
    const schema = type === "workout" ? workoutPlanSchema : mealPlanSchema;
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.error("AI response failed validation:", result.error.flatten());
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ plan: result.data });
  } catch (error) {
    console.error("Error in generate-plan route:", error);

    // Upstream AI failure — surface a friendly, actionable message. Overload
    // (503/429) is temporary; other statuses map to a generic failure.
    if (error instanceof GeminiError) {
      const overloaded = error.retryable;
      return NextResponse.json(
        {
          error: overloaded
            ? "The AI is busy right now (high demand). Please try again in a moment."
            : "AI generation failed. Please try again.",
        },
        { status: overloaded ? 503 : 502 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate plan";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
