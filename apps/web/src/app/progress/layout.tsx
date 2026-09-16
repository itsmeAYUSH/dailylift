import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Fitness Progress, Weight Tracking & Personal Records",
  description:
    "Track your fitness journey with body weight moving averages, workout volume charts, and personal records (PRs) across compound lifts.",
  keywords: [
    "fitness progress tracker",
    "body weight chart",
    "personal records tracker",
    "1RM tracker",
    "workout volume graph",
    "strength progression chart",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/progress`,
  },
  openGraph: {
    title: "Fitness Progress & Personal Records | DailyLift",
    description:
      "Visualize your weight trends, training volume, and strength milestones over time.",
    url: `${SITE_CONFIG.url}/progress`,
  },
};

export default function ProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
