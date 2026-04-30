// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => {
  const TabsContext = React.createContext<{ value: string; setValue: (v: string) => void }>({
    value: "dictionary",
    setValue: () => {},
  });

  function Tabs({ children, defaultValue }: any) {
    const [value, setValue] = React.useState(defaultValue ?? "dictionary");
    return (
      <TabsContext.Provider value={{ value, setValue }}>
        <div data-testid="tabs">{children}</div>
      </TabsContext.Provider>
    );
  }

  function TabsList({ children }: any) {
    return <div role="tablist">{children}</div>;
  }

  function TabsTrigger({ value, children }: any) {
    const ctx = React.useContext(TabsContext);
    return (
      <button
        role="tab"
        aria-selected={ctx.value === value}
        onClick={() => ctx.setValue(value)}
      >
        {children}
      </button>
    );
  }

  function TabsContent({ value, children }: any) {
    const ctx = React.useContext(TabsContext);
    if (ctx.value !== value) return null;
    return <div role="tabpanel">{children}</div>;
  }

  return {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Input: ({ value, onChange, placeholder, className }: any) => (
      <input value={value} onChange={onChange} placeholder={placeholder} className={className} />
    ),
    Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
    Button: ({ children, onClick, disabled, className, variant }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
        {children}
      </button>
    ),
    Card: ({ children, className, onClick }: any) => (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div className={className} onClick={onClick}>{children}</div>
    ),
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
    Dialog: ({ open, children }: any) => open ? <div role="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
    Textarea: ({ value, onChange, placeholder, className }: any) => (
      <textarea value={value} onChange={onChange} placeholder={placeholder} className={className} />
    ),
  };
});

// ── Mock gen-x-map ─────────────────────────────────────────────────────────

vi.mock("../lib/gen-x-map", () => ({
  GEN_X_MAP: {
    rizz: "Game / Mack Daddy",
    bussin: "Da Bomb / Phat",
    slay: "Fly / All That",
  },
}));

import { SlangApp } from "../components/slang-app";
import type { SlangEntry } from "../lib/types";

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<SlangEntry> = {}): SlangEntry {
  return {
    id: "rizz",
    term: "Rizz",
    definition: "Charisma or charm",
    example: "He has rizz",
    category: "compliment",
    vibe_score: 10,
    vibeScore: 10,
    origin: "Internet",
    era: "2022-present",
    aliases: [],
    generation: "gen-alpha",
    ...overrides,
  };
}

const allSlang: SlangEntry[] = [
  makeEntry({ id: "rizz", term: "Rizz", generation: "gen-alpha", category: "compliment" }),
  makeEntry({ id: "bussin", term: "Bussin", generation: "gen-alpha", category: "food", definition: "Very good food" }),
  makeEntry({ id: "slay", term: "Slay", generation: "gen-alpha", category: "compliment" }),
  makeEntry({ id: "no-cap", term: "No Cap", generation: "gen-alpha", category: "reaction", definition: "No lie" }),
  makeEntry({
    id: "rad",
    term: "Rad",
    generation: "gen-x",
    category: "compliment",
    definition: "Something cool",
    equivalents: { genAlpha: "Rizz" },
  }),
  makeEntry({
    id: "gnarly",
    term: "Gnarly",
    generation: "gen-x",
    category: "reaction",
    definition: "Awesome or extreme",
    equivalents: { genAlpha: "Bussin" },
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("SlangApp — DictionaryTab", () => {
  it("renders dictionary tab by default with all terms", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    // Use getAllByText since "Rizz" also appears as a gen-x equivalent in the Rad card
    expect(screen.getAllByText("Rizz").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bussin").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Rad")).toBeInTheDocument();
  });

  it("filters by search query", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    const input = screen.getByPlaceholderText(/Search slang/i);
    fireEvent.change(input, { target: { value: "bussin" } });

    expect(screen.getAllByText("Bussin").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Slay")).not.toBeInTheDocument();
    expect(screen.queryByText("Rad")).not.toBeInTheDocument();
  });

  it("filters by generation — Gen Alpha only", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    fireEvent.click(screen.getByRole("button", { name: "Gen Alpha" }));

    expect(screen.getAllByText("Rizz").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Rad")).not.toBeInTheDocument();
    expect(screen.queryByText("Gnarly")).not.toBeInTheDocument();
  });

  it("filters by generation — Gen X only", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    fireEvent.click(screen.getByRole("button", { name: "Gen X" }));

    expect(screen.getByText("Rad")).toBeInTheDocument();
    expect(screen.queryByText("Slay")).not.toBeInTheDocument();
    expect(screen.queryByText("No Cap")).not.toBeInTheDocument();
  });

  it("opens modal when a slang card is clicked", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    // Click the Rad card (gen-x) — it has a unique term text at the top level
    const radCard = screen.getByText("Rad").closest("div[class]")!;
    fireEvent.click(radCard);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows no-results message when filter matches nothing", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    const input = screen.getByPlaceholderText(/Search slang/i);
    fireEvent.change(input, { target: { value: "zzznomatch" } });

    expect(screen.getByText(/No slang found/i)).toBeInTheDocument();
  });
});

describe("SlangApp — TranslatorTab", () => {
  it("switches to translator tab and shows direction labels", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    fireEvent.click(screen.getByRole("tab", { name: /Translator/i }));

    // Both "Gen Alpha" and "Gen X" panel labels appear (input + output)
    expect(screen.getAllByText(/Gen Alpha/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Gen X/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows the translation textarea in translator tab", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    fireEvent.click(screen.getByRole("tab", { name: /Translator/i }));

    expect(
      screen.getByPlaceholderText(/Type or paste Gen Alpha slang/i),
    ).toBeInTheDocument();
  });

  it("shows placeholder text in the output panel before typing", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    fireEvent.click(screen.getByRole("tab", { name: /Translator/i }));

    expect(screen.getByText(/Translation appears here/i)).toBeInTheDocument();
  });

  it("swap button flips translation direction", () => {
    renderWithProviders(<SlangApp allSlang={allSlang} />);

    fireEvent.click(screen.getByRole("tab", { name: /Translator/i }));

    const swapBtn = screen.getByRole("button", { name: /Swap/i });
    fireEvent.click(swapBtn);

    // After swap, the textarea placeholder changes to "Gen X"
    expect(
      screen.getByPlaceholderText(/Type or paste Gen X slang/i),
    ).toBeInTheDocument();
  });
});
