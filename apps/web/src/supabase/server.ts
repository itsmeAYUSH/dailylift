import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@dailylift/env/web";
import type { Database } from "./types";

/**
 * Server Supabase client for React Server Components, route handlers, and
 * server actions. Reads/writes the session from Next.js cookies, so it shares
 * the same auth session as the browser client.
 *
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 * Always verify the user with `auth.getUser()` (not `getSession()`) on the
 * server — it re-validates the token against Supabase.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component. This can be ignored
            // when middleware is refreshing sessions (see middleware.ts).
          }
        },
      },
    },
  );
}

/**
 * Returns the authenticated user or `null`. Convenience wrapper used by route
 * handlers to gate access. Never trust a client-supplied user id — derive it
 * from here instead.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
