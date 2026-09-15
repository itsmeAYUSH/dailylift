import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// Long-form generation — keep this on the Node runtime, not edge.
export const runtime = "nodejs";
export const maxDuration = 60;

interface Profile {
  fitness_level?: string;
  fitness_goal?: string;
  workout_preference?: string;
  available_time_minutes?: number;
  age?: number;
  weight_kg?: number;
  dietary_preference?: string;
  daily_calories?: number;
}

function buildPrompts(type: string, profile: Profile) {
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

  if (type === "meal") {
    const dailyCalories = profile.daily_calories || 2000;
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

  return null;
}

/** Pull a JSON object out of the model's text, tolerating stray prose or fences. */
function parsePlan(content: string) {
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const { type, profile } = (await req.json()) as {
      type: string;
      profile: Profile;
    };

    const prompts = buildPrompts(type, profile);
    if (!prompts) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      system: prompts.system,
      messages: [{ role: "user", content: prompts.user }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { text: string }).text)
      .join("");

    const plan = parsePlan(text);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error in generate-plan route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate plan";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
