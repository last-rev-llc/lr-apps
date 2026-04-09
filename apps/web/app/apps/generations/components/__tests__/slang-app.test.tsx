// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { SlangTerm, GenerationConfig } from "../../lib/types";

// Mock child components
vi.mock("../slang-dictionary", () => ({
  SlangDictionary: ({ terms, gen }: { terms: SlangTerm[]; gen: GenerationConfig }) => (
    <div data-testid="slang-dictionary">Dictionary: {terms.length} terms for {gen.name}</div>
  ),
}));

vi.mock("../slang-translator", () => ({
  SlangTranslator: ({ gen }: { gen: GenerationConfig }) => (
    <div data-testid="slang-translator">Translator for {gen.name}</div>
  ),
}));

vi.mock("../slang-quiz", () => ({
  SlangQuiz: ({ gen }: { gen: GenerationConfig }) => (
    <div data-testid="slang-quiz">Quiz for {gen.name}</div>
  ),
}));

// Mock @repo/ui with working tabs
vi.mock("@repo/ui", () => {
  const TabsContext = React.createContext({ value: "", onChange: (_v: string) => {} });

  return {
    Tabs: ({
      children,
      defaultValue,
    }: {
      children: React.ReactNode;
      defaultValue: string;
    }) => {
      const [value, setValue] = React.useState(defaultValue);
      return (
        <TabsContext.Provider value={{ value, onChange: setValue }}>
          <div data-testid="tabs">{children}</div>
        </TabsContext.Provider>
      );
    },
    TabsList: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div role="tablist" {...rest}>{children}</div>
    ),
    TabsTrigger: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => {
      const ctx = React.useContext(TabsContext);
      return (
        <button role="tab" onClick={() => ctx.onChange(value)} data-state={ctx.value === value ? "active" : "inactive"}>
          {children}
        </button>
      );
    },
    TabsContent: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => {
      const ctx = React.useContext(TabsContext);
      return ctx.value === value ? <div role="tabpanel">{children}</div> : null;
    },
  };
});

import { SlangApp } from "../slang-app";

function makeTerm(overrides: Partial<SlangTerm> = {}): SlangTerm {
  return {
    id: "test",
    term: "Test",
    definition: "A test term",
    example: "Test example",
    category: "test",
    vibeScore: 5,
    origin: "test",
    era: "2020",
    aliases: [],
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

const fixtureTerms: SlangTerm[] = Array.from({ length: 25 }, (_, i) =>
  makeTerm({ id: `t-${i}`, term: `Term ${i}`, vibeScore: i + 1 })
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SlangApp", () => {
  it("renders header with gen name, emoji, era, and term count", () => {
    renderWithProviders(<SlangApp terms={fixtureTerms} gen={genZ} />);
    expect(screen.getByText("Gen Z Slang")).toBeTruthy();
    expect(screen.getByText("💅")).toBeTruthy();
    expect(screen.getByText(/1997–2012/)).toBeTruthy();
    expect(screen.getAllByText(/25 terms/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows dictionary tab by default", () => {
    renderWithProviders(<SlangApp terms={fixtureTerms} gen={genZ} />);
    expect(screen.getByTestId("slang-dictionary")).toBeTruthy();
  });

  it("switches to translator tab", () => {
    renderWithProviders(<SlangApp terms={fixtureTerms} gen={genZ} />);
    fireEvent.click(screen.getByText(/Translator/));
    expect(screen.getByTestId("slang-translator")).toBeTruthy();
    expect(screen.queryByTestId("slang-dictionary")).toBeNull();
  });

  it("switches to quiz tab", () => {
    renderWithProviders(<SlangApp terms={fixtureTerms} gen={genZ} />);
    fireEvent.click(screen.getByText(/Quiz/));
    expect(screen.getByTestId("slang-quiz")).toBeTruthy();
  });

  it("switches to trending tab and shows top 20 terms by vibe score", () => {
    renderWithProviders(<SlangApp terms={fixtureTerms} gen={genZ} />);
    fireEvent.click(screen.getByText(/Trending/));
    expect(screen.getByText(/Trending Wall/)).toBeTruthy();
    // Top term by vibeScore is Term 24 (score 25)
    expect(screen.getByText("Term 24")).toBeTruthy();
    // Term 0 (score 1) should not be in top 20 since we have 25 terms
    expect(screen.queryByText("Term 0")).toBeNull();
  });
});
