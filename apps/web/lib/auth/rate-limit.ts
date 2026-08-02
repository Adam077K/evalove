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
