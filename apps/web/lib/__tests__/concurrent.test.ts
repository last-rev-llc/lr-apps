import { describe, expect, it } from "vitest";
import { pLimit } from "../concurrent";

describe("pLimit", () => {
  it("rejects invalid concurrency values", () => {
    expect(() => pLimit(0)).toThrow();
    expect(() => pLimit(-1)).toThrow();
    expect(() => pLimit(1.5)).toThrow();
  });

  it("caps in-flight tasks at the configured concurrency", async () => {
    const limit = pLimit(3);
    let inFlight = 0;
    let peak = 0;

    let resolveBarrier: () => void = () => {};
    const barrier = new Promise<void>((resolve) => {
      resolveBarrier = resolve;
    });

    const tasks = Array.from({ length: 10 }, () =>
      limit(async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await barrier;
        inFlight -= 1;
        return inFlight;
      }),
    );

    // Yield to the event loop so tasks have a chance to start.
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(inFlight).toBe(3);

    resolveBarrier();
    await Promise.all(tasks);

    expect(peak).toBe(3);
  });

  it("preserves task return values", async () => {
    const limit = pLimit(2);
    const out = await Promise.all([
      limit(async () => "a"),
      limit(async () => "b"),
      limit(async () => "c"),
    ]);
    expect(out).toEqual(["a", "b", "c"]);
  });

  it("propagates rejections without breaking subsequent tasks", async () => {
    const limit = pLimit(1);

    await expect(limit(async () => {
      throw new Error("boom");
    })).rejects.toThrow("boom");

    const result = await limit(async () => "ok");
    expect(result).toBe("ok");
  });
});
