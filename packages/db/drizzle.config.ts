import type { Config } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

// Strip out pgbouncer parameter and use non-pooling port for migrations
const nonPoolingUrl = process.env.POSTGRES_URL.replace(
  ":6543",
  ":5432",
).replace(/[?&]pgbouncer=true/gi, "");

export default {
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: nonPoolingUrl },
  casing: "snake_case",
} satisfies Config;
