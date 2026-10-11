/**
 * Typed domain errors and the mapping from a thrown value to an HTTP result.
 *
 * Rules (docs/data-and-security.md, docs/architecture.md):
 * - Clients receive a stable machine `code`, a safe human `message`, and the
 *   `requestId` needed to find the matching server log line.
 * - Internals (stacks, causes, raw provider messages, SQL) never leave the
 *   server. Only errors explicitly marked `expose` surface their message.
 * - Anything that is not an {@link AppError} becomes an opaque `internal_error`
 *   so an unhandled bug cannot leak implementation detail.
 *
 * The module is framework-free and pure so it can be unit-tested and reused by
 * route handlers, server actions, and repositories alike.
 */

import { REQUEST_ID_HEADER } from "@/lib/observability/request-id";

export type ErrorCode =
  | "bad_request"
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "unsupported_media_type"
  | "rate_limited"
  | "internal_error";

export interface ErrorResponseBody {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    /** Optional, safe field-level detail (never PII, never internals). */
    details?: Record<string, unknown>;
  };
}

export interface AppErrorOptions {
  code: ErrorCode;
  status: number;
  /** Whether `message` is safe to return to the client. Defaults to false. */
  expose?: boolean;
  /** `Retry-After` hint in seconds for 429 responses. */
  retryAfterSeconds?: number;
  /** Safe, structured field errors (e.g. from schema validation). */
  details?: Record<string, unknown>;
  cause?: unknown;
}

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;
  readonly retryAfterSeconds?: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.status = options.status;
    this.expose = options.expose ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.details = options.details;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "The request is invalid.",
    details?: Record<string, unknown>,
  ) {
    super(message, { code: "validation_error", status: 400, expose: true, details });
  }
}

export class BadRequestError extends AppError {
  constructor(message = "The request could not be processed.") {
    super(message, { code: "bad_request", status: 400, expose: true });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in.") {
    super(message, { code: "unauthorized", status: 401, expose: true });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource.") {
    super(message, { code: "forbidden", status: 403, expose: true });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "That item could not be found.") {
    super(message, { code: "not_found", status: 404, expose: true });
  }
}

/** Stale `version` on an optimistic-concurrency update. */
export class ConflictError extends AppError {
  constructor(message = "This item changed since you loaded it.") {
    super(message, { code: "conflict", status: 409, expose: true });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "That file or request is too large.") {
    super(message, { code: "payload_too_large", status: 413, expose: true });
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = "That content type is not supported.") {
    super(message, { code: "unsupported_media_type", status: 415, expose: true });
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds = 60, message = "Too many requests. Slow down.") {
    super(message, {
      code: "rate_limited",
      status: 429,
      expose: true,
      retryAfterSeconds,
    });
  }
}

export class InternalError extends AppError {
  constructor(message = GENERIC_MESSAGE, cause?: unknown) {
    super(message, { code: "internal_error", status: 500, expose: false, cause });
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export interface HttpError {
  status: number;
  headers: Record<string, string>;
  body: ErrorResponseBody;
}

/**
 * Maps any thrown value to a safe HTTP result. Never includes a stack, cause,
 * or provider message in the body.
 */
export function toHttpError(error: unknown, requestId: string): HttpError {
  const appError = isAppError(error) ? error : new InternalError(undefined, error);

  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    [REQUEST_ID_HEADER]: requestId,
  };

  if (appError.retryAfterSeconds !== undefined) {
    headers["retry-after"] = String(appError.retryAfterSeconds);
  }

  return {
    status: appError.status,
    headers,
    body: {
      error: {
        code: appError.code,
        message: appError.expose ? appError.message : GENERIC_MESSAGE,
        requestId,
        ...(appError.expose && appError.details
          ? { details: appError.details }
          : {}),
      },
    },
  };
}

/** Web-standard JSON error response for route handlers and server actions. */
export function errorResponse(error: unknown, requestId: string): Response {
  const { status, headers, body } = toHttpError(error, requestId);
  return new Response(JSON.stringify(body), { status, headers });
}
