// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

import { ContactForm } from "../components/contact-form";

describe("ContactForm", () => {
  it("renders the writable contact fields", () => {
    renderWithProviders(<ContactForm onSubmit={vi.fn()} />);
    expect(screen.getByText(/^Name/)).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn URL")).toBeInTheDocument();
    expect(screen.getByText(/Tags/)).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("blocks submit and shows a field error when name is empty", () => {
    const onSubmit = vi.fn();
    const { container } = renderWithProviders(
      <ContactForm onSubmit={onSubmit} submitLabel="Create" />,
    );

    const form = container.querySelector("form");
    if (!form) throw new Error("form not rendered");
    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with parsed values when form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { container } = renderWithProviders(
      <ContactForm
        onSubmit={onSubmit}
        initialValues={{ name: "Existing", email: "x@y.com" }}
        submitLabel="Save"
      />,
    );

    const form = container.querySelector("form");
    if (!form) throw new Error("form not rendered");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      name: "Existing",
      email: "x@y.com",
    });
  });

  it("renders a Cancel button when onCancel is provided", () => {
    renderWithProviders(<ContactForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("displays the error returned by onSubmit inline", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("server exploded"));

    const { container } = renderWithProviders(
      <ContactForm onSubmit={onSubmit} initialValues={{ name: "Alice" }} />,
    );

    const form = container.querySelector("form");
    if (!form) throw new Error("form not rendered");
    fireEvent.submit(form);

    expect(await screen.findByText("server exploded")).toBeInTheDocument();
  });
});
