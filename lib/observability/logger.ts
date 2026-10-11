/**
 * Central structured logger.
 *
 * Every line is a single JSON object so Vercel request/function logs stay
 * queryable without a log pipeline. The logger is deliberately conservative:
 *
 * - Keys that look sensitive (passwords, tokens, cookies, emails, note/file
 *   content, …) are replaced with `[redacted]` before serialization.
 * - Long strings are truncated and deeply nested payloads are depth-limited so
 *   private notes or file contents can never be spilled wholesale.
 * - Error stacks are included, but never request or response bodies.
 *
 * The contract is "never log tokens, file contents, private notes, or
 * unnecessary personal data" (docs/architecture.md, docs/data-and-security.md).
 * The redactor is the enforcement point; keep it strict and covered by tests.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Returns a logger that merges `fields` into every subsequent line. */
  child(fields: LogFields): Logger;
}

export interface LoggerOptions {
  /** Minimum level to emit. Defaults to `LOG_LEVEL`, then `info` in production. */
  level?: LogLevel;
  /** Destination for serialized lines. Defaults to the console. */
  sink?: (line: string, level: LogLevel) => void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACTED = "[redacted]";
const UNSERIALIZABLE = "[unserializable]";
const MAX_STRING = 512;
const MAX_STACK = 4000;
const MAX_DEPTH = 4;
const MAX_ARRAY = 20;

/**
 * Keys whose values are never logged. Matched case-insensitively as a
 * substring, so `userEmail`, `noteContent`, and `authorizationHeader` all
 * match. Kept intentionally broad: a false positive only loses debug detail,
 * a false negative can leak private data.
 */
const SENSITIVE_KEY =
  /(pass(word|phrase)?|secret|token|authorization|cookie|api[-_]?key|session[-_]?id|signature|credential|private[-_]?key|email|phone|address|ssn|dob|birth|note|content|attachment|file|body)/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

function normalizeLevel(value: string | undefined): LogLevel | null {
  if (!value) return null;
  const candidate = value.toLowerCase();
  return candidate in LEVEL_ORDER ? (candidate as LogLevel) : null;
}

function resolveDefaultLevel(): LogLevel {
  const fromEnv = normalizeLevel(process.env.LOG_LEVEL);
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function defaultSink(line: string, level: LogLevel): void {
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}[truncated]` : value;
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  switch (typeof value) {
    case "string":
      return truncate(value, MAX_STRING);
    case "number":
    case "boolean":
      return value;
    case "bigint":
      return value.toString();
    case "undefined":
    case "function":
    case "symbol":
      return UNSERIALIZABLE;
    default:
      break;
  }

  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return serializeError(value);
  if (typeof value !== "object") return UNSERIALIZABLE;
  if (depth >= MAX_DEPTH) return "[max depth]";

  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const head = value
      .slice(0, MAX_ARRAY)
      .map((item) => sanitizeValue(item, depth + 1, seen));
    if (value.length > MAX_ARRAY) {
      head.push(`[+${value.length - MAX_ARRAY} more]`);
    }
    return head;
  }

  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    output[key] = isSensitiveKey(key)
      ? REDACTED
      : sanitizeValue(item, depth + 1, seen);
  }
  return output;
}

/** Redacts sensitive keys and bounds size. Exported for focused testing. */
export function sanitizeFields(fields: LogFields): Record<string, unknown> {
  return sanitizeValue(fields, 0, new WeakSet()) as Record<string, unknown>;
}

/** Converts any thrown value into a bounded, log-safe object. */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: truncate(error.message, MAX_STRING),
      ...(error.stack ? { stack: truncate(error.stack, MAX_STACK) } : {}),
      ...(error.cause !== undefined
        ? { cause: serializeError(error.cause) }
        : {}),
    };
  }
  return { value: sanitizeValue(error, 0, new WeakSet()) };
}

function safeStringify(record: Record<string, unknown>): string {
  try {
    return JSON.stringify(record);
  } catch {
    return JSON.stringify({ level: record.level, msg: record.msg });
  }
}

export function createLogger(
  base: LogFields = {},
  options: LoggerOptions = {},
): Logger {
  const level = options.level ?? resolveDefaultLevel();
  const threshold = LEVEL_ORDER[level];
  const sink = options.sink ?? defaultSink;

  function emit(entryLevel: LogLevel, message: string, fields?: LogFields) {
    if (LEVEL_ORDER[entryLevel] < threshold) return;
    const record: Record<string, unknown> = {
      level: entryLevel,
      msg: message,
      time: new Date().toISOString(),
      ...sanitizeFields(base),
      ...(fields ? sanitizeFields(fields) : {}),
    };
    sink(safeStringify(record), entryLevel);
  }

  return {
    debug: (message, fields) => emit("debug", message, fields),
    info: (message, fields) => emit("info", message, fields),
    warn: (message, fields) => emit("warn", message, fields),
    error: (message, fields) => emit("error", message, fields),
    child: (fields) => createLogger({ ...base, ...fields }, { level, sink }),
  };
}

/** Process-wide logger. Prefer `createLogger({ requestId })` per request. */
export const logger = createLogger({ service: "lifeos" });
