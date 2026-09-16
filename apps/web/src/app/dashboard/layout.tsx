import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Dashboard — Today's Training, Nutrition & Consistency",
  description:
    "Your central DailyLift dashboard. View active training sessions, daily calorie targets, workout consistency streaks, and recent achievements.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
