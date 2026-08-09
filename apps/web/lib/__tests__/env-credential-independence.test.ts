/**
 * Three credentials, all independent — the assertion `lib/env.ts` exists for,
 * finally run by the test suite.
 *
 * IT WAS NOT BEFORE. The independence checks had a home in `lib/__smoke.spec.ts`,
 * and `vitest.config.ts` includes `lib/**\/*.test.ts` — `.spec.ts` matches
 * nothing. So the boot refusal that protects the vault against the password
 * typed on a phone in public had, in practice, no test at all. Splitting one
 * app password into two seemed a poor moment to leave it that way.
 *
 * WHAT IS BEING PROTECTED. Eva's password, Adam's password and the vault
 * passphrase are three secrets. Every pair of them must be independent, and
 * each pair fails differently:
 *
 *   - Eva's derived from Adam's: the door can no longer say which of them came
 *     in, which is the whole reason there are two. Worse than the single shared
 *     password it replaced, because the token would assert an identity that is
 *     not true.
 *   - Either of theirs derived from the vault's: the password typed most days,
 *     in public, also opens the private items.
 *
 * THREE PAIRS, NOT TWO. A loop over adjacent entries checks Eva-Adam and
 * Adam-vault and silently skips Eva-vault, which is exactly as bad as the two
 * it checked. Every pair is asserted below by name for that reason.
 *
 * Each case boots the real module against a constructed environment, because
 * the behaviour under test IS the boot.
 */

import { randomBytes, scryptSync } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ *
 * Building credentials
 * ------------------------------------------------------------------ */

/** A credential at `lib/env.ts`'s cost floor. Salt supplied to force a collision. */
function scryptHash(password: string, salt: Buffer = randomBytes(16)): string {
  const key = scryptSync(password, salt, 32, { N: 16_384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

/** A complete, valid environment: three different secrets, three random salts. */
function validEnv(): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: randomBytes(48).toString("hex"),
    APP_PASSWORD_HASH_EVA: scryptHash("evas-own-password"),
    APP_PASSWORD_HASH_ADAM: scryptHash("adams-own-different-password"),
    VAULT_PASSPHRASE_HASH: scryptHash("a-third-unrelated-vault-phrase"),
    SESSION_SECRET: randomBytes(32).toString("base64"),
  };
}

const ORIGINAL_ENV = process.env;

/**
 * Boot `lib/env.ts` against a constructed environment.
 *
 * `process.env` is replaced wholesale rather than patched: a developer with a
 * real `.env` exported into their shell would otherwise decide the result of
 * every case here, and `APP_PASSWORD_HASH` in particular has to be absent for
 * the retired-variable cases to mean anything.
 */
async function boot(overrides: Record<string, string | undefined> = {}) {
  const inherited: Record<string, string> = {};
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) continue;
    if (key.startsWith("NEXT_PUBLIC_")) continue;
    if (key.startsWith("APP_PASSWORD_HASH")) continue;
    if (key.startsWith("VAULT_PASSPHRASE")) continue;
    if (["SESSION_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"].includes(key)) {
      continue;
    }
    inherited[key] = value;
  }

  const built: Record<string, string> = { ...inherited, ...validEnv() };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete built[key];
    else built[key] = value;
  }

  process.env = built as NodeJS.ProcessEnv;
  vi.resetModules();
  return import("@/lib/env");
}

/**
 * Boot, require that it refuses, and hand back the error.
 *
 * The `.catch(e => e)` shorthand types as "the module OR an error", which
 * makes every assertion on `.message` a cast. Failing loudly on a boot that
 * unexpectedly SUCCEEDS is also the point: a silent success would make the
 * assertions below run against undefined.
 */
async function bootExpectingFailure(
  overrides: Record<string, string | undefined>,
): Promise<Error> {
  try {
    await boot(overrides);
  } catch (thrown) {
    return thrown as Error;
  }
  throw new Error("expected lib/env.ts to refuse to boot, and it did not");
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.resetModules();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * The baseline — the environment these cases mutate must itself boot
 * ------------------------------------------------------------------ */

describe("three independent credentials", () => {
  it("boots when all three are independently generated", async () => {
    // The canary. Every refusal below is only evidence of the guard biting if
    // the unmutated environment gets in.
    const { env } = await boot();
    expect(env.APP_PASSWORD_HASH_EVA).toMatch(/^scrypt\$16384\$/);
    expect(env.APP_PASSWORD_HASH_ADAM).toMatch(/^scrypt\$16384\$/);
  });

  it("requires Eva's variable", async () => {
    await expect(boot({ APP_PASSWORD_HASH_EVA: undefined })).rejects.toThrow(
      /APP_PASSWORD_HASH_EVA is missing/,
    );
  });

  it("requires Adam's variable", async () => {
    // The one a "split the variable in two" change forgets. Without it the app
    // would boot with only Eva's credential and quietly have one door again.
    await expect(boot({ APP_PASSWORD_HASH_ADAM: undefined })).rejects.toThrow(
      /APP_PASSWORD_HASH_ADAM is missing/,
    );
  });
});

/* ------------------------------------------------------------------ *
 * All three pairs, by name
 * ------------------------------------------------------------------ */

describe("a shared salt refuses to boot", () => {
  it("Eva and Adam", async () => {
    const salt = randomBytes(16);
    await expect(
      boot({
        APP_PASSWORD_HASH_EVA: scryptHash("evas-own-password", salt),
        APP_PASSWORD_HASH_ADAM: scryptHash("adams-own-password", salt),
      }),
    ).rejects.toThrow(
      /APP_PASSWORD_HASH_EVA and APP_PASSWORD_HASH_ADAM share a salt/,
    );
  });

  it("Adam and the vault", async () => {
    const salt = randomBytes(16);
    await expect(
      boot({
        APP_PASSWORD_HASH_ADAM: scryptHash("adams-own-password", salt),
        VAULT_PASSPHRASE_HASH: scryptHash("a-vault-phrase", salt),
      }),
    ).rejects.toThrow(
      /APP_PASSWORD_HASH_ADAM and VAULT_PASSPHRASE_HASH share a salt/,
    );
  });

  it("Eva and the vault — the pair an adjacent-pairs loop skips", async () => {
    const salt = randomBytes(16);
    await expect(
      boot({
        APP_PASSWORD_HASH_EVA: scryptHash("evas-own-password", salt),
        VAULT_PASSPHRASE_HASH: scryptHash("a-vault-phrase", salt),
      }),
    ).rejects.toThrow(
      /APP_PASSWORD_HASH_EVA and VAULT_PASSPHRASE_HASH share a salt/,
    );
  });
});

describe("an identical hash refuses to boot", () => {
  it("Eva and Adam — the copied line, the likeliest mistake of all", async () => {
    // Copying `APP_PASSWORD_HASH_EVA=…` and editing only the variable name is
    // how one credential becomes two variables that are one credential.
    const same = scryptHash("one-password-for-both-of-them");
    await expect(
      boot({
        APP_PASSWORD_HASH_EVA: same,
        APP_PASSWORD_HASH_ADAM: same,
      }),
    ).rejects.toThrow(
      /APP_PASSWORD_HASH_EVA and APP_PASSWORD_HASH_ADAM are the same hash/,
    );
  });

  it("Eva and the vault", async () => {
    const same = scryptHash("one-secret-for-two-doors");
    await expect(
      boot({ APP_PASSWORD_HASH_EVA: same, VAULT_PASSPHRASE_HASH: same }),
    ).rejects.toThrow(
      /APP_PASSWORD_HASH_EVA and VAULT_PASSPHRASE_HASH are the same hash/,
    );
  });

  it("reports the shared salt AND the shared key when a line was copied", async () => {
    const same = scryptHash("one-password-for-both-of-them");
    const error = await bootExpectingFailure({
      APP_PASSWORD_HASH_EVA: same,
      APP_PASSWORD_HASH_ADAM: same,
    });

    expect(error.message).toMatch(/share a salt/);
    expect(error.message).toMatch(/are the same hash/);
  });

  it("never puts a credential's VALUE in the error", async () => {
    // Boot errors land in log aggregators, crash reporters and CI output, all
    // of which are less private than the secret store the value came from.
    const same = scryptHash("one-password-for-both-of-them");
    const error = await bootExpectingFailure({
      APP_PASSWORD_HASH_EVA: same,
      APP_PASSWORD_HASH_ADAM: same,
    });

    expect(error.message).not.toContain(same);
  });
});

/* ------------------------------------------------------------------ *
 * The retired variable
 * ------------------------------------------------------------------ */

describe("the old shared APP_PASSWORD_HASH", () => {
  it("warns when it is still defined", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await boot({ APP_PASSWORD_HASH: scryptHash("the-old-shared-password") });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(
      /APP_PASSWORD_HASH is set but is no longer read/,
    );
  });

  it("does NOT refuse to boot because of it", async () => {
    // Deliberate, and the reverse of what a security check usually does.
    // Failing here would take the app down over a leftover, on the one door of
    // an archive with no reset flow — the founder would be locked out by a
    // tidiness rule. The leftover is a stale secret; the refusal is two people
    // outside.
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { env } = await boot({
      APP_PASSWORD_HASH: scryptHash("the-old-shared-password"),
    });

    expect(env.APP_PASSWORD_HASH_EVA).toBeDefined();
  });

  it("is not carried into the validated env object", async () => {
    // `env` is the only supported way to read config, so a variable absent
    // from it is a variable nothing in the app can accidentally still use.
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { env } = await boot({
      APP_PASSWORD_HASH: scryptHash("the-old-shared-password"),
    });

    expect(Object.keys(env)).not.toContain("APP_PASSWORD_HASH");
  });

  it("says nothing when it is absent", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await boot();

    expect(warn).not.toHaveBeenCalled();
  });

  it("says nothing when it is present but blank", async () => {
    // An empty `FOO=` is not a value anywhere else in this module, and a
    // warning about one would train people to ignore the warning.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await boot({ APP_PASSWORD_HASH: "   " });

    expect(warn).not.toHaveBeenCalled();
  });
});
