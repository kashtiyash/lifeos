import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  clerkFrontendApiOrigin,
  resolveCspMode,
  securityHeaders,
  CSP_HEADER_ENFORCE,
  CSP_HEADER_REPORT_ONLY,
} from "@/lib/security/headers";

const CLERK_KEY = `pk_test_${Buffer.from(
  "daring-fox-13.clerk.accounts.dev$",
).toString("base64url")}`;

function headerValue(
  headers: Array<{ key: string; value: string }>,
  key: string,
): string | undefined {
  return headers.find((header) => header.key === key)?.value;
}

describe("resolveCspMode", () => {
  it("defaults to report-only and only enforces when asked", () => {
    expect(resolveCspMode(undefined)).toBe("report-only");
    expect(resolveCspMode("")).toBe("report-only");
    expect(resolveCspMode("report-only")).toBe("report-only");
    expect(resolveCspMode("ENFORCE")).toBe("enforce");
    expect(resolveCspMode("off")).toBe("off");
    expect(resolveCspMode("nonsense")).toBe("report-only");
  });
});

describe("clerkFrontendApiOrigin", () => {
  it("decodes the frontend API host from the publishable key", () => {
    expect(clerkFrontendApiOrigin(CLERK_KEY)).toBe(
      "https://daring-fox-13.clerk.accounts.dev",
    );
  });

  it("returns null for missing or malformed keys", () => {
    expect(clerkFrontendApiOrigin(undefined)).toBeNull();
    expect(clerkFrontendApiOrigin("not-a-key")).toBeNull();
    expect(clerkFrontendApiOrigin("pk_test_@@@")).toBeNull();
  });
});

describe("buildContentSecurityPolicy", () => {
  it("starts from default-src 'self' and locks down dangerous directives", () => {
    const policy = buildContentSecurityPolicy({ clerkOrigin: null });
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("adds the exact Clerk origin and Turnstile when present", () => {
    const policy = buildContentSecurityPolicy({
      clerkOrigin: "https://daring-fox-13.clerk.accounts.dev",
    });
    expect(policy).toContain("https://daring-fox-13.clerk.accounts.dev");
    expect(policy).toContain("https://challenges.cloudflare.com");
  });

  it("relaxes eval and drops upgrade-insecure-requests in development", () => {
    const policy = buildContentSecurityPolicy({ isDev: true });
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("never falls back to a wildcard source", () => {
    expect(buildContentSecurityPolicy({ clerkOrigin: null })).not.toContain("*");
  });
});

describe("securityHeaders", () => {
  it("ships a report-only CSP by default with baseline hardening", () => {
    const headers = securityHeaders({ publishableKey: CLERK_KEY, isDev: false });
    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "X-Frame-Options")).toBe("DENY");
    expect(headerValue(headers, "Strict-Transport-Security")).toContain(
      "max-age=63072000",
    );
    expect(headerValue(headers, CSP_HEADER_ENFORCE)).toBeUndefined();
    expect(headerValue(headers, CSP_HEADER_REPORT_ONLY)).toContain(
      "daring-fox-13.clerk.accounts.dev",
    );
  });

  it("switches to the enforcing header when CSP_MODE=enforce", () => {
    const headers = securityHeaders({
      cspMode: "enforce",
      publishableKey: CLERK_KEY,
    });
    expect(headerValue(headers, CSP_HEADER_ENFORCE)).toBeTruthy();
    expect(headerValue(headers, CSP_HEADER_REPORT_ONLY)).toBeUndefined();
  });

  it("omits CSP entirely when CSP_MODE=off", () => {
    const headers = securityHeaders({ cspMode: "off" });
    expect(headerValue(headers, CSP_HEADER_ENFORCE)).toBeUndefined();
    expect(headerValue(headers, CSP_HEADER_REPORT_ONLY)).toBeUndefined();
    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
  });
});
