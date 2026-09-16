import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { CALCULATOR_FAQS, getFAQSchema, SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Health & Fitness Calculators — BMR, TDEE, Body Fat, BMI & Water",
  description:
    "Free clinical fitness calculators. Calculate your BMR with the Mifflin-St Jeor formula, find your TDEE daily calorie goal, estimate body fat % with the U.S. Navy method, BMI, and daily water needs.",
  keywords: [
    "BMR calculator",
    "TDEE calculator",
    "daily calorie calculator",
    "Mifflin-St Jeor formula",
    "Navy body fat calculator",
    "BMI calculator",
    "water intake calculator",
    "macro calculator",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/calculators`,
  },
  openGraph: {
    title: "Health & Fitness Calculators — BMR, TDEE, Body Fat & BMI | DailyLift",
    description:
      "Accurate scientific fitness calculators for Basal Metabolic Rate, daily calorie needs, U.S. Navy body fat percentage, BMI, and hydration.",
    url: `${SITE_CONFIG.url}/calculators`,
  },
};

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={getFAQSchema(CALCULATOR_FAQS)} />
      {children}
    </>
  );
}
