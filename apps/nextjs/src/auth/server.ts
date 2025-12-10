import "server-only";

import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";

import { initAuth } from "@ogm/auth";

import { env } from "~/env";

const getBaseUrl = () => {
  if (env.BASE_URL) return env.BASE_URL;
  if (env.RAILWAY_PUBLIC_DOMAIN) return `https://${env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
};

const baseUrl = getBaseUrl();

export const auth = initAuth({
  baseUrl,
  productionUrl: env.BASE_URL ?? "https://turbo.t3.gg",
  secret: env.AUTH_SECRET,
  extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
