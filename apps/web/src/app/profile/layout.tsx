import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile & Fitness Preferences",
  description: "Manage your body statistics, training experience, fitness goals, and dietary preferences.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
