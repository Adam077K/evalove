/**
 * POST /api/session — the front door. DELETE /api/session — the way out.
 *
 * One password, known to both of them, checked against a scrypt hash that
 * lives in the environment. There is no user table behind this and no per-person
 * credential, and the code says so out loud rather than pretending: what this
 * route proves is "someone who knows the password is here", which is not the
 * same claim as "Eva is here". The second claim is `getIdentity()`, it is
 * self-declared, and it gates nothing. See `lib/session/profile.ts`.
 *
 * The route is a composition root: read the request, ask the limiter, ask the
 * verifier, record what happened, answer. Every rule it enforces lives in a
 * module that can be tested without an HTTP request, because a rule that only
 * holds inside a handler is a rule that holds until someone adds a second
 * handler.
 *
 * FOUR THINGS THIS FILE IS RESPONSIBLE FOR NOT GETTING WRONG:
 *
 *   1. Node runtime. `scrypt` does not exist on Edge, and a route that silently
 *      ran there would fail at the one moment it matters.
 *   2. Every declining answer takes the same time. See `lib/auth/timing.ts`.
 *   3. Every declining answer says the same thing. One sentence, no reason
 *      code — "wrong password", "too many tries" and "malformed body" are
 *      distinguishable by status where they must be and by nothing else.
 *   4. The limiter is asked BEFORE the password is checked, so a guesser
 *      cannot spend our CPU on scrypt after being cut off.
 */

import { z } from "zod";

import { verifySecret } from "@/lib/auth/password";
import {
  checkDegradedSessionRateLimit,
  checkRateLimit,
  refundDegradedAttempt,
  type RateLimitDecision,
} from "@/lib/auth/rate-limit";
import { holdUntilFloor, startClock } from "@/lib/auth/timing";
import { recordAuthAttempt } from "@/lib/data/auth-attempts";
import { env, parseScryptHash } from "@/lib/env";
import { createSession, destroySession } from "@/lib/session";

/** scrypt is a Node API. This route cannot run on the Edge runtime. */
export const runtime = "nodejs";

/**
 * Never cached, never prerendered. The response depends on a cookie it is in
 * the middle of setting, and on a rate-limit window measured in minutes.
 */
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ *
 * Input
 * ------------------------------------------------------------------ */

/**
 * The body.
 *
 * The cap is input validation, not a policy about password length: scrypt will
 * happily chew on a megabyte of text, and an unbounded input is a free way to
 * make the server work. Not trimmed — leading and trailing spaces are part of
 * a password, and silently stripping them means a password containing one can
 * never be entered.
 */
const bodySchema = z.object({
  password: z.string().min(1).max(1024),
});

/* ------------------------------------------------------------------ *
 * Answers
 * ------------------------------------------------------------------ */

/**
 * The single declining sentence.
 *
 * Deliberately incurious. "No such password", "you are rate limited for
 * another 4 minutes" and "your JSON was malformed" are three different pieces
 * of information about our internals, and the person who typed their password
 * wrong needs none of them to try again.
 */
const DECLINED = "That's not it. Try again.";

/** A body shape every response shares, so the client has one thing to parse. */
interface SessionResponseBody {
  ok: boolean;
  message?: string;
}

function json(body: SessionResponseBody, init: ResponseInit): Response {
  return Response.json(body, init);
}

/* ------------------------------------------------------------------ *
 * POST — unlock
 * ------------------------------------------------------------------ */

export async function POST(request: Request): Promise<Response> {
  const clock = startClock();
  const ip = clientAddress(request);
  const userAgent = request.headers.get("user-agent");

  /* --- shape ---------------------------------------------------- */

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    // Held to the same floor as a wrong password. A malformed body that
    // answers in 2ms while a wrong password takes 60ms tells a prober exactly
    // where the expensive branch starts.
    await holdUntilFloor(clock);
    return json({ ok: false, message: DECLINED }, { status: 400 });
  }

  /* --- limiter, before any expensive work ----------------------- */

  let limit: RateLimitDecision;
  let degradedPath = false;
  try {
    limit = await checkRateLimit("session", ip);
  } catch (error) {
    // scope='session': degrade to the in-process counter rather than fail
    // closed. A correct password + Supabase unavailable = 503 was the only
    // path to the archive, and being locked out at 3am because a free-tier
    // project paused is the precise failure mode we are preventing.
    //
    // scope='vault' never enters this branch: vault has its own route and its
    // own catch block, which MUST keep failing closed. That split — session
    // degrades, vault does not — is the whole design. See the argument in
    // lib/auth/rate-limit.ts's file header for why each door is different.
    console.error("rate-limit read failed; degrading to in-process counter", {
      scope: "session",
      message: error instanceof Error ? error.message : String(error),
    });
    const degraded = checkDegradedSessionRateLimit(ip);
    if (!degraded.allowed) {
      // Response is byte-identical to the ordinary 429: no banner, no extra
      // header, no different sentence. Telling the caller "the limiter is
      // degraded" is an oracle for the one attacker who can make storage
      // unreachable on demand.
      await holdUntilFloor(clock);
      return json(
        { ok: false, message: "Too many tries. Give it a few minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(degraded.retryAfterSeconds) },
        },
      );
    }
    degradedPath = true;
    limit = { allowed: true };
  }

  if (!limit.allowed) {
    // Not recorded as an attempt. A refused request never reached the password
    // check, so counting it would let a blocked caller extend their own
    // lockout indefinitely by continuing to knock.
    await holdUntilFloor(clock);
    return json(
      { ok: false, message: "Too many tries. Give it a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  /* --- the actual check ----------------------------------------- */

  const ok = await verifySecret(
    parsed.data.password,
    parseScryptHash("APP_PASSWORD_HASH", env.APP_PASSWORD_HASH),
  );

  // Awaited, not fire-and-forget. On a serverless platform the process can be
  // frozen the instant the response is returned, and an un-awaited insert is a
  // rate limiter that records nothing under exactly the load it exists for.
  // `recordAuthAttempt` never throws.
  await recordAuthAttempt({ ip, userAgent, scope: "session", ok });

  if (!ok) {
    await holdUntilFloor(clock);
    return json({ ok: false, message: DECLINED }, { status: 401 });
  }

  /* --- in ------------------------------------------------------- */

  // Refund the pessimistic charge from the degraded counter. A correct password
  // must not count against the per-instance budget: repeated successful logins
  // during an outage (troubleshooting, device switching) would otherwise exhaust
  // it and lock the door for fifteen minutes — the exact scenario this whole
  // change exists to prevent.
  if (degradedPath) refundDegradedAttempt(ip);

  // No `mid`. One password, two people, and the door cannot tell them apart —
  // saying otherwise in the token would be inventing identity. The "who's
  // this?" tap that follows is attribution and lives in its own cookie.
  await createSession();

  return json({ ok: true }, { status: 200 });
}

/* ------------------------------------------------------------------ *
 * DELETE — sign out
 * ------------------------------------------------------------------ */

/**
 * Always 204, even with no session to destroy.
 *
 * Signing out is idempotent by nature and the caller's correct reaction to
 * every outcome is identical. A 401 here would mean a client whose cookie has
 * already expired gets an error while trying to do the safe thing.
 */
export async function DELETE(): Promise<Response> {
  await destroySession();
  return new Response(null, { status: 204 });
}

/* ------------------------------------------------------------------ *
 * Internals
 * ------------------------------------------------------------------ */

/** `request.json()` without the throw. Malformed input is an answer, not a crash. */
async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/**
 * The client's address, as well as it can be known.
 *
 * `x-forwarded-for` is a comma-separated chain and the FIRST entry is the
 * original client; the ones after it are proxies. The header is spoofable in
 * general — but not here, because Vercel overwrites it at the edge, and this
 * app is not reachable except through it. Recording a null address is better
 * than recording a made-up one: null is honestly excluded from the per-address
 * window, while a fabricated value would put every unresolvable client into one
 * shared bucket and let the first of them lock out all the rest.
 */
function clientAddress(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;

  const real = request.headers.get("x-real-ip")?.trim();
  return real ? real : null;
}
