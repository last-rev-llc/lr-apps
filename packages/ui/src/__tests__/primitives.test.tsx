import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

import { Button, buttonVariants } from "../components/button";
import { Badge } from "../components/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/card";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { Textarea } from "../components/textarea";
import { Separator } from "../components/separator";
import { Avatar, AvatarFallback } from "../components/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("renders destructive variant", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.querySelector("button")?.className).toContain("destructive");
  });

  it("renders outline variant", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    expect(container.querySelector("button")?.className).toContain("outline");
  });

  it("renders secondary variant", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    expect(container.querySelector("button")?.className).toContain("secondary");
  });

  it("renders ghost variant", () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    expect(container.querySelector("button")?.className).toContain("hover:bg-accent");
  });

  it("renders link variant", () => {
    const { container } = render(<Button variant="link">Link</Button>);
    expect(container.querySelector("button")?.className).toContain("underline-offset-4");
  });

  it("renders sm size", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.querySelector("button")?.className).toContain("h-8");
  });

  it("renders lg size", () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.querySelector("button")?.className).toContain("h-10");
  });

  it("renders icon size", () => {
    const { container } = render(<Button size="icon">X</Button>);
    expect(container.querySelector("button")?.className).toContain("h-9 w-9");
  });

  it("renders as a child element with asChild prop", () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>,
    );
    expect(screen.getByText("Home").tagName).toBe("A");
  });

  it("buttonVariants returns class string for given variant", () => {
    const cls = buttonVariants({ variant: "destructive" });
    expect(cls).toContain("destructive");
  });
});

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeDefined();
  });

  it("renders secondary variant", () => {
    const { container } = render(<Badge variant="secondary">Beta</Badge>);
    expect(container.querySelector("div")?.className).toContain("secondary");
  });

  it("renders destructive variant", () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.querySelector("div")?.className).toContain("destructive");
  });

  it("renders outline variant", () => {
    const { container } = render(<Badge variant="outline">Draft</Badge>);
    expect(container.querySelector("div")?.className).toContain("outline");
  });
});

describe("Card", () => {
  it("renders card with all sub-components", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeDefined();
    expect(screen.getByText("Description")).toBeDefined();
    expect(screen.getByText("Content")).toBeDefined();
    expect(screen.getByText("Footer")).toBeDefined();
  });
});

describe("Input", () => {
  it("renders an input element", () => {
    const { container } = render(<Input placeholder="Enter text" />);
    expect(container.querySelector("input")).toBeDefined();
  });

  it("accepts type prop", () => {
    const { container } = render(<Input type="email" />);
    expect(container.querySelector("input")?.type).toBe("email");
  });
});

describe("Label", () => {
  it("renders label text", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeDefined();
  });
});

describe("Textarea", () => {
  it("renders a textarea element", () => {
    const { container } = render(<Textarea placeholder="Type here" />);
    expect(container.querySelector("textarea")).toBeDefined();
  });
});

describe("Separator", () => {
  it("renders a separator element", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders vertical separator", () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toBeDefined();
  });
});

describe("Avatar", () => {
  it("renders avatar with fallback", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("AB")).toBeDefined();
  });
});

describe("Tabs", () => {
  it("renders tabs with content", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Tab 1")).toBeDefined();
    expect(screen.getByText("Content 1")).toBeDefined();
  });
});
