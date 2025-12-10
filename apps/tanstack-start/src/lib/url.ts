import { env } from "~/env";

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (env.BASE_URL) {
    return env.BASE_URL;
  }
  if (env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3001}`;
}
