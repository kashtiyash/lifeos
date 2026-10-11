/**
 * Baseline performance measurement hooks.
 *
 * These are intentionally tiny and dependency-free. They let request handlers
 * accumulate a `Server-Timing` header (server + database segments) and let the
 * proxy report its own duration, so p50/p95 can be read from response headers
 * or Vercel logs before any profiler exists (docs/operations.md).
 */

export interface TimingSample {
  /** Token-style metric name, e.g. `db`, `proxy`, `render`. */
  name: string;
  durationMs: number;
  /** Optional short, non-sensitive label. */
  description?: string;
}

const TIMING_NAME = /^[A-Za-z0-9_-]{1,64}$/;

function sanitizeName(name: string): string {
  const safe = name.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 64);
  return TIMING_NAME.test(safe) ? safe : "segment";
}

function sanitizeDescription(description: string): string {
  return description.replace(/["\\\r\n]/g, " ").slice(0, 64);
}

function normalizeDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) return 0;
  return Math.round(durationMs * 10) / 10;
}

/** Starts a monotonic timer and returns a function reading elapsed milliseconds. */
export function createTimer(now: () => number = () => performance.now()) {
  const startedAt = now();
  return () => Math.max(0, now() - startedAt);
}

/** Serializes samples into an RFC 6797 `Server-Timing` header value. */
export function formatServerTiming(samples: readonly TimingSample[]): string {
  return samples
    .map((sample) => {
      const parts = [
        sanitizeName(sample.name),
        `dur=${normalizeDuration(sample.durationMs)}`,
      ];
      if (sample.description) {
        parts.push(`desc="${sanitizeDescription(sample.description)}"`);
      }
      return parts.join(";");
    })
    .join(", ");
}

/**
 * Collects timing samples for one request. Safe to reuse for database
 * segments once the repository layer lands; today it is used by the proxy.
 */
export class ServerTiming {
  private readonly samples: TimingSample[] = [];

  add(name: string, durationMs: number, description?: string): void {
    this.samples.push({ name, durationMs, description });
  }

  record<T>(name: string, operation: () => T): T {
    const elapsed = createTimer();
    try {
      return operation();
    } finally {
      this.add(name, elapsed());
    }
  }

  async recordAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const elapsed = createTimer();
    try {
      return await operation();
    } finally {
      this.add(name, elapsed());
    }
  }

  entries(): readonly TimingSample[] {
    return this.samples;
  }

  toHeaderValue(): string {
    return formatServerTiming(this.samples);
  }
}
