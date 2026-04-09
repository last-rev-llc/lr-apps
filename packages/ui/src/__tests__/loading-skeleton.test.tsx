import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { LoadingSkeleton } from "../components/loading-skeleton";

describe("LoadingSkeleton", () => {
  it("renders with default line shape", () => {
    render(<LoadingSkeleton data-testid="skeleton" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveClass("animate-pulse");
    expect(el).toHaveClass("rounded");
  });

  it("renders circle shape", () => {
    render(<LoadingSkeleton shape="circle" size="md" data-testid="skeleton" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveClass("rounded-full");
    expect(el).toHaveClass("h-12");
    expect(el).toHaveClass("w-12");
  });

  it("renders card skeleton with inner elements", () => {
    render(<LoadingSkeleton shape="card" data-testid="skeleton" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveClass("rounded-xl");
    // Card renders child divs for the skeleton lines
    expect(el.querySelectorAll(".bg-muted").length).toBeGreaterThanOrEqual(3);
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<LoadingSkeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies custom width and height via style", () => {
    render(<LoadingSkeleton width={200} height={50} data-testid="skeleton" />);
    const el = screen.getByTestId("skeleton");
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("50px");
  });

  it("applies custom className", () => {
    render(<LoadingSkeleton className="my-class" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("my-class");
  });

  it("renders rect shape", () => {
    render(<LoadingSkeleton shape="rect" size="sm" data-testid="skeleton" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveClass("rounded-md");
    expect(el).toHaveClass("h-16");
  });
});
