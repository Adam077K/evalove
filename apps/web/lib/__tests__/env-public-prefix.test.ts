/**
 * The `NEXT_PUBLIC_` guard, from both sides.
 *
 * The guard in `lib/env.ts` exists to stop a secret that was pasted into the
 * wrong box in a hosting dashboard from being inlined into the browser bundle.
 * It once did exactly that, and it is worth keeping sharp.
 *
 * It was also, for a while, wrong in a specific way: it assumed this app names
 * every variable in its own environment. Vercel injects six of its own at build
 * time, the guard rejected all six, and `lib/env.ts` threw at module load —
 * which Next reports as "Failed to collect page data for /api/ai/chat" and
 * which takes the entire production build down. The fix allows the
 * platform-owned `NEXT_PUBLIC_VERCEL_` namespace.
 *
 * A fix like that is one careless edit away from becoming "allow all of
 * `NEXT_PUBLIC_`", which would delete the guard while leaving it looking
 * present. So this file asserts BOTH halves and treats them as equally
 * important:
 *
 *   - platform metadata boots the app          (the build must not break)
 *   - a plausible secret still refuses to boot (the guard must still bite)
 *
 * The whole check runs against the real `process.env` at module evaluation, so
 * each case here builds a complete environment and re-imports the module. That
 * is slower than calling a pure function, and deliberate: it tests the boot
 * behaviour that actually failed, not a helper that resembles it.
 */

import { randomBytes, scryptSync } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ *
 * A valid environment
 * ------------------------------------------------------------------ */

/** Cost parameters matching `lib/env.ts`'s floor. Generated once — scrypt is slow on purpose. */
function scryptHash(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32, { N: 16_384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

/**
 * Everything `lib/env.ts` requires, and nothing else.
 *
 * The two hashes are generated from different passwords with different salts
 * because the module refuses to start if the app password and the vault
 * passphrase look derived from each other.
 *
 * `ANTHROPIC_API_KEY` is absent throughout this file. That is not an oversight
 * — production has no key, and its absence must never be a boot failure.
 */
const REQUIRED_ENV: Readonly<Record<string, string>> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: randomBytes(48).toString("hex"),
  APP_PASSWORD_HASH: scryptHash("the-app-password"),
  VAULT_PASSPHRASE_HASH: scryptHash("an-independent-vault-passphrase"),
  SESSION_SECRET: randomBytes(48).toString("base64"),
};

/** The six Vercel injects when "expose System Environment Variables" is on. */
const VERCEL_PLATFORM_ENV: Readonly<Record<string, string>> = {
  NEXT_PUBLIC_VERCEL_URL: "evalove-git-main-evalove.vercel.app",
  NEXT_PUBLIC_VERCEL_PROJECT_ID: "prj_a1b2c3d4e5f6",
  NEXT_PUBLIC_VERCEL_TARGET_ENV: "production",
  NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG: "evalove",
  NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "app.evalove.com",
  NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG: '{"sampleRate":1}',
};

const ORIGINAL_ENV = process.env;

/**
 * Boot `lib/env.ts` against a constructed environment.
 *
 * `process.env` is replaced wholesale rather than patched. The guard inspects
 * every key it can see, so a stray `NEXT_PUBLIC_` variable in the developer's
 * own shell would otherwise decide the result of these tests.
 */
async function boot(extra: Record<string, string> = {}) {
  const inherited = Object.fromEntries(
    Object.entries(ORIGINAL_ENV).filter(
      ([key]) => !key.startsWith("NEXT_PUBLIC_") && key !== "ANTHROPIC_API_KEY",
    ),
  );

  process.env = { ...inherited, ...REQUIRED_ENV, ...extra } as NodeJS.ProcessEnv;

  vi.resetModules();
  return import("@/lib/env");
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.resetModules();
});

/* ------------------------------------------------------------------ *
 * Half one — the build must not break
 * ------------------------------------------------------------------ */

describe("platform-owned NEXT_PUBLIC_VERCEL_ variables", () => {
  it("boots with all six of Vercel's injected variables present", async () => {
    const { env } = await boot(VERCEL_PLATFORM_ENV);

    // Reaching here at all is the assertion: before the fix this threw, and
    // the throw is what failed the production build.
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://example-project.supabase.co",
    );
  });

  it.each(Object.keys(VERCEL_PLATFORM_ENV))(
    "boots with %s present on its own",
    async (key) => {
      await expect(
        boot({ [key]: VERCEL_PLATFORM_ENV[key] as string }),
      ).resolves.toBeDefined();
    },
  );

  it("accepts a system variable Vercel has not shipped yet", async () => {
    // The reason the check matches a namespace instead of six literal strings.
    // A seventh system variable must not break a build at 1am.
    await expect(
      boot({ NEXT_PUBLIC_VERCEL_SOME_FUTURE_FLAG: "on" }),
    ).resolves.toBeDefined();
  });
});

/* ------------------------------------------------------------------ *
 * Half two — the guard must still bite
 * ------------------------------------------------------------------ */

describe("the NEXT_PUBLIC_ guard still refuses secrets", () => {
  it("refuses to boot on NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", async () => {
    // The exact mistake the guard was written for: the service role key
    // bypasses Row Level Security entirely, and this prefix would inline it
    // into every browser bundle, including already-cached ones.
    await expect(
      boot({ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: randomBytes(48).toString("hex") }),
    ).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("names the variable without ever printing its value", async () => {
    const secret = "sk-live-must-never-appear-in-a-log";

    await expect(
      boot({ NEXT_PUBLIC_STRIPE_SECRET_KEY: secret }),
    ).rejects.toThrow(
      expect.objectContaining({
        name: "EnvironmentError",
        message: expect.not.stringContaining(secret) as unknown as string,
      }),
    );
  });

  it.each([
    "NEXT_PUBLIC_ANTHROPIC_API_KEY",
    "NEXT_PUBLIC_SESSION_SECRET",
    "NEXT_PUBLIC_APP_PASSWORD_HASH",
    "NEXT_PUBLIC_POSTHOG_API_KEY",
  ])("refuses to boot on %s", async (key) => {
    await expect(boot({ [key]: "a-value" })).rejects.toThrow(
      new RegExp(key),
    );
  });

  it("does not treat a VERCEL lookalike as platform-owned", async () => {
    // The trailing underscore in the `NEXT_PUBLIC_VERCEL_` prefix is doing
    // real work. Without it, this name would be waved through.
    await expect(
      boot({ NEXT_PUBLIC_VERCELISH_SECRET: "not-vercels" }),
    ).rejects.toThrow(/NEXT_PUBLIC_VERCELISH_SECRET/);
  });

  it("still catches a secret sitting alongside the platform variables", async () => {
    // The realistic shape of the mistake now: a real Vercel deployment, where
    // the injected six are always present, plus one key pasted into the wrong
    // box. The platform variables must not provide cover.
    await expect(
      boot({
        ...VERCEL_PLATFORM_ENV,
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: randomBytes(48).toString("hex"),
      }),
    ).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  });
});

/* ------------------------------------------------------------------ *
 * The optional key
 * ------------------------------------------------------------------ */

describe("ANTHROPIC_API_KEY", () => {
  it("boots when absent — Echo is unavailable, the app is not", async () => {
    const { env } = await boot(VERCEL_PLATFORM_ENV);
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it("boots when set to an empty string, as an unfilled dashboard box is", async () => {
    // Vercel stores a cleared variable as "", not as absent. Treating that as
    // a present-but-blank key would hand an empty credential to the SDK.
    const { env } = await boot({ ...VERCEL_PLATFORM_ENV, ANTHROPIC_API_KEY: "" });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });
});
