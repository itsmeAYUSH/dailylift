import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Workout Logger & Progressive Overload Tracker",
  description:
    "Live workout tracking with intelligent progressive overload prompts, integrated rest timers, RPE logging, and performance comparison against previous sessions.",
  keywords: [
    "workout logger",
    "gym tracker",
    "progressive overload log",
    "weightlifting set tracker",
    "rest timer app",
    "RPE workout tracker",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/workouts`,
  },
  openGraph: {
    title: "Workout Logger & Progressive Overload Tracker | DailyLift",
    description:
      "Log your sets, reps, and weights with automated progressive overload suggestions and rest timers.",
    url: `${SITE_CONFIG.url}/workouts`,
  },
};

export default function WorkoutsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
