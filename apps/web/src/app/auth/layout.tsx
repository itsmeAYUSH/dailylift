import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign In or Create Account — DailyLift",
  description:
    "Sign in to your DailyLift account or create a free account to get AI-generated workout and meal plans tailored to your fitness goals.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/auth`,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
