import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

import { authEnv } from "@ogm/auth/env";

export const env = createEnv({
  extends: [authEnv()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    POSTGRES_URL: z.url(),
    // Base URL for production deployment (Railway, etc.)
    BASE_URL: z.url().optional(),
    // Railway auto-injects this
    RAILWAY_PUBLIC_DOMAIN: z.string().optional(),
    // GHL Integration
    GHL_CLIENT_ID: z.string().min(1),
    GHL_CLIENT_SECRET: z.string().min(1),
    GHL_WEBHOOK_SECRET: z.string().min(1).optional(),
    // Supabase Storage (S3)
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    // Optional video hosting
    MUX_TOKEN_ID: z.string().optional(),
    MUX_TOKEN_SECRET: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_GHL_CLIENT_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_GHL_CLIENT_ID: process.env.NEXT_PUBLIC_GHL_CLIENT_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
