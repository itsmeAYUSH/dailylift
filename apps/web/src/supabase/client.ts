import { createBrowserClient } from "@supabase/ssr";
import { env } from "@dailylift/env/web";
import type { Database } from "./types";

/**
 * Browser Supabase client. Safe to import from client components; session is
 * persisted via cookies so it survives reloads and SSR.
 *
 *   import { supabase } from "@/supabase/client";
 */
export const supabase = createBrowserClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
);
