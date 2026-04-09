// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

vi.mock("@repo/ui", () => ({
  Topbar: ({ title, children }: any) => (
    <header>
      <span>{title}</span>
      <nav>{children}</nav>
    </header>
  ),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import SlangTranslatorLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("SlangTranslatorLayout", () => {
  it("calls requireAppLayoutAccess with 'slang-translator'", async () => {
    const jsx = await SlangTranslatorLayout({ children: <div>child</div> });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("slang-translator");
  });

  it("renders children when authenticated", async () => {
    const jsx = await SlangTranslatorLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders the app title", async () => {
    const jsx = await SlangTranslatorLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    expect(screen.getByText(/Slang Translator/)).toBeInTheDocument();
  });

  it("renders App, About, and Dashboard nav links", async () => {
    const jsx = await SlangTranslatorLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    expect(screen.getByRole("link", { name: "App" })).toHaveAttribute(
      "href",
      "/apps/slang-translator",
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/apps/slang-translator/about",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      SlangTranslatorLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
