import { describe, expect, it } from "vitest";

import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
  errorResponse,
  isAppError,
  toHttpError,
} from "@/lib/errors";

const REQUEST_ID = "3f1c0e1e-6a1a-4d5e-9f00-2b3c4d5e6f70";

describe("typed errors", () => {
  it("maps common cases to stable codes and statuses", () => {
    expect(toHttpError(new ValidationError("bad input"), REQUEST_ID)).toMatchObject({
      status: 400,
      body: { error: { code: "validation_error", message: "bad input" } },
    });
    expect(toHttpError(new UnauthorizedError(), REQUEST_ID).status).toBe(401);
    expect(toHttpError(new ForbiddenError(), REQUEST_ID).status).toBe(403);
    expect(toHttpError(new NotFoundError(), REQUEST_ID).status).toBe(404);
    expect(toHttpError(new ConflictError(), REQUEST_ID).status).toBe(409);
    expect(toHttpError(new RateLimitError(), REQUEST_ID).status).toBe(429);
  });

  it("always echoes the request id and number headers", () => {
    const result = toHttpError(new InternalError(), REQUEST_ID);
    expect(result.body.error.requestId).toBe(REQUEST_ID);
    expect(result.headers["x-request-id"]).toBe(REQUEST_ID);
    expect(result.headers["content-type"]).toContain("application/json");
  });

  it("adds a Retry-After hint for rate limits", () => {
    const result = toHttpError(new RateLimitError(30), REQUEST_ID);
    expect(result.headers["retry-after"]).toBe("30");
  });

  it("never exposes internals for server errors", () => {
    const result = toHttpError(
      new InternalError("token=super-secret crashed"),
      REQUEST_ID,
    );
    const rendered = JSON.stringify(result.body);
    expect(result.body.error.code).toBe("internal_error");
    expect(result.body.error.message).toBe("Something went wrong. Please try again.");
    expect(rendered).not.toContain("super-secret");
    expect(rendered).not.toContain("stack");
  });

  it("converts unknown thrown values into an opaque internal error", () => {
    const result = toHttpError({ sql: "select * from secrets" }, REQUEST_ID);
    expect(result.status).toBe(500);
    expect(JSON.stringify(result.body)).not.toContain("select * from secrets");
  });

  it("only includes validation details when the message is exposed", () => {
    const exposed = toHttpError(
      new ValidationError("bad input", { title: "Required" }),
      REQUEST_ID,
    );
    expect(exposed.body.error.details).toEqual({ title: "Required" });

    const hidden = toHttpError(
      new AppError("hidden", {
        code: "internal_error",
        status: 500,
        details: { secret: true },
      }),
      REQUEST_ID,
    );
    expect(hidden.body.error.details).toBeUndefined();
  });

  it("recognizes AppError instances", () => {
    expect(isAppError(new NotFoundError())).toBe(true);
    expect(isAppError(new Error("plain"))).toBe(false);
  });
});

describe("errorResponse", () => {
  it("returns a JSON Response with the request id header", async () => {
    const response = errorResponse(new NotFoundError(), REQUEST_ID);
    expect(response.status).toBe(404);
    expect(response.headers.get("x-request-id")).toBe(REQUEST_ID);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "not_found", requestId: REQUEST_ID },
    });
  });
});
