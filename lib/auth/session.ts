/**
 * Server-side session resolution.
 *
 * This is the single seam every protected server operation uses to learn *who*
 * is calling. In production it returns only the subject of a verified Clerk
 * session. When the secret-free test-auth adapter is active it reads the test
 * cookie instead (see `lib/auth/e2e/`).
 *
 * Callers must never accept an account ID from form data, query parameters, or
 * client state — only from this module (docs/architecture.md, ticket I-2).
 */

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { isE2ETestAuthEnabled } from "@/lib/auth/e2e/config";
import {
  E2E_AUTH_COOKIE,
  resolveE2ECookieUserId,
} from "@/lib/auth/e2e/cookie";
import { findE2ETestUser } from "@/lib/auth/e2e/users";

export type SessionSource = "clerk" | "e2e";

export interface Session {
  /** Opaque account ID (Clerk subject, or a registered test-user ID). */
  userId: string;
  /** Which verifier produced the session. Diagnostics and UI-only. */
  source: SessionSource;
  /** Display name when the adapter can provide one without a provider call. */
  name?: string;
}

/**
 * Resolves the current session, or `null` when the caller is signed out.
 * Never throws for a missing session.
 */
export async function getSession(): Promise<Session | null> {
  if (isE2ETestAuthEnabled()) {
    const cookieStore = await cookies();
    const userId = resolveE2ECookieUserId(
      cookieStore.get(E2E_AUTH_COOKIE)?.value,
    );
    if (!userId) return null;
    const user = findE2ETestUser(userId);
    return { userId, source: "e2e", ...(user ? { name: user.name } : {}) };
  }

  const { userId } = await auth();
  return userId ? { userId, source: "clerk" } : null;
}

/** The verified account ID, or `null` when signed out. */
export async function getCurrentUserId(): Promise<string | null> {
  return (await getSession())?.userId ?? null;
}
