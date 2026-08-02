/**
 * Eva & Adam — validated environment access.
 *
 * This module is the ONLY place in the app that reads `process.env`. Everything
 * else imports the frozen `env` object below. That is not a style preference:
 * a scattered `process.env.FOO` is un-typed, un-validated, and silently
 * `undefined` in exactly the environment you did not test. Here it is one
 * schema, checked once, loudly.
 *
 * Validation runs at MODULE EVALUATION — importing this file is the boot check.
 * A bad environment throws before a single request is served, rather than
 * surfacing as an `undefined` three layers deep at 2am. Any server entry point
 * (a route handler, a server action, a server component that touches data)
 * should import `env` so the failure happens at boot rather than on first use.
 *
 * Two hard rules this file enforces:
 *
 *   1. No secret ever sits behind `NEXT_PUBLIC_`. That prefix means "inlined
 *      into the JavaScript bundle the browser downloads" — it is publication,
 *      not configuration. Exactly one variable is allowed to carry it, and the
 *      allowlist below is checked against the real environment at boot, so a
 *      stray `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in a Vercel dashboard
 *      cannot quietly ship.
 *
 *   2. The app password and the vault passphrase are INDEPENDENT credentials.
 *      See the `assertIndependentCredentials` block at the bottom.
 */

import { Buffer } from "node:buffer";
import { z } from "zod";

/* ------------------------------------------------------------------ *
 * Failure type
 * ------------------------------------------------------------------ */

/**
 * Thrown at boot when the environment is unusable.
 *
 * Never carries a variable's VALUE — only its name and what is wrong with it.
 * Boot errors end up in log aggregators, crash reporters and CI output, all of
 * which are less private than the secret store the value came from.
 */
export class EnvironmentError extends Error {
  override readonly name = "EnvironmentError";

  constructor(problems: readonly string[]) {
    super(
      [
        "Invalid environment for apps/web. The app will not start.",
        "",
        ...problems.map((p) => `  - ${p}`),
        "",
        "Every variable is documented in apps/web/.env.example, including how",
        "to generate it. Copy that file to .env.local and fill it in.",
      ].join("\n"),
    );
  }
}

/* ------------------------------------------------------------------ *
 * scrypt hash encoding
 * ------------------------------------------------------------------ */

/**
 * Stored credential format:
 *
 *     scrypt$<N>$<r>$<p>$<salt-base64>$<key-base64>
 *
 * The cost parameters travel WITH the hash instead of living in a constant
 * somewhere. That is what lets us raise `N` later without invalidating the two
 * credentials that already exist — verification reads the parameters off the
 * stored string, so an old hash keeps verifying under its old cost.
 */
const SCRYPT_PATTERN =
  /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9+/]+={0,2})\$([A-Za-z0-9+/]+={0,2})$/;

/** Minimum CPU/memory cost. 2^14 is the floor for an interactive login. */
const MIN_SCRYPT_N = 16_384;
/** 16 bytes is the smallest salt that is meaningfully unguessable. */
const MIN_SALT_BYTES = 16;
/** 32 bytes of derived key — matches SHA-256 output width. */
const MIN_KEY_BYTES = 32;
/** HS256 keys shorter than the hash width weaken the MAC. */
const MIN_SESSION_SECRET_BYTES = 32;

/** A parsed `scrypt$...` credential string. */
export interface ScryptHash {
  /** CPU/memory cost. Always a power of two. */
  readonly n: number;
  /** Block size. */
  readonly r: number;
  /** Parallelisation. */
  readonly p: number;
  /** Random per-credential salt. Not secret, but must never be reused. */
  readonly salt: Buffer;
  /** The derived key itself. */
  readonly key: Buffer;
}

/**
 * Decode a stored credential string.
 *
 * Exported so that the auth code verifying a password does not have to
 * re-implement this split — one parser, one format, one place to change.
 *
 * @throws {EnvironmentError} if the string is not a well-formed credential.
 */
export function parseScryptHash(label: string, value: string): ScryptHash {
  const problems = collectScryptProblems(label, value);
  if (problems.length > 0) throw new EnvironmentError(problems);

  // Safe: `collectScryptProblems` returning empty means the pattern matched.
  const groups = SCRYPT_PATTERN.exec(value)?.slice(1) ?? [];
  const [nRaw = "", rRaw = "", pRaw = "", saltB64 = "", keyB64 = ""] = groups;

  return {
    n: Number.parseInt(nRaw, 10),
    r: Number.parseInt(rRaw, 10),
    p: Number.parseInt(pRaw, 10),
    salt: Buffer.from(saltB64, "base64"),
    key: Buffer.from(keyB64, "base64"),
  };
}

/**
 * Everything wrong with a credential string, as human sentences.
 *
 * Returns all problems rather than the first one: fixing an environment one
 * error message per restart is a miserable way to spend an afternoon.
 */
function collectScryptProblems(label: string, value: string): string[] {
  const groups = SCRYPT_PATTERN.exec(value)?.slice(1);
  if (!groups) {
    return [
      `${label} is malformed. Expected "scrypt$<N>$<r>$<p>$<salt-base64>$<key-base64>".`,
    ];
  }

  const [nRaw = "", rRaw = "", pRaw = "", saltB64 = "", keyB64 = ""] = groups;
  const problems: string[] = [];

  const n = Number.parseInt(nRaw, 10);
  const r = Number.parseInt(rRaw, 10);
  const p = Number.parseInt(pRaw, 10);

  if (!Number.isSafeInteger(n) || n < MIN_SCRYPT_N) {
    problems.push(`${label} has scrypt N below the ${MIN_SCRYPT_N} minimum.`);
  } else if ((n & (n - 1)) !== 0) {
    problems.push(`${label} has scrypt N = ${n}, which is not a power of two.`);
  }
  if (!Number.isSafeInteger(r) || r < 1) {
    problems.push(`${label} has an invalid scrypt block size (r).`);
  }
  if (!Number.isSafeInteger(p) || p < 1) {
    problems.push(`${label} has an invalid scrypt parallelisation (p).`);
  }

  const salt = Buffer.from(saltB64, "base64");
  if (salt.toString("base64") !== saltB64) {
    problems.push(`${label} has a salt that is not canonical base64.`);
  } else if (salt.byteLength < MIN_SALT_BYTES) {
    problems.push(
      `${label} has a ${salt.byteLength}-byte salt; ${MIN_SALT_BYTES} bytes is the minimum.`,
    );
  }

  const key = Buffer.from(keyB64, "base64");
  if (key.toString("base64") !== keyB64) {
    problems.push(`${label} has a derived key that is not canonical base64.`);
  } else if (key.byteLength < MIN_KEY_BYTES) {
    problems.push(
      `${label} has a ${key.byteLength}-byte derived key; ${MIN_KEY_BYTES} bytes is the minimum.`,
    );
  }

  return problems;
}

/* ------------------------------------------------------------------ *
 * Schema
 * ------------------------------------------------------------------ */

/** Blank and whitespace-only count as absent — an empty `FOO=` is not a value. */
function blankToUndefined(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

function requiredString(label: string) {
  return z.preprocess(
    blankToUndefined,
    z.string({ error: `${label} is missing.` }),
  );
}

function scryptHashVar(label: string) {
  return requiredString(label).superRefine((value, ctx) => {
    for (const message of collectScryptProblems(label, String(value))) {
      ctx.addIssue({ code: "custom", message });
    }
  });
}

const envSchema = z.object({
  /**
   * The only public variable. A Supabase project URL is printed in every
   * client request anyway; hiding it would be theatre. Row Level Security is
   * what protects the data, not the obscurity of the hostname.
   */
  NEXT_PUBLIC_SUPABASE_URL: requiredString("NEXT_PUBLIC_SUPABASE_URL")
    .superRefine((value, ctx) => {
      let url: URL;
      try {
        url = new URL(String(value));
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "NEXT_PUBLIC_SUPABASE_URL is not a valid absolute URL.",
        });
        return;
      }
      if (url.protocol !== "https:") {
        ctx.addIssue({
          code: "custom",
          message: `NEXT_PUBLIC_SUPABASE_URL must use https, got "${url.protocol}".`,
        });
      }
      if (url.search !== "" || url.hash !== "") {
        ctx.addIssue({
          code: "custom",
          message:
            "NEXT_PUBLIC_SUPABASE_URL must be a bare origin — no query string, no fragment.",
        });
      }
    })
    // Normalised to a bare origin so callers can concatenate paths without
    // second-guessing whether this value ends in a slash.
    .transform((value) => new URL(String(value)).origin),

  /**
   * Bypasses Row Level Security completely. Server-only, always. If this ever
   * reaches a browser the entire database is readable and writable by anyone.
   */
  SUPABASE_SERVICE_ROLE_KEY: requiredString(
    "SUPABASE_SERVICE_ROLE_KEY",
  ).superRefine((value, ctx) => {
    const key = String(value);
    if (/\s/.test(key)) {
      ctx.addIssue({
        code: "custom",
        message:
          "SUPABASE_SERVICE_ROLE_KEY contains whitespace — it was probably line-wrapped on paste.",
      });
    }
    if (key.length < 40) {
      ctx.addIssue({
        code: "custom",
        message:
          "SUPABASE_SERVICE_ROLE_KEY is too short to be a real service role key.",
      });
    }
  }),

  /** Opens the book. Known to both of us. */
  APP_PASSWORD_HASH: scryptHashVar("APP_PASSWORD_HASH"),

  /** Opens the vault. A different secret, independently generated. */
  VAULT_PASSPHRASE_HASH: scryptHashVar("VAULT_PASSPHRASE_HASH"),

  /** HS256 signing key for `jose`. Rotating this invalidates every session. */
  SESSION_SECRET: requiredString("SESSION_SECRET").superRefine((value, ctx) => {
    const raw = String(value);
    const bytes = Buffer.from(raw, "base64");
    if (bytes.toString("base64") !== raw) {
      ctx.addIssue({
        code: "custom",
        message: "SESSION_SECRET is not canonical base64.",
      });
      return;
    }
    if (bytes.byteLength < MIN_SESSION_SECRET_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: `SESSION_SECRET decodes to ${bytes.byteLength} bytes; HS256 needs at least ${MIN_SESSION_SECRET_BYTES}.`,
      });
    }
  }),
});

/** The validated environment. */
export type Env = z.infer<typeof envSchema>;

/* ------------------------------------------------------------------ *
 * Boot assertions
 * ------------------------------------------------------------------ */

/**
 * Variables allowed to carry the `NEXT_PUBLIC_` prefix.
 *
 * Adding a name here is a decision to publish that value to every browser that
 * loads the app, forever, including in already-cached bundles. Make it
 * deliberately.
 */
const PUBLIC_ALLOWLIST: ReadonlySet<string> = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
]);

/**
 * Catch a secret that has been given a `NEXT_PUBLIC_` prefix.
 *
 * The realistic failure is not someone writing `NEXT_PUBLIC_` in this repo —
 * a reviewer would see that. It is someone pasting a key into the wrong box in
 * a hosting dashboard at 1am. That never touches the codebase, so only a
 * runtime check against the real environment can find it.
 */
function collectPublicPrefixProblems(source: NodeJS.ProcessEnv): string[] {
  return Object.keys(source)
    .filter((key) => key.startsWith("NEXT_PUBLIC_"))
    .filter((key) => !PUBLIC_ALLOWLIST.has(key))
    .sort()
    .map(
      (key) =>
        `${key} uses the NEXT_PUBLIC_ prefix, which inlines it into the browser bundle. ` +
        `Only ${[...PUBLIC_ALLOWLIST].join(", ")} may be public. Rename it, or add it to ` +
        `PUBLIC_ALLOWLIST in lib/env.ts if it is genuinely not a secret.`,
    );
}

/**
 * The assertion this whole module exists for.
 *
 * The app password opens the book. The vault passphrase opens the private
 * items. If the second is derivable from the first, then the book's password —
 * the one typed on a phone, in public, most days — also opens the vault, and
 * the vault was never a second door at all.
 *
 * Independence cannot be proven from two hashes; that is the honest limit of a
 * runtime check. What CAN be caught is every plausible way the mistake
 * actually happens:
 *
 *   - Copying the whole `APP_PASSWORD_HASH` line and editing the variable name
 *     -> identical salt AND identical key.
 *   - Reusing one generated salt for both, "to keep it simple"
 *     -> identical salt, different key. This is the dangerous one: it looks
 *        fine, and it means one rainbow table covers both credentials.
 *   - Hashing the same passphrase twice with fresh salts
 *     -> not detectable here, and the reason the README says to generate each
 *        secret in a password manager rather than typing one you invented.
 *
 * A shared salt is enough to refuse to start. Two independently generated
 * credentials have a vanishing chance of colliding, so a collision is not bad
 * luck — it is evidence of derivation.
 */
function collectCredentialIndependenceProblems(
  appRaw: string | undefined,
  vaultRaw: string | undefined,
): string[] {
  // Run even when other variables are invalid, so this — the assertion the
  // whole module exists for — is never hidden behind an unrelated typo. If
  // either credential is itself malformed the schema already says so, and
  // there is nothing meaningful to compare.
  if (appRaw === undefined || vaultRaw === undefined) return [];
  if (collectScryptProblems("APP_PASSWORD_HASH", appRaw).length > 0) return [];
  if (collectScryptProblems("VAULT_PASSPHRASE_HASH", vaultRaw).length > 0) {
    return [];
  }

  const app = parseScryptHash("APP_PASSWORD_HASH", appRaw);
  const vault = parseScryptHash("VAULT_PASSPHRASE_HASH", vaultRaw);
  const problems: string[] = [];

  if (app.salt.equals(vault.salt)) {
    problems.push(
      "APP_PASSWORD_HASH and VAULT_PASSPHRASE_HASH share a salt. Each credential " +
        "must be generated with its own random salt — a shared salt means one " +
        "precomputation attacks both doors. Regenerate VAULT_PASSPHRASE_HASH from " +
        "scratch (see apps/web/README.md).",
    );
  }

  if (app.key.equals(vault.key)) {
    problems.push(
      "APP_PASSWORD_HASH and VAULT_PASSPHRASE_HASH are the same hash. The vault " +
        "passphrase must be a different secret from the app password — not the " +
        "same string, not a suffix of it, not a second round over the same input. " +
        "Generate an independent passphrase (see apps/web/README.md).",
    );
  }

  return problems;
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

function loadEnv(source: NodeJS.ProcessEnv): Env {
  // Reading these by literal name rather than handing the whole `process.env`
  // to Zod keeps the surface explicit, and stops an unrelated variable from
  // ever being carried into the returned object.
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
    APP_PASSWORD_HASH: source.APP_PASSWORD_HASH,
    VAULT_PASSPHRASE_HASH: source.VAULT_PASSPHRASE_HASH,
    SESSION_SECRET: source.SESSION_SECRET,
  });

  const problems = [
    ...collectPublicPrefixProblems(source),
    // Zod's own wording for a missing key mentions "undefined", which reads as
    // a bug rather than a to-do. Our custom messages already say what to fix,
    // so they are used verbatim.
    ...(result.success ? [] : result.error.issues.map((i) => i.message)),
    ...collectCredentialIndependenceProblems(
      source.APP_PASSWORD_HASH?.trim(),
      source.VAULT_PASSPHRASE_HASH?.trim(),
    ),
  ];

  if (problems.length > 0) throw new EnvironmentError(problems);
  if (!result.success) throw new EnvironmentError(["Unknown validation error."]);

  return Object.freeze(result.data);
}

// A `process.env` lookup this module does not control cannot be validated, and
// on the client every server variable is `undefined` by design. Failing here is
// clearer than five confusing "is missing" errors in a browser console.
if (typeof window !== "undefined") {
  throw new EnvironmentError([
    "lib/env.ts was imported from client code. It reads server-only secrets and " +
      "must never reach the browser bundle. Read `env` in a server component or " +
      "route handler and pass the specific value down as a prop.",
  ]);
}

/**
 * The validated, frozen environment. The only supported way to read config.
 *
 * ```ts
 * import { env } from "@/lib/env";
 * const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
 * ```
 */
export const env: Env = loadEnv(process.env);
