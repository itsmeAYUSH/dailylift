import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@dailylift/env/web";
import type { Database } from "./types";

/**
 * Privileged service-role client — **server-only**. Bypasses RLS, so never
 * import this from a client component and never use it to serve user data
 * without checking ownership yourself. Intended for admin tasks such as seeding
 * the shared exercise library.
 *
 * Throws if `SUPABASE_SECRET_KEY` is not configured.
 */
export function createAdminClient() {
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not configured — required for the admin client.",
    );
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
