import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { StatusBadge } from "../components/status-badge";

describe("StatusBadge", () => {
  it("renders with default neutral variant", () => {
    render(<StatusBadge>Status</StatusBadge>);
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Status")).toHaveClass("text-zinc-600");
  });

  it("applies semantic variant classes", () => {
    const { rerender } = render(<StatusBadge variant="success">OK</StatusBadge>);
    expect(screen.getByText("OK")).toHaveClass("text-emerald-600");

    rerender(<StatusBadge variant="error">Fail</StatusBadge>);
    expect(screen.getByText("Fail")).toHaveClass("text-red-600");

    rerender(<StatusBadge variant="warning">Warn</StatusBadge>);
    expect(screen.getByText("Warn")).toHaveClass("text-amber-600");

    rerender(<StatusBadge variant="info">Info</StatusBadge>);
    expect(screen.getByText("Info")).toHaveClass("text-blue-600");

    rerender(<StatusBadge variant="pending">Wait</StatusBadge>);
    expect(screen.getByText("Wait")).toHaveClass("animate-pulse");
  });

  it("renders dot indicator when dot prop is true", () => {
    render(<StatusBadge variant="success" dot>Active</StatusBadge>);
    const dot = screen.getByText("Active").querySelector("[aria-hidden='true']");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("bg-emerald-500");
  });

  it("does not render dot by default", () => {
    render(<StatusBadge variant="success">Active</StatusBadge>);
    const dot = screen.getByText("Active").querySelector("[aria-hidden='true']");
    expect(dot).toBeNull();
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<StatusBadge ref={ref}>Test</StatusBadge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("applies custom className", () => {
    render(<StatusBadge className="extra">Test</StatusBadge>);
    expect(screen.getByText("Test")).toHaveClass("extra");
  });
});
