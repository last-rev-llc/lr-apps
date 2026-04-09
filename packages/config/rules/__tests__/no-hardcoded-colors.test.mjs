import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import rule from "../no-hardcoded-colors.mjs";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("no-hardcoded-colors", () => {
  it("detects hardcoded hex colors and allows clean code", () => {
    tester.run("no-hardcoded-colors", rule, {
      valid: [
        // Theme token classes — no hex colors
        { code: `<div className="bg-primary text-white" />` },
        // Template literal without hex
        { code: "<div className={`bg-primary ${active}`} />" },
        // Non-color hex-like strings (too short / not in target attrs)
        { code: `<div id="#top" />` },
        // data attributes with hex are fine
        { code: `<div data-color="#ff0000" />` },
        // No value
        { code: `<div className />` },
        // Empty string
        { code: `<div className="" />` },
      ],
      invalid: [
        // 6-digit hex in className literal
        {
          code: `<div className="bg-[#ff0000]" />`,
          errors: [{ messageId: "noHardcodedColor" }],
        },
        // 3-digit hex in className literal
        {
          code: `<div className="text-[#abc]" />`,
          errors: [{ messageId: "noHardcodedColor" }],
        },
        // 8-digit hex (with alpha)
        {
          code: `<div className="bg-[#ff000080]" />`,
          errors: [{ messageId: "noHardcodedColor" }],
        },
        // Multiple hex colors in one string
        {
          code: `<div className="bg-[#ff0000] text-[#00ff00]" />`,
          errors: [
            { messageId: "noHardcodedColor" },
            { messageId: "noHardcodedColor" },
          ],
        },
        // Hex in template literal
        {
          code: "<div className={`bg-[#ff0000] ${cls}`} />",
          errors: [{ messageId: "noHardcodedColor" }],
        },
        // Hex in expression string
        {
          code: `<div className={"bg-[#abcdef]"} />`,
          errors: [{ messageId: "noHardcodedColor" }],
        },
        // style object with hex value
        {
          code: `<div style={{ color: "#ff0000" }} />`,
          errors: [{ messageId: "noHardcodedColor" }],
        },
        // style object with multiple hex values
        {
          code: `<div style={{ color: "#ff0000", backgroundColor: "#00ff00" }} />`,
          errors: [
            { messageId: "noHardcodedColor" },
            { messageId: "noHardcodedColor" },
          ],
        },
      ],
    });
  });
});
