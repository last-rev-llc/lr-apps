import sharedConfig from "@repo/config/eslint";

export default [
  ...sharedConfig,
  {
    plugins: {
      "@next/next": { rules: { "no-img-element": {} } },
      "react-hooks": { rules: { "exhaustive-deps": {} } },
      react: { rules: { "no-danger": {} } },
    },
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/no-danger": "off",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
];
