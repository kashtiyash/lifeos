/**
 * The only identities the test-auth adapter can mint.
 *
 * E2E flows need more than one account (cross-user isolation, "switch user"),
 * but the adapter must never act as an arbitrary Clerk subject. Restricting it
 * to a small, explicit registry means a forged cookie value that is not a known
 * test user resolves to "signed out" instead of an attacker-chosen account.
 *
 * IDs are prefixed `user_e2e_` so they are visually distinct from real Clerk
 * IDs in test output and the (disposable) test database. The adapter never runs
 * in production (see `config.ts`), so these values cannot collide with real
 * accounts.
 */

export interface E2ETestUser {
  /** Stable opaque ID used as the database `app_users` key in tests. */
  id: string;
  /** Display name shown in the account menu. */
  name: string;
}

export const E2E_TEST_USERS: readonly E2ETestUser[] = [
  { id: "user_e2e_alice", name: "Alice (E2E)" },
  { id: "user_e2e_bob", name: "Bob (E2E)" },
];

export const E2E_TEST_USER_ID_PATTERN = /^user_e2e_[a-z0-9_]+$/;

const BY_ID = new Map(E2E_TEST_USERS.map((user) => [user.id, user]));

/** Returns the registered test user for `id`, or `null` when unknown. */
export function findE2ETestUser(
  id: string | null | undefined,
): E2ETestUser | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

/** Convenience guard for callers that only need a yes/no answer. */
export function isE2ETestUserId(id: string | null | undefined): boolean {
  return findE2ETestUser(id) !== null;
}
