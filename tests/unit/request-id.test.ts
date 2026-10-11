import { describe, expect, it } from "vitest";

import {
  isValidRequestId,
  REQUEST_ID_HEADER,
  resolveRequestId,
} from "@/lib/observability/request-id";

describe("request ids", () => {
  it("exposes a stable header name", () => {
    expect(REQUEST_ID_HEADER).toBe("x-request-id");
  });

  it("accepts well-formed caller-supplied ids", () => {
    expect(isValidRequestId("abc12345")).toBe(true);
    expect(isValidRequestId("3f1c0e1e-6a1a-4d5e-9f00-2b3c4d5e6f70")).toBe(true);
    expect(resolveRequestId("abc12345")).toBe("abc12345");
  });

  it("rejects short, empty, or injected values", () => {
    expect(isValidRequestId("short")).toBe(false);
    expect(isValidRequestId("")).toBe(false);
    expect(isValidRequestId(null)).toBe(false);
    expect(isValidRequestId("has space")).toBe(false);
    expect(isValidRequestId('quote"injection')).toBe(false);
    expect(isValidRequestId("line\nbreak")).toBe(false);
  });

  it("mints a fresh id when the inbound value is unusable", () => {
    const generated = resolveRequestId("bad value");
    expect(generated).not.toBe("bad value");
    expect(isValidRequestId(generated)).toBe(true);
    expect(resolveRequestId(undefined)).not.toBe(generated);
  });
});
