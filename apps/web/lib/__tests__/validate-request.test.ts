import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateJson } from "../validate-request";

const schema = z.object({
  email: z.string().email(),
  count: z.number().int().positive(),
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("validateJson", () => {
  it("returns ok with typed data when input matches", async () => {
    const result = await validateJson(
      jsonRequest({ email: "a@b.co", count: 2 }),
      schema,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ email: "a@b.co", count: 2 });
    }
  });

  it("returns 400 invalid_json on malformed JSON", async () => {
    const result = await validateJson(jsonRequest("not-json"), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as { error: string };
      expect(body.error).toBe("invalid_json");
    }
  });

  it("returns 400 invalid_input with structured issues on schema failure", async () => {
    const result = await validateJson(
      jsonRequest({ email: "nope", count: -1 }),
      schema,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as {
        error: string;
        issues: Array<{ path: unknown; message: string; code: string }>;
      };
      expect(body.error).toBe("invalid_input");
      expect(body.issues.length).toBeGreaterThanOrEqual(2);
      const paths = body.issues.map((i) => JSON.stringify(i.path));
      expect(paths.some((p) => p.includes("email"))).toBe(true);
      expect(paths.some((p) => p.includes("count"))).toBe(true);
    }
  });
});
