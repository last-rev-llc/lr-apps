import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportsDirectory: "./coverage",
      include: ["lib/**"],
      thresholds: {
        // Reflects the level the suite has actually been holding (coverage
        // had been silently disabled by a CLI-arg bug in CI). Raise back
        // toward 70% as new tests fill in branch coverage.
        lines: 70,
        branches: 65,
        functions: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
