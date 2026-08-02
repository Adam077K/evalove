/**
 * Verifying a typed secret against a stored scrypt credential.
 *
 * The interesting assertion is not "the right password works" — it is that the
 * wrong one is refused for every shape of wrong, including the shapes that
 * would crash a naive `timingSafeEqual` call or quietly pass a normalisation
 * bug.
 */

import { describe, expect, it } from "vitest";

import { verifySecret } from "@/lib/auth/password";
import { parseScryptHash } from "@/lib/env";
import { scryptCredential } from "./credentials";

const SECRET = "the sky between two cities";
const HASH = parseScryptHash("APP_PASSWORD_HASH", scryptCredential(SECRET));

describe("verifySecret", () => {
  it("accepts the secret it was built from", async () => {
    await expect(verifySecret(SECRET, HASH)).resolves.toBe(true);
  });

  it("refuses a different secret", async () => {
    await expect(verifySecret("the sky between two towns", HASH)).resolves.toBe(
      false,
    );
  });

  it("refuses a secret that only shares a prefix", async () => {
    // The case a string comparison leaks the length of. It must be as false as
    // any other wrong answer, and take the same work to say so.
    await expect(verifySecret("the sky between two citie", HASH)).resolves.toBe(
      false,
    );
    await expect(verifySecret("the sky between two citiesX", HASH)).resolves.toBe(
      false,
    );
  });

  it("refuses the empty string", async () => {
    await expect(verifySecret("", HASH)).resolves.toBe(false);
  });

  it("refuses a secret differing only in case", async () => {
    await expect(verifySecret("The Sky Between Two Cities", HASH)).resolves.toBe(
      false,
    );
  });

  it("does not care which way an accent was typed", async () => {
    // é as one code point, and as e + combining acute. Same visible password,
    // different bytes — a phone keyboard can produce either, and refusing one
    // of them is a login that works on one device and not the other.
    const composed = "café au lait";
    const decomposed = "café au lait";
    expect(composed).not.toBe(decomposed);

    const hash = parseScryptHash(
      "APP_PASSWORD_HASH",
      scryptCredential(composed),
    );
    await expect(verifySecret(decomposed, hash)).resolves.toBe(true);
  });

  it("reads the cost parameters off the stored hash", () => {
    // Not a behavioural test of verification — a guard on the format contract
    // that lets N be raised later without invalidating the credential that
    // already exists.
    expect(HASH.n).toBe(16_384);
    expect(HASH.r).toBe(8);
    expect(HASH.p).toBe(1);
    expect(HASH.salt.byteLength).toBe(16);
    expect(HASH.key.byteLength).toBe(32);
  });
});
