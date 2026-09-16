import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Meal Plans & Nutrition Tracker — Macro-Balanced Daily Diet",
  description:
    "AI-powered meal planning for fitness goals. Get full-day meal plans with calorie and macro targets tailored to vegetarian, vegan, non-vegetarian, or eggetarian diets.",
  keywords: [
    "AI meal planner",
    "fitness nutrition plan",
    "macro meal planner",
    "high protein diet plan",
    "vegetarian gym diet",
    "bodybuilding meal plan",
    "daily calorie tracker",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/meals`,
  },
  openGraph: {
    title: "AI Meal Plans & Nutrition Tracker | DailyLift",
    description:
      "Generate macro-balanced daily meal plans matching your caloric targets and dietary preferences.",
    url: `${SITE_CONFIG.url}/meals`,
  },
};

export default function MealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
