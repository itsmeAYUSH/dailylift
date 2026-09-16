import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Exercise Library & Form Guide — Muscle Groups, Cues & Variations",
  description:
    "Comprehensive exercise database for strength and hypertrophy. Filter exercises by targeted muscle (chest, back, shoulders, arms, legs, core) and equipment (gym, home, dumbbells, bodyweight).",
  keywords: [
    "exercise library",
    "gym exercises database",
    "muscle group workouts",
    "dumbbell exercises",
    "bodyweight exercises",
    "chest exercises",
    "back exercises",
    "leg day workout",
    "exercise form guide",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises`,
  },
  openGraph: {
    title: "Exercise Library & Form Guide | DailyLift",
    description:
      "Explore hundreds of resistance training exercises with form cues, muscle targets, and equipment filters.",
    url: `${SITE_CONFIG.url}/exercises`,
  },
};

export default function ExercisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
