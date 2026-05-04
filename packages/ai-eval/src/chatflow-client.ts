import "server-only";

const BEARER_REGEX = /Bearer\s+[A-Za-z0-9._\-+/=]+/g;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redact(text: string, apiToken: string): string {
  let out = text.replace(BEARER_REGEX, "Bearer [REDACTED]");
  if (apiToken) {
    out = out.replace(new RegExp(escapeRegex(apiToken), "g"), "[REDACTED]");
  }
  return out;
}

export class ChatflowHTTPError extends Error {
  readonly status: number;
  readonly bodyExcerpt: string;
  readonly cause?: unknown;

  constructor(status: number, bodyExcerpt: string, cause?: unknown) {
    super(`Chatflow HTTP ${status}: ${bodyExcerpt.slice(0, 200)}`);
    this.name = "ChatflowHTTPError";
    this.status = status;
    this.bodyExcerpt = bodyExcerpt;
    this.cause = cause;
  }
}

export class ChatflowNetworkError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ChatflowNetworkError";
    this.cause = cause;
  }
}

export interface CallChatflowOptions {
  apiHost: string;
  apiToken: string;
  chatflowId: string;
  question: string;
  chatId: string;
  trackingMetadata: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface CallChatflowResult {
  text: string;
  raw: unknown;
}

export async function callChatflow(
  opts: CallChatflowOptions,
): Promise<CallChatflowResult> {
  const {
    apiHost,
    apiToken,
    chatflowId,
    question,
    chatId,
    trackingMetadata,
    signal,
  } = opts;

  const normalizedHost = apiHost.replace(/\/+$/, "");
  const url = `${normalizedHost}/api/v1/prediction/${encodeURIComponent(
    chatflowId,
  )}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        streaming: false,
        chatId,
        trackingMetadata,
      }),
      signal,
    });
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "AbortError") {
      throw err;
    }
    const message = (err as Error | null)?.message ?? "network error";
    throw new ChatflowNetworkError(redact(message, apiToken), err);
  }

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      bodyText = "";
    }
    const excerpt = redact(bodyText.slice(0, 500), apiToken);
    throw new ChatflowHTTPError(response.status, excerpt);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    throw new ChatflowHTTPError(response.status, "malformed JSON response", err);
  }

  const record = data as { text?: unknown; response?: unknown } | null;
  let text: string;
  if (record && typeof record.text === "string") {
    text = record.text;
  } else if (record && typeof record.response === "string") {
    text = record.response;
  } else {
    text = JSON.stringify(data);
  }

  return { text, raw: data };
}
