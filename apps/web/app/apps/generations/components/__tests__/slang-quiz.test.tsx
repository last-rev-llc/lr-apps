// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { SlangTerm, GenerationConfig } from "../../lib/types";

vi.mock("@repo/ui", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
  Card: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardContent: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  Badge: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span {...rest}>{children}</span>
  ),
}));

import { SlangQuiz } from "../slang-quiz";

const genZ: GenerationConfig = {
  slug: "gen-z",
  name: "Gen Z",
  era: "1997–2012",
  color: "#06b6d4",
  emoji: "💅",
  tagline: "No cap, it's giving main character energy",
};

// Create 12 terms so quiz can pick 10 + 3 wrong options
function makeTerms(count: number): SlangTerm[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `term-${i}`,
    term: `Term ${i}`,
    definition: `Definition for term ${i}`,
    example: `Example ${i}`,
    category: "test",
    vibeScore: 5 + (i % 5),
    origin: "test",
    era: "2020",
    aliases: [],
  }));
}

const fixtureTerms = makeTerms(12);

beforeEach(() => {
  vi.clearAllMocks();
  // Deterministic shuffle: Math.random returns ascending values
  let callCount = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    callCount++;
    return (callCount % 100) / 100;
  });
});

describe("SlangQuiz", () => {
  it("renders question 1 of 10", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);
    expect(screen.getByText("Question 1 of 10")).toBeTruthy();
  });

  it("shows a term in quotes and 4 answer options", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);
    // Term displayed in quotes
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading.textContent).toContain("Term");
    // 4 answer buttons (options) + no Next button yet
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(4);
  });

  it("clicking correct answer increments score and shows Next", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);
    // Find the correct answer — it matches the term's definition
    const heading = screen.getByRole("heading", { level: 3 });
    const termText = heading.textContent!.replace(/[""]/g, "").trim();
    const termIndex = fixtureTerms.findIndex((t) => t.term === termText);
    const correctDef = fixtureTerms[termIndex]!.definition;

    fireEvent.click(screen.getByText(correctDef));

    // Next button appears
    expect(
      screen.getByText("Next →") || screen.getByText("See Results 🏆")
    ).toBeTruthy();
  });

  it("clicking wrong answer disables buttons and shows Next", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);
    const heading = screen.getByRole("heading", { level: 3 });
    const termText = heading.textContent!.replace(/[""]/g, "").trim();
    const termIndex = fixtureTerms.findIndex((t) => t.term === termText);
    const correctDef = fixtureTerms[termIndex]!.definition;

    // Click a wrong answer
    const buttons = screen.getAllByRole("button");
    const wrongButton = buttons.find((b) => b.textContent !== correctDef)!;
    fireEvent.click(wrongButton);

    // All option buttons become disabled
    const optionButtons = screen.getAllByRole("button").filter((b) =>
      b.textContent !== "Next →" && b.textContent !== "See Results 🏆"
    );
    for (const btn of optionButtons) {
      expect(btn).toHaveProperty("disabled", true);
    }
  });

  it("Next advances to question 2", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);
    // Answer first question
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]!);
    // Click Next
    fireEvent.click(screen.getByText("Next →"));
    expect(screen.getByText("Question 2 of 10")).toBeTruthy();
  });

  it("after 10 questions shows results screen with score", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);

    // Answer all 10 questions
    for (let i = 0; i < 10; i++) {
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]!);
      const nextLabel = i < 9 ? "Next →" : "See Results 🏆";
      fireEvent.click(screen.getByText(nextLabel));
    }

    // Results screen should show score as X/10
    expect(screen.getByText(/\/10/)).toBeTruthy();
  });

  it("results screen shows 90%+ message for perfect score", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);

    // Answer all questions correctly
    for (let i = 0; i < 10; i++) {
      const heading = screen.getByRole("heading", { level: 3 });
      const termText = heading.textContent!.replace(/[""]/g, "").trim();
      const termIndex = fixtureTerms.findIndex((t) => t.term === termText);
      const correctDef = fixtureTerms[termIndex]!.definition;
      fireEvent.click(screen.getByText(correctDef));
      const nextLabel = i < 9 ? "Next →" : "See Results 🏆";
      fireEvent.click(screen.getByText(nextLabel));
    }

    expect(screen.getByText(/Certified Gen Z/)).toBeTruthy();
    expect(screen.getByText("10/10")).toBeTruthy();
  });

  it("results screen shows <30% message for low score", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);

    // Answer all questions wrong (pick an option that isn't the correct one)
    for (let i = 0; i < 10; i++) {
      const heading = screen.getByRole("heading", { level: 3 });
      const termText = heading.textContent!.replace(/[""]/g, "").trim();
      const termIndex = fixtureTerms.findIndex((t) => t.term === termText);
      const correctDef = fixtureTerms[termIndex]!.definition;

      const buttons = screen.getAllByRole("button");
      const wrongButton = buttons.find((b) => b.textContent !== correctDef)!;
      fireEvent.click(wrongButton);
      const nextLabel = i < 9 ? "Next →" : "See Results 🏆";
      fireEvent.click(screen.getByText(nextLabel));
    }

    expect(screen.getByText(/Total Outsider/)).toBeTruthy();
    expect(screen.getByText("0/10")).toBeTruthy();
  });

  it("Try Again restarts the quiz", () => {
    renderWithProviders(<SlangQuiz terms={fixtureTerms} gen={genZ} />);

    // Speed through all questions
    for (let i = 0; i < 10; i++) {
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]!);
      const nextLabel = i < 9 ? "Next →" : "See Results 🏆";
      fireEvent.click(screen.getByText(nextLabel));
    }

    // Click Try Again
    fireEvent.click(screen.getByText(/Try Again/));
    expect(screen.getByText("Question 1 of 10")).toBeTruthy();
  });
});
