import { describe, it, expect } from "vitest";
import { generateLangfuseLink } from "../langfuse";

describe("generateLangfuseLink", () => {
  it("returns null when baseUrl is undefined", () => {
    expect(generateLangfuseLink({ uid: "abc" })).toBeNull();
  });

  it("returns null when baseUrl is an empty string", () => {
    expect(generateLangfuseLink({ baseUrl: "", uid: "abc" })).toBeNull();
  });

  it("returns null when baseUrl is whitespace-only", () => {
    expect(generateLangfuseLink({ baseUrl: "   ", uid: "abc" })).toBeNull();
    expect(generateLangfuseLink({ baseUrl: "\t\n", uid: "abc" })).toBeNull();
  });

  it("builds a link without a tag when only uid is provided", () => {
    expect(
      generateLangfuseLink({
        baseUrl: "https://cloud.langfuse.com",
        uid: "row-42",
      }),
    ).toBe("https://cloud.langfuse.com/traces?tag=row-42");
  });

  it("builds a link with `${tag}_${uid}` when a tag is provided", () => {
    expect(
      generateLangfuseLink({
        baseUrl: "https://cloud.langfuse.com",
        tag: "eval-run",
        uid: "row-42",
      }),
    ).toBe("https://cloud.langfuse.com/traces?tag=eval-run_row-42");
  });

  it("strips a single trailing slash from baseUrl", () => {
    expect(
      generateLangfuseLink({
        baseUrl: "https://cloud.langfuse.com/",
        uid: "abc",
      }),
    ).toBe("https://cloud.langfuse.com/traces?tag=abc");
  });

  it("strips multiple trailing slashes from baseUrl", () => {
    expect(
      generateLangfuseLink({
        baseUrl: "https://cloud.langfuse.com////",
        uid: "abc",
      }),
    ).toBe("https://cloud.langfuse.com/traces?tag=abc");
  });

  it("encodes reserved URL characters in the tag value", () => {
    const link = generateLangfuseLink({
      baseUrl: "https://cloud.langfuse.com",
      tag: "a&b=c d",
      uid: "uid",
    });
    expect(link).toBe(
      "https://cloud.langfuse.com/traces?tag=a%26b%3Dc%20d_uid",
    );
  });

  it("encodes reserved URL characters in the uid", () => {
    const link = generateLangfuseLink({
      baseUrl: "https://cloud.langfuse.com",
      uid: "row id&with=symbols",
    });
    expect(link).toBe(
      "https://cloud.langfuse.com/traces?tag=row%20id%26with%3Dsymbols",
    );
  });

  it("preserves baseUrl path segments other than the trailing slash", () => {
    expect(
      generateLangfuseLink({
        baseUrl: "https://example.com/langfuse/",
        uid: "abc",
      }),
    ).toBe("https://example.com/langfuse/traces?tag=abc");
  });
});
