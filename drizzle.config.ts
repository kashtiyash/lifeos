import { defineConfig } from "drizzle-kit";

/**
 * Migration-only configuration. `DATABASE_URL_UNPOOLED` is the direct,
 * migration-role connection; never point this at the runtime role or at
 * production from a developer machine.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? "",
  },
});
