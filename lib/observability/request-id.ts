/**
 * Privacy-safe request identifiers.
 *
 * A request ID is an opaque correlation token, never a user identifier. We
 * accept a caller-supplied `x-request-id` only when it already looks like
 * something we could have generated ourselves; otherwise we mint a fresh one.
 * That keeps arbitrary client-controlled strings out of our logs and response
 * headers (see `docs/operations.md`).
 */

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Matches the UUIDs we generate plus a conservative set of IDs produced by
 * proxies and tests. Deliberately excludes whitespace, quotes, and anything
 * that could be used to inject into a log line or header.
 */
const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/;

export function isValidRequestId(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && VALID_REQUEST_ID.test(value);
}

function randomId(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }
  // Fallback for runtimes without Web Crypto. Still opaque and unguessable
  // enough for correlation; never used for authorization.
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Returns the caller-supplied request ID when it is safe to echo, otherwise a
 * new random ID. Never throws and never returns an empty string.
 */
export function resolveRequestId(incoming: string | null | undefined): string {
  return isValidRequestId(incoming) ? incoming : randomId();
}
