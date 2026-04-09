import js from "@eslint/js";
import tseslint from "typescript-eslint";
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
  {
    ignores: [".next/", "node_modules/", "dist/"],
  },
);
