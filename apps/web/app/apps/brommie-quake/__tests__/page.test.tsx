// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

// Stub CSS import to avoid parse errors in jsdom
vi.mock("../brommie-quake.css", () => ({}));

// Stub IntersectionObserver (not available in jsdom)
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

import BrommieQuakePage from "../page";

describe("BrommieQuakePage", () => {
  it("renders hero title with Marc Bromwell's name", () => {
    renderWithProviders(<BrommieQuakePage />);
    expect(
      screen.getByText(/Marc.*My Days.*Bromwell/i),
    ).toBeInTheDocument();
  });

  it("renders 'Start the Quake' button", () => {
    renderWithProviders(<BrommieQuakePage />);
    expect(
      screen.getByRole("button", { name: /Start the Quake/i }),
    ).toBeInTheDocument();
  });

  it("renders wave section heading", () => {
    renderWithProviders(<BrommieQuakePage />);
    expect(screen.getByText(/THE WAVE BEGINS/i)).toBeInTheDocument();
  });

  it("renders quotes section heading", () => {
    renderWithProviders(<BrommieQuakePage />);
    expect(screen.getByText(/FROM THE STANDS/i)).toBeInTheDocument();
  });

  it("renders all stat labels", () => {
    renderWithProviders(<BrommieQuakePage />);
    expect(screen.getByText("Kid Started It")).toBeInTheDocument();
    expect(screen.getByText("Full Stadium Wave")).toBeInTheDocument();
    expect(screen.getByText("Crowd Volume")).toBeInTheDocument();
    expect(screen.getByText("Hype Level")).toBeInTheDocument();
  });

  it("renders at least one quote author", () => {
    renderWithProviders(<BrommieQuakePage />);
    expect(
      screen.getByText(/Section 109, Season Ticket Holder/i),
    ).toBeInTheDocument();
  });

  it("clicking Start the Quake button does not throw", () => {
    renderWithProviders(<BrommieQuakePage />);
    const btn = screen.getByRole("button", { name: /Start the Quake/i });
    expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
