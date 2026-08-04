import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const webRoot = fileURLToPath(new URL(".", import.meta.url));
// Tools tests live outside the Next.js app root; resolve to an absolute path
// so vitest can find them regardless of the working directory.
const toolsTestsGlob = resolve(webRoot, "../../tools/export/__tests__/**/*.test.ts");

export default defineConfig({
  test: {
    environment: "node",
    // `lib/env.ts` validates the environment at module evaluation, so anything
    // that transitively imports it needs a complete one before the import runs
    // — which is earlier than any `beforeAll`. See the file for what it sets
    // and what it deliberately leaves alone.
    //
    // The tools tests do not import lib/env.ts (they are pure fixtures), so the
    // setup file is harmless for them — it just sets some env vars that go unused.
    setupFiles: ["./lib/__tests__/setup-env.ts"],
    include: [
      "lib/**/*.test.ts",
      "app/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      toolsTestsGlob,
    ],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
