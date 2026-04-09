// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => {
  const TabsContext = React.createContext<{ value: string; setValue: (v: string) => void }>({
    value: "phrases",
    setValue: () => {},
  });

  function Tabs({ children, defaultValue }: any) {
    const [value, setValue] = React.useState(defaultValue ?? "phrases");
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
    Badge: ({ children, className, variant, style }: any) => (
      <span className={className} data-variant={variant} style={style}>{children}</span>
    ),
    Button: ({ children, onClick, disabled, className, variant, size, "aria-label": ariaLabel }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} data-variant={variant} data-size={size} aria-label={ariaLabel}>
        {children}
      </button>
    ),
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  };
});

// ── Mock server actions ────────────────────────────────────────────────────

vi.mock("../lib/actions", () => ({
  generatePhrase: vi.fn(),
  generateMemeCaption: vi.fn(),
}));

// ── Mock utils ─────────────────────────────────────────────────────────────

vi.mock("../lib/utils", () => ({
  getRandomTerms: vi.fn(),
}));

import { CringeApp } from "../components/cringe-app";
import { generatePhrase, generateMemeCaption } from "../lib/actions";
import { getRandomTerms } from "../lib/utils";

const mockGeneratePhrase = vi.mocked(generatePhrase);
const mockGetRandomTerms = vi.mocked(getRandomTerms);

const MOCK_PHRASE = {
  text: "This brisket is giving sigma rizz no cap fr fr.",
  terms: [
    { term: "sigma", def: "Independent, lone-wolf type personality" },
    { term: "rizz", def: "Charisma or charm, especially romantic" },
    { term: "no cap", def: "No lie, for real" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRandomTerms.mockReturnValue(["sigma", "rizz", "no cap"]);
  mockGeneratePhrase.mockResolvedValue(MOCK_PHRASE);
  vi.mocked(generateMemeCaption).mockResolvedValue({
    topText: "WHEN DAD SAYS BUSSIN",
    bottomText: "NO CAP FR FR",
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CringeApp — structure", () => {
  it("renders the Cringe Rizzler heading", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByText("Cringe Rizzler")).toBeInTheDocument();
  });

  it("renders the three tab triggers", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByRole("tab", { name: /Phrases/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Memes/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Glossary/i })).toBeInTheDocument();
  });

  it("shows Phrases tab panel by default", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByRole("tab", { name: /Phrases/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /Generate New Phrase/i })).toBeInTheDocument();
  });
});

describe("CringeApp — tab switching", () => {
  it("switches to Glossary tab and shows search input", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByRole("tab", { name: /Glossary/i }));
    expect(screen.getByPlaceholderText(/Search slang or definition/i)).toBeInTheDocument();
  });

  it("switches to Memes tab and shows scenarios", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByRole("tab", { name: /Memes/i }));
    expect(screen.getByRole("button", { name: /texting my kids/i })).toBeInTheDocument();
  });
});

describe("CringeApp — Glossary tab", () => {
  it("renders glossary terms from slang data", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByRole("tab", { name: /Glossary/i }));
    // SLANG_GLOSSARY has 40 items; at least a few should appear
    expect(screen.getByText("rizz")).toBeInTheDocument();
    expect(screen.getByText("sigma")).toBeInTheDocument();
    expect(screen.getByText("bussin")).toBeInTheDocument();
  });

  it("filters glossary by search input", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByRole("tab", { name: /Glossary/i }));

    const input = screen.getByPlaceholderText(/Search slang or definition/i);
    fireEvent.change(input, { target: { value: "bussin" } });

    expect(screen.getByText("bussin")).toBeInTheDocument();
    expect(screen.queryByText("sigma")).not.toBeInTheDocument();
  });

  it("shows no-results message when search matches nothing", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByRole("tab", { name: /Glossary/i }));

    const input = screen.getByPlaceholderText(/Search slang or definition/i);
    fireEvent.change(input, { target: { value: "zzznomatch" } });

    expect(screen.getByText(/No slang found/i)).toBeInTheDocument();
  });

  it("shows term count", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByRole("tab", { name: /Glossary/i }));
    expect(screen.getByText(/term/i)).toBeInTheDocument();
  });
});
