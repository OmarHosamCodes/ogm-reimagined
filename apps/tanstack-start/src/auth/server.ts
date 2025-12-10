import { reactStartCookies } from "better-auth/react-start";

import { initAuth } from "@ogm/auth";

import { env } from "~/env";
import { getBaseUrl } from "~/lib/url";

export const auth = initAuth({
  baseUrl: getBaseUrl(),
  productionUrl: env.BASE_URL ?? "https://turbo.t3.gg",
  secret: env.AUTH_SECRET,
  extraPlugins: [reactStartCookies()],
});
