/**
 * Eva & Adam — reads and writes against `public.auth_attempts`.
 *
 * The rate limiter lives in Postgres, not in a module-level `Map`. On a
 * serverless platform every request may land in a different lambda with its own
 * fresh heap, so an in-memory counter is not a weak limiter — it is no limiter
 * at all, and it is worse than none because it looks like one in code review.
 * The table is shared state; that is the entire reason it exists.
 *
 * Two scopes share the table. `'session'` is the front door, `'vault'` is the
 * passphrase in front of the pocket. They are counted independently: someone
 * fumbling the app password five times must not lock the vault, and pressure on
 * the vault must be visible on its own rather than buried in ordinary sign-ins.
 * Vault unlock is not wired yet — every function here already takes `scope`, so
 * that work is a call site, not a change to this file.
 */

import { db } from "@/lib/data/client";

/** The two things a person can try to unlock. Mirrors the SQL check constraint. */
export type AuthScope = "session" | "vault";

/** One attempt, as it is written down. */
export interface AuthAttempt {
  /**
   * Client address, or null when none could be resolved.
   *
   * Nullable on purpose (and in the schema): losing the attempt because the
   * address was unreadable would be strictly worse than losing the address.
   */
  ip: string | null;
  userAgent: string | null;
  scope: AuthScope;
  /** True when the secret matched. */
  ok: boolean;
}

/**
 * Record an attempt. Never throws.
 *
 * A write failure here must not turn a correct password into an error page:
 * the limiter degrades, the person still gets in. The failure is logged loudly
 * because a limiter that has silently stopped recording is a limiter that has
 * silently stopped limiting, and that is exactly the state you want an alert
 * for rather than a mystery about.
 */
export async function recordAuthAttempt(attempt: AuthAttempt): Promise<void> {
  const { error } = await db().from("auth_attempts").insert({
    ip: attempt.ip,
    user_agent: attempt.userAgent,
    scope: attempt.scope,
    ok: attempt.ok,
  });

  if (error) {
    console.error("auth_attempts.insert failed", {
      scope: attempt.scope,
      ok: attempt.ok,
      code: error.code,
      message: error.message,
    });
  }
}

/**
 * The most this reads in one query.
 *
 * The limiter only ever needs to know whether a small threshold has been
 * crossed and when the oldest counted attempt ages out. A cap keeps a sustained
 * attack from turning every single request into an unbounded read of a table
 * the attacker is personally filling up.
 */
const MAX_ROWS = 200;

/**
 * When each unsuccessful attempt from this address happened, newest first.
 *
 * Timestamps rather than a `count`, because a sliding window has to answer
 * "when does this clear" as well as "is it over the line". A bare count can
 * only ever produce a made-up `Retry-After`.
 *
 * `ip` of null means the address was unresolvable. Those attempts are recorded
 * but never counted against a per-address window: with a null key they would
 * all share one bucket, and the first unreadable address would lock out every
 * other one. The global limit is what covers that case.
 */
export async function failuresFromAddress(
  scope: AuthScope,
  ip: string | null,
  since: Date,
): Promise<Date[]> {
  if (ip === null) return [];

  const { data, error } = await db()
    .from("auth_attempts")
    .select("at")
    .eq("scope", scope)
    .eq("ok", false)
    .eq("ip", ip)
    .gte("at", since.toISOString())
    .order("at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) throw new AuthAttemptsReadError("failuresFromAddress", error);
  return toDates(data);
}

/**
 * When each unsuccessful attempt happened across every address, newest first.
 *
 * This is the limit that survives a rotating source address. Per-address
 * counting is trivially defeated by having more addresses; the global window is
 * the backstop, and it is deliberately generous enough that the two people who
 * use this app will never meet it.
 */
export async function failuresEverywhere(
  scope: AuthScope,
  since: Date,
): Promise<Date[]> {
  const { data, error } = await db()
    .from("auth_attempts")
    .select("at")
    .eq("scope", scope)
    .eq("ok", false)
    .gte("at", since.toISOString())
    .order("at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) throw new AuthAttemptsReadError("failuresEverywhere", error);
  return toDates(data);
}

/**
 * A read against `auth_attempts` did not complete.
 *
 * Thrown rather than swallowed. A write can fail open — the person still gets
 * in and we lose one row of history. A READ cannot: if the limiter cannot see
 * the recent attempts, it cannot know whether this is the second try or the
 * five-hundredth, and answering "come in" on no information is how a limiter
 * becomes decorative.
 */
export class AuthAttemptsReadError extends Error {
  override readonly name = "AuthAttemptsReadError";

  constructor(operation: string, cause: { code?: string; message: string }) {
    super(`auth_attempts.${operation} failed: ${cause.message}`);
  }
}

/** Postgres hands back ISO strings; the limiter works in `Date`. */
function toDates(rows: readonly { at: string }[] | null): Date[] {
  return (rows ?? [])
    .map((row) => new Date(row.at))
    .filter((d) => !Number.isNaN(d.getTime()));
}
