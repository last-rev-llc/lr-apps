// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { SlangTerm, GenerationConfig } from "../../lib/types";

vi.mock("@repo/ui", () => ({
  Input: ({
    placeholder,
    value,
    onChange,
    ...rest
  }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input placeholder={placeholder} value={value} onChange={onChange} {...rest} />
  ),
  Badge: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span {...rest}>{children}</span>
  ),
  Card: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardContent: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  PillList: ({
    items,
    selected,
    onSelect,
  }: {
    items: { label: string }[];
    selected: string;
    onSelect: (label: string) => void;
    size?: string;
    className?: string;
  }) => (
    <div data-testid="pill-list">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.label)}
          data-selected={item.label === selected}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

import { SlangDictionary } from "../slang-dictionary";

function makeTerm(overrides: Partial<SlangTerm> = {}): SlangTerm {
  return {
    id: "test-term",
    term: "Slay",
    definition: "To do something exceptionally well",
    example: "She slayed that presentation",
    category: "compliment",
    vibeScore: 8,
    origin: "Drag culture",
    era: "2020-present",
    aliases: ["slaying"],
    generation: "genz",
    equivalents: { millennial: "Killing it" },
    ...overrides,
  };
}

const genZ: GenerationConfig = {
  slug: "gen-z",
  name: "Gen Z",
  era: "1997–2012",
  color: "#06b6d4",
  emoji: "💅",
  tagline: "No cap, it's giving main character energy",
};

const fixtureTerms: SlangTerm[] = [
  makeTerm({ id: "slay", term: "Slay", category: "compliment", vibeScore: 8 }),
  makeTerm({ id: "mid", term: "Mid", definition: "Average, mediocre", category: "insult", vibeScore: 5, aliases: ["midcore"] }),
  makeTerm({ id: "rizz", term: "Rizz", definition: "Charisma or charm", category: "dating", vibeScore: 9, aliases: ["unspoken rizz"] }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SlangDictionary", () => {
  it("renders all terms", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    expect(screen.getByText("Slay")).toBeTruthy();
    expect(screen.getByText("Mid")).toBeTruthy();
    expect(screen.getByText("Rizz")).toBeTruthy();
  });

  it("shows term count", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    expect(screen.getByText("3 terms found")).toBeTruthy();
  });

  it("sorts terms by vibeScore descending", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    const termNames = screen.getAllByText(/^(Slay|Mid|Rizz)$/).map((el) => el.textContent);
    // Rizz (9), Slay (8), Mid (5)
    expect(termNames).toEqual(["Rizz", "Slay", "Mid"]);
  });

  it("filters by search on term name", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    fireEvent.change(screen.getByPlaceholderText("Search slang terms..."), {
      target: { value: "rizz" },
    });
    expect(screen.getByText("Rizz")).toBeTruthy();
    expect(screen.queryByText("Slay")).toBeNull();
    expect(screen.getByText("1 term found")).toBeTruthy();
  });

  it("filters by search on definition", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    fireEvent.change(screen.getByPlaceholderText("Search slang terms..."), {
      target: { value: "mediocre" },
    });
    expect(screen.getByText("Mid")).toBeTruthy();
    expect(screen.queryByText("Slay")).toBeNull();
  });

  it("filters by search on alias", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    fireEvent.change(screen.getByPlaceholderText("Search slang terms..."), {
      target: { value: "midcore" },
    });
    expect(screen.getByText("Mid")).toBeTruthy();
    expect(screen.queryByText("Rizz")).toBeNull();
  });

  it("category pill filters work", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    // Click the dating pill in the pill list
    const pillList = screen.getByTestId("pill-list");
    const datingPill = Array.from(pillList.querySelectorAll("button")).find(
      (b) => b.textContent === "dating"
    )!;
    fireEvent.click(datingPill);
    expect(screen.getByText("Rizz")).toBeTruthy();
    expect(screen.queryByText("Slay")).toBeNull();
    expect(screen.getByText("1 term found")).toBeTruthy();
  });

  it("shows empty state when no matches", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    fireEvent.change(screen.getByPlaceholderText("Search slang terms..."), {
      target: { value: "xyznonexistent" },
    });
    expect(screen.getByText("No slang found for that search.")).toBeTruthy();
    expect(screen.getByText("0 terms found")).toBeTruthy();
  });

  it("renders category pills including 'all'", () => {
    renderWithProviders(<SlangDictionary terms={fixtureTerms} gen={genZ} />);
    const pillList = screen.getByTestId("pill-list");
    const pillLabels = Array.from(pillList.querySelectorAll("button")).map(
      (b) => b.textContent
    );
    expect(pillLabels).toContain("all");
    expect(pillLabels).toContain("compliment");
    expect(pillLabels).toContain("dating");
    expect(pillLabels).toContain("insult");
  });
});
