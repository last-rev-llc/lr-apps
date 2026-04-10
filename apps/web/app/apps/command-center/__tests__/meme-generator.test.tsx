// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(() => {
      callback([{ isIntersecting: true }], {});
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock canvas API
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineJoin: "",
    globalAlpha: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }),
  });

  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,mock");
  HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb) => cb(new Blob()));
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { MemeGeneratorApp } from "../meme-generator/components/meme-generator-app";

describe("MemeGeneratorApp", () => {
  it("renders the page header", () => {
    renderWithProviders(<MemeGeneratorApp />);

    expect(screen.getByText("😂 Meme Generator")).toBeInTheDocument();
    expect(screen.getByText("Create instant memes — no server needed")).toBeInTheDocument();
  });

  it("renders text input controls with default values", () => {
    renderWithProviders(<MemeGeneratorApp />);

    expect(screen.getByPlaceholderText("Top text…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Bottom text…")).toBeInTheDocument();

    const topInput = screen.getByPlaceholderText("Top text…") as HTMLInputElement;
    const bottomInput = screen.getByPlaceholderText("Bottom text…") as HTMLInputElement;
    expect(topInput.value).toBe("WHEN YOU FINALLY");
    expect(bottomInput.value).toBe("SHIP THE FEATURE");
  });

  it("renders template selector buttons", () => {
    renderWithProviders(<MemeGeneratorApp />);

    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
    expect(screen.getByText("Matrix")).toBeInTheDocument();
    expect(screen.getByText("Vaporwave")).toBeInTheDocument();
    expect(screen.getByText("Fire")).toBeInTheDocument();
    expect(screen.getByText("Ice Cold")).toBeInTheDocument();
    expect(screen.getByText("Classic")).toBeInTheDocument();
  });

  it("renders download and copy action buttons", () => {
    renderWithProviders(<MemeGeneratorApp />);

    expect(screen.getByText("⬇ Download")).toBeInTheDocument();
    expect(screen.getByText("📋 Copy")).toBeInTheDocument();
  });
});
