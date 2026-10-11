import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isE2ETestAuthEnabled } from "@/lib/auth/e2e/config";
import {
  REQUEST_ID_HEADER,
  resolveRequestId,
} from "@/lib/observability/request-id";
import { formatServerTiming } from "@/lib/observability/timing";

// Next.js 16 renamed middleware to Proxy. Route protection here is a UX layer
// only. The real security boundary is the server-side session check in the
// protected layout (`app/(app)/layout.tsx`) and in every protected server
// operation, so no path-matching route matcher is used.
//
// Every request also gets a privacy-safe ID: we accept a well-formed inbound
// `x-request-id` (e.g. from a proxy or a browser retry) or mint one, forward it
// to the server via request headers, and echo it back on the response so a
// client error can be matched to its server log line (docs/operations.md).
function withRequestMetadata(request: NextRequest): NextResponse {
  const startedAt = performance.now();
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set(
    "Server-Timing",
    formatServerTiming([
      { name: "proxy", durationMs: performance.now() - startedAt },
    ]),
  );

  return response;
}

// Real identity verification: load and refresh the Clerk session.
const clerkProxy = clerkMiddleware(async (_auth, request) =>
  withRequestMetadata(request),
);

// Secret-free test mode: Clerk is not configured, so skip it entirely and keep
// only the request observability. Enabled only outside production
// (lib/auth/e2e/config.ts).
const testAuthProxy = (request: NextRequest) => withRequestMetadata(request);

const proxy = isE2ETestAuthEnabled() ? testAuthProxy : clerkProxy;

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes.
    "/__clerk/(.*)",
  ],
};
