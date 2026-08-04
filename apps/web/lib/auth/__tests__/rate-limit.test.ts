/**
 * The limiter's decision, as a pure function of timestamps.
 *
 * Kept separate from the route test on purpose. Where exactly the boundary
 * sits — is the fifth attempt refused, or the sixth? — is the part of a rate
 * limiter that is wrong most often, and it is the part that needs no HTTP, no
 * database and no clock to test. An off-by-one here is a person locked out one
 * try earlier than the sentence they were told.
 *
 * The degraded-fallback tests at the bottom cover
 * `checkDegradedSessionRateLimit` and `refundDegradedAttempt`, the in-process
 * counter used when the database is unreachable. They are pure in the same
 * sense: no database, no HTTP, deterministic via the `now` param.
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  ADDRESS_MAX_FAILURES,
  ADDRESS_WINDOW_MS,
  checkDegradedSessionRateLimit,
  DEGRADED_GLOBAL_MAX_FAILURES,
  DEGRADED_MAX_FAILURES,
  decideRateLimit,
  GLOBAL_LOCKOUT_MS,
  GLOBAL_MAX_FAILURES,
  GLOBAL_WINDOW_MS,
  refundDegradedAttempt,
  __resetDegradedCounters,
} from "@/lib/auth/rate-limit";

// Reset the module-scope degraded counter between test cases so they do not
// bleed into one another. The `decideRateLimit` tests are pure functions with
// no side effects and need no reset.
beforeEach(() => {
  __resetDegradedCounters();
});

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

/* ------------------------------------------------------------------ *
 * Degraded fallback
 * ------------------------------------------------------------------ */

describe("the degraded in-process fallback (checkDegradedSessionRateLimit)", () => {
  const IP = "203.0.113.99";
  const DEGRADED_NOW = new Date("2026-08-03T03:00:00.000Z");

  it("allows the first attempt when storage is unreachable", () => {
    // Storage failure + correct password = in. A correct password and a bad
    // database afternoon must not lock two people out of their own archive.
    const decision = checkDegradedSessionRateLimit(IP, DEGRADED_NOW);
    expect(decision.allowed).toBe(true);
  });

  it(`allows the first ${DEGRADED_MAX_FAILURES} wrong attempts, refuses the next one`, () => {
    // Each wrong-password call charges the budget (no refund on failure), so
    // three wrong guesses lock the instance for the 15-minute window.
    for (let i = 0; i < DEGRADED_MAX_FAILURES; i++) {
      expect(
        checkDegradedSessionRateLimit(IP, DEGRADED_NOW).allowed,
        `attempt ${i + 1} should be allowed`,
      ).toBe(true);
      // Simulate wrong password: no refund.
    }
    // Storage failure + 4th wrong password from the same instance = refused.
    const refused = checkDegradedSessionRateLimit(IP, DEGRADED_NOW);
    expect(refused.allowed).toBe(false);
    if (refused.allowed) return;
    expect(refused.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("correct passwords do not exhaust the budget — the refund restores the charge", () => {
    // Three successful logins followed by a fourth must all be allowed.
    // Without the refund, the fourth would be refused because the pessimistic
    // counter already has three entries.
    for (let i = 0; i < DEGRADED_MAX_FAILURES + 1; i++) {
      expect(
        checkDegradedSessionRateLimit(IP, DEGRADED_NOW).allowed,
        `successful login ${i + 1} should be allowed`,
      ).toBe(true);
      // Simulate correct password: refund the pessimistic charge.
      refundDegradedAttempt(IP);
    }
  });

  it("a refund after a wrong password does not restore that slot", () => {
    // The refund removes the most recent entry. If wrong passwords were charged
    // without refunds and we then refund, the wrong-password entries remain.
    checkDegradedSessionRateLimit(IP, DEGRADED_NOW); // wrong password — no refund
    checkDegradedSessionRateLimit(IP, DEGRADED_NOW); // wrong password — no refund
    checkDegradedSessionRateLimit(IP, DEGRADED_NOW); // wrong password — no refund
    // Three charges in. One spurious refund should not unlock the instance.
    refundDegradedAttempt(IP); // refund the third charge (edge case; still 2 left)
    // Budget is down to 2 charges: one more check allowed, then refused.
    expect(checkDegradedSessionRateLimit(IP, DEGRADED_NOW).allowed).toBe(true);
    expect(checkDegradedSessionRateLimit(IP, DEGRADED_NOW).allowed).toBe(false);
  });

  it("counter expires after the 15-minute window — the door reopens", () => {
    // Exhaust the instance budget at T=0 (without refunds = wrong passwords).
    for (let i = 0; i < DEGRADED_MAX_FAILURES; i++) {
      checkDegradedSessionRateLimit(IP, DEGRADED_NOW);
    }
    expect(
      checkDegradedSessionRateLimit(IP, DEGRADED_NOW).allowed,
    ).toBe(false);

    // 16 minutes later all entries have aged out of the 15-minute window.
    const later = new Date(DEGRADED_NOW.getTime() + 16 * 60_000);
    expect(checkDegradedSessionRateLimit(IP, later).allowed).toBe(true);
  });

  it("per-IP limit blocks that IP while other IPs can still attempt", () => {
    // Three wrong guesses from one IP locks that IP, but a fresh IP is
    // still allowed — the per-IP limit is not a global lockout.
    for (let i = 0; i < DEGRADED_MAX_FAILURES; i++) {
      checkDegradedSessionRateLimit("1.2.3.4", DEGRADED_NOW);
    }
    expect(
      checkDegradedSessionRateLimit("1.2.3.4", DEGRADED_NOW).allowed,
    ).toBe(false);
    expect(
      checkDegradedSessionRateLimit("5.6.7.8", DEGRADED_NOW).allowed,
    ).toBe(true);
  });

  it("distributed guessing hits the global cap — the per-IP limit is not the only bound", () => {
    // THE FIX FOR THE QA BLOCK. Without a global counter, an attacker who
    // can force the endpoint into degraded mode (by flooding until Supabase
    // read latency spikes) could send one wrong guess per IP and never trip
    // the per-address limit. The global counter closes this hole.
    //
    // This test asserts the property the previous "independent budgets" test
    // was asserting the ABSENCE of. "different IPs have independent budgets"
    // was blessing the hole; this test closes it.
    for (let i = 0; i < DEGRADED_GLOBAL_MAX_FAILURES; i++) {
      const decision = checkDegradedSessionRateLimit(
        `10.0.0.${i}`,
        DEGRADED_NOW,
      );
      expect(
        decision.allowed,
        `wrong guess ${i + 1} from unique IP 10.0.0.${i} should be allowed`,
      ).toBe(true);
      // No refund = simulating a wrong password from each unique IP.
    }
    // Global budget spent. Any new IP — with no prior attempts of its own —
    // is refused because the INSTANCE is at its limit.
    const refused = checkDegradedSessionRateLimit("99.99.99.99", DEGRADED_NOW);
    expect(refused.allowed).toBe(false);
    if (refused.allowed) return; // narrow union so TypeScript sees .reason
    expect(refused.reason).toBe("global");
    expect(refused.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("successful logins from different IPs do not exhaust the global budget", () => {
    // The refund applies to the global counter too. Two people troubleshooting
    // on separate devices (different IPs) must not lock the instance with
    // correct passwords. This is what makes the global cap survivable for the
    // two real users of the app.
    const now = DEGRADED_NOW;
    for (let i = 0; i < DEGRADED_GLOBAL_MAX_FAILURES + 5; i++) {
      expect(
        checkDegradedSessionRateLimit(`192.168.1.${i}`, now).allowed,
        `correct login ${i + 1} from a new IP should be allowed`,
      ).toBe(true);
      // Simulate correct password: refund both counters.
      refundDegradedAttempt(`192.168.1.${i}`);
    }
    // After all those correct logins and refunds, a fresh IP still has budget.
    expect(
      checkDegradedSessionRateLimit("203.0.113.1", now).allowed,
    ).toBe(true);
  });

  it("the ordinary (healthy-storage) path is unchanged", () => {
    // The degraded function has no effect on `decideRateLimit`. Calling it
    // any number of times must not change the decision from the database path.
    for (let i = 0; i < DEGRADED_MAX_FAILURES + 10; i++) {
      checkDegradedSessionRateLimit(IP, DEGRADED_NOW);
    }

    // decideRateLimit with an empty history is still allowed.
    expect(
      decideRateLimit({ fromAddress: [], everywhere: [] }, DEGRADED_NOW).allowed,
    ).toBe(true);
  });
});
