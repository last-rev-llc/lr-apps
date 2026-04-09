// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { SlangEntry } from "../../lib/types";

// Mock @repo/ui with working Tabs context + basic components
vi.mock("@repo/ui", () => {
  const TabsContext = React.createContext({ value: "", onChange: (_v: string) => {} });

  return {
    Tabs: ({
      children,
      defaultValue,
    }: {
      children: React.ReactNode;
      defaultValue: string;
      className?: string;
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
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
    Badge: ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
      <span {...rest}>{children}</span>
    ),
    Button: ({
      children,
      onClick,
      disabled,
      title,
      ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
      <button onClick={onClick} disabled={disabled} title={title} {...rest}>
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
    Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
    Dialog: ({
      children,
      open,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => (open ? <div role="dialog">{children}</div> : null),
    DialogContent: ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
    DialogTitle: ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...rest}>{children}</h2>,
  };
});

import { SlangApp } from "../slang-app";

function makeEntry(overrides: Partial<SlangEntry> = {}): SlangEntry {
  return {
    id: "skibidi",
    term: "Skibidi",
    definition: "Something wild or chaotic",
    example: "That was so skibidi",
    category: "Reaction",
    vibe_score: 8,
    vibeScore: 8,
    origin: "Internet culture",
    era: "2020s",
    aliases: [],
    generation: "gen-alpha",
    ...overrides,
  };
}

const fixtureSlang: SlangEntry[] = [
  makeEntry({ id: "skibidi", term: "Skibidi", vibe_score: 10, vibeScore: 10, category: "Reaction", generation: "gen-alpha" }),
  makeEntry({ id: "rizz", term: "Rizz", definition: "Charm and charisma", vibe_score: 9, vibeScore: 9, category: "compliment", generation: "gen-alpha", aliases: ["charisma"] }),
  makeEntry({ id: "bussin", term: "Bussin", definition: "Really good", vibe_score: 8, vibeScore: 8, category: "Approval", generation: "gen-alpha" }),
  makeEntry({
    id: "as-if",
    term: "As If!",
    definition: "Expression of disbelief",
    vibe_score: 9,
    vibeScore: 9,
    category: "Reaction",
    generation: "gen-x",
    era: "90s",
    origin: "Clueless (1995)",
    equivalents: { genAlpha: "Nah fr / Cap" },
  }),
  makeEntry({
    id: "da-bomb",
    term: "Da Bomb",
    definition: "Something extremely cool",
    vibe_score: 9,
    vibeScore: 9,
    category: "Approval",
    generation: "gen-x",
    era: "90s",
    origin: "90s hip-hop",
    equivalents: { genAlpha: "Bussin / Fire" },
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SlangApp", () => {
  it("renders Dictionary tab by default", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    // Dictionary tab content is visible — search input placeholder
    expect(screen.getByPlaceholderText(/Search slang terms/)).toBeTruthy();
  });

  it("renders all four tab triggers", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    expect(screen.getByText("Dictionary")).toBeTruthy();
    expect(screen.getByText("Translator")).toBeTruthy();
    expect(screen.getByText("Compare")).toBeTruthy();
    expect(screen.getByText("Quiz")).toBeTruthy();
  });

  it("switches to Translator tab", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    fireEvent.click(screen.getByText("Translator"));
    // Translator shows swap direction button
    expect(screen.getByTitle("Swap direction")).toBeTruthy();
    // Translator shows textarea placeholder
    expect(screen.getByPlaceholderText(/Type or paste/)).toBeTruthy();
  });

  it("switches to Compare tab", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    fireEvent.click(screen.getByText("Compare"));
    expect(screen.getByText(/Side-by-side view/)).toBeTruthy();
  });

  it("switches to Quiz tab", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    fireEvent.click(screen.getByText("Quiz"));
    expect(screen.getByText(/Test your cross-generational/)).toBeTruthy();
    expect(screen.getByText("Start Quiz")).toBeTruthy();
  });
});

describe("DictionaryTab", () => {
  it("shows term count", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    expect(screen.getByText("5 terms found")).toBeTruthy();
  });

  it("renders all slang terms", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    expect(screen.getByText("Skibidi")).toBeTruthy();
    expect(screen.getByText("Rizz")).toBeTruthy();
    expect(screen.getByText("Bussin")).toBeTruthy();
    expect(screen.getByText("As If!")).toBeTruthy();
    expect(screen.getByText("Da Bomb")).toBeTruthy();
  });

  it("filters terms by search input (term match)", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    const searchInput = screen.getByPlaceholderText(/Search slang terms/);
    fireEvent.change(searchInput, { target: { value: "skibidi" } });
    expect(screen.getByText("1 term found")).toBeTruthy();
    expect(screen.getByText("Skibidi")).toBeTruthy();
  });

  it("filters terms by search input (definition match)", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    const searchInput = screen.getByPlaceholderText(/Search slang terms/);
    fireEvent.change(searchInput, { target: { value: "charm" } });
    expect(screen.getByText("1 term found")).toBeTruthy();
    expect(screen.getByText("Rizz")).toBeTruthy();
  });

  it("filters terms by search input (alias match)", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    const searchInput = screen.getByPlaceholderText(/Search slang terms/);
    fireEvent.change(searchInput, { target: { value: "charisma" } });
    expect(screen.getByText("1 term found")).toBeTruthy();
    expect(screen.getByText("Rizz")).toBeTruthy();
  });

  it("filters by Gen Alpha generation", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    // Click the "Gen Alpha" generation filter button
    const genAlphaButtons = screen.getAllByText("Gen Alpha");
    // Find the filter button (not the badges on cards)
    const filterButton = genAlphaButtons.find((el) => el.tagName === "BUTTON");
    fireEvent.click(filterButton!);
    expect(screen.getByText("3 terms found")).toBeTruthy();
  });

  it("filters by Gen X generation", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    const genXButtons = screen.getAllByText("Gen X");
    const filterButton = genXButtons.find((el) => el.tagName === "BUTTON");
    fireEvent.click(filterButton!);
    expect(screen.getByText("2 terms found")).toBeTruthy();
  });

  it("filters by category", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    // Click "Reaction" category filter
    const reactionButtons = screen.getAllByText("Reaction");
    const filterButton = reactionButtons.find((el) => el.tagName === "BUTTON");
    fireEvent.click(filterButton!);
    // Skibidi (Reaction, gen-alpha) + As If! (Reaction, gen-x) = 2
    expect(screen.getByText("2 terms found")).toBeTruthy();
  });

  it("shows empty state when no terms match", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    const searchInput = screen.getByPlaceholderText(/Search slang terms/);
    fireEvent.change(searchInput, { target: { value: "zzzznonexistent" } });
    expect(screen.getByText("0 terms found")).toBeTruthy();
    expect(screen.getByText(/No slang found/)).toBeTruthy();
  });

  it("opens SlangDetailModal when clicking a card", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    // Click the first card (Skibidi) — cards are rendered as div with onClick
    fireEvent.click(screen.getByText("Skibidi"));
    // Modal should open with a dialog
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("SlangCard bi-directional display", () => {
  it("shows Gen X equivalent for gen-alpha entries via GEN_X_MAP", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    // Skibidi (gen-alpha) → GEN_X_MAP has "Gnarly / Radical"
    expect(screen.getByText("Gnarly / Radical")).toBeTruthy();
    expect(screen.getAllByText(/Gen X equivalent/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows Gen Alpha equivalent for gen-x entries via equivalents.genAlpha", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    // As If! (gen-x) has equivalents.genAlpha = "Nah fr / Cap"
    expect(screen.getByText("Nah fr / Cap")).toBeTruthy();
    expect(screen.getAllByText(/Gen Alpha equivalent/).length).toBeGreaterThanOrEqual(1);
  });
});

describe("TranslatorTab", () => {
  function renderTranslator() {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    fireEvent.click(screen.getByText("Translator"));
  }

  it("shows swap direction button", () => {
    renderTranslator();
    expect(screen.getByTitle("Swap direction")).toBeTruthy();
  });

  it("swaps direction when clicking swap button", () => {
    renderTranslator();
    // Initially alpha-to-x: first label is "Gen Alpha →"
    const swapBtn = screen.getByTitle("Swap direction");
    fireEvent.click(swapBtn);
    // After swap: should show "Gen X →" as first label
    const labels = screen.getAllByText(/→/);
    expect(labels.some((el) => el.textContent?.includes("Gen X"))).toBe(true);
  });

  it("translates known gen-alpha slang to gen-x equivalent", () => {
    renderTranslator();
    const textarea = screen.getByPlaceholderText(/Type or paste/);
    fireEvent.change(textarea, { target: { value: "skibidi" } });
    // Should show the Gen X translation "Gnarly / Radical" in the output
    expect(screen.getByText("Gnarly / Radical")).toBeTruthy();
  });

  it("shows 'No recognized slang terms found' for unknown text", () => {
    renderTranslator();
    const textarea = screen.getByPlaceholderText(/Type or paste/);
    fireEvent.change(textarea, { target: { value: "hello world nothing here" } });
    expect(screen.getByText(/No recognized slang terms found/)).toBeTruthy();
  });
});

describe("CompareTab", () => {
  it("renders side-by-side pairs with both generation badges", () => {
    renderWithProviders(<SlangApp allSlang={fixtureSlang} />);
    fireEvent.click(screen.getByText("Compare"));

    // Should show side-by-side description
    expect(screen.getByText(/Side-by-side view/)).toBeTruthy();

    // Gen Alpha badges should appear on compare cards
    const alphaSpans = screen.getAllByText("Gen Alpha");
    expect(alphaSpans.length).toBeGreaterThanOrEqual(1);

    // Gen X badges should appear on compare cards
    const xSpans = screen.getAllByText("Gen X");
    expect(xSpans.length).toBeGreaterThanOrEqual(1);
  });
});
