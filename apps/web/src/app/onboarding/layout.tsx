import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalized Setup — Build Your AI Fitness Profile",
  description:
    "Complete your quick 2-minute fitness onboarding to generate custom workout splits and daily meal plans.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
