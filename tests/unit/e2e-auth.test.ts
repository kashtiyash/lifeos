import { describe, expect, it } from "vitest";

import {
  assertE2ETestAuthConfig,
  isE2ETestAuthEnabled,
} from "@/lib/auth/e2e/config";
import {
  e2eAuthCookieOptions,
  resolveE2ECookieUserId,
} from "@/lib/auth/e2e/cookie";
import { E2E_TEST_USERS, findE2ETestUser } from "@/lib/auth/e2e/users";

const [alice, bob] = E2E_TEST_USERS;

describe("isE2ETestAuthEnabled", () => {
  it("enables only when explicitly requested outside production", () => {
    expect(isE2ETestAuthEnabled({ E2E_TEST_AUTH: "1", NODE_ENV: "test" })).toBe(
      true,
    );
    expect(
      isE2ETestAuthEnabled({ E2E_TEST_AUTH: "1", NODE_ENV: "development" }),
    ).toBe(true);
  });

  it("stays disabled in production even when requested", () => {
    expect(
      isE2ETestAuthEnabled({ E2E_TEST_AUTH: "1", NODE_ENV: "production" }),
    ).toBe(false);
  });

  it("stays disabled without the exact opt-in value", () => {
    expect(isE2ETestAuthEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(isE2ETestAuthEnabled({ E2E_TEST_AUTH: "true", NODE_ENV: "test" })).toBe(
      false,
    );
    expect(isE2ETestAuthEnabled({ E2E_TEST_AUTH: "", NODE_ENV: "test" })).toBe(
      false,
    );
    expect(isE2ETestAuthEnabled({})).toBe(false);
  });
});

describe("assertE2ETestAuthConfig", () => {
  it("refuses to run with the adapter enabled in production", () => {
    expect(() =>
      assertE2ETestAuthConfig({
        E2E_TEST_AUTH: "1",
        NODE_ENV: "production",
      }),
    ).toThrow(/production/i);
  });

  it("allows non-production runs and unconfigured production", () => {
    expect(() =>
      assertE2ETestAuthConfig({ E2E_TEST_AUTH: "1", NODE_ENV: "development" }),
    ).not.toThrow();
    expect(() =>
      assertE2ETestAuthConfig({ NODE_ENV: "production" }),
    ).not.toThrow();
  });
});

describe("test-user registry", () => {
  it("resolves only registered users", () => {
    expect(findE2ETestUser(alice.id)?.id).toBe(alice.id);
    expect(findE2ETestUser(bob.id)?.id).toBe(bob.id);
    expect(findE2ETestUser("user_e2e_forged")).toBeNull();
    expect(findE2ETestUser("")).toBeNull();
    expect(findE2ETestUser(null)).toBeNull();
    expect(findE2ETestUser(undefined)).toBeNull();
  });

  it("maps a raw cookie value to a registered user or null", () => {
    expect(resolveE2ECookieUserId(alice.id)).toBe(alice.id);
    expect(resolveE2ECookieUserId("user_e2e_forged")).toBeNull();
    expect(resolveE2ECookieUserId(undefined)).toBeNull();
  });
});

describe("e2eAuthCookieOptions", () => {
  it("is httpOnly, lax, and not secure outside production", () => {
    const options = e2eAuthCookieOptions({ NODE_ENV: "development" });
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.secure).toBe(false);
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it("sets secure when running a production process", () => {
    expect(e2eAuthCookieOptions({ NODE_ENV: "production" }).secure).toBe(true);
  });
});
