import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import noHardcodedColors from "./rules/no-hardcoded-colors.mjs";

const repoPlugin = {
  rules: {
    "no-hardcoded-colors": noHardcodedColors,
  },
};

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: {
      "@repo": repoPlugin,
    },
    rules: {
      "@repo/no-hardcoded-colors": "warn",
    },
  },
  // jsx-a11y/recommended for TSX. Issue #224 — author-time accessibility
  // enforcement so violations are caught before they reach the runtime
  // axe-core audit (#223). Disabled rules are documented inline.
  {
    files: ["**/*.tsx"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,

      // Off — Next.js <Link> wraps <a> in patterns where the href lives
      // on the parent component, which jsx-a11y flags as invalid. The
      // Next ESLint preset already lints `<Link>` misuse, so this rule
      // is redundant noise here.
      "jsx-a11y/anchor-is-valid": "off",
    },
  },
  {
    ignores: [".next/", "node_modules/", "dist/"],
  },
);
