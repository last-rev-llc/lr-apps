// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import SlangTranslatorLayout from "../layout";

const mockRequireAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAccess.mockResolvedValue(undefined);
});

describe("SlangTranslatorLayout", () => {
  it("calls requireAppLayoutAccess with 'slang-translator'", async () => {
    const ui = await SlangTranslatorLayout({ children: <div>child</div> });
    renderWithProviders(ui);
    expect(mockRequireAccess).toHaveBeenCalledWith("slang-translator");
  });

  it("renders children when authorized", async () => {
    const ui = await SlangTranslatorLayout({ children: <div>App Content</div> });
    renderWithProviders(ui);
    expect(screen.getByText("App Content")).toBeTruthy();
  });

  it("throws when requireAppLayoutAccess rejects (unauthorized)", async () => {
    mockRequireAccess.mockRejectedValue(new Error("Unauthorized"));
    await expect(
      SlangTranslatorLayout({ children: <div>child</div> })
    ).rejects.toThrow("Unauthorized");
  });

  it("renders nav links: App, About, Dashboard", async () => {
    const ui = await SlangTranslatorLayout({ children: <div>child</div> });
    renderWithProviders(ui);
    expect(screen.getByText("App")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("renders header title with emoji", async () => {
    const ui = await SlangTranslatorLayout({ children: <div>child</div> });
    renderWithProviders(ui);
    expect(screen.getByText(/🗣️ Slang Translator/)).toBeTruthy();
  });
});
