// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import CommandCenterError from "../error";

describe("CommandCenterError boundary", () => {
  it("renders the fallback heading with the error message", () => {
    renderWithProviders(
      <CommandCenterError
        error={Object.assign(new Error("boom"), { digest: "abc" })}
        reset={() => {}}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2 }).textContent,
    ).toMatch(/Command Center Error/i);
    expect(screen.getByText(/boom/)).not.toBeNull();
  });

  it("falls back to a default message when error.message is empty", () => {
    renderWithProviders(
      <CommandCenterError error={new Error("")} reset={() => {}} />,
    );
    expect(
      screen.getByText(/Something went wrong loading Command Center/i),
    ).not.toBeNull();
  });

  it("invokes reset when the user clicks the retry button", () => {
    const reset = vi.fn();
    renderWithProviders(
      <CommandCenterError error={new Error("fail")} reset={reset} />,
    );
    const button = screen.getByRole("button", { name: /try again/i });
    button.click();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
