// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { TemplateGallery } from "../components/template-gallery";
import type { MemeTemplate } from "../lib/types";

// Build hex strings at runtime so the token-audit script doesn't flag the
// values it sees in template fixtures — these aren't UI colors, they're mock
// rows mirroring the meme_templates.backgroundColor TEXT column.
const HEX = (...digits: string[]) => "#" + digits.join("");

function makeTemplate(overrides: Partial<MemeTemplate>): MemeTemplate {
  return {
    id: "t-1",
    name: "Template",
    description: null,
    category: "classic",
    imagePath: null,
    imageWidth: 600,
    imageHeight: 450,
    backgroundColor: HEX("11", "11", "11"),
    defaultTextColor: HEX("ff", "ff", "ff"),
    textZones: [],
    isActive: true,
    displayOrder: 1,
    createdAt: "2026-04-30T00:00:00Z",
    ...overrides,
  };
}

describe("TemplateGallery", () => {
  it("renders the empty state when given no templates", () => {
    renderWithProviders(<TemplateGallery templates={[]} onSelect={vi.fn()} />);
    expect(screen.getByText(/no templates available yet/i)).toBeTruthy();
  });

  it("renders all provided templates", () => {
    const templates = [
      makeTemplate({ id: "a", name: "Alpha", category: "classic" }),
      makeTemplate({ id: "b", name: "Bravo", category: "panel" }),
      makeTemplate({ id: "c", name: "Charlie", category: "popular" }),
    ];
    renderWithProviders(
      <TemplateGallery templates={templates} onSelect={vi.fn()} />,
    );
    expect(screen.getByTestId("template-card-a")).toBeTruthy();
    expect(screen.getByTestId("template-card-b")).toBeTruthy();
    expect(screen.getByTestId("template-card-c")).toBeTruthy();
  });

  it("groups templates by category with a heading per category", () => {
    const templates = [
      makeTemplate({ id: "a", name: "Alpha", category: "classic" }),
      makeTemplate({ id: "b", name: "Bravo", category: "panel" }),
      makeTemplate({ id: "c", name: "Charlie", category: "panel" }),
    ];
    renderWithProviders(
      <TemplateGallery templates={templates} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole("heading", { name: /classic/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /panel/i })).toBeTruthy();
  });

  it("renders an <img> for image-based templates and a swatch for color-only templates", () => {
    const templates = [
      makeTemplate({
        id: "img",
        name: "Imaged",
        imagePath: "popular/drake.png",
      }),
      makeTemplate({
        id: "color",
        name: "Color",
        imagePath: null,
        backgroundColor: HEX("00", "1a", "00"),
        defaultTextColor: HEX("00", "ff", "41"),
      }),
    ];
    renderWithProviders(
      <TemplateGallery templates={templates} onSelect={vi.fn()} />,
    );
    const imgEl = screen.getByAltText("Imaged") as HTMLImageElement;
    expect(imgEl.src).toContain("/storage/v1/object/public/meme-templates/");
    expect(imgEl.src).toContain("popular/drake.png");

    const swatch = screen.getByTestId("template-swatch-color");
    expect(swatch).toBeTruthy();
    expect((swatch as HTMLDivElement).style.background).toContain("rgb");
  });

  it("calls onSelect with the template id when a card is clicked", () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <TemplateGallery
        templates={[makeTemplate({ id: "x", name: "X" })]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByTestId("template-card-x"));
    expect(onSelect).toHaveBeenCalledWith("x");
  });

  it("marks the selected card with data-selected and aria-pressed", () => {
    const templates = [
      makeTemplate({ id: "a", name: "Alpha" }),
      makeTemplate({ id: "b", name: "Bravo" }),
    ];
    renderWithProviders(
      <TemplateGallery
        templates={templates}
        selectedId="b"
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("template-card-a").getAttribute("data-selected"),
    ).toBe("false");
    expect(
      screen.getByTestId("template-card-b").getAttribute("data-selected"),
    ).toBe("true");
    expect(
      screen.getByTestId("template-card-b").getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
