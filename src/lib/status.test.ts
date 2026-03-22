import { describe, expect, it } from "vitest";
import { STEP_COUNT } from "./steps";
import { computeStatus } from "./status";

describe("computeStatus", () => {
  it("returns planned when no steps are done", () => {
    expect(computeStatus([])).toBe("planned");
  });

  it("returns ongoing when some but not all steps are done", () => {
    expect(computeStatus([0])).toBe("ongoing");
    expect(computeStatus([0, 1, 2])).toBe("ongoing");
  });

  it("returns done when all steps are completed", () => {
    const all = Array.from({ length: STEP_COUNT }, (_, i) => i);
    expect(computeStatus(all)).toBe("done");
  });

  it("ignores invalid step indices", () => {
    expect(computeStatus([-1, 999])).toBe("planned");
  });
});
