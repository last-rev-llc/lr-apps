// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import SentimentError from "../error";

describe("SentimentError boundary", () => {
  it("renders the fallback heading and message", () => {
    renderWithProviders(
      <SentimentError error={new Error("query failed")} reset={() => {}} />,
    );
    expect(
      screen.getByRole("heading", { level: 2 }).textContent,
    ).toMatch(/Something went wrong/i);
    expect(screen.getByText(/query failed/)).not.toBeNull();
  });

  it("falls back to the default message when error has no message", () => {
    renderWithProviders(
      <SentimentError error={new Error("")} reset={() => {}} />,
    );
    expect(screen.getByText(/Failed to load sentiment data/i)).not.toBeNull();
  });

  it("wires the retry button to the reset callback", () => {
    const reset = vi.fn();
    renderWithProviders(
      <SentimentError error={new Error("boom")} reset={reset} />,
    );
    screen.getByRole("button", { name: /try again/i }).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
