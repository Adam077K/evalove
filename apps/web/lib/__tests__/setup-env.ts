/**
 * A valid environment, before any test file is evaluated.
 *
 * `lib/env.ts` validates at MODULE EVALUATION — importing it is the boot check.
 * That is the right behaviour for a server that should refuse to start on a bad
 * config, and it means any test that transitively imports it needs a complete
 * environment already in place before the import runs. `beforeAll` is too late:
 * ESM imports are hoisted above it.
 *
 * So this file runs first, as vitest `setupFiles`. It fills in only what is
 * MISSING, so a developer running against a real `.env` keeps their values, and
 * `lib/__tests__/env-public-prefix.test.ts` — which replaces `process.env`
 * wholesale to test the boot behaviour itself — is unaffected either way.
 *
 * `ANTHROPIC_API_KEY` is deliberately not set. Production has no key, and its
 * absence must never be a boot failure.
 */

import { randomBytes, scryptSync } from "node:crypto";

/** The cost floor `lib/env.ts` enforces. */
function scryptHash(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32, { N: 16_384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

/**
 * The plaintext behind `APP_PASSWORD_HASH` below.
 *
 * Exported so a test that needs the door to actually open can ask for it
 * rather than re-deriving a hash of its own. A test that sets
 * `process.env.APP_PASSWORD_HASH` at its own top level is already too late:
 * ESM hoists every `import` above every statement, so the route under test —
 * and `lib/env.ts` with it — has been evaluated before that line runs. Reading
 * the password from here sidesteps the ordering problem entirely instead of
 * fighting it with `vi.hoisted`.
 */
export const TEST_APP_PASSWORD = "a-test-app-password";

/** The plaintext behind `VAULT_PASSPHRASE_HASH`. For T13, when the pocket is wired. */
export const TEST_VAULT_PASSPHRASE = "an-independent-test-vault-passphrase";

/**
 * Two DIFFERENT passwords with two DIFFERENT salts.
 *
 * `lib/env.ts` refuses to boot when the app password and the vault passphrase
 * look derived from one another, and a test fixture that trips that assertion
 * would look like a bug in the assertion.
 */
const defaults: Readonly<Record<string, string>> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: randomBytes(48).toString("hex"),
  APP_PASSWORD_HASH: scryptHash(TEST_APP_PASSWORD),
  VAULT_PASSPHRASE_HASH: scryptHash(TEST_VAULT_PASSPHRASE),
  SESSION_SECRET: randomBytes(32).toString("base64"),
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}
