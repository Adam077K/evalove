/**
 * The limiter's decision, as a pure function of timestamps.
 *
 * Kept separate from the route test on purpose. Where exactly the boundary
 * sits — is the fifth attempt refused, or the sixth? — is the part of a rate
 * limiter that is wrong most often, and it is the part that needs no HTTP, no
 * database and no clock to test. An off-by-one here is a person locked out one
 * try earlier than the sentence they were told.
 */

import { describe, expect, it } from "vitest";

import {
  ADDRESS_MAX_FAILURES,
  ADDRESS_WINDOW_MS,
  decideRateLimit,
  GLOBAL_LOCKOUT_MS,
  GLOBAL_MAX_FAILURES,
  GLOBAL_WINDOW_MS,
} from "@/lib/auth/rate-limit";

const NOW = new Date("2026-08-02T20:00:00.000Z");

/** `count` unsuccessful attempts, the most recent `startMsAgo` ago, one a second apart. */
function failures(count: number, startMsAgo = 1_000): Date[] {
  return Array.from(
    { length: count },
    (_, i) => new Date(NOW.getTime() - startMsAgo - i * 1_000),
  );
}

describe("the per-address window", () => {
  it("allows the fifth attempt", () => {
    // Four unsuccessful tries already recorded. The fifth is still allowed:
    // "more than 5 in 15 minutes" is crossed by the sixth.
    const decision = decideRateLimit(
      { fromAddress: failures(ADDRESS_MAX_FAILURES - 1), everywhere: [] },
      NOW,
    );
    expect(decision.allowed).toBe(true);
  });

  it("refuses the sixth attempt in fifteen minutes", () => {
    const decision = decideRateLimit(
      { fromAddress: failures(ADDRESS_MAX_FAILURES), everywhere: [] },
      NOW,
    );

    expect(decision).toMatchObject({ allowed: false, reason: "address" });
  });

  it("says when the window clears, measured from the OLDEST counted attempt", () => {
    // A sliding window frees a slot when its oldest entry ages out. Reporting
    // anything else over-states the wait and trains people to ignore it.
    const oldestMsAgo = 10 * 60_000; // ten minutes into a fifteen-minute window
    const history = [
      new Date(NOW.getTime() - oldestMsAgo),
      ...failures(ADDRESS_MAX_FAILURES - 1),
    ];

    const decision = decideRateLimit(
      { fromAddress: history, everywhere: [] },
      NOW,
    );

    expect(decision.allowed).toBe(false);
    if (decision.allowed) return;
    expect(decision.retryAfterSeconds).toBe(
      Math.ceil((ADDRESS_WINDOW_MS - oldestMsAgo) / 1000),
    );
  });

  it("forgets attempts older than the window", () => {
    const stale = Array.from(
      { length: 50 },
      (_, i) => new Date(NOW.getTime() - ADDRESS_WINDOW_MS - 1_000 - i * 1_000),
    );

    expect(
      decideRateLimit({ fromAddress: stale, everywhere: [] }, NOW).allowed,
    ).toBe(true);
  });

  it("never promises a retry in zero seconds", () => {
    // An attempt right on the edge of the window would round to 0, and a
    // `Retry-After: 0` invites an immediate retry that is refused again.
    const onTheEdge = Array.from(
      { length: ADDRESS_MAX_FAILURES },
      () => new Date(NOW.getTime() - ADDRESS_WINDOW_MS + 1),
    );

    const decision = decideRateLimit(
      { fromAddress: onTheEdge, everywhere: [] },
      NOW,
    );
    expect(decision.allowed).toBe(false);
    if (decision.allowed) return;
    expect(decision.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("the global window", () => {
  it("allows the twentieth attempt", () => {
    expect(
      decideRateLimit(
        { fromAddress: [], everywhere: failures(GLOBAL_MAX_FAILURES - 1) },
        NOW,
      ).allowed,
    ).toBe(true);
  });

  it("shuts the door after twenty in an hour", () => {
    const decision = decideRateLimit(
      { fromAddress: [], everywhere: failures(GLOBAL_MAX_FAILURES) },
      NOW,
    );

    expect(decision).toMatchObject({ allowed: false, reason: "global" });
  });

  it("is a lockout, not a sliding window — an hour from the NEWEST attempt", () => {
    // While an attack is in progress every new attempt pushes the release out.
    // A sliding window would reopen the instant the oldest entry aged out, and
    // be slammed again by the next guess.
    const newestMsAgo = 2_000;
    const decision = decideRateLimit(
      { fromAddress: [], everywhere: failures(GLOBAL_MAX_FAILURES, newestMsAgo) },
      NOW,
    );

    expect(decision.allowed).toBe(false);
    if (decision.allowed) return;
    expect(decision.retryAfterSeconds).toBe(
      Math.ceil((GLOBAL_LOCKOUT_MS - newestMsAgo) / 1000),
    );
  });

  it("catches a guesser who rotates addresses", () => {
    // The reason this limit exists. Per-address counting is defeated by having
    // more addresses, which costs an attacker nothing; twenty unsuccessful
    // attempts in an hour is a number two people will never reach.
    const decision = decideRateLimit(
      { fromAddress: [], everywhere: failures(GLOBAL_MAX_FAILURES + 40) },
      NOW,
    );
    expect(decision.allowed).toBe(false);
  });

  it("forgets attempts older than the hour", () => {
    const stale = Array.from(
      { length: GLOBAL_MAX_FAILURES * 3 },
      (_, i) => new Date(NOW.getTime() - GLOBAL_WINDOW_MS - 1_000 - i * 1_000),
    );

    expect(
      decideRateLimit({ fromAddress: [], everywhere: stale }, NOW).allowed,
    ).toBe(true);
  });
});

describe("when both limits are tripped", () => {
  it("reports the longer wait", () => {
    // Promising the address window's few minutes while the global lockout has
    // an hour left is a reopening that is not going to happen.
    const decision = decideRateLimit(
      {
        fromAddress: failures(ADDRESS_MAX_FAILURES),
        everywhere: failures(GLOBAL_MAX_FAILURES),
      },
      NOW,
    );

    expect(decision).toMatchObject({ allowed: false, reason: "global" });
    if (decision.allowed) return;
    expect(decision.retryAfterSeconds).toBeGreaterThan(
      ADDRESS_WINDOW_MS / 1000,
    );
  });
});
