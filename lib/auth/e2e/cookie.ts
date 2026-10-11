/**
 * Cookie transport for the test-auth adapter.
 *
 * The signed-in test user is carried in a single, non-secret cookie. Reading it
 * goes through {@link resolveE2ECookieUserId}, which only accepts a value in the
 * test-user registry — an unknown or tampered value is treated as signed out.
 *
 * Pure and framework-free so it can be unit-tested; the route handler and the
 * server session helper pass the cookie value in from `next/headers`.
 */

import { findE2ETestUser } from "@/lib/auth/e2e/users";
import type { EnvLike } from "@/lib/auth/e2e/config";

export const E2E_AUTH_COOKIE = "lifeos_e2e_user";

/** Matches the subset of `next/headers` cookie options the adapter relies on. */
export interface E2ECookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
}

/**
 * Cookie flags. `SameSite=Lax` blocks cross-site posts; `httpOnly` keeps the
 * value out of client JavaScript. `secure` follows the environment so local
 * HTTP tests still work, while any HTTPS test deployment sends it encrypted.
 */
export function e2eAuthCookieOptions(
  env: EnvLike = process.env,
): E2ECookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  };
}

/**
 * Maps a raw cookie value to a registered test-user ID, or `null` when the
 * cookie is absent, empty, or not a known test user.
 */
export function resolveE2ECookieUserId(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  return findE2ETestUser(raw)?.id ?? null;
}
