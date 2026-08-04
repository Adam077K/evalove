/**
 * Eva & Adam — the unlock rate limiter.
 *
 * Two windows, both sliding, both counting only UNSUCCESSFUL attempts:
 *
 *   - Per address: more than 5 in 15 minutes and the next one is refused. This
 *     is the one that stops a guesser, and it is the one a real person can trip
 *     by fumbling a password on a phone — hence a window that clears itself in
 *     a quarter of an hour rather than a ban.
 *   - Everywhere: more than 20 in an hour and the door is shut for an hour.
 *     Per-address counting is defeated by having more addresses, which costs an
 *     attacker nothing. This is the backstop. Twenty unsuccessful attempts in an
 *     hour is a number the two people who use this app will never reach, and a
 *     distributed guesser reaches it in under a second.
 *
 * `scope` is `'session'` or `'vault'` and the two count independently, so
 * fumbling the front door cannot lock the pocket. Vault unlock is not wired
 * yet; every function here already takes the scope, so wiring it is a call
 * site rather than an edit to this file.
 *
 * The decision is a pure function of timestamps. All the IO is in
 * `lib/data/auth-attempts.ts`, which means the interesting behaviour — where
 * exactly the boundary is, what `Retry-After` should say — is testable without
 * a database, and IS tested without one.
 *
 * FAIL-CLOSED POSTURE — which door it applies to and why:
 *
 * The original argument for failing closed was correct: a distributed guesser
 * who can make the storage unreachable to switch off the limiter will happily
 * wait a few seconds to do so. That argument still holds — but it does not hold
 * equally for both doors.
 *
 *   scope='vault': ALWAYS fails closed. The vault passphrase is a 20-character
 *     manager-generated secret. Online guessing is not a realistic threat model
 *     because no attacker reaches the vault before exhausting every other path.
 *     The cost of a false negative (attacker gets in during an outage) is severe
 *     and irreversible. Failing closed is correct here.
 *
 *   scope='session': degrades to in-process counters
 *     (`checkDegradedSessionRateLimit`) instead of failing closed. The session
 *     password is shared between two people on their phones; fumbling it on the
 *     way home is normal. The cost of a false negative is not zero, but the
 *     cost of the false positive — two people locked out of their own archive
 *     at 3am because Supabase's free tier paused — is worse and happens far
 *     more often. Two in-process counters keep meaningful bounds per instance:
 *     a per-IP limit (3 wrong guesses / 15 min) and a global limit (20 wrong
 *     guesses / 15 min across all IPs) that caps the distributed case the
 *     per-IP limit alone cannot stop.
 *
 * The split is implemented in the catch block of `app/api/session/route.ts`.
 * `checkDegradedSessionRateLimit` takes no scope parameter: the name is the
 * type. Vault scope never reaches that path; when vault is wired, its own
 * catch block MUST keep failing closed and MUST NOT call this function.
 */

import {
  failuresEverywhere,
  failuresFromAddress,
  type AuthScope,
} from "@/lib/data/auth-attempts";

/* ------------------------------------------------------------------ *
 * The numbers
 * ------------------------------------------------------------------ */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** How far back the per-address window looks. */
export const ADDRESS_WINDOW_MS = 15 * MINUTE_MS;

/**
 * Unsuccessful attempts allowed from one address inside that window.
 *
 * Five are allowed; the sixth is refused. "More than 5 in 15 minutes" means the
 * limit is crossed at the sixth attempt, not the fifth — an off-by-one here is
 * a person being locked out one try earlier than the sentence they were told.
 */
export const ADDRESS_MAX_FAILURES = 5;

/** How far back the global window looks. */
export const GLOBAL_WINDOW_MS = HOUR_MS;

/** Unsuccessful attempts allowed across every address inside that window. */
export const GLOBAL_MAX_FAILURES = 20;

/**
 * How long the global limit shuts the door for, measured from the most recent
 * unsuccessful attempt.
 *
 * A true lockout rather than a sliding window: while an attack is in progress
 * every new attempt pushes the release out, so the door does not reopen the
 * instant the oldest attempt ages out only to be slammed again.
 */
export const GLOBAL_LOCKOUT_MS = HOUR_MS;

/* ------------------------------------------------------------------ *
 * The decision
 * ------------------------------------------------------------------ */

/** Which limit refused the attempt. Never shown to the client. */
export type RateLimitReason = "address" | "global";

export type RateLimitDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: RateLimitReason;
      /** Whole seconds until the next attempt can be made. Always >= 1. */
      retryAfterSeconds: number;
    };

/** The timestamps a decision is made from. Newest first is not required. */
export interface FailureHistory {
  /** Unsuccessful attempts from this address inside the address window. */
  fromAddress: readonly Date[];
  /** Unsuccessful attempts from every address inside the global window. */
  everywhere: readonly Date[];
}

/**
 * Should this attempt be allowed? Pure.
 *
 * The global limit is checked first: when both are tripped, the honest
 * `Retry-After` is the longer of the two, and reporting the address window's
 * shorter one would promise a reopening that is not going to happen.
 */
export function decideRateLimit(
  history: FailureHistory,
  now: Date,
): RateLimitDecision {
  const nowMs = now.getTime();

  const global = within(history.everywhere, nowMs, GLOBAL_WINDOW_MS);
  if (global.length >= GLOBAL_MAX_FAILURES) {
    // Newest attempt + the lockout. `global` is non-empty here: the threshold
    // is a positive integer, so reaching it means at least one timestamp.
    const newest = Math.max(...global.map((d) => d.getTime()));
    return {
      allowed: false,
      reason: "global",
      retryAfterSeconds: secondsUntil(newest + GLOBAL_LOCKOUT_MS, nowMs),
    };
  }

  const address = within(history.fromAddress, nowMs, ADDRESS_WINDOW_MS);
  if (address.length >= ADDRESS_MAX_FAILURES) {
    // A sliding window clears when its OLDEST counted attempt ages out — at
    // that instant the count drops below the threshold and one more try is
    // available. Anything else over-reports the wait.
    const oldest = Math.min(...address.map((d) => d.getTime()));
    return {
      allowed: false,
      reason: "address",
      retryAfterSeconds: secondsUntil(oldest + ADDRESS_WINDOW_MS, nowMs),
    };
  }

  return { allowed: true };
}

/**
 * Read the history and decide.
 *
 * The two reads are issued together. They are independent, and running them in
 * series would double the latency of every single login for no reason.
 *
 * A read that throws is NOT caught here. If the limiter cannot see the recent
 * attempts it does not know whether this is the second try or the
 * five-hundredth, and the caller must decide what to do about that with its
 * eyes open — see the handler in `app/api/session/route.ts`.
 */
export async function checkRateLimit(
  scope: AuthScope,
  ip: string | null,
  now: Date = new Date(),
): Promise<RateLimitDecision> {
  const [fromAddress, everywhere] = await Promise.all([
    failuresFromAddress(scope, ip, new Date(now.getTime() - ADDRESS_WINDOW_MS)),
    failuresEverywhere(scope, new Date(now.getTime() - GLOBAL_WINDOW_MS)),
  ]);

  return decideRateLimit({ fromAddress, everywhere }, now);
}

/* ------------------------------------------------------------------ *
 * Degraded fallback — in-process counters
 * ------------------------------------------------------------------ */

/**
 * Wrong-password attempts allowed from one address in the 15-minute window
 * on a single lambda instance while the database is unreachable.
 *
 * Three is intentionally smaller than the normal per-address limit of five:
 * the degraded path cannot see across lambda instances, so the per-instance
 * budget is narrower to compensate.
 */
export const DEGRADED_MAX_FAILURES = 3;

/**
 * Wrong-password attempts allowed across ALL addresses on a single lambda
 * instance while the database is unreachable.
 *
 * This is the cap that stops a distributed guesser. Without it, an attacker
 * who has forced the door into degraded mode (by flooding the endpoint until
 * Supabase read latency spikes) could send one wrong guess per IP and never
 * trip the per-address limit. Twenty wrong guesses in 15 minutes from any
 * combination of addresses locks the instance.
 *
 * Matches `GLOBAL_MAX_FAILURES` numerically so the healthy and degraded paths
 * share the same philosophical bound; the window (15 min vs 1 hour) is already
 * more restrictive.
 */
export const DEGRADED_GLOBAL_MAX_FAILURES = 20;

/**
 * Per-IP store. Key is the client IP, or `_DEGRADED_NULL_KEY` for unresolvable
 * addresses. Values are epoch-ms timestamps of uncharged attempts (wrong
 * passwords). Module-scope = per lambda instance.
 */
const _degradedAttempts = new Map<string, number[]>();
const _DEGRADED_NULL_KEY = "__null__";

/**
 * Global store. All addresses combined, per lambda instance. Same window as
 * the per-IP counter.
 */
let _degradedGlobal: number[] = [];

/**
 * The fallback decision when the database is unreachable. Session scope only —
 * the name is the type. Vault scope never reaches this function; when vault is
 * wired its own catch block must keep failing closed (see file header).
 *
 * Two limits, mirroring the structure of `decideRateLimit`:
 *
 *   - Global: more than `DEGRADED_GLOBAL_MAX_FAILURES` wrong guesses from any
 *     combination of addresses in 15 minutes locks the instance. Checked first
 *     so the honest `Retry-After` is the longer of the two, and so that a
 *     distributed guesser is capped even when no single IP trips the per-IP
 *     limit.
 *   - Per-address: more than `DEGRADED_MAX_FAILURES` wrong guesses from one
 *     address in 15 minutes locks that address.
 *
 * Counting discipline: each allowed call charges one timestamp against BOTH
 * counters before the password outcome is known (pessimistic). On a correct
 * password the caller must call `refundDegradedAttempt` to remove those
 * charges from both counters, so that troubleshooting across devices — the
 * scenario an outage most often produces — does not exhaust the budget.
 *
 * The client-visible response on the refused path is byte-identical to the
 * ordinary rate-limit 429. No banner, no header, no different message: telling
 * a caller "the limiter is degraded" is an oracle for the one attacker this
 * still guards against (someone who can force the degraded state on demand).
 */
export function checkDegradedSessionRateLimit(
  ip: string | null,
  now: Date = new Date(),
): RateLimitDecision {
  const nowMs = now.getTime();
  const windowStart = nowMs - ADDRESS_WINDOW_MS;

  // --- global limit: check first (mirrors decideRateLimit's ordering) -----

  const global = _degradedGlobal.filter((t) => t > windowStart);

  if (global.length >= DEGRADED_GLOBAL_MAX_FAILURES) {
    const oldest = Math.min(...global);
    _degradedGlobal = global; // persist pruned list
    return {
      allowed: false,
      reason: "global",
      retryAfterSeconds: secondsUntil(oldest + ADDRESS_WINDOW_MS, nowMs),
    };
  }

  // --- per-address limit --------------------------------------------------

  const key = ip ?? _DEGRADED_NULL_KEY;
  const existing = (_degradedAttempts.get(key) ?? []).filter(
    (t) => t > windowStart,
  );

  if (existing.length >= DEGRADED_MAX_FAILURES) {
    const oldest = Math.min(...existing);
    _degradedAttempts.set(key, existing);
    _degradedGlobal = global; // persist pruned global too
    return {
      allowed: false,
      reason: "address",
      retryAfterSeconds: secondsUntil(oldest + ADDRESS_WINDOW_MS, nowMs),
    };
  }

  // --- charge both counters pessimistically -------------------------------

  // On a correct password the caller calls `refundDegradedAttempt` to remove
  // these entries from both counters. On a wrong password they stand — no
  // extra recording needed on the 401 path.
  global.push(nowMs);
  _degradedGlobal = global;
  existing.push(nowMs);
  _degradedAttempts.set(key, existing);

  return { allowed: true };
}

/**
 * Remove the most recent charge from BOTH in-process counters.
 *
 * Call this when `ok === true` and the request came through the degraded path.
 * A successful login must not count against either budget: troubleshooting
 * across devices — switching from phone to iPad, handing the phone to the
 * other person — is exactly what happens during an outage, and the refund
 * ensures it does not exhaust the global counter even when different IPs are
 * involved.
 */
export function refundDegradedAttempt(ip: string | null): void {
  // Refund per-IP counter. The list is appended in chronological order so the
  // newest timestamp is at the end.
  const key = ip ?? _DEGRADED_NULL_KEY;
  const existing = _degradedAttempts.get(key);
  if (existing && existing.length > 0) {
    existing.pop();
    _degradedAttempts.set(key, existing);
  }

  // Refund global counter. Without this, repeated correct logins from different
  // IPs (two devices, two people) would eventually exhaust the global budget
  // even though every attempt was successful.
  if (_degradedGlobal.length > 0) {
    _degradedGlobal.pop();
  }
}

/** Reset all in-process counters. Test helper — do not call in production. */
export function __resetDegradedCounters(): void {
  _degradedAttempts.clear();
  _degradedGlobal = [];
}

/* ------------------------------------------------------------------ *
 * Internals
 * ------------------------------------------------------------------ */

/**
 * The timestamps inside the window.
 *
 * Re-filtered here even though the query already applied a `since`: the pure
 * decision must not depend on the caller having narrowed correctly, and a test
 * hands it whatever it likes.
 */
function within(
  timestamps: readonly Date[],
  nowMs: number,
  windowMs: number,
): Date[] {
  const floor = nowMs - windowMs;
  return timestamps.filter((d) => {
    const t = d.getTime();
    return !Number.isNaN(t) && t > floor && t <= nowMs;
  });
}

/** Whole seconds from now until `atMs`, never below 1. */
function secondsUntil(atMs: number, nowMs: number): number {
  return Math.max(1, Math.ceil((atMs - nowMs) / 1000));
}
