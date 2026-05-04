import { describe, expect, it } from "vitest";
import { runRollingQueue } from "../queue";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("runRollingQueue", () => {
  it("never exceeds the concurrency cap", async () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    let inFlight = 0;
    let peak = 0;

    const result = await runRollingQueue({
      items,
      concurrency: 5,
      process: async () => {
        inFlight++;
        if (inFlight > peak) peak = inFlight;
        await wait(Math.floor(Math.random() * 5));
        inFlight--;
        return null;
      },
    });

    expect(peak).toBeLessThanOrEqual(5);
    expect(result.completed).toBe(100);
    expect(result.errored).toBe(0);
    expect(result.cancelled).toBe(false);
  });

  it("aborts in-flight items and stops new ones when the outer signal aborts", async () => {
    const controller = new AbortController();
    let started = 0;
    const completedIndices: number[] = [];

    const promise = runRollingQueue({
      items: Array.from({ length: 50 }, (_, i) => i),
      concurrency: 3,
      signal: controller.signal,
      process: async (_item, idx, signal) => {
        started++;
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, 20);
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            const e = new Error("aborted");
            e.name = "AbortError";
            reject(e);
          });
        });
        completedIndices.push(idx);
        return idx;
      },
    });

    setTimeout(() => controller.abort(), 5);
    const result = await promise;

    expect(result.cancelled).toBe(true);
    expect(started).toBeLessThan(50);
  });

  it("stops dispatching when shouldCancel returns true", async () => {
    let calls = 0;

    const result = await runRollingQueue({
      items: Array.from({ length: 50 }, (_, i) => i),
      concurrency: 2,
      shouldCancel: () => calls >= 6,
      process: async () => {
        calls++;
        await wait(1);
        return null;
      },
    });

    expect(result.cancelled).toBe(true);
    expect(calls).toBeLessThan(50);
  });

  it("does not abort siblings when one item errors", async () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const result = await runRollingQueue({
      items,
      concurrency: 4,
      process: async (_item, idx) => {
        if (idx % 2 === 0) throw new Error(`boom ${idx}`);
        return idx;
      },
    });

    expect(result.completed).toBe(10);
    expect(result.errored).toBe(10);
    expect(result.cancelled).toBe(false);
  });

  it("calls onComplete exactly once per started item", async () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const completionCounts = new Map<number, number>();

    await runRollingQueue({
      items,
      concurrency: 5,
      process: async (_item, idx) => {
        if (idx % 3 === 0) throw new Error("err");
        return idx;
      },
      onComplete: async (_item, idx) => {
        completionCounts.set(idx, (completionCounts.get(idx) ?? 0) + 1);
      },
    });

    for (let i = 0; i < items.length; i++) {
      expect(completionCounts.get(i)).toBe(1);
    }
  });

  it("returns zeros immediately for empty input and never calls process", async () => {
    let processCalled = false;
    const result = await runRollingQueue({
      items: [],
      concurrency: 4,
      process: async () => {
        processCalled = true;
        return null;
      },
    });
    expect(result).toEqual({ completed: 0, errored: 0, cancelled: false });
    expect(processCalled).toBe(false);
  });

  it("processes items in order when concurrency is 1", async () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const startOrder: number[] = [];

    await runRollingQueue({
      items,
      concurrency: 1,
      process: async (_item, idx) => {
        startOrder.push(idx);
        await wait(1);
        return idx;
      },
    });

    expect(startOrder).toEqual(items);
  });

  it("continues running other items even when onComplete throws", async () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    let processed = 0;

    const result = await runRollingQueue({
      items,
      concurrency: 3,
      process: async () => {
        processed++;
        return null;
      },
      onComplete: async () => {
        throw new Error("onComplete boom");
      },
    });

    expect(processed).toBe(10);
    expect(result.completed).toBe(10);
    expect(result.errored).toBe(0);
  });
});
