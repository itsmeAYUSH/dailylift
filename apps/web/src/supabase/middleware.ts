import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@dailylift/env/web";
import type { Database } from "./types";

/** Routes that require an authenticated user. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/workouts",
  "/plans",
  "/progress",
  "/nutrition",
  "/meals",
  "/exercises",
  "/ai-coach",
  "/profile",
  "/settings",
  "/onboarding",
];

/** Auth pages an already-signed-in user should be bounced away from. */
const AUTH_ROUTES = ["/auth"];

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * server-side auth redirects. Run from `middleware.ts`. This must return the
 * `supabaseResponse` object as-is (or a redirect that copies its cookies) so
 * the refreshed session is written back to the browser.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            }),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() re-validates the token — do not use getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  // Callback and password-reset routes live below /auth, but must remain
  // accessible after Supabase creates a recovery session.
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
