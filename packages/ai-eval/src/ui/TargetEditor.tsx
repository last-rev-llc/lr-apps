"use client";

import * as React from "react";
import type { ChatflowTargetInput, ChatflowTargetOutput } from "../schema";

export interface TargetEditorProps {
  open: boolean;
  onClose: () => void;
  /**
   * If set, the form is in "edit existing target" mode. The existing api_token
   * value is NEVER read into client state — there is no `api_token` field on
   * `ChatflowTargetOutput`. The token input always starts empty; leaving it
   * empty on submit means "keep the existing encrypted token".
   */
  existingTarget?: ChatflowTargetOutput;
  /** csv mode shows the prompt-template field. */
  mode?: "eval" | "csv";
  onSubmit: (input: ChatflowTargetInput) => void;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function TargetEditor({
  open,
  onClose,
  existingTarget,
  mode = "eval",
  onSubmit,
}: TargetEditorProps) {
  const [name, setName] = React.useState(existingTarget?.name ?? "");
  const [apiHost, setApiHost] = React.useState(existingTarget?.api_host ?? "");
  const [chatflowId, setChatflowId] = React.useState(
    existingTarget?.chatflow_id ?? "",
  );
  // Token input MUST start empty even when editing — the existing value is
  // never sent down the wire.
  const [apiToken, setApiToken] = React.useState("");
  const [baseTraceUrl, setBaseTraceUrl] = React.useState(
    existingTarget?.base_trace_url ?? "",
  );
  const [defaultTag, setDefaultTag] = React.useState(
    existingTarget?.default_tag ?? "",
  );
  const [promptTemplate, setPromptTemplate] = React.useState(
    existingTarget?.prompt_template ?? "",
  );

  if (!open) return null;

  const apiHostValid = isValidUrl(apiHost);
  const baseTraceUrlValid =
    baseTraceUrl.length === 0 || isValidUrl(baseTraceUrl);
  const nameValid = name.trim().length > 0;
  const chatflowIdValid = chatflowId.trim().length > 0;
  const tokenValid = existingTarget
    ? true // empty means "keep existing"
    : apiToken.length > 0;
  const canSubmit =
    nameValid &&
    apiHostValid &&
    baseTraceUrlValid &&
    chatflowIdValid &&
    tokenValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const input: ChatflowTargetInput = {
      name: name.trim(),
      api_host: apiHost.trim(),
      chatflow_id: chatflowId.trim(),
      base_trace_url:
        baseTraceUrl.trim().length === 0 ? null : baseTraceUrl.trim(),
      default_tag: defaultTag.trim().length === 0 ? null : defaultTag.trim(),
      prompt_template:
        promptTemplate.trim().length === 0 ? null : promptTemplate.trim(),
    };
    if (apiToken.length > 0) {
      input.api_token = apiToken;
    }
    onSubmit(input);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="target-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg border border-border bg-card text-card-foreground shadow-lg"
      >
        <div className="border-b border-border px-6 py-4">
          <h2
            id="target-editor-title"
            className="text-lg font-semibold leading-none tracking-tight"
          >
            {existingTarget ? "Edit chatflow target" : "Add chatflow target"}
          </h2>
        </div>

        <div className="space-y-4 px-6 py-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">API host</span>
            <input
              type="url"
              value={apiHost}
              onChange={(e) => setApiHost(e.target.value)}
              placeholder="https://flowise.example.com"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            {apiHost.length > 0 && !apiHostValid ? (
              <span className="mt-1 block text-xs text-destructive">
                Must be a valid URL
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Chatflow ID
            </span>
            <input
              type="text"
              value={chatflowId}
              onChange={(e) => setChatflowId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <div className="block">
            <label htmlFor="target-editor-api-token">
              <span className="text-sm font-medium text-foreground">
                API token
              </span>
            </label>
            <input
              id="target-editor-api-token"
              type="password"
              autoComplete="new-password"
              placeholder={existingTarget ? "•••••••" : ""}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            {existingTarget ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                Token: ••• (leave blank to keep)
              </span>
            ) : null}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Base trace URL
            </span>
            <input
              type="url"
              value={baseTraceUrl}
              onChange={(e) => setBaseTraceUrl(e.target.value)}
              placeholder="https://cloud.langfuse.com"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            {baseTraceUrl.length > 0 && !baseTraceUrlValid ? (
              <span className="mt-1 block text-xs text-destructive">
                Must be a valid URL
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Default tag
            </span>
            <input
              type="text"
              value={defaultTag}
              onChange={(e) => setDefaultTag(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          {mode === "csv" ? (
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Prompt template
              </span>
              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save target
          </button>
        </div>
      </form>
    </div>
  );
}
