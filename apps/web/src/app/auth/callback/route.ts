import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@dailylift/env/web";
import type { Database } from "@/supabase/types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // Handle OAuth provider error (e.g. user cancelled)
  if (error) {
    const redirectUrl = new URL("/auth", origin);
    redirectUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    let redirectUrl = new URL(destination, origin);
    let response = NextResponse.redirect(redirectUrl);

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
            response = NextResponse.redirect(redirectUrl);
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
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

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data?.user) {
      // Check if user has completed onboarding
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", data.user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          const onboardingUrl = new URL("/onboarding", origin);
          const onboardingResponse = NextResponse.redirect(onboardingUrl);
          response.cookies.getAll().forEach((c) => {
            onboardingResponse.cookies.set(c.name, c.value, c);
          });
          return onboardingResponse;
        }
      } catch {
        // Continue to destination
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
      if (forwardedHost && !isLocalhost) {
        const fwdResponse = NextResponse.redirect(`https://${forwardedHost}${destination}`);
        response.cookies.getAll().forEach((c) => {
          fwdResponse.cookies.set(c.name, c.value, c);
        });
        return fwdResponse;
      }

      return response;
    }

    // Exchange error: redirect to auth screen with descriptive error
    const errorRedirect = new URL("/auth", origin);
    errorRedirect.searchParams.set(
      "error",
      exchangeError?.message || "Authentication failed. Please try again."
    );
    return NextResponse.redirect(errorRedirect);
  }

  return NextResponse.redirect(new URL("/auth", origin));
}
