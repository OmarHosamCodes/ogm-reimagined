import { expo } from "@better-auth/expo";
import { db } from "@ogm/db/client";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;
  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    user: {
      additionalFields: {
        ghlGlobalUserId: {
          type: "string",
          required: false,
          unique: true,
        },
      },
    },
    plugins: [expo(), ...(options.extraPlugins ?? [])],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Disable for development
    },
    trustedOrigins: ["expo://"],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
