import { describe, expect, it } from "vitest";
import {
  ChatflowTargetInputSchema,
  ChatflowTargetOutputSchema,
} from "../schema";
import { PROMPT_TEMPLATE_MAX_BYTES } from "../tier-limits";

const baseInput = {
  name: "Production",
  api_host: "https://chat.example.com",
  chatflow_id: "abc123",
  api_token: "secret",
};

describe("ChatflowTargetInputSchema", () => {
  it("accepts a valid input", () => {
    const parsed = ChatflowTargetInputSchema.parse(baseInput);
    expect(parsed.api_host).toBe("https://chat.example.com");
  });

  it("rejects an invalid api_host URL", () => {
    expect(() =>
      ChatflowTargetInputSchema.parse({ ...baseInput, api_host: "not-a-url" }),
    ).toThrow();
  });

  it("strips trailing slashes from api_host", () => {
    const parsed = ChatflowTargetInputSchema.parse({
      ...baseInput,
      api_host: "https://chat.example.com//",
    });
    expect(parsed.api_host).toBe("https://chat.example.com");
  });

  it("rejects an empty api_token", () => {
    expect(() =>
      ChatflowTargetInputSchema.parse({ ...baseInput, api_token: "" }),
    ).toThrow();
  });

  it("accepts a prompt_template at exactly the byte cap", () => {
    const prompt = "a".repeat(PROMPT_TEMPLATE_MAX_BYTES);
    const parsed = ChatflowTargetInputSchema.parse({
      ...baseInput,
      prompt_template: prompt,
    });
    expect(parsed.prompt_template).toBe(prompt);
  });

  it("rejects a prompt_template one byte over the cap", () => {
    const prompt = "a".repeat(PROMPT_TEMPLATE_MAX_BYTES + 1);
    expect(() =>
      ChatflowTargetInputSchema.parse({ ...baseInput, prompt_template: prompt }),
    ).toThrow(/16 KiB/);
  });

  it("measures multi-byte UTF-8 by byte length, not char length", () => {
    // "🎉" is 4 UTF-8 bytes; this fits in chars but exceeds the byte cap.
    const charsThatFitButBytesDont = Math.floor(PROMPT_TEMPLATE_MAX_BYTES / 4) + 1;
    const prompt = "🎉".repeat(charsThatFitButBytesDont);
    expect(prompt.length).toBeLessThanOrEqual(PROMPT_TEMPLATE_MAX_BYTES);
    expect(new TextEncoder().encode(prompt).byteLength).toBeGreaterThan(
      PROMPT_TEMPLATE_MAX_BYTES,
    );
    expect(() =>
      ChatflowTargetInputSchema.parse({ ...baseInput, prompt_template: prompt }),
    ).toThrow();
  });
});

describe("ChatflowTargetOutputSchema", () => {
  const baseOutput = {
    id: "11111111-1111-4111-8111-111111111111",
    owner_id: "22222222-2222-4222-8222-222222222222",
    name: "Production",
    api_host: "https://chat.example.com",
    chatflow_id: "abc123",
    base_trace_url: null,
    prompt_template: null,
    is_default: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("accepts a sanitized server projection", () => {
    expect(() => ChatflowTargetOutputSchema.parse(baseOutput)).not.toThrow();
  });

  it("rejects objects that include api_token", () => {
    expect(() =>
      ChatflowTargetOutputSchema.parse({
        ...baseOutput,
        api_token: "leaked",
      }),
    ).toThrow();
  });

  it("rejects objects that include api_token_encrypted", () => {
    expect(() =>
      ChatflowTargetOutputSchema.parse({
        ...baseOutput,
        api_token_encrypted: "leaked",
      }),
    ).toThrow();
  });

  it("rejects objects that include api_token_key_id", () => {
    expect(() =>
      ChatflowTargetOutputSchema.parse({
        ...baseOutput,
        api_token_key_id: "leaked",
      }),
    ).toThrow();
  });
});
