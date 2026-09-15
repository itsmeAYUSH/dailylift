import "@dailylift/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dailylift/ui"],
  poweredByHeader: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@dailylift/ui", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, private, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
