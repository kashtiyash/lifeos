import { cookies } from "next/headers";
import { z } from "zod";

import { isE2ETestAuthEnabled } from "@/lib/auth/e2e/config";
import { E2E_AUTH_COOKIE, e2eAuthCookieOptions } from "@/lib/auth/e2e/cookie";
import { E2E_TEST_USERS, findE2ETestUser } from "@/lib/auth/e2e/users";
import { NotFoundError, ValidationError, errorResponse } from "@/lib/errors";
import {
  REQUEST_ID_HEADER,
  resolveRequestId,
} from "@/lib/observability/request-id";

/**
 * Sign-in/out endpoint for the secret-free test-auth adapter.
 *
 * This route is compiled into every build but only does anything when
 * {@link isE2ETestAuthEnabled} is true; otherwise it returns a plain 404, so a
 * production deployment can never mint a test session. It accepts only one of
 * the registered test users (`lib/auth/e2e/users.ts`).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signInSchema = z.object({
  userId: z.string().min(1).max(128),
});

function requestIdFor(request: Request): string {
  return resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
}

export async function POST(request: Request): Promise<Response> {
  const requestId = requestIdFor(request);
  if (!isE2ETestAuthEnabled()) {
    return errorResponse(new NotFoundError(), requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      new ValidationError("Expected a JSON body."),
      requestId,
    );
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      new ValidationError("A test userId is required."),
      requestId,
    );
  }

  const user = findE2ETestUser(parsed.data.userId);
  if (!user) {
    return errorResponse(
      new ValidationError("Unknown test user.", {
        allowed: E2E_TEST_USERS.map((candidate) => candidate.id),
      }),
      requestId,
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(E2E_AUTH_COOKIE, user.id, e2eAuthCookieOptions());

  return Response.json({ userId: user.id, name: user.name });
}

export async function DELETE(request: Request): Promise<Response> {
  const requestId = requestIdFor(request);
  if (!isE2ETestAuthEnabled()) {
    return errorResponse(new NotFoundError(), requestId);
  }

  const cookieStore = await cookies();
  cookieStore.delete(E2E_AUTH_COOKIE);

  return new Response(null, { status: 204 });
}
