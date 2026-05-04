"use client";

import * as React from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import type { ChatflowRunRow } from "../schema";

export interface ResultsTableProps {
  rows: ChatflowRunRow[];
  /**
   * The target's `base_trace_url`. The Langfuse anchor is only rendered when
   * BOTH this value is set AND the row has a non-null `langfuse_link`.
   */
  baseTraceUrl?: string | null;
  onRerun?: (rowId: string) => void;
  rowHeight?: number;
  height?: number;
}

const STATUS_TONE: Record<
  ChatflowRunRow["status"],
  { dot: string; pill: string }
> = {
  queued: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground",
  },
  running: {
    dot: "bg-primary",
    pill: "bg-primary/10 text-primary",
  },
  completed: {
    dot: "bg-primary",
    pill: "bg-primary/10 text-primary",
  },
  errored: {
    dot: "bg-destructive",
    pill: "bg-destructive/10 text-destructive",
  },
  cancelled: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground",
  },
};

function StatusPill({ status }: { status: ChatflowRunRow["status"] }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${tone.pill}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${tone.dot}`}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

function formatResponse(row: ChatflowRunRow): {
  text: string;
  isJson: boolean;
} {
  if (row.response_json) {
    return { text: JSON.stringify(row.response_json, null, 2), isJson: true };
  }
  if (row.response_text) {
    try {
      const parsed = JSON.parse(row.response_text);
      return { text: JSON.stringify(parsed, null, 2), isJson: true };
    } catch {
      return { text: row.response_text, isJson: false };
    }
  }
  return { text: "", isJson: false };
}

export function ResultsTable({
  rows,
  baseTraceUrl,
  onRerun,
  rowHeight = 96,
  height = 480,
}: ResultsTableProps) {
  const Row = React.useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const row = rows[index];
      const { text, isJson } = formatResponse(row);
      const showLangfuse = !!baseTraceUrl && !!row.langfuse_link;
      return (
        <div
          style={style}
          className="grid grid-cols-[7rem_minmax(0,1fr)_8rem_4rem] items-start gap-4 border-b border-border px-4 py-2 text-sm text-foreground"
          data-testid={`results-row-${row.id}`}
        >
          <div className="flex flex-col gap-1">
            <StatusPill status={row.status} />
            <span className="text-xs text-muted-foreground">
              #{row.position}
            </span>
          </div>
          <div className="min-w-0">
            {row.error ? (
              <div className="text-xs text-destructive">{row.error}</div>
            ) : null}
            {text.length > 0 ? (
              isJson ? (
                <pre
                  data-testid={`results-row-response-${row.id}`}
                  data-format="json"
                  className="max-h-24 overflow-auto whitespace-pre-wrap rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {text}
                </pre>
              ) : (
                <div
                  data-testid={`results-row-response-${row.id}`}
                  data-format="text"
                  className="max-h-24 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground"
                >
                  {text}
                </div>
              )
            ) : null}
          </div>
          <div className="text-xs">
            {showLangfuse ? (
              <a
                href={row.langfuse_link!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
                data-testid={`results-row-langfuse-${row.id}`}
              >
                View trace
              </a>
            ) : null}
          </div>
          <div className="flex justify-end">
            {onRerun ? (
              <button
                type="button"
                onClick={() => onRerun(row.id)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
              >
                Re-run
              </button>
            ) : null}
          </div>
        </div>
      );
    },
    [rows, baseTraceUrl, onRerun],
  );

  return (
    <div className="rounded-md border border-border bg-card text-card-foreground">
      <div className="grid grid-cols-[7rem_minmax(0,1fr)_8rem_4rem] gap-4 border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Status</span>
        <span>Response</span>
        <span>Trace</span>
        <span className="text-right">Actions</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">No rows.</div>
      ) : (
        <FixedSizeList
          height={height}
          width="100%"
          itemCount={rows.length}
          itemSize={rowHeight}
          overscanCount={4}
        >
          {Row}
        </FixedSizeList>
      )}
    </div>
  );
}
