/**
 * POST /api/session — the front door, end to end, minus the database.
 *
 * The password check here is REAL. `lib/__tests__/setup-env.ts` puts a genuine
 * scrypt credential in the environment before any test module is evaluated,
 * and this file asks it for the matching plaintext, so the route runs the same
 * `verifySecret` against the same format production runs. Only the two things
 * that need a network are stubbed — the `auth_attempts` table and the cookie
 * jar.
 *
 * The four behaviours this file exists to hold:
 *
 *   1. A wrong password answers 401, and takes the same time as every other
 *      declining branch.
 *   2. The sixth attempt within fifteen minutes answers 429 with `Retry-After`.
 *   3. A correct password sets a cookie carrying every attribute that makes it
 *      safe.
 *   4. No response body ever says which branch refused it.
 *
 * Section 5 covers the degraded path: when the database is unreachable,
 * scope='session' falls back to the in-process counter rather than 503.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADDRESS_MAX_FAILURES,
  DEGRADED_MAX_FAILURES,
  __resetDegradedCounters,
} from "@/lib/auth/rate-limit";
import { FAILURE_FLOOR_MS } from "@/lib/auth/timing";
import { TEST_APP_PASSWORD as PASSWORD } from "@/lib/__tests__/setup-env";

/* ------------------------------------------------------------------ *
 * Stubs
 * ------------------------------------------------------------------ */

const attempts = vi.hoisted(() => ({
  recorded: [] as { ok: boolean; ip: string | null }[],
  fromAddress: [] as Date[],
  everywhere: [] as Date[],
  /** Set to make the limiter's storage unreachable. */
  readThrows: false,
}));

vi.mock("@/lib/data/auth-attempts", () => ({
  recordAuthAttempt: vi.fn(async (attempt: { ok: boolean; ip: string | null }) => {
    attempts.recorded.push({ ok: attempt.ok, ip: attempt.ip });
  }),
  failuresFromAddress: vi.fn(async () => {
    if (attempts.readThrows) throw new Error("connection refused");
    return attempts.fromAddress;
  }),
  failuresEverywhere: vi.fn(async () => {
    if (attempts.readThrows) throw new Error("connection refused");
    return attempts.everywhere;
  }),
}));

const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    get: (name: string) => {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: vi.fn(
      (name: string, value: string, _options?: Record<string, unknown>) => {
        store.set(name, value);
      },
    ),
  };
});

vi.mock("next/headers", () => ({ cookies: async () => jar }));

import { DELETE, POST } from "@/app/api/session/route";

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function post(body: unknown, ip = "203.0.113.7"): Request {
  return new Request("https://evalove.test/api/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `${ip}, 198.51.100.1`,
      "user-agent": "vitest",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** Milliseconds the handler took, and what it answered. */
async function timed(request: Request) {
  const started = performance.now();
  const response = await POST(request);
  return { response, ms: performance.now() - started };
}

/** `count` unsuccessful attempts, all within the last minute. */
function recentFailures(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => new Date(Date.now() - i * 1000));
}

beforeEach(() => {
  jar.store.clear();
  jar.set.mockClear();
  attempts.recorded.length = 0;
  attempts.fromAddress = [];
  attempts.everywhere = [];
  attempts.readThrows = false;
  // Reset the in-process degraded counter so tests do not bleed into each other.
  __resetDegradedCounters();
});

/* ------------------------------------------------------------------ *
 * 1. The wrong password
 * ------------------------------------------------------------------ */

describe("a wrong password", () => {
  it("answers 401 and sets no cookie", async () => {
    const response = await POST(post({ password: "not it" }));

    expect(response.status).toBe(401);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("is recorded as an unsuccessful attempt", async () => {
    await POST(post({ password: "not it" }));

    expect(attempts.recorded).toEqual([{ ok: false, ip: "203.0.113.7" }]);
  });

  it("takes at least the floor", async () => {
    const { ms } = await timed(post({ password: "not it" }));
    // A small tolerance: `setTimeout` may fire a fraction early, and a test
    // that fails on a sub-millisecond rounding teaches people to rerun CI.
    expect(ms).toBeGreaterThanOrEqual(FAILURE_FLOOR_MS - 5);
  });

  it("takes the same time as a malformed body and as a rate-limited attempt", async () => {
    // THE ACTUAL ASSERTION. A constant-time comparison is worthless if the
    // route's own branches have different costs: rejecting malformed JSON is
    // microseconds and running scrypt is tens of milliseconds, so without a
    // shared floor the latency alone says how far a request got.
    const wrong = await timed(post({ password: "not it" }));
    const malformed = await timed(post("{ not json"));

    attempts.fromAddress = recentFailures(ADDRESS_MAX_FAILURES);
    const limited = await timed(post({ password: PASSWORD }));

    expect(wrong.response.status).toBe(401);
    expect(malformed.response.status).toBe(400);
    expect(limited.response.status).toBe(429);

    const spread =
      Math.max(wrong.ms, malformed.ms, limited.ms) -
      Math.min(wrong.ms, malformed.ms, limited.ms);
    expect(spread).toBeLessThan(80);
  });

  it("says the same sentence whatever went wrong", async () => {
    const wrong = await (await POST(post({ password: "not it" }))).json();
    const malformed = await (await POST(post("{ not json"))).json();

    expect(wrong.message).toBe(malformed.message);
    // Nothing in the body hints at which branch refused it.
    expect(JSON.stringify(wrong)).not.toMatch(/hash|scrypt|rate|limit|env/i);
  });
});

/* ------------------------------------------------------------------ *
 * 2. The limiter
 * ------------------------------------------------------------------ */

describe("the rate limit", () => {
  it("lets the fifth attempt through to the password check", async () => {
    attempts.fromAddress = recentFailures(ADDRESS_MAX_FAILURES - 1);

    const response = await POST(post({ password: "not it" }));

    expect(response.status).toBe(401);
    expect(attempts.recorded).toHaveLength(1);
  });

  it("answers 429 on the sixth attempt within fifteen minutes", async () => {
    attempts.fromAddress = recentFailures(ADDRESS_MAX_FAILURES);

    const response = await POST(post({ password: "not it" }));

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("refuses even the CORRECT password once the window is closed", async () => {
    // The limit is on attempts, not on wrong answers. A guesser who happens to
    // land on the right one after being cut off does not get in.
    attempts.fromAddress = recentFailures(ADDRESS_MAX_FAILURES);

    const response = await POST(post({ password: PASSWORD }));

    expect(response.status).toBe(429);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("does not count a refused request against the window", async () => {
    // Otherwise a blocked caller extends their own lockout by continuing to
    // knock, and the door never reopens.
    attempts.fromAddress = recentFailures(ADDRESS_MAX_FAILURES);

    await POST(post({ password: "not it" }));

    expect(attempts.recorded).toHaveLength(0);
  });

  it("degrades to in-process counter for session scope when storage is unreachable", async () => {
    // The old behaviour was 503. The new behaviour for scope='session' is to
    // fall back to the in-process counter. A correct password still gets in.
    // See lib/auth/rate-limit.ts for the argument for why session degrades but
    // vault does not.
    attempts.readThrows = true;

    const response = await POST(post({ password: PASSWORD }));

    expect(response.status).toBe(200);
    expect(jar.set).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ *
 * 5. The degraded path (storage unreachable, session scope)
 * ------------------------------------------------------------------ */

describe("degraded session limiter (storage unreachable)", () => {
  it("storage failure + correct password = 200 (the door stays open)", async () => {
    // This is the property that justifies the change. The original fail-closed
    // posture was correct in principle; the problem is that a Supabase free-tier
    // pause is far more likely than a guessing attack, and this is a couple's
    // private archive, not a public sign-in form.
    attempts.readThrows = true;

    const response = await POST(post({ password: PASSWORD }));

    expect(response.status).toBe(200);
  });

  it(`${DEGRADED_MAX_FAILURES + 1} successful logins in a row are all allowed`, async () => {
    // Repeated correct logins must not exhaust the budget. Troubleshooting an
    // outage — clearing site data, switching devices, handing the phone to the
    // other person — is exactly what happens during a Supabase pause. Without
    // the refund on success, the fourth correct login would be refused for
    // fifteen minutes, re-introducing the failure mode this brief exists to fix.
    attempts.readThrows = true;

    for (let i = 0; i < DEGRADED_MAX_FAILURES + 1; i++) {
      const response = await POST(post({ password: PASSWORD }));
      expect(response.status, `login ${i + 1} should succeed`).toBe(200);
      // Each successful login must set a cookie and not exhaust the budget.
      jar.set.mockClear();
    }
  });

  it("storage failure + wrong password = 401 (same message as always)", async () => {
    // The degraded path must not leak information about its own state. The
    // 401 body is byte-identical to the ordinary wrong-password response.
    attempts.readThrows = true;

    const response = await POST(post({ password: "not it" }));
    const body = await response.json() as { message: string };

    expect(response.status).toBe(401);
    // Same sentence as the healthy path — no "storage", "degraded", etc.
    expect(body.message).toBe("That's not it. Try again.");
  });

  it(`storage failure + ${DEGRADED_MAX_FAILURES + 1} wrong passwords = the last one is 429`, async () => {
    // The in-process counter allows DEGRADED_MAX_FAILURES attempts before
    // shutting the door for the rest of the 15-minute window.
    attempts.readThrows = true;

    for (let i = 0; i < DEGRADED_MAX_FAILURES; i++) {
      const r = await POST(post({ password: "not it" }));
      expect(r.status, `attempt ${i + 1} should be 401`).toBe(401);
    }

    // The next one is refused. Whether the password is right or wrong does
    // not matter — the instance budget is spent.
    const refused = await POST(post({ password: "not it" }));

    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("the 429 on the degraded path is byte-identical to the ordinary rate-limit 429", async () => {
    // Telling a caller "the limiter is degraded" is an oracle for the one
    // attacker who can make storage unreachable on demand.
    attempts.readThrows = false;
    attempts.fromAddress = recentFailures(ADDRESS_MAX_FAILURES);
    const ordinary = await POST(post({ password: "not it" }));
    const ordinaryBody = await ordinary.json() as { message: string };

    __resetDegradedCounters();
    attempts.readThrows = true;
    for (let i = 0; i < DEGRADED_MAX_FAILURES; i++) {
      await POST(post({ password: "not it" }));
    }
    const degraded = await POST(post({ password: "not it" }));
    const degradedBody = await degraded.json() as { message: string };

    expect(degraded.status).toBe(429);
    expect(degradedBody.message).toBe(ordinaryBody.message);
  });
});

/* ------------------------------------------------------------------ *
 * 3. The right password
 * ------------------------------------------------------------------ */

describe("the right password", () => {
  it("answers 200", async () => {
    const response = await POST(post({ password: PASSWORD }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("is recorded as a successful attempt", async () => {
    await POST(post({ password: PASSWORD }));
    expect(attempts.recorded).toEqual([{ ok: true, ip: "203.0.113.7" }]);
  });

  it("sets a cookie carrying all four attributes", async () => {
    await POST(post({ password: PASSWORD }));

    const call = jar.set.mock.calls.at(0);
    expect(call?.[0]).toBe("ea_session");

    expect(call?.[2]).toMatchObject({
      httpOnly: true, // script cannot read it, so an XSS cannot take it
      secure: true, // never crosses plain http
      sameSite: "lax", // not sent on a cross-site POST
      path: "/", // one app, one scope
      maxAge: 15_552_000, // six months
    });
  });

  it("puts a signed token in the cookie, not the password", async () => {
    await POST(post({ password: PASSWORD }));

    const token = jar.set.mock.calls[0]?.[1] as string;
    expect(token).not.toContain(PASSWORD);
    // header.payload.signature
    expect(token.split(".")).toHaveLength(3);
  });

  it("takes the address from the FIRST x-forwarded-for entry", async () => {
    // The chain is client, then proxies. Recording the last one attributes
    // every attempt to our own edge.
    await POST(post({ password: PASSWORD }, "192.0.2.44"));
    expect(attempts.recorded[0]?.ip).toBe("192.0.2.44");
  });
});

/* ------------------------------------------------------------------ *
 * 4. The way out
 * ------------------------------------------------------------------ */

describe("DELETE", () => {
  it("answers 204 and expires the cookie", async () => {
    await POST(post({ password: PASSWORD }));
    jar.set.mockClear();

    const response = await DELETE();

    expect(response.status).toBe(204);
    const expired = jar.set.mock.calls.find((c) => c[0] === "ea_session");
    expect(expired?.[2]).toMatchObject({ maxAge: 0, path: "/" });
  });

  it("answers 204 with no session to destroy", async () => {
    // Signing out is idempotent. A 401 here would error a client whose cookie
    // has already expired while it tries to do the safe thing.
    await expect(DELETE()).resolves.toMatchObject({ status: 204 });
  });
});
