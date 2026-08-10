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
 *      not configuration. Exactly one variable WE name is allowed to carry it,
 *      plus the `NEXT_PUBLIC_VERCEL_*` namespace the host injects and we do not
 *      control. The allowlist below is checked against the real environment at
 *      boot, so a stray `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in a Vercel
 *      dashboard still cannot quietly ship.
 *
 *   2. Eva's password, Adam's password and the vault passphrase are THREE
 *      INDEPENDENT credentials. See the independence block at the bottom.
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

  /**
   * Opens the book, as Eva. Hers alone — Adam does not have it.
   *
   * There used to be one `APP_PASSWORD_HASH` that both of them typed, which
   * meant the front door could not say who had come in and Eva's way into the
   * archive was a string in Adam's password manager. Two variables is what
   * turns that from a shared key into her own.
   */
  APP_PASSWORD_HASH_EVA: scryptHashVar("APP_PASSWORD_HASH_EVA"),

  /** Opens the book, as Adam. A different secret, independently generated. */
  APP_PASSWORD_HASH_ADAM: scryptHashVar("APP_PASSWORD_HASH_ADAM"),

  /** Opens the vault. A third secret, independently generated. */
  VAULT_PASSPHRASE_HASH: scryptHashVar("VAULT_PASSPHRASE_HASH"),

  /**
   * The margin's API key. OPTIONAL, and the only optional variable here.
   *
   * Every other variable in this file is required because the app cannot serve
   * a page without it. This one gates a single feature: with no key the margin
   * is unreachable and the book, the day and the pocket all work exactly as
   * before. Making it required would mean a missing AI credential takes the
   * whole product down, which is the wrong failure for the least essential
   * thing in it.
   *
   * `lib/ai/transport.ts` throws `MissingApiKeyError` at the point of use, so
   * the absence is reported as a specific, fixable condition rather than as an
   * outage.
   */
  ANTHROPIC_API_KEY: z.preprocess(
    blankToUndefined,
    z.string().optional(),
  ),

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
 * Prefixes owned by the host, not by this app.
 *
 * The allowlist above answers "which of OUR variables may be public". It
 * silently assumed we name every variable in the environment, and we do not:
 * Vercel injects its own at build time — `NEXT_PUBLIC_VERCEL_URL`,
 * `NEXT_PUBLIC_VERCEL_PROJECT_ID`, `NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG` and
 * others — whenever "Automatically expose System Environment Variables" is on.
 * That produced six boot failures for values that are a hostname, a project id
 * and a git branch name. Not secrets, and not ours to rename.
 *
 * Matching the namespace rather than listing the six names is the point.
 * `VERCEL_` is reserved by the platform — its dashboard refuses to create a
 * custom variable under that prefix — so nothing we own can land here, and a
 * seventh system variable in some future release will not break a build at
 * 1am. A list of six strings would.
 *
 * WIDEN THIS NO FURTHER. Adding `NEXT_PUBLIC_` itself, or any prefix whose
 * namespace this project can write into, deletes the guard: the whole value of
 * the check is that a human-chosen name must be justified one at a time. Only
 * a prefix that (a) a third party controls and (b) that party documents as
 * non-secret metadata belongs in this array.
 */
const PLATFORM_PUBLIC_PREFIXES: readonly string[] = ["NEXT_PUBLIC_VERCEL_"];

/** True when the hosting platform, not this app, owns the variable's name. */
function isPlatformOwned(key: string): boolean {
  return PLATFORM_PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix));
}

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
    .filter((key) => !isPlatformOwned(key))
    .sort()
    .map(
      (key) =>
        `${key} uses the NEXT_PUBLIC_ prefix, which inlines it into the browser bundle. ` +
        `Only ${[...PUBLIC_ALLOWLIST].join(", ")} may be public. Rename it, or add it to ` +
        `PUBLIC_ALLOWLIST in lib/env.ts if it is genuinely not a secret.`,
    );
}

/**
 * The variable that used to be the only door, and is no longer read.
 *
 * Kept here as a name rather than deleted from the file entirely, because the
 * value is still sitting in a Vercel dashboard and in somebody's `.env.local`
 * on the day this ships, and a secret nothing checks is a secret nobody
 * rotates.
 */
const RETIRED_APP_PASSWORD_VAR = "APP_PASSWORD_HASH";

/**
 * A leftover shared password, reported but NOT fatal.
 *
 * This is deliberately a warning and not a boot problem, and the asymmetry is
 * the point. Refusing to start would mean that a deploy where both new
 * variables are set correctly and the old one merely still exists takes the
 * app down — and this is the one door of an archive with no reset flow and no
 * recovery email, where "down" is not recoverable by the person locked out.
 * The cost of the leftover is a stale secret; the cost of failing closed is
 * two people outside. So it is said loudly, once, at boot, and the app serves.
 */
function collectRetiredVariableWarnings(source: NodeJS.ProcessEnv): string[] {
  const raw = source[RETIRED_APP_PASSWORD_VAR]?.trim();
  if (raw === undefined || raw === "") return [];

  return [
    `${RETIRED_APP_PASSWORD_VAR} is set but is no longer read by anything. Eva and Adam ` +
      "now have their own credentials — APP_PASSWORD_HASH_EVA and APP_PASSWORD_HASH_ADAM. " +
      `Delete ${RETIRED_APP_PASSWORD_VAR} wherever it is defined (Vercel project settings, ` +
      ".env.local): until you do, the old shared password still exists as a secret that " +
      "nothing verifies and nobody rotates.",
  ];
}

/** The credentials that must all be independent of one another. Eva first. */
const INDEPENDENT_CREDENTIAL_VARS = [
  "APP_PASSWORD_HASH_EVA",
  "APP_PASSWORD_HASH_ADAM",
  "VAULT_PASSPHRASE_HASH",
] as const;

/**
 * The assertion this whole module exists for.
 *
 * THREE secrets now, not two. Eva's password and Adam's password open the
 * book; the vault passphrase opens the private items. Every pair of them has
 * to be independent, and each pair fails differently if it is not:
 *
 *   - Eva's and Adam's derived from one another: the door can no longer say
 *     who came in, which is the entire point of there being two of them. Worse
 *     than the single shared password it replaced, because the token would now
 *     assert an identity that is not true.
 *   - Either of theirs and the vault's: the password typed on a phone, in
 *     public, most days also opens the private items, and the vault was never
 *     a second door at all.
 *
 * Independence cannot be proven from hashes; that is the honest limit of a
 * runtime check. What CAN be caught is every plausible way the mistake
 * actually happens:
 *
 *   - Copying a whole `APP_PASSWORD_HASH_EVA=` line and editing the variable
 *     name -> identical salt AND identical key. The likeliest mistake of all
 *     while splitting one variable into two.
 *   - Reusing one generated salt for both, "to keep it simple"
 *     -> identical salt, different key. This is the dangerous one: it looks
 *        fine, and it means one precomputation covers both credentials.
 *   - Hashing the same passphrase twice with fresh salts
 *     -> not detectable here, and the reason the README says to generate each
 *        secret in a password manager rather than typing one you invented.
 *        `lib/auth/door.ts` catches this one at the door instead, at the only
 *        moment it can be seen: when a single typed string opens both.
 *
 * A shared salt is enough to refuse to start. Independently generated
 * credentials have a vanishing chance of colliding, so a collision is not bad
 * luck — it is evidence of derivation.
 */
function collectCredentialIndependenceProblems(
  source: NodeJS.ProcessEnv,
): string[] {
  // Run even when other variables are invalid, so this — the assertion the
  // whole module exists for — is never hidden behind an unrelated typo. A
  // credential that is itself malformed is already reported by the schema and
  // has nothing meaningful to compare.
  const usable = INDEPENDENT_CREDENTIAL_VARS.flatMap((label) => {
    const raw = source[label]?.trim();
    if (raw === undefined) return [];
    if (collectScryptProblems(label, raw).length > 0) return [];
    return [{ label, hash: parseScryptHash(label, raw) }];
  });

  const problems: string[] = [];

  // Every pair, not just the adjacent ones: with three credentials there are
  // three pairs, and the one that gets skipped by a loop over neighbours is
  // Eva-versus-vault, which is exactly as bad as the two it would have checked.
  for (let i = 0; i < usable.length; i += 1) {
    for (let j = i + 1; j < usable.length; j += 1) {
      const a = usable[i]!;
      const b = usable[j]!;

      if (a.hash.salt.equals(b.hash.salt)) {
        problems.push(
          `${a.label} and ${b.label} share a salt. Each credential must be generated ` +
            "with its own random salt — a shared salt means one precomputation attacks " +
            `both. Regenerate ${b.label} from scratch (see apps/web/README.md).`,
        );
      }

      if (a.hash.key.equals(b.hash.key)) {
        problems.push(
          `${a.label} and ${b.label} are the same hash. Each of these must be a ` +
            "different secret — not the same string, not a suffix of another, not a " +
            `second round over the same input. Generate an independent secret for ` +
            `${b.label} (see apps/web/README.md).`,
        );
      }
    }
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
    APP_PASSWORD_HASH_EVA: source.APP_PASSWORD_HASH_EVA,
    APP_PASSWORD_HASH_ADAM: source.APP_PASSWORD_HASH_ADAM,
    VAULT_PASSPHRASE_HASH: source.VAULT_PASSPHRASE_HASH,
    SESSION_SECRET: source.SESSION_SECRET,
    ANTHROPIC_API_KEY: source.ANTHROPIC_API_KEY,
  });

  // Said before the throw below, so a leftover shared password is still
  // reported on a boot that is also failing for an unrelated reason.
  for (const warning of collectRetiredVariableWarnings(source)) {
    console.warn(warning);
  }

  const problems = [
    ...collectPublicPrefixProblems(source),
    // Zod's own wording for a missing key mentions "undefined", which reads as
    // a bug rather than a to-do. Our custom messages already say what to fix,
    // so they are used verbatim.
    ...(result.success ? [] : result.error.issues.map((i) => i.message)),
    ...collectCredentialIndependenceProblems(source),
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
