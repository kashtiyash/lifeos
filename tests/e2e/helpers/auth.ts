import { expect, type BrowserContext, type Page } from "@playwright/test";

import { E2E_AUTH_COOKIE } from "@/lib/auth/e2e/cookie";
import { E2E_TEST_USERS } from "@/lib/auth/e2e/users";

/**
 * Helpers for the secret-free test-auth adapter.
 *
 * Playwright is started by `playwright.config.ts` with `E2E_TEST_AUTH=1`, so the
 * app verifies sessions from the test cookie instead of Clerk. These helpers set
 * and clear that cookie directly; `auth.spec.ts` also covers the sign-in UI and
 * the `/api/e2e/auth` route.
 */

export const TEST_AUTH_ENABLED = process.env.E2E_TEST_AUTH === "1";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

export const ALICE = E2E_TEST_USERS[0];
export const BOB = E2E_TEST_USERS[1];

/**
 * Sets the session cookie as `userId`. Unknown IDs are intentionally accepted
 * here (the server treats them as signed out) so tests can prove forged values
 * do not authenticate.
 */
export async function setTestUser(
  context: BrowserContext,
  userId: string,
): Promise<void> {
  await context.addCookies([
    {
      name: E2E_AUTH_COOKIE,
      value: userId,
      url: BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

export async function clearTestUser(context: BrowserContext): Promise<void> {
  await context.clearCookies({ name: E2E_AUTH_COOKIE });
}

/** Signs in through the real route handler, as a browser would. */
export async function signInViaApi(page: Page, userId: string): Promise<void> {
  const response = await page.request.post("/api/e2e/auth", {
    data: { userId },
  });
  expect(response.ok()).toBeTruthy();
}

/** Signs out through the real route handler. */
export async function signOutViaApi(page: Page): Promise<void> {
  await page.request.delete("/api/e2e/auth");
}
