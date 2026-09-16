import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Workout Plans & Splits — Push Pull Legs, Upper/Lower, Full Body",
  description:
    "Generate and manage intelligent training plans with AI. Build customized Push-Pull-Legs (PPL), Upper/Lower, or Full Body splits designed for your schedule and experience level.",
  keywords: [
    "AI workout generator",
    "workout plans",
    "push pull legs split",
    "upper lower routine",
    "hypertrophy plan",
    "strength training program",
    "custom gym routine",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/plans`,
  },
  openGraph: {
    title: "AI Workout Plans & Training Splits | DailyLift",
    description:
      "Generate custom workout plans based on your training days, equipment, and fitness level.",
    url: `${SITE_CONFIG.url}/plans`,
  },
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
