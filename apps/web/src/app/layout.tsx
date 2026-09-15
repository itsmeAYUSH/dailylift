import "@dailylift/ui/globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "DailyLift — Your AI-powered fitness companion",
    template: "%s · DailyLift",
  },
  description:
    "AI-generated workout and meal plans tailored to your goals, level, and schedule.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
