import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsTable } from "../ResultsTable";
import type { ChatflowRunRow } from "../../schema";

function row(overrides: Partial<ChatflowRunRow>): ChatflowRunRow {
  return {
    id: "r-1",
    run_id: "run-1",
    uid: "u-1",
    position: 0,
    prompt: "What is the weather?",
    meta: null,
    status: "completed",
    response_text: null,
    response_json: null,
    langfuse_link: null,
    error: null,
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe("<ResultsTable>", () => {
  it("renders pretty-printed JSON when response_json is set", () => {
    const json = { a: 1, b: { c: 2 } };
    render(
      <ResultsTable
        rows={[row({ id: "j", response_json: json })]}
        baseTraceUrl="https://lf.example.com"
      />,
    );
    const cell = screen.getByTestId("results-row-response-j");
    expect(cell.getAttribute("data-format")).toBe("json");
    expect(cell.textContent).toBe(JSON.stringify(json, null, 2));
  });

  it("pretty-prints JSON when response_text parses as JSON", () => {
    render(
      <ResultsTable
        rows={[row({ id: "p", response_text: '{"k":"v"}' })]}
      />,
    );
    const cell = screen.getByTestId("results-row-response-p");
    expect(cell.getAttribute("data-format")).toBe("json");
    expect(cell.textContent).toBe('{\n  "k": "v"\n}');
  });

  it("falls back to plain text when response_text does not parse", () => {
    render(
      <ResultsTable
        rows={[row({ id: "t", response_text: "not json" })]}
      />,
    );
    const cell = screen.getByTestId("results-row-response-t");
    expect(cell.getAttribute("data-format")).toBe("text");
    expect(cell.textContent).toBe("not json");
  });

  it("renders a Langfuse anchor only when both langfuse_link and baseTraceUrl are set", () => {
    render(
      <ResultsTable
        rows={[
          row({
            id: "a",
            langfuse_link: "https://lf.example.com/traces?tag=u-1",
          }),
        ]}
        baseTraceUrl="https://lf.example.com"
      />,
    );
    expect(screen.getByTestId("results-row-langfuse-a")).toBeInTheDocument();
  });

  it("hides the Langfuse anchor when langfuse_link is null", () => {
    render(
      <ResultsTable
        rows={[row({ id: "n", langfuse_link: null })]}
        baseTraceUrl="https://lf.example.com"
      />,
    );
    expect(
      screen.queryByTestId("results-row-langfuse-n"),
    ).not.toBeInTheDocument();
  });

  it("hides the Langfuse anchor when baseTraceUrl is empty", () => {
    render(
      <ResultsTable
        rows={[
          row({
            id: "n",
            langfuse_link: "https://lf.example.com/traces?tag=u-1",
          }),
        ]}
      />,
    );
    expect(
      screen.queryByTestId("results-row-langfuse-n"),
    ).not.toBeInTheDocument();
  });
});
