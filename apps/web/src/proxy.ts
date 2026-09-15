import type { NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";

/**
 * Next.js 16 proxy (formerly "middleware"). Runs before every matched request
 * to refresh the Supabase session cookie and enforce auth redirects.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Run on every route except Next.js internals and static assets. This keeps
   * the Supabase session fresh and enforces auth redirects app-wide.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
