/**
 * `openDoor` — and the one rule it exists to hold: EVERY CREDENTIAL IS
 * EVALUATED, EVERY TIME.
 *
 * WHY THIS FILE IS SHAPED THE WAY IT IS. The obvious test — "Eva's password
 * returns eva, Adam's returns adam" — passes against a short-circuiting loop.
 * It passes against every wrong implementation of this function that still
 * gets the answer right, and getting the answer right was never the hard part.
 * The hard part is that a loop returning on the first match makes Eva's login
 * one scrypt and Adam's two, and hands anyone with a stopwatch the answer to
 * "which of them does this password belong to".
 *
 * So the assertions here are about the WORK, not the answer:
 *
 *   1. Both credentials are verified — started and finished — including on the
 *      attempt that matches the first one. Counted through the injected
 *      verifier, not read off the source.
 *   2. Eva's correct password and Adam's correct password take the same time,
 *      measured, with a stand-in verifier whose cost is fixed and known.
 *
 * AND THEN THE ASSERTIONS ARE THEMSELVES TESTED. `shortCircuitingDoor` below
 * is the wrong implementation, written out in full, and the last describe
 * block runs the two assertions above against it and requires them to FAIL.
 * Without that, "the count is 2" is a sentence that could be true for reasons
 * having nothing to do with `openDoor` — a guard nobody has watched break is a
 * guard nobody knows is connected.
 */

import { randomBytes, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  openDoor,
  type DoorAnswer,
  type DoorCredential,
  type VerifyCredential,
} from "@/lib/auth/door";
import { parseScryptHash, type ScryptHash } from "@/lib/env";
import type { MemberSlug } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const EVA_PASSWORD = "a-password-that-is-evas";
const ADAM_PASSWORD = "a-different-password-that-is-adams";

/** A real credential at the cost floor `lib/env.ts` enforces. */
function credential(slug: MemberSlug, password: string): DoorCredential {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32, { N: 16_384, r: 8, p: 1 });
  const label = slug === "eva" ? "APP_PASSWORD_HASH_EVA" : "APP_PASSWORD_HASH_ADAM";
  return {
    slug,
    label,
    hash: parseScryptHash(
      label,
      `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`,
    ),
  };
}

const EVA = credential("eva", EVA_PASSWORD);
const ADAM = credential("adam", ADAM_PASSWORD);
const BOTH: readonly DoorCredential[] = [EVA, ADAM];

/* ------------------------------------------------------------------ *
 * The instrumented verifier
 * ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Ledger {
  /** Labels in the order verification BEGAN. */
  readonly started: string[];
  /** Labels in the order verification RETURNED. */
  readonly finished: string[];
}

/**
 * A stand-in for `verifySecret` that records itself and costs a fixed amount.
 *
 * Fixed cost is the point of the timing assertions: real scrypt varies by a
 * few milliseconds per run, which is enough noise to hide a difference on a
 * fast machine and enough to invent one on a busy CI box. A 60ms sleep is
 * exactly 60ms every time, so a doubling is unambiguous.
 */
function ledgerVerifier(
  costMs: number,
): { verify: VerifyCredential; ledger: Ledger } {
  const ledger: Ledger = { started: [], finished: [] };

  const labelOf = (hash: ScryptHash) =>
    hash === EVA.hash ? EVA.label : ADAM.label;

  const verify: VerifyCredential = async (candidate, hash) => {
    ledger.started.push(labelOf(hash));
    if (costMs > 0) await sleep(costMs);
    ledger.finished.push(labelOf(hash));
    return hash === EVA.hash
      ? candidate === EVA_PASSWORD
      : candidate === ADAM_PASSWORD;
  };

  return { verify, ledger };
}

/**
 * THE WRONG IMPLEMENTATION. The one anybody would write, and the one the last
 * describe block requires this file's assertions to catch.
 */
async function shortCircuitingDoor(
  candidate: string,
  credentials: readonly DoorCredential[],
  verify: VerifyCredential,
): Promise<DoorAnswer> {
  for (const credential of credentials) {
    if (await verify(candidate, credential.hash)) {
      return { opened: true, slug: credential.slug, ambiguous: false };
    }
  }
  return { opened: false, slug: null, ambiguous: false };
}

/** How long a call took, to the nearest fraction of a millisecond. */
async function elapsed(work: () => Promise<unknown>): Promise<number> {
  const started = performance.now();
  await work();
  return performance.now() - started;
}

/* ------------------------------------------------------------------ *
 * 1. Every credential, every time
 * ------------------------------------------------------------------ */

describe("openDoor evaluates every credential", () => {
  it("verifies BOTH when the FIRST one matches", async () => {
    // The attempt a short-circuiting loop gets away with. Eva is first in the
    // list, so a loop that returns on her match never touches Adam's hash.
    const { verify, ledger } = ledgerVerifier(0);

    const answer = await openDoor(EVA_PASSWORD, BOTH, verify);

    expect(answer).toEqual({ opened: true, slug: "eva", ambiguous: false });
    expect(ledger.started).toHaveLength(2);
    expect(ledger.started).toEqual(
      expect.arrayContaining([EVA.label, ADAM.label]),
    );
  });

  it("lets both verifications RUN TO COMPLETION when the first matches", async () => {
    // Started is not enough on its own: an implementation could kick both off
    // and then resolve on whichever answers first, which is the same oracle
    // wearing a different hat. Both have to finish before the answer exists.
    const { verify, ledger } = ledgerVerifier(5);

    await openDoor(EVA_PASSWORD, BOTH, verify);

    expect(ledger.finished).toHaveLength(2);
    expect(ledger.finished).toEqual(
      expect.arrayContaining([EVA.label, ADAM.label]),
    );
  });

  it("verifies both when the SECOND one matches", async () => {
    const { verify, ledger } = ledgerVerifier(0);

    const answer = await openDoor(ADAM_PASSWORD, BOTH, verify);

    expect(answer).toEqual({ opened: true, slug: "adam", ambiguous: false });
    expect(ledger.finished).toHaveLength(2);
  });

  it("verifies both when NEITHER matches", async () => {
    const { verify, ledger } = ledgerVerifier(0);

    const answer = await openDoor("not either of them", BOTH, verify);

    expect(answer).toEqual({ opened: false, slug: null, ambiguous: false });
    expect(ledger.finished).toHaveLength(2);
  });

  it("does exactly as much work for one password as for the other", async () => {
    // The count, stated as the property rather than as a number: whatever the
    // door spends on Eva it spends on Adam, and on a stranger.
    const counts = [] as number[];
    for (const candidate of [EVA_PASSWORD, ADAM_PASSWORD, "neither"]) {
      const { verify, ledger } = ledgerVerifier(0);
      await openDoor(candidate, BOTH, verify);
      counts.push(ledger.finished.length);
    }

    expect(new Set(counts).size).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * 2. The timing property, measured
 * ------------------------------------------------------------------ */

/** One verification's fixed cost in the timing tests. */
const COST_MS = 60;
/**
 * How far apart the two logins may be.
 *
 * Half of one verification. A short-circuiting door differs by a whole one
 * (60ms), so this catches it with room to spare; ordinary scheduling jitter on
 * a `setTimeout` is single-digit milliseconds, so it does not catch that.
 */
const TOLERANCE_MS = COST_MS / 2;

describe("the door takes the same time whichever password was typed", () => {
  it("Eva's correct password and Adam's correct password cost the same", async () => {
    const eva = await elapsed(() =>
      openDoor(EVA_PASSWORD, BOTH, ledgerVerifier(COST_MS).verify),
    );
    const adam = await elapsed(() =>
      openDoor(ADAM_PASSWORD, BOTH, ledgerVerifier(COST_MS).verify),
    );

    expect(Math.abs(eva - adam)).toBeLessThan(TOLERANCE_MS);
  });

  it("a wrong password costs the same as a right one", async () => {
    // Nothing holds a SUCCESSFUL answer to a floor — `holdUntilFloor` covers
    // the declining paths only, deliberately, because a login that worked has
    // to feel immediate. So this uniformity has to come from the work itself.
    const right = await elapsed(() =>
      openDoor(EVA_PASSWORD, BOTH, ledgerVerifier(COST_MS).verify),
    );
    const wrong = await elapsed(() =>
      openDoor("not either of them", BOTH, ledgerVerifier(COST_MS).verify),
    );

    expect(Math.abs(right - wrong)).toBeLessThan(TOLERANCE_MS);
  });
});

/* ------------------------------------------------------------------ *
 * 3. The answer
 * ------------------------------------------------------------------ */

describe("what the door concludes, against real scrypt", () => {
  it("names Eva for Eva's password", async () => {
    await expect(openDoor(EVA_PASSWORD, BOTH)).resolves.toEqual({
      opened: true,
      slug: "eva",
      ambiguous: false,
    });
  });

  it("names Adam for Adam's password", async () => {
    await expect(openDoor(ADAM_PASSWORD, BOTH)).resolves.toEqual({
      opened: true,
      slug: "adam",
      ambiguous: false,
    });
  });

  it("opens for neither on a wrong password", async () => {
    await expect(openDoor("nope", BOTH)).resolves.toEqual({
      opened: false,
      slug: null,
      ambiguous: false,
    });
  });

  it("is not fooled by a prefix of a correct password", async () => {
    await expect(
      openDoor(EVA_PASSWORD.slice(0, -1), BOTH),
    ).resolves.toMatchObject({ opened: false });
  });

  it("opens with no name when one string opens both", async () => {
    // Two salts over ONE password. `lib/env.ts` cannot catch this at boot —
    // independent salts produce different keys, so there is nothing to compare
    // — and it is the reason `ambiguous` exists.
    const shared = "the-same-password-set-twice";
    const answer = await openDoor("the-same-password-set-twice", [
      credential("eva", shared),
      credential("adam", shared),
    ]);

    // In, because locking both of them out of an archive with no reset flow is
    // the worse failure. But UNNAMED: the token gets no `mid`, the picker comes
    // back, and nothing is attributed to a person the door cannot identify.
    expect(answer).toEqual({ opened: true, slug: null, ambiguous: true });
  });

  it("refuses an empty list rather than opening for anything", async () => {
    await expect(openDoor("anything at all", [])).resolves.toEqual({
      opened: false,
      slug: null,
      ambiguous: false,
    });
  });
});

/* ------------------------------------------------------------------ *
 * 4. The assertions, tested
 * ------------------------------------------------------------------ */

describe("the checks above can actually fail", () => {
  /*
   * Every assertion in sections 1 and 2 is re-run against a door that DOES
   * short-circuit. If any of these stops failing, the corresponding assertion
   * above has stopped meaning anything, and this project's defining defect —
   * a test that passes whether or not the thing it guards is there — has
   * arrived in the auth layer.
   */

  it("the both-were-verified count catches a short-circuiting door", async () => {
    const { verify, ledger } = ledgerVerifier(0);

    await shortCircuitingDoor(EVA_PASSWORD, BOTH, verify);

    // One, not two. This is precisely the assertion in section 1 failing.
    expect(ledger.finished).toHaveLength(1);
    expect(ledger.finished).not.toContain(ADAM.label);
  });

  it("the timing comparison catches a short-circuiting door", async () => {
    const eva = await elapsed(() =>
      shortCircuitingDoor(EVA_PASSWORD, BOTH, ledgerVerifier(COST_MS).verify),
    );
    const adam = await elapsed(() =>
      shortCircuitingDoor(ADAM_PASSWORD, BOTH, ledgerVerifier(COST_MS).verify),
    );

    // Adam is measurably slower — one whole extra verification — which is the
    // oracle. The tolerance in section 2 is half a verification, so this gap
    // is caught with margin on both sides.
    expect(adam - eva).toBeGreaterThan(TOLERANCE_MS);
  });

  it("a short-circuiting door still gets the ANSWER right — which is why answers are not the test", async () => {
    const { verify } = ledgerVerifier(0);

    await expect(
      shortCircuitingDoor(EVA_PASSWORD, BOTH, verify),
    ).resolves.toMatchObject({ opened: true, slug: "eva" });
  });
});
