/**
 * Central security headers and Content Security Policy.
 *
 * The policy starts from `default-src 'self'` and adds only the exact origins
 * the deployed app needs (Clerk's frontend API, Cloudflare Turnstile, Vercel
 * Web Analytics/Speed Insights). It ships as report-only first and flips to
 * enforcement via `CSP_MODE` once preview shows no violations (docs/operations.md).
 *
 * This module is framework-free and reads its inputs from `process.env` so it
 * can be called from `next.config.ts` at build time and unit-tested directly.
 */

export type CspMode = "off" | "report-only" | "enforce";

export interface SecurityHeader {
  key: string;
  value: string;
}

export const CSP_HEADER_ENFORCE = "Content-Security-Policy";
export const CSP_HEADER_REPORT_ONLY = "Content-Security-Policy-Report-Only";

/** Reads `CSP_MODE`, defaulting to report-only so we never enforce by accident. */
export function resolveCspMode(raw: string | undefined): CspMode {
  switch (raw?.trim().toLowerCase()) {
    case "off":
      return "off";
    case "enforce":
      return "enforce";
    case "report-only":
    case undefined:
    case "":
      return "report-only";
    default:
      return "report-only";
  }
}

function decodeBase64Url(input: string): string | null {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    return atob(padded);
  } catch {
    return null;
  }
}

/**
 * Extracts the exact Clerk frontend API origin from a publishable key.
 *
 * Clerk publishable keys encode `<frontend-api-host>$` as base64url, e.g.
 * `pk_test_<base64>`. Returns e.g. `https://daring-fox-13.clerk.accounts.dev`,
 * or `null` when the key is missing or not in the expected shape.
 */
export function clerkFrontendApiOrigin(
  publishableKey: string | null | undefined,
): string | null {
  if (!publishableKey) return null;
  const match = /^pk_(?:test|live)_(.+)$/.exec(publishableKey.trim());
  if (!match) return null;

  const decoded = decodeBase64Url(match[1]);
  if (!decoded) return null;

  const host = decoded.replace(/\$$/, "").trim().toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(host) || host.length > 253) return null;

  return `https://${host}`;
}

/** Builds the CSP directive string. Pure so it can be asserted in tests. */
export function buildContentSecurityPolicy(options: {
  clerkOrigin?: string | null;
  isDev?: boolean;
} = {}): string {
  const { clerkOrigin, isDev = false } = options;
  const join = (values: Array<string | null | undefined>) =>
    values.filter((value): value is string => Boolean(value)).join(" ");

  const directives: string[] = [
    "default-src 'self'",
    `script-src ${join([
      "'self'",
      "'unsafe-inline'",
      clerkOrigin,
      "https://challenges.cloudflare.com",
      "https://va.vercel-scripts.com",
      isDev ? "'unsafe-eval'" : null,
    ])}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${join([
      "'self'",
      "data:",
      "blob:",
      "https://img.clerk.com",
      "https://images.clerk.dev",
    ])}`,
    "font-src 'self' data:",
    `connect-src ${join([
      "'self'",
      clerkOrigin,
      "https://clerk-telemetry.com",
      "https://vitals.vercel-insights.com",
    ])}`,
    "media-src 'self'",
    `frame-src ${join([clerkOrigin, "https://challenges.cloudflare.com"])}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${join(["'self'", clerkOrigin])}`,
    "frame-ancestors 'none'",
  ];

  if (!isDev) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}

/**
 * The full header set applied to every response. CSP is included unless
 * `CSP_MODE=off`; the header name depends on the mode.
 */
export function securityHeaders(
  env: {
    cspMode?: string;
    publishableKey?: string;
    isDev?: boolean;
  } = {},
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
  ];

  const mode = resolveCspMode(env.cspMode ?? process.env.CSP_MODE);
  if (mode === "off") return headers;

  const policy = buildContentSecurityPolicy({
    clerkOrigin: clerkFrontendApiOrigin(
      env.publishableKey ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    isDev: env.isDev ?? process.env.NODE_ENV !== "production",
  });

  headers.push({
    key: mode === "enforce" ? CSP_HEADER_ENFORCE : CSP_HEADER_REPORT_ONLY,
    value: policy,
  });

  return headers;
}
