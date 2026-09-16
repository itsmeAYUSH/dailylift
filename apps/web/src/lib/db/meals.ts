import { supabase } from "@/supabase/client";
import { todayLocalISODate } from "@/lib/date";
import type { Json } from "@/supabase/types";
import type { MealPlan } from "@/lib/ai/schemas";

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You are signed out. Please sign in again.");
  return data.user.id;
}

/**
 * Persist a meal plan for a given day (defaults to today, local time). Upserts
 * on (user_id, plan_date) so regenerating replaces that day's plan instead of
 * piling up duplicates, and never touches another day's plan.
 */
export async function saveMealPlan(plan: MealPlan, planDate?: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("meal_plans").upsert(
    {
      user_id: userId,
      plan_data: plan as unknown as Json,
      plan_date: planDate ?? todayLocalISODate(),
    },
    { onConflict: "user_id,plan_date" },
  );
  if (error) throw error;
}

/** The user's most recent saved meal plan, if any (for refresh recovery). */
export async function fetchLatestMealPlan(): Promise<MealPlan | null> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("plan_data")
    .order("plan_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? (data.plan_data as unknown as MealPlan) : null;
}
