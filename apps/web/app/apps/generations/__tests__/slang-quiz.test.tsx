// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

vi.mock("@repo/ui", () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  ),
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { SlangQuiz } from "../components/slang-quiz";
import type { SlangTerm, GenerationConfig } from "../lib/types";

const genFixture: GenerationConfig = {
  slug: "gen-alpha",
  name: "Gen Alpha",
  era: "2010s–Present",
  color: "#a855f7",
  emoji: "🧠",
  tagline: "Brainrot, rizz, and skibidi vibes",
};

function makeTerm(id: string, term: string, definition: string): SlangTerm {
  return {
    id,
    term,
    definition,
    example: `Example of ${term}`,
    category: "reaction",
    vibeScore: 7,
    origin: "Internet",
    era: "2022-present",
    aliases: [],
  };
}

// Create 15 terms to ensure quiz can always build 10 questions with 3 wrong answers
const terms: SlangTerm[] = Array.from({ length: 15 }, (_, i) =>
  makeTerm(`term-${i}`, `Term ${i}`, `Definition ${i}`),
);

let randomCallIdx = 0;
const deterministicRandom = () => {
  // Alternating values to produce stable but varied sort order
  return (randomCallIdx++ % 3) * 0.3;
};

beforeEach(() => {
  randomCallIdx = 0;
  vi.spyOn(Math, "random").mockImplementation(deterministicRandom);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SlangQuiz", () => {
  it("renders 'Question 1 of 10' at the start", () => {
    renderWithProviders(<SlangQuiz terms={terms} gen={genFixture} />);
    expect(screen.getByText("Question 1 of 10")).toBeInTheDocument();
  });

  it("renders 4 answer options for the first question", () => {
    renderWithProviders(<SlangQuiz terms={terms} gen={genFixture} />);
    // All 4 options are buttons that contain "Definition"
    const optionButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.startsWith("Definition"));
    expect(optionButtons).toHaveLength(4);
  });

  it("shows progress dots equal to question count", () => {
    const { container } = renderWithProviders(
      <SlangQuiz terms={terms} gen={genFixture} />,
    );
    const dots = container.querySelectorAll(".w-2\\.5");
    expect(dots).toHaveLength(10);
  });

  it("clicking an answer disables all answer buttons", () => {
    renderWithProviders(<SlangQuiz terms={terms} gen={genFixture} />);

    const options = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.startsWith("Definition"));
    fireEvent.click(options[0]);

    const disabledOptions = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.startsWith("Definition") && b.hasAttribute("disabled"));
    expect(disabledOptions).toHaveLength(4);
  });

  it("shows Next button after answering a question", () => {
    renderWithProviders(<SlangQuiz terms={terms} gen={genFixture} />);

    const options = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.startsWith("Definition"));
    fireEvent.click(options[0]);

    expect(screen.getByRole("button", { name: /Next →|See Results/ })).toBeInTheDocument();
  });

  it("advances to Question 2 after clicking Next", () => {
    renderWithProviders(<SlangQuiz terms={terms} gen={genFixture} />);

    const options = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.startsWith("Definition"));
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByRole("button", { name: /Next →/ }));

    expect(screen.getByText("Question 2 of 10")).toBeInTheDocument();
  });

  it("shows results with score after completing all 10 questions", () => {
    renderWithProviders(<SlangQuiz terms={terms} gen={genFixture} />);

    for (let q = 0; q < 10; q++) {
      const options = screen
        .getAllByRole("button")
        .filter((b) => b.textContent?.startsWith("Definition"));
      fireEvent.click(options[0]);

      const nextBtn = screen.queryByRole("button", { name: /Next →/ });
      const resultsBtn = screen.queryByRole("button", { name: /See Results/ });
      if (nextBtn) fireEvent.click(nextBtn);
      else if (resultsBtn) fireEvent.click(resultsBtn);
    }

    // Results view shows score like "X/10"
    expect(screen.getByText(/\/10/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try Again/ })).toBeInTheDocument();
  });

  it("clicking Try Again resets to Question 1 of 10", () => {
    renderWithProviders(<SlangQuiz terms={terms} gen={genFixture} />);

    // Complete all questions
    for (let q = 0; q < 10; q++) {
      const options = screen
        .getAllByRole("button")
        .filter((b) => b.textContent?.startsWith("Definition"));
      fireEvent.click(options[0]);

      const nextBtn = screen.queryByRole("button", { name: /Next →/ });
      const resultsBtn = screen.queryByRole("button", { name: /See Results/ });
      if (nextBtn) fireEvent.click(nextBtn);
      else if (resultsBtn) fireEvent.click(resultsBtn);
    }

    fireEvent.click(screen.getByRole("button", { name: /Try Again/ }));

    expect(screen.getByText("Question 1 of 10")).toBeInTheDocument();
  });
});
