import "@dailylift/ui/globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { StructuredData } from "@/components/StructuredData";
import {
  SITE_CONFIG,
  getWebsiteSchema,
  getSoftwareAppSchema,
  getOrganizationSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: "DailyLift — Your AI-Powered Fitness Companion",
    template: "%s · DailyLift",
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.author, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.creator,
  publisher: SITE_CONFIG.creator,
  keywords: SITE_CONFIG.keywords,
  category: "Health & Fitness",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DailyLift — AI-Powered Workout & Meal Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: ["/og-image.png"],
    creator: "@dailylift",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e11" },
  ],
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
      <head>
        <StructuredData data={getWebsiteSchema()} />
        <StructuredData data={getSoftwareAppSchema()} />
        <StructuredData data={getOrganizationSchema()} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
