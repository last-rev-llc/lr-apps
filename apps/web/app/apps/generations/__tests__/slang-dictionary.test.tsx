// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

vi.mock("@repo/ui", () => ({
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
  Badge: ({ children, className, style }: any) => (
    <span className={className} style={style}>
      {children}
    </span>
  ),
  Button: ({ children, onClick, className, style, variant }: any) => (
    <button onClick={onClick} className={className} style={style} data-variant={variant}>
      {children}
    </button>
  ),
  Card: ({ children, className, style }: any) => (
    <div className={className} style={style}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

import { SlangDictionary } from "../components/slang-dictionary";
import type { SlangTerm, GenerationConfig } from "../lib/types";

const genFixture: GenerationConfig = {
  slug: "gen-alpha",
  name: "Gen Alpha",
  era: "2010s–Present",
  color: "#a855f7",
  emoji: "🧠",
  tagline: "Brainrot, rizz, and skibidi vibes",
};

function makeTerm(overrides: Partial<SlangTerm> = {}): SlangTerm {
  return {
    id: "term-1",
    term: "rizz",
    definition: "Charisma or charm",
    example: "He's got rizz",
    category: "compliment",
    vibeScore: 9,
    origin: "Internet",
    era: "2022-present",
    aliases: [],
    ...overrides,
  };
}

const terms: SlangTerm[] = [
  makeTerm({ id: "1", term: "Rizz", category: "compliment", vibeScore: 9 }),
  makeTerm({ id: "2", term: "Skibidi", definition: "Chaotic absurd thing", category: "internet culture", vibeScore: 8 }),
  makeTerm({ id: "3", term: "Bussin", definition: "Extremely good food", category: "compliment", vibeScore: 9 }),
  makeTerm({ id: "4", term: "No Cap", definition: "No lie, for real", category: "reaction", vibeScore: 7 }),
  makeTerm({ id: "5", term: "Bet", definition: "Okay, agreed", category: "reaction", vibeScore: 7 }),
];

describe("SlangDictionary", () => {
  it("renders all terms by default", () => {
    renderWithProviders(<SlangDictionary terms={terms} gen={genFixture} />);

    expect(screen.getByText("Rizz")).toBeInTheDocument();
    expect(screen.getByText("Skibidi")).toBeInTheDocument();
    expect(screen.getByText("Bussin")).toBeInTheDocument();
    expect(screen.getByText("No Cap")).toBeInTheDocument();
    expect(screen.getByText("Bet")).toBeInTheDocument();
  });

  it("shows term count", () => {
    renderWithProviders(<SlangDictionary terms={terms} gen={genFixture} />);
    expect(screen.getByText("5 terms found")).toBeInTheDocument();
  });

  it("filters terms by search query", () => {
    renderWithProviders(<SlangDictionary terms={terms} gen={genFixture} />);

    const input = screen.getByPlaceholderText("Search slang terms...");
    fireEvent.change(input, { target: { value: "rizz" } });

    expect(screen.getByText("Rizz")).toBeInTheDocument();
    expect(screen.queryByText("Skibidi")).not.toBeInTheDocument();
  });

  it("updates term count after search", () => {
    renderWithProviders(<SlangDictionary terms={terms} gen={genFixture} />);

    const input = screen.getByPlaceholderText("Search slang terms...");
    fireEvent.change(input, { target: { value: "bussin" } });

    expect(screen.getByText("1 term found")).toBeInTheDocument();
  });

  it("renders category filter buttons including 'all'", () => {
    renderWithProviders(<SlangDictionary terms={terms} gen={genFixture} />);

    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compliment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reaction/i })).toBeInTheDocument();
  });

  it("filters by category when a category button is clicked", () => {
    renderWithProviders(<SlangDictionary terms={terms} gen={genFixture} />);

    fireEvent.click(screen.getByRole("button", { name: /reaction/i }));

    expect(screen.getByText("No Cap")).toBeInTheDocument();
    expect(screen.getByText("Bet")).toBeInTheDocument();
    expect(screen.queryByText("Rizz")).not.toBeInTheDocument();
    expect(screen.queryByText("Skibidi")).not.toBeInTheDocument();
  });

  it("shows empty state when no terms match search", () => {
    renderWithProviders(<SlangDictionary terms={terms} gen={genFixture} />);

    const input = screen.getByPlaceholderText("Search slang terms...");
    fireEvent.change(input, { target: { value: "zzznomatch" } });

    expect(screen.getByText("No slang found for that search.")).toBeInTheDocument();
  });
});
