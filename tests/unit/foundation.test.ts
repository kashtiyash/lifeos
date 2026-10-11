import { describe, expect, it } from "vitest";

import { isActivePath } from "@/lib/ui/nav";
import { targetSizes } from "@/lib/ui/targets";

describe("target size tiers", () => {
  it("keeps the floor at 24px hit area", () => {
    expect(targetSizes.floor).toBe("min-h-6 min-w-6");
  });

  it("uses 40px on phones and 36px from 768px for default controls", () => {
    expect(targetSizes.default).toBe("h-10 md:h-9");
  });

  it("uses 44px for primary one-handed actions", () => {
    expect(targetSizes.primary).toBe("h-11");
    expect(targetSizes.primaryIcon).toBe("size-11");
  });
});

describe("isActivePath", () => {
  it("matches the exact route and its descendants", () => {
    expect(isActivePath("/tasks", "/tasks")).toBe(true);
    expect(isActivePath("/tasks/123", "/tasks")).toBe(true);
  });

  it("does not match sibling or prefix-only paths", () => {
    expect(isActivePath("/projects", "/tasks")).toBe(false);
    expect(isActivePath("/tasks-archive", "/tasks")).toBe(false);
  });
});
