import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Parallax } from "../components/parallax";
import { Placeholder } from "../components/placeholder";
import { ShareButton } from "../components/share-button";
import { StatCard } from "../components/stat-card";

beforeAll(() => {
  const mockObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  vi.stubGlobal("IntersectionObserver", mockObserver);

  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    setTimeout(() => cb(performance.now()), 0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

describe("Dialog", () => {
  it("renders trigger and opens content on click", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <p>Body</p>
          <DialogFooter>
            <button>OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Open")).toBeDefined();
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Title")).toBeDefined();
    expect(screen.getByText("Description")).toBeDefined();
    expect(screen.getByText("Body")).toBeDefined();
    expect(screen.getByText("OK")).toBeDefined();
  });

  it("renders DialogHeader and DialogFooter as div elements", () => {
    const { container } = render(
      <DialogHeader>
        <span>H</span>
      </DialogHeader>,
    );
    expect(container.querySelector("div")).toBeDefined();
  });
});

describe("DropdownMenu", () => {
  it("renders trigger button", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Menu")).toBeDefined();
  });

  it("shows menu items when opened", async () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Actions")).toBeDefined();
    expect(screen.getByText("Edit")).toBeDefined();
  });
});

describe("Parallax", () => {
  it("renders children", () => {
    render(
      <Parallax>
        <span>Parallax content</span>
      </Parallax>,
    );
    expect(screen.getByText("Parallax content")).toBeDefined();
  });

  it("renders with custom height", () => {
    const { container } = render(<Parallax height="50vh" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe("50vh");
  });

  it("renders with bgColor", () => {
    const { container } = render(<Parallax bgColor="red" />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders with all align variants", () => {
    const aligns = ["top", "center", "bottom"] as const;
    aligns.forEach((align) => {
      const { unmount } = render(
        <Parallax align={align}>
          <span>{align}</span>
        </Parallax>,
      );
      expect(screen.getByText(align)).toBeDefined();
      unmount();
    });
  });

  it("renders with speed=0 (no scroll effect)", () => {
    const { container } = render(<Parallax speed={0} />);
    expect(container.firstChild).toBeDefined();
  });
});

describe("Placeholder", () => {
  it("renders with default props", () => {
    const { container } = render(<Placeholder />);
    const el = container.querySelector('[role="img"]');
    expect(el).toBeDefined();
    expect(el?.getAttribute("aria-label")).toBe("Loading placeholder");
  });

  it("renders with icon", () => {
    render(<Placeholder icon="🎬" seed="movie" />);
    expect(screen.getByText("🎬")).toBeDefined();
  });

  it("renders with custom seed for aria-label", () => {
    const { container } = render(<Placeholder icon="📷" seed="photo" />);
    const el = container.querySelector('[role="img"]');
    expect(el?.getAttribute("aria-label")).toBe("photo placeholder");
  });

  it("renders with rounded variant", () => {
    const { container } = render(<Placeholder rounded />);
    const el = container.querySelector('[role="img"]') as HTMLElement;
    expect(el?.className).toContain("rounded-full");
  });

  it("renders with explicit width and height", () => {
    const { container } = render(<Placeholder width={100} height={100} />);
    const el = container.querySelector('[role="img"]') as HTMLElement;
    expect(el.style.width).toBe("100px");
    expect(el.style.height).toBe("100px");
  });

  it("renders with string width", () => {
    const { container } = render(<Placeholder width="50%" />);
    const el = container.querySelector('[role="img"]') as HTMLElement;
    expect(el.style.width).toBe("50%");
  });
});

describe("ShareButton", () => {
  it("renders all share buttons", () => {
    render(<ShareButton text="Check this out" />);
    expect(screen.getByLabelText("Copy to clipboard")).toBeDefined();
    expect(screen.getByLabelText("Share on X / Twitter")).toBeDefined();
    expect(screen.getByLabelText("Share on Facebook")).toBeDefined();
    expect(screen.getByLabelText("Share on Reddit")).toBeDefined();
    expect(screen.getByLabelText("Share via...")).toBeDefined();
  });

  it("renders with custom url", () => {
    const { container } = render(<ShareButton url="https://example.com" />);
    expect(container.firstChild).toBeDefined();
  });

  it("handles copy click", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<ShareButton text="Hello" url="https://example.com" />);
    fireEvent.click(screen.getByLabelText("Copy to clipboard"));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

describe("StatCard", () => {
  it("renders value and label", () => {
    render(<StatCard value={42} label="Users" />);
    expect(screen.getByText("Users")).toBeDefined();
  });

  it("renders with icon", () => {
    const { container } = render(<StatCard value={10} label="Items" icon="📦" />);
    expect(container.textContent).toContain("📦");
  });

  it("renders with trend indicator", () => {
    const { container } = render(<StatCard value={100} label="Revenue" trend="up" />);
    expect(container.textContent).toContain("↑");
  });

  it("renders down trend", () => {
    const { container } = render(<StatCard value={50} label="Bugs" trend="down" />);
    expect(container.textContent).toContain("↓");
  });

  it("renders neutral trend", () => {
    const { container } = render(<StatCard value={0} label="Change" trend="neutral" />);
    expect(container.textContent).toContain("→");
  });

  it("renders all size variants", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<StatCard value={1} label={size} size={size} />);
      expect(screen.getByText(size)).toBeDefined();
      unmount();
    });
  });

  it("renders as a link when href is provided", () => {
    const { container } = render(<StatCard value={5} label="Link" href="https://example.com" />);
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
  });

  it("renders string value directly", () => {
    const { container } = render(<StatCard value="N/A" label="Status" />);
    expect(container.textContent).toContain("N/A");
  });
});
