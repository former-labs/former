import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().url(),
    SUPABASE_API_KEY: z.string(),
    VERVE_GA4_SERVICE_ACCOUNT_JSON_BASE64: z.string(),
    HELICONE_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    DB_COLUMN_ENCRYPTION_SECRET: z.string(),
    GOOGLE_OAUTH_REDIRECT_URI: z.string(),
    GOOGLE_OAUTH_CLIENT_ID: z.string(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
    OAUTH_CALLBACK_SECRET: z.string(),
    DASHBOARD_URI: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_API_KEY: process.env.SUPABASE_API_KEY,
    VERVE_GA4_SERVICE_ACCOUNT_JSON_BASE64:
      process.env.VERVE_GA4_SERVICE_ACCOUNT_JSON_BASE64,
    HELICONE_API_KEY: process.env.HELICONE_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DB_COLUMN_ENCRYPTION_SECRET: process.env.DB_COLUMN_ENCRYPTION_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    OAUTH_CALLBACK_SECRET: process.env.OAUTH_CALLBACK_SECRET,
    DASHBOARD_URI: process.env.DASHBOARD_URI,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
