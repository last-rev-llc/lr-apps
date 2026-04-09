// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

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
      className?: string;
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
      className?: string;
    }) => {
      const ctx = React.useContext(TabsContext);
      return ctx.value === value ? <div role="tabpanel">{children}</div> : null;
    },
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
      asChild,
      ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string; asChild?: boolean }) => (
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
  };
});

// Mock lib/actions
vi.mock("../../lib/actions", () => ({
  generatePhrase: vi.fn(),
  generateMemeCaption: vi.fn(),
}));

// Mock lib/utils
vi.mock("../../lib/utils", () => ({
  getRandomTerms: vi.fn(() => ["rizz", "sigma", "bussin"]),
}));

import { CringeApp } from "../cringe-app";
import { generatePhrase } from "../../lib/actions";
import { getRandomTerms } from "../../lib/utils";

const mockGeneratePhrase = vi.mocked(generatePhrase);
const mockGetRandomTerms = vi.mocked(getRandomTerms);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRandomTerms.mockReturnValue(["rizz", "sigma", "bussin"]);
  mockGeneratePhrase.mockResolvedValue({
    text: "This brisket is giving sigma rizz no cap fr fr.",
    terms: [
      { term: "rizz", def: "Charisma or charm" },
      { term: "sigma", def: "Independent, lone-wolf type" },
      { term: "bussin", def: "Really good, especially food" },
    ],
  });
});

describe("CringeApp", () => {
  it("renders page header with title", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByText("Cringe Rizzler")).toBeTruthy();
  });

  it("renders subtitle text", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByText(/Embarrass Gen Alpha/)).toBeTruthy();
  });

  it("renders all three tab triggers", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByText(/Phrases/)).toBeTruthy();
    expect(screen.getByText(/Memes/)).toBeTruthy();
    expect(screen.getByText(/Glossary/)).toBeTruthy();
  });

  it("shows Phrases tab by default with generate button", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByText(/Generate New Phrase/)).toBeTruthy();
  });

  it("shows empty state prompt on initial render", () => {
    renderWithProviders(<CringeApp />);
    expect(screen.getByText(/Hit the button to generate/)).toBeTruthy();
  });
});

describe("PhraseTab", () => {
  it("calls generatePhrase when generate button is clicked", async () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByText(/Generate New Phrase/));
    // The action was called via useTransition
    expect(mockGetRandomTerms).toHaveBeenCalledWith(3);
  });
});

describe("Tab switching", () => {
  it("switches to Memes tab", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByText(/Memes/));
    // Meme tab shows scenario description
    expect(screen.getByText(/Pick a scenario/)).toBeTruthy();
  });

  it("switches to Glossary tab and shows search", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByText(/Glossary/));
    expect(screen.getByPlaceholderText(/Search slang or definition/)).toBeTruthy();
  });

  it("switches to Glossary tab and shows terms", () => {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByText(/Glossary/));
    expect(screen.getByText("rizz")).toBeTruthy();
    expect(screen.getByText("sigma")).toBeTruthy();
    expect(screen.getByText("bussin")).toBeTruthy();
  });
});

describe("GlossaryTab", () => {
  function renderGlossary() {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByText(/Glossary/));
  }

  it("shows term count", () => {
    renderGlossary();
    expect(screen.getByText(/40 terms/)).toBeTruthy();
  });

  it("filters terms by search input", () => {
    renderGlossary();
    const searchInput = screen.getByPlaceholderText(/Search slang or definition/);
    fireEvent.change(searchInput, { target: { value: "rizz" } });
    expect(screen.getByText("rizz")).toBeTruthy();
    expect(screen.getByText(/1 term/)).toBeTruthy();
  });

  it("filters terms by definition search", () => {
    renderGlossary();
    const searchInput = screen.getByPlaceholderText(/Search slang or definition/);
    fireEvent.change(searchInput, { target: { value: "Greatest of all time" } });
    expect(screen.getByText("goat")).toBeTruthy();
  });

  it("filters by category dropdown", () => {
    renderGlossary();
    const select = screen.getByDisplayValue("All categories");
    fireEvent.change(select, { target: { value: "food" } });
    expect(screen.getByText("fanum tax")).toBeTruthy();
    expect(screen.getByText(/1 term/)).toBeTruthy();
  });

  it("shows empty state when no terms match search", () => {
    renderGlossary();
    const searchInput = screen.getByPlaceholderText(/Search slang or definition/);
    fireEvent.change(searchInput, { target: { value: "zzzznonexistent" } });
    expect(screen.getByText(/0 terms/)).toBeTruthy();
    expect(screen.getByText(/No slang found/)).toBeTruthy();
  });

  it("shows vibe scores", () => {
    renderGlossary();
    // goat has vibeScore 10
    expect(screen.getByText("10/10")).toBeTruthy();
  });
});

describe("MemeTab", () => {
  function renderMemes() {
    renderWithProviders(<CringeApp />);
    fireEvent.click(screen.getByText(/Memes/));
  }

  it("shows scenario buttons", () => {
    renderMemes();
    expect(screen.getByText(/texting my kids/)).toBeTruthy();
    expect(screen.getByText(/family dinner/)).toBeTruthy();
    expect(screen.getByText(/office meeting/)).toBeTruthy();
  });

  it("shows 10 scenario buttons", () => {
    renderMemes();
    const buttons = screen.getAllByText(/🎭/);
    expect(buttons).toHaveLength(10);
  });
});
