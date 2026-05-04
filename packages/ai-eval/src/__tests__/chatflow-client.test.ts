import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChatflowHTTPError,
  ChatflowNetworkError,
  callChatflow,
} from "../chatflow-client";

const TOKEN = "secret-token-123";

const baseOpts = {
  apiHost: "https://chat.example.com",
  apiToken: TOKEN,
  chatflowId: "abc",
  question: "What is 1 + 1?",
  chatId: "chat-1",
  trackingMetadata: {},
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("callChatflow", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns text from a successful response and sends the auth header", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { text: "hello" }));
    const result = await callChatflow(baseOpts);
    expect(result.text).toBe("hello");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://chat.example.com/api/v1/prediction/abc");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      question: baseOpts.question,
      streaming: false,
      chatId: baseOpts.chatId,
      trackingMetadata: {},
    });
  });

  it("normalizes a trailing slash in apiHost", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { text: "ok" }));
    await callChatflow({ ...baseOpts, apiHost: "https://chat.example.com//" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://chat.example.com/api/v1/prediction/abc",
    );
  });

  it("throws ChatflowHTTPError with status on 4xx", async () => {
    fetchMock.mockResolvedValue(
      new Response("bad input", { status: 400 }),
    );
    await expect(callChatflow(baseOpts)).rejects.toMatchObject({
      name: "ChatflowHTTPError",
      status: 400,
    });
  });

  it("throws ChatflowHTTPError with status on 5xx", async () => {
    fetchMock.mockResolvedValue(
      new Response("upstream down", { status: 503 }),
    );
    await expect(callChatflow(baseOpts)).rejects.toMatchObject({
      name: "ChatflowHTTPError",
      status: 503,
    });
  });

  it("propagates AbortError when the signal is aborted", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_input: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );

    const promise = callChatflow({ ...baseOpts, signal: controller.signal });
    setTimeout(() => controller.abort(), 0);
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  });

  it("throws ChatflowHTTPError on malformed JSON", async () => {
    const bad = new Response("not json", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    fetchMock.mockResolvedValue(bad);
    await expect(callChatflow(baseOpts)).rejects.toThrow(/malformed JSON/);
  });

  it("redacts the bearer token even when the upstream echoes it back", async () => {
    const echoed = `Authentication failed for Bearer ${TOKEN} you sent us`;
    fetchMock.mockResolvedValue(new Response(echoed, { status: 401 }));

    let caught: ChatflowHTTPError | null = null;
    try {
      await callChatflow(baseOpts);
    } catch (err) {
      caught = err as ChatflowHTTPError;
    }

    expect(caught).toBeInstanceOf(ChatflowHTTPError);
    expect(caught!.bodyExcerpt).not.toContain(TOKEN);
    expect(caught!.bodyExcerpt).not.toMatch(new RegExp(`Bearer ${TOKEN}`));
    expect(caught!.message).not.toContain(TOKEN);
  });

  it("redacts the apiToken from network error messages", async () => {
    const networkErr = new Error(
      `connect failed using token ${TOKEN}`,
    );
    fetchMock.mockRejectedValue(networkErr);

    let caught: ChatflowNetworkError | null = null;
    try {
      await callChatflow(baseOpts);
    } catch (err) {
      caught = err as ChatflowNetworkError;
    }
    expect(caught).toBeInstanceOf(ChatflowNetworkError);
    expect(caught!.message).not.toContain(TOKEN);
  });

  it("falls back to data.response when data.text is missing", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { response: "from-response" }));
    const result = await callChatflow(baseOpts);
    expect(result.text).toBe("from-response");
  });

  it("falls back to JSON.stringify(data) when neither text nor response is present", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { other: "value" }));
    const result = await callChatflow(baseOpts);
    expect(result.text).toBe(JSON.stringify({ other: "value" }));
  });
});
