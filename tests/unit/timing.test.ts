import { describe, expect, it } from "vitest";

import {
  createTimer,
  formatServerTiming,
  ServerTiming,
} from "@/lib/observability/timing";

describe("formatServerTiming", () => {
  it("renders metric, duration, and quoted description", () => {
    expect(
      formatServerTiming([
        { name: "db", durationMs: 12.34, description: "tasks" },
        { name: "total", durationMs: 40 },
      ]),
    ).toBe('db;dur=12.3;desc="tasks", total;dur=40');
  });

  it("clamps invalid durations and sanitizes names/descriptions", () => {
    const value = formatServerTiming([
      { name: "bad name!", durationMs: Number.NaN },
      { name: "auth", durationMs: -5, description: 'a"b' },
    ]);
    expect(value).toContain("bad-name-;dur=0");
    expect(value).toContain('auth;dur=0;desc="a b"');
  });
});

describe("ServerTiming collector", () => {
  it("records synchronous and asynchronous segments", async () => {
    const timing = new ServerTiming();
    const value = timing.record("render", () => 7);
    expect(value).toBe(7);

    await timing.recordAsync("db", async () => {
      await Promise.resolve();
      return "ok";
    });

    expect(timing.entries().map((entry) => entry.name)).toEqual(["render", "db"]);
    expect(timing.toHeaderValue()).toContain("render;dur=");
    expect(timing.toHeaderValue()).toContain("db;dur=");
  });
});

describe("createTimer", () => {
  it("measures elapsed time from an injected clock", () => {
    let now = 100;
    const elapsed = createTimer(() => now);
    now = 175.5;
    expect(elapsed()).toBeCloseTo(75.5);
    now = 50;
    expect(elapsed()).toBe(0);
  });
});
