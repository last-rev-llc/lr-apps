// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(__dirname, "..", "target-store.ts");

const source = readFileSync(SOURCE_PATH, "utf8");

/**
 * Strip line and block comments so the assertions below only inspect
 * executable code — bare references to `Authorization` or `api_token` in a
 * doc comment are fine and are documented intent.
 */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const sourceCode = stripComments(source);

describe("target-store: no token logging", () => {
  it("does not call any console.* in the source", () => {
    expect(sourceCode).not.toMatch(/\bconsole\.[a-zA-Z]+\(/);
  });

  it("does not call logger.* in the source", () => {
    expect(sourceCode).not.toMatch(/\blogger\.[a-zA-Z]+\(/);
  });

  it("does not contain a camelCase apiToken identifier", () => {
    expect(sourceCode).not.toMatch(/\bapiToken\b/);
  });

  it("does not contain the literal Authorization header name in code", () => {
    expect(sourceCode).not.toMatch(/\bAuthorization\b/);
  });

  it("does not call any logging-shaped expression containing api_token", () => {
    // belt-and-braces: even if a console/logger import is added later, fail
    // if any such call passes a substring that includes `api_token`.
    const loggingShape =
      /(console\.[a-zA-Z]+|logger\.[a-zA-Z]+)\s*\([^)]*api_token/g;
    expect(sourceCode.match(loggingShape)).toBeNull();
  });
});
