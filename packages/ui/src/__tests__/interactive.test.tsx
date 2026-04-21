import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

import { Search } from "../components/search";
import { FilterDrawer } from "../components/filter-drawer";
import { ViewToggle } from "../components/view-toggle";
import { StarRating } from "../components/star-rating";
import { PillList } from "../components/pill-list";
import { EditMode } from "../components/edit-mode";

describe("Search", () => {
  it("renders an input with placeholder", () => {
    render(<Search value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Search…")).toBeDefined();
  });

  it("renders with custom placeholder", () => {
    render(<Search value="" onChange={() => {}} placeholder="Find items" />);
    expect(screen.getByPlaceholderText("Find items")).toBeDefined();
  });

  it("displays the initial value", () => {
    render(<Search value="hello" onChange={() => {}} />);
    const input = screen.getByPlaceholderText("Search…") as HTMLInputElement;
    expect(input.value).toBe("hello");
  });

  it("calls onChange after debounce (debounce=0)", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<Search value="" onChange={onChange} debounce={0} />);
    const input = screen.getByPlaceholderText("Search…");
    fireEvent.change(input, { target: { value: "test" } });
    expect(onChange).toHaveBeenCalledWith("test");
    vi.useRealTimers();
  });
});

describe("FilterDrawer", () => {
  it("renders nothing visible when closed", () => {
    const { container } = render(
      <FilterDrawer open={false} onClose={() => {}} />,
    );
    const panel = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel?.className).toContain("translate-x-full");
  });

  it("renders visible when open", () => {
    const { container } = render(
      <FilterDrawer open={true} onClose={() => {}} title="Filters" />,
    );
    const panel = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel?.className).toContain("translate-x-0");
  });

  it("renders custom title", () => {
    render(<FilterDrawer open={true} onClose={() => {}} title="Sort Options" />);
    expect(screen.getByText("Sort Options")).toBeDefined();
  });

  it("renders children when open", () => {
    render(
      <FilterDrawer open={true} onClose={() => {}}>
        <div>Filter content</div>
      </FilterDrawer>,
    );
    expect(screen.getByText("Filter content")).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<FilterDrawer open={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ViewToggle", () => {
  it("renders grid and list toggle buttons", () => {
    render(<ViewToggle view="grid" onChange={() => {}} />);
    expect(screen.getByLabelText("Grid view")).toBeDefined();
    expect(screen.getByLabelText("List view")).toBeDefined();
  });

  it("marks the active view as pressed", () => {
    render(<ViewToggle view="list" onChange={() => {}} />);
    const listBtn = screen.getByLabelText("List view");
    expect(listBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onChange with grid when grid is clicked", () => {
    const onChange = vi.fn();
    render(<ViewToggle view="list" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Grid view"));
    expect(onChange).toHaveBeenCalledWith("grid");
  });

  it("calls onChange with list when list is clicked", () => {
    const onChange = vi.fn();
    render(<ViewToggle view="grid" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("List view"));
    expect(onChange).toHaveBeenCalledWith("list");
  });
});

describe("StarRating", () => {
  it("renders null when value is 0 and not interactive", () => {
    const { container } = render(<StarRating value={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders stars when interactive (onChange provided)", () => {
    render(<StarRating value={0} onChange={() => {}} />);
    expect(screen.getByLabelText("Rate 1 out of 5")).toBeDefined();
  });

  it("renders with value and no onChange (display mode)", () => {
    const { container } = render(<StarRating value={3} />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders with custom max", () => {
    render(<StarRating value={0} onChange={() => {}} max={3} />);
    expect(screen.getByLabelText("Rate 3 out of 3")).toBeDefined();
  });

  it("shows label when showLabel is true", () => {
    const { container } = render(<StarRating value={4} showLabel />);
    expect(container.textContent).toContain("4/5");
  });

  it("calls onChange when a star is clicked", () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Rate 3 out of 5"));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});

describe("PillList", () => {
  it("renders null when items list is empty", () => {
    const { container } = render(<PillList items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders string items", () => {
    render(<PillList items={["React", "TypeScript", "Vitest"]} />);
    expect(screen.getByText("React")).toBeDefined();
    expect(screen.getByText("TypeScript")).toBeDefined();
    expect(screen.getByText("Vitest")).toBeDefined();
  });

  it("renders PillItem objects", () => {
    const items = [{ label: "Pro", icon: "⭐" }, { label: "Beta" }];
    render(<PillList items={items} />);
    expect(screen.getByText("Pro")).toBeDefined();
    expect(screen.getByText("Beta")).toBeDefined();
  });

  it("highlights selected pill", () => {
    const { container } = render(
      <PillList items={["React", "Vue"]} selected="React" />,
    );
    const spans = container.querySelectorAll("span");
    expect(spans[0]?.className).toContain("amber");
  });

  it("renders sm size variant", () => {
    const { container } = render(
      <PillList items={["Tag"]} size="sm" />,
    );
    expect(container.querySelector("span")?.className).toContain("text-xs");
  });

  it("calls onSelect when a pill is clicked", () => {
    const onSelect = vi.fn();
    render(<PillList items={["React", "Vue"]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Vue"));
    expect(onSelect).toHaveBeenCalledWith("Vue");
  });
});

describe("EditMode", () => {
  it("renders the current value in display mode", () => {
    render(<EditMode value="My Value" onSave={() => {}} />);
    expect(screen.getByText("My Value")).toBeDefined();
  });

  it("renders an Edit button", () => {
    render(<EditMode value="Text" onSave={() => {}} />);
    expect(screen.getByLabelText("Edit")).toBeDefined();
  });

  it("renders label when provided", () => {
    render(<EditMode value="Text" onSave={() => {}} label="Name" />);
    expect(screen.getByText("Name")).toBeDefined();
  });

  it("shows input when edit button is clicked", () => {
    render(<EditMode value="Hello" onSave={() => {}} />);
    fireEvent.click(screen.getByLabelText("Edit"));
    expect(screen.getByDisplayValue("Hello")).toBeDefined();
  });

  it("calls onSave with updated value", () => {
    const onSave = vi.fn();
    render(<EditMode value="Old" onSave={onSave} />);
    fireEvent.click(screen.getByLabelText("Edit"));
    const input = screen.getByDisplayValue("Old");
    fireEvent.change(input, { target: { value: "New" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith("New");
  });

  it("cancels edit and restores original value", () => {
    render(<EditMode value="Original" onSave={() => {}} />);
    fireEvent.click(screen.getByLabelText("Edit"));
    const input = screen.getByDisplayValue("Original");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Original")).toBeDefined();
  });

  it("renders textarea type", () => {
    render(<EditMode value="Text" onSave={() => {}} type="textarea" />);
    fireEvent.click(screen.getByLabelText("Edit"));
    expect(screen.getByDisplayValue("Text").tagName).toBe("TEXTAREA");
  });
});
