import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated environment for the web app. Client vars must be prefixed
 * `NEXT_PUBLIC_` to be inlined into the browser bundle; server vars stay
 * server-only and are read inside route handlers.
 */
export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url()
      .default("http://localhost:3000"),
  },
  server: {
    /** Google Gemini API key used by the `/api/generate-plan` route handler. */
    GEMINI_API_KEY: z.string().min(1).optional(),
    /**
     * Supabase service-role (secret) key. Server-only — used for privileged
     * operations like seeding the exercise library. Never expose to the client.
     */
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  },
  emptyStringAsUndefined: true,
});
