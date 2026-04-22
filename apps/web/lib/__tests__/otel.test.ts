import { describe, it, expect } from "vitest";
import { withSpan } from "../otel";

describe("withSpan (no-op tracer)", () => {
  it("returns the function's resolved value", async () => {
    const result = await withSpan("test.span", { attr: 1 }, () => "value");
    expect(result).toBe("value");
  });

  it("awaits async functions", async () => {
    const result = await withSpan("test.span", {}, async () => {
      await new Promise((r) => setTimeout(r, 0));
      return 42;
    });
    expect(result).toBe(42);
  });

  it("re-throws errors from the wrapped function", async () => {
    await expect(
      withSpan("test.span", {}, () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("re-throws errors from async rejected functions", async () => {
    await expect(
      withSpan("test.span", {}, async () => {
        throw new Error("async boom");
      }),
    ).rejects.toThrow("async boom");
  });
});
