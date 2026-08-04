/**
 * vitest.config.ts for tools/export tests
 *
 * Run from apps/web/:
 *   npm run test:tools
 *
 * Which expands to:
 *   vitest run --config ../../tools/vitest.config.ts
 *
 * vitest is installed in apps/web/node_modules and runs from there.
 * The root is set to tools/ so that include patterns resolve correctly.
 * No setupFiles needed — the export tests are pure fixtures; they do not
 * import lib/env.ts or anything that validates the environment at load time.
 */

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const toolsRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: toolsRoot,
  test: {
    environment: "node",
    include: ["export/__tests__/**/*.test.ts"],
    // No setupFiles: these tests are pure — no database, no env vars, no app.
  },
});
