/**
 * Gate for the secret-free test-auth adapter used by end-to-end tests.
 *
 * The adapter exists so Playwright can exercise signed-in flows in CI without
 * any Clerk secret (`docs/github-and-ci.md`). It is deliberately fail-closed:
 *
 * - It activates only when `E2E_TEST_AUTH=1` **and** the process is not running
 *   a production build. `next build`/`next start` set `NODE_ENV=production`, so
 *   a deployed build always falls back to real Clerk verification.
 * - {@link assertE2ETestAuthConfig} turns the misconfiguration
 *   `E2E_TEST_AUTH=1` in production into a loud startup/build failure instead of
 *   silently ignoring it.
 *
 * This module is framework-free and reads plain environment objects so it can
 * be unit-tested and called from `next.config.ts`, the proxy, route handlers,
 * and server components alike.
 */

export const E2E_TEST_AUTH_ENV = "E2E_TEST_AUTH";

/** A minimal environment view: anything `process.env`-like. */
export type EnvLike = Record<string, string | undefined>;

const ENABLED = "1";

/** Whether the test-auth adapter should be used for this process. */
export function isE2ETestAuthEnabled(env: EnvLike = process.env): boolean {
  return env[E2E_TEST_AUTH_ENV] === ENABLED && env.NODE_ENV !== "production";
}

/**
 * Refuses to run when the adapter is requested in production. Call this once at
 * startup (for example from `next.config.ts`) so a bad environment fails loudly
 * rather than shipping a trust-the-cookie auth path.
 */
export function assertE2ETestAuthConfig(env: EnvLike = process.env): void {
  if (env[E2E_TEST_AUTH_ENV] === ENABLED && env.NODE_ENV === "production") {
    throw new Error(
      `${E2E_TEST_AUTH_ENV} must never be enabled in production. ` +
        "The test-auth adapter is disabled outside development and test.",
    );
  }
}
