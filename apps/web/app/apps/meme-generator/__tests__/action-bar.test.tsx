// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { ActionBar } from "../components/action-bar";

describe("ActionBar", () => {
  it("renders Save, Download, and Copy buttons", () => {
    renderWithProviders(
      <ActionBar onSave={vi.fn()} onDownload={vi.fn()} onCopy={vi.fn()} />,
    );
    expect(screen.getByTestId("action-save")).toBeTruthy();
    expect(screen.getByTestId("action-download")).toBeTruthy();
    expect(screen.getByTestId("action-copy")).toBeTruthy();
  });

  it("invokes the corresponding handler when each button is clicked", () => {
    const onSave = vi.fn();
    const onDownload = vi.fn();
    const onCopy = vi.fn();
    renderWithProviders(
      <ActionBar onSave={onSave} onDownload={onDownload} onCopy={onCopy} />,
    );
    fireEvent.click(screen.getByTestId("action-save"));
    fireEvent.click(screen.getByTestId("action-download"));
    fireEvent.click(screen.getByTestId("action-copy"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("disables Save when saveDisabled is true", () => {
    renderWithProviders(
      <ActionBar
        saveDisabled
        onSave={vi.fn()}
        onDownload={vi.fn()}
        onCopy={vi.fn()}
      />,
    );
    expect(
      (screen.getByTestId("action-save") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("shows a Saving… label while saving", () => {
    renderWithProviders(
      <ActionBar
        saving
        onSave={vi.fn()}
        onDownload={vi.fn()}
        onCopy={vi.fn()}
      />,
    );
    expect(screen.getByTestId("action-save").textContent).toMatch(/Saving/i);
  });
});
