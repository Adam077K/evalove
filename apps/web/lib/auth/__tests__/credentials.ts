/**
 * Real scrypt credentials, generated for the tests that need them.
 *
 * Generated rather than pasted. A checked-in hash string is a hash nobody can
 * regenerate when the format changes, and it invites the reader to wonder
 * whether it is a real secret. These take about fifty milliseconds at the
 * minimum cost the environment allows and they exercise the same parser, the
 * same parameters and the same comparison the running app uses.
 */

import { Buffer } from "node:buffer";
import { randomBytes, scryptSync } from "node:crypto";

/** The floor `lib/env.ts` enforces. Fast enough for a test, real enough to mean it. */
export const TEST_SCRYPT = { N: 16_384, r: 8, p: 1 } as const;

/** Encode a passphrase into the `scrypt$N$r$p$salt$key` string the env carries. */
export function scryptCredential(secret: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(secret.normalize("NFC"), salt, 32, {
    N: TEST_SCRYPT.N,
    r: TEST_SCRYPT.r,
    p: TEST_SCRYPT.p,
  });

  return [
    "scrypt",
    TEST_SCRYPT.N,
    TEST_SCRYPT.r,
    TEST_SCRYPT.p,
    salt.toString("base64"),
    Buffer.from(key).toString("base64"),
  ].join("$");
}

/** 32 random bytes, base64 — the shape `SESSION_SECRET` must have. */
export function sessionSecret(): string {
  return randomBytes(32).toString("base64");
}
