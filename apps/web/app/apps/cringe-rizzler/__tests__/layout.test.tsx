// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

import CringeRizzlerLayout from "../layout";

describe("CringeRizzlerLayout", () => {
  it("renders children", () => {
    renderWithProviders(
      <CringeRizzlerLayout>
        <div>App Content</div>
      </CringeRizzlerLayout>
    );
    expect(screen.getByText("App Content")).toBeTruthy();
  });

  it("renders header with Cringe Rizzler title", () => {
    renderWithProviders(
      <CringeRizzlerLayout>
        <div>child</div>
      </CringeRizzlerLayout>
    );
    expect(screen.getByText(/Cringe Rizzler/)).toBeTruthy();
  });

  it("renders nav links: App, About, Dashboard", () => {
    renderWithProviders(
      <CringeRizzlerLayout>
        <div>child</div>
      </CringeRizzlerLayout>
    );
    expect(screen.getByText("App")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
    // Dashboard link has "← Dashboard" text
    expect(screen.getByText(/Dashboard/)).toBeTruthy();
  });

  it("renders skull emoji in header", () => {
    renderWithProviders(
      <CringeRizzlerLayout>
        <div>child</div>
      </CringeRizzlerLayout>
    );
    expect(screen.getByText(/💀/)).toBeTruthy();
  });
});
