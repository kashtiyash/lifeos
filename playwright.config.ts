import { defineConfig, devices } from "@playwright/test";

// A managed E2E server never shares a port or build directory with a
// developer's `next dev`:
// - the dedicated port avoids a port clash;
// - `E2E_TEST_AUTH` makes next.config.ts pick the isolated `.next-e2e` distDir,
//   which sidesteps Next 16's one-dev-server-per-distDir lock.
const MANAGED_PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);

// When Playwright manages the app (no external PLAYWRIGHT_BASE_URL), start it in
// the secret-free test-auth mode so signed-in flows need no provider secrets
// (see lib/auth/e2e and docs/testing.md). An externally managed deployment must
// already have decided its own auth mode, so we leave it untouched.
const managesServer = !process.env.PLAYWRIGHT_BASE_URL;
if (managesServer && process.env.E2E_TEST_AUTH === undefined) {
  process.env.E2E_TEST_AUTH = "1";
}

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${MANAGED_PORT}`;

/** Re-spawn env for the dev server, dropping undefined entries. */
function serverEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

/**
 * Browser tests. The app is started/stopped automatically unless
 * `PLAYWRIGHT_BASE_URL` points at an already-running deployment. Failure
 * artifacts are bounded and uploaded by CI.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: managesServer
    ? {
        command: "npm run dev",
        url: baseURL,
        // Always start a fresh test-auth server rather than attaching to
        // whatever already listens on the port (which would be a normal Clerk
        // dev server, not in test-auth mode).
        reuseExistingServer: false,
        timeout: 120_000,
        env: { ...serverEnv(), PORT: String(MANAGED_PORT) },
      }
    : undefined,
});
