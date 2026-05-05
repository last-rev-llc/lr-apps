import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TargetEditor } from "../TargetEditor";
import type { ChatflowTargetOutput } from "../../schema";

const existing: ChatflowTargetOutput = {
  id: "t-1",
  user_id: "u-1",
  name: "Production",
  api_host: "https://flowise.example.com",
  chatflow_id: "cf-1",
  base_trace_url: "https://lf.example.com",
  default_tag: "prod",
  prompt_template: null,
  streaming: false,
  createdAt: "2026-05-04T00:00:00Z",
  updatedAt: "2026-05-04T00:00:00Z",
};

describe("<TargetEditor>", () => {
  it("renders an empty api token input even when existingTarget is provided", () => {
    render(
      <TargetEditor
        open
        existingTarget={existing}
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );
    const tokenInput = screen.getByLabelText(/api token/i) as HTMLInputElement;
    expect(tokenInput.value).toBe("");
    expect(tokenInput.getAttribute("defaultValue")).toBeNull();
    expect(screen.getByText(/leave blank to keep/i)).toBeInTheDocument();
  });

  it("renders an empty api token input when no existing target is provided", () => {
    render(
      <TargetEditor open onClose={() => {}} onSubmit={() => {}} />,
    );
    const tokenInput = screen.getByLabelText(/api token/i) as HTMLInputElement;
    expect(tokenInput.value).toBe("");
  });

  it("disables submit until the URL fields validate", () => {
    render(
      <TargetEditor open onClose={() => {}} onSubmit={() => {}} />,
    );
    const submit = screen.getByRole("button", {
      name: /save target/i,
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Local" },
    });
    fireEvent.change(screen.getByLabelText(/api host/i), {
      target: { value: "not-a-url" },
    });
    fireEvent.change(screen.getByLabelText(/chatflow id/i), {
      target: { value: "cf-1" },
    });
    fireEvent.change(screen.getByLabelText(/api token/i), {
      target: { value: "tok" },
    });
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/api host/i), {
      target: { value: "https://flowise.example.com" },
    });
    expect(submit.disabled).toBe(false);
  });

  it("does NOT include api_token in the submit payload when token input is left blank in edit mode", () => {
    const onSubmit = vi.fn();
    render(
      <TargetEditor
        open
        existingTarget={existing}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).not.toHaveProperty("api_token");
  });

  it("includes api_token in the submit payload when the token input is filled", () => {
    const onSubmit = vi.fn();
    render(
      <TargetEditor
        open
        existingTarget={existing}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText(/api token/i), {
      target: { value: "rotated" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ api_token: "rotated" }),
    );
  });
});
