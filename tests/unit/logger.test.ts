import { describe, expect, it } from "vitest";

import {
  createLogger,
  isSensitiveKey,
  sanitizeFields,
  serializeError,
  type LogLevel,
} from "@/lib/observability/logger";

function capture() {
  const lines: Array<{ level: LogLevel; record: Record<string, unknown> }> = [];
  const sink = (line: string, level: LogLevel) => {
    lines.push({ level, record: JSON.parse(line) as Record<string, unknown> });
  };
  return { lines, sink };
}

describe("log redaction", () => {
  it("treats credential and private-content keys as sensitive", () => {
    for (const key of [
      "password",
      "CLERK_SECRET_KEY",
      "authorization",
      "sessionId",
      "apiKey",
      "userEmail",
      "noteContent",
      "fileContents",
      "requestBody",
    ]) {
      expect(isSensitiveKey(key), key).toBe(true);
    }
    expect(isSensitiveKey("requestId")).toBe(false);
    expect(isSensitiveKey("statusCode")).toBe(false);
  });

  it("redacts sensitive keys at any depth", () => {
    const sanitized = sanitizeFields({
      requestId: "abc12345",
      user: { email: "person@example.com", token: "secret-value" },
      noteContent: "my private note",
    });

    expect(sanitized.requestId).toBe("abc12345");
    expect(sanitized.user).toEqual({ email: "[redacted]", token: "[redacted]" });
    expect(sanitized.noteContent).toBe("[redacted]");
    expect(JSON.stringify(sanitized)).not.toContain("person@example.com");
    expect(JSON.stringify(sanitized)).not.toContain("private note");
  });

  it("truncates oversized strings and handles cycles", () => {
    const long = "x".repeat(2000);
    const cyclical: Record<string, unknown> = { name: "cycle" };
    cyclical.self = cyclical;

    const sanitized = sanitizeFields({ long, cyclical });
    expect((sanitized.long as string).length).toBeLessThan(600);
    expect((sanitized.long as string)).toContain("[truncated]");
    expect((sanitized.cyclical as Record<string, unknown>).self).toBe("[circular]");
  });

  it("serializes errors without leaking anything but a bounded stack", () => {
    const error = new Error("database connection refused");
    const serialized = serializeError(error);
    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe("database connection refused");
    expect(typeof serialized.stack).toBe("string");
  });
});

describe("logger", () => {
  it("emits a structured JSON line with the request id", () => {
    const { lines, sink } = capture();
    const logger = createLogger({ requestId: "abc12345" }, { level: "info", sink });

    logger.info("task.created", { taskId: "t1" });

    expect(lines).toHaveLength(1);
    expect(lines[0].level).toBe("info");
    expect(lines[0].record).toMatchObject({
      level: "info",
      msg: "task.created",
      requestId: "abc12345",
      taskId: "t1",
    });
    expect(typeof lines[0].record.time).toBe("string");
  });

  it("drops lines below the configured level", () => {
    const { lines, sink } = capture();
    const logger = createLogger({}, { level: "warn", sink });
    logger.debug("noise");
    logger.info("noise");
    logger.warn("kept");
    logger.error("kept", { error: new Error("boom") });

    expect(lines.map((line) => line.level)).toEqual(["warn", "error"]);
  });

  it("redacts sensitive fields before they reach the sink", () => {
    const { lines, sink } = capture();
    const logger = createLogger({}, { level: "info", sink });
    logger.error("upload.failed", {
      error: new Error("boom"),
      email: "person@example.com",
    });

    const rendered = JSON.stringify(lines[0].record);
    expect(rendered).toContain("[redacted]");
    expect(rendered).not.toContain("person@example.com");
  });

  it("binds child fields", () => {
    const { lines, sink } = capture();
    const logger = createLogger({}, { level: "info", sink }).child({
      requestId: "child-1",
    });
    logger.info("hello");
    expect(lines[0].record.requestId).toBe("child-1");
  });
});
