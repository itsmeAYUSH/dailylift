import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "workout") {
      systemPrompt = `You are an expert fitness coach. Generate a detailed, personalized workout plan based on the user's profile. Be specific with exercises, sets, reps, and rest times. Include warm-up and cool-down. Format as JSON.`;
      
      userPrompt = `Create a workout plan for today for someone with:
- Fitness Level: ${profile.fitness_level}
- Goal: ${profile.fitness_goal?.replace('_', ' ')}
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
}`;
    } else if (type === "meal") {
      systemPrompt = `You are an expert nutritionist. Generate a detailed, personalized meal plan based on the user's profile and dietary preferences. Include exact portions, calories, and macros for each meal. Format as JSON.`;
      
      const dailyCalories = profile.daily_calories || 2000;
      
      userPrompt = `Create a full day meal plan for someone with:
- Goal: ${profile.fitness_goal?.replace('_', ' ')}
- Dietary Preference: ${profile.dietary_preference || 'non_vegetarian'}
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
}`;
    } else {
      throw new Error("Invalid plan type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate plan");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Extract JSON from the response
    let plan;
    try {
      // Try to parse directly
      plan = JSON.parse(content);
    } catch {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the response
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          plan = JSON.parse(objectMatch[0]);
        } else {
          throw new Error("Could not parse plan from AI response");
        }
      }
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-plan function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate plan";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
