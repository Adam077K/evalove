/**
 * Eva & Adam — verifying a typed secret against a stored scrypt credential.
 *
 * NODE ONLY. `scrypt` does not exist on the Edge runtime, which is why every
 * route that calls this declares `runtime = "nodejs"` and why the middleware
 * verifies a signed token instead of a password.
 *
 * Two properties this module exists to guarantee:
 *
 *   1. The comparison is `crypto.timingSafeEqual` over the derived keys, never
 *      `===` over strings. A string compare returns as soon as two bytes
 *      differ, so the time it takes leaks how many leading bytes were right —
 *      which turns guessing a 20-character secret from 2^160 work into 20
 *      independent one-character guesses.
 *   2. The cost parameters come off the stored hash, not from a constant here.
 *      `lib/env.ts` already parses them out. That is what allows `N` to be
 *      raised later without invalidating the credential that already exists.
 */

import { Buffer } from "node:buffer";
import { scrypt, timingSafeEqual } from "node:crypto";

import type { ScryptHash } from "@/lib/env";

/**
 * How much memory scrypt is allowed to use, derived from the stored cost.
 *
 * Node's default `maxmem` is 32 MiB and scrypt needs roughly `128 * N * r`
 * bytes, so a credential generated at N = 2^15, r = 8 (32 MiB) fails with an
 * opaque "memory limit exceeded" rather than a wrong-password answer. Sizing
 * the ceiling from the parameters that are actually stored means raising the
 * cost later does not also require remembering to raise a magic number here.
 * The multiplier is 2x the requirement, matching Node's own headroom.
 */
function maxmemFor(hash: ScryptHash): number {
  return 256 * hash.n * hash.r;
}

/** Promisified `crypto.scrypt` — the callback form, with the params applied. */
function derive(candidate: string, hash: ScryptHash): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      // Normalising to NFC matters on a phone keyboard: an accented character
      // can be typed as one code point or as a letter plus a combining mark,
      // and those are different bytes for the same visible secret.
      candidate.normalize("NFC"),
      hash.salt,
      hash.key.byteLength,
      { N: hash.n, r: hash.r, p: hash.p, maxmem: maxmemFor(hash) },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

/**
 * Does this string open that credential?
 *
 * Returns a boolean rather than throwing on mismatch: a wrong password is an
 * ordinary outcome of a login form, not an exceptional condition, and modelling
 * it as an exception is how a `catch` somewhere ends up treating a scrypt crash
 * and a typo as the same thing.
 *
 * A candidate that derives to a different length short-circuits to false —
 * `timingSafeEqual` throws on mismatched lengths, and the length here is fixed
 * by the stored key, so it cannot vary with the input anyway.
 */
export async function verifySecret(
  candidate: string,
  hash: ScryptHash,
): Promise<boolean> {
  const derived = await derive(candidate, hash);
  if (derived.byteLength !== hash.key.byteLength) return false;
  return timingSafeEqual(derived, hash.key);
}
