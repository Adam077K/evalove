import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // `lib/env.ts` validates the environment at module evaluation, so anything
    // that transitively imports it needs a complete one before the import runs
    // — which is earlier than any `beforeAll`. See the file for what it sets
    // and what it deliberately leaves alone.
    setupFiles: ["./lib/__tests__/setup-env.ts"],
    include: [
      "lib/**/*.test.ts",
      "app/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
