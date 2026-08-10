/**
 * POST /api/session — the front door. DELETE /api/session — the way out.
 *
 * TWO passwords, one each, checked against two scrypt hashes that live in the
 * environment under their own names. There is still no user table behind this
 * and no account system, but the claim has changed: this route used to prove
 * "someone who knows the password is here" and now proves "someone who knows
 * EVA's password is here" — or Adam's — and it says which in the token.
 *
 * Until 2026-08-10 there was one password that both of them typed, the door
 * genuinely could not tell them apart, and every sentence in this file said
 * so. Those sentences are gone rather than softened: a comment describing an
 * auth boundary that no longer exists is worse than no comment, because it is
 * read as current.
 *
 * WHAT IS AND IS NOT PROVEN, NOW. A session minted here carries `mid`, and
 * `getIdentity()` reports `source: 'authenticated'` for it. That is real
 * identity as far as a shared-secret credential can carry it: the holder of
 * Eva's password. It is NOT an account — there is no rotation either of them
 * can perform without the founder editing a Vercel variable, and no recovery
 * flow at all. Sessions minted before this change carry no `mid` and fall back
 * to the self-declared profile cookie until they expire; that fallback is
 * required, not vestigial. See `lib/session/index.ts`.
 *
 * The route is a composition root: read the request, ask the limiter, ask the
 * door, record what happened, answer. Every rule it enforces lives in a
 * module that can be tested without an HTTP request, because a rule that only
 * holds inside a handler is a rule that holds until someone adds a second
 * handler. The both-credentials rule is `lib/auth/door.ts`.
 *
 * FIVE THINGS THIS FILE IS RESPONSIBLE FOR NOT GETTING WRONG:
 *
 *   1. Node runtime. `scrypt` does not exist on Edge, and a route that silently
 *      ran there would fail at the one moment it matters.
 *   2. Every declining answer takes the same time. See `lib/auth/timing.ts`.
 *   3. Every declining answer says the same thing. One sentence, no reason
 *      code — "wrong password", "too many tries" and "malformed body" are
 *      distinguishable by status where they must be and by nothing else.
 *   4. The limiter is asked BEFORE the password is checked, so a guesser
 *      cannot spend our CPU on scrypt after being cut off.
 *   5. BOTH credentials are checked on every attempt, including the ones that
 *      match the first. An early return would make Eva's login measurably
 *      faster than Adam's and turn the door into an oracle for which name was
 *      typed. `lib/auth/door.ts` holds this; the route must not "improve" it.
 */

import { z } from "zod";

import { openDoor, type DoorCredential } from "@/lib/auth/door";
import {
  checkDegradedSessionRateLimit,
  checkRateLimit,
  refundDegradedAttempt,
  type RateLimitDecision,
} from "@/lib/auth/rate-limit";
import { holdUntilFloor, startClock } from "@/lib/auth/timing";
import { recordAuthAttempt } from "@/lib/data/auth-attempts";
import { memberIdBySlug } from "@/lib/data/members";
import { env, parseScryptHash } from "@/lib/env";
import { createSession, destroySession } from "@/lib/session";
import type { MemberSlug, Uuid } from "@/lib/types";

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
  /**
   * Whose password opened the door. Present ONLY on a successful answer.
   *
   * Not an oracle: the only caller that ever sees it is one that has just
   * proved it knows a password, and it learns which of the two it typed —
   * which it already knew. What it buys is the "who's this?" tap: the client
   * records the name itself instead of asking a question the server can now
   * answer. Absent when the door could not attribute the login (see
   * `DoorAnswer.ambiguous`), and the picker comes back for that session.
   */
  who?: MemberSlug;
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

  // BOTH credentials, every time. `openDoor` does not stop at the first match
  // and must not be changed to — see rule 5 in this file's header and the
  // argument in `lib/auth/door.ts`.
  const answer = await openDoor(parsed.data.password, doorCredentials());

  if (answer.ambiguous) {
    // One string opened both. That means Eva's password and Adam's password
    // are the same secret under two salts — the one derivation mistake
    // `lib/env.ts` cannot catch at boot, because two independent salts over
    // one password produce two different keys.
    //
    // They are still let in. Refusing would lock both of them out of an
    // archive with no reset flow, which is a far worse outcome than a session
    // that declines to name its holder. What is refused is the CLAIM: no
    // `mid`, no `who`, and the picker asks — the same honest answer the app
    // gave when there was one shared password.
    console.error(
      "both app credentials matched one password; minting a session with no identity",
      { scope: "session" },
    );
  }

  // Awaited, not fire-and-forget. On a serverless platform the process can be
  // frozen the instant the response is returned, and an un-awaited insert is a
  // rate limiter that records nothing under exactly the load it exists for.
  // `recordAuthAttempt` never throws.
  await recordAuthAttempt({
    ip,
    userAgent,
    scope: "session",
    ok: answer.opened,
  });

  if (!answer.opened) {
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

  // The `mid` the token will carry: the DATABASE id for the slug whose
  // credential matched, resolved through `lib/data/members.ts`. Never the
  // fixture uuid in `lib/fixtures/members.ts` — those two sets of ids do not
  // agree, and a fixture id written into a real row is a row attributed to
  // nobody.
  const mid = answer.slug === null ? null : await memberIdOrNull(answer.slug);

  await createSession(mid === null ? {} : { mid });

  return json(
    { ok: true, ...(answer.slug === null ? {} : { who: answer.slug }) },
    { status: 200 },
  );
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

/**
 * Both ways in, Eva first.
 *
 * Parsed per request rather than memoised at module scope: it is a regex and
 * two base64 decodes against a value that is already in memory, next to two
 * scrypt derivations that cost tens of milliseconds each, and a module-level
 * cache would be one more thing to invalidate for no measurable gain.
 *
 * Order is legibility only — `openDoor` evaluates every entry before reading
 * any of them, so nothing about the answer depends on which is written first.
 */
function doorCredentials(): DoorCredential[] {
  return [
    {
      slug: "eva",
      label: "APP_PASSWORD_HASH_EVA",
      hash: parseScryptHash("APP_PASSWORD_HASH_EVA", env.APP_PASSWORD_HASH_EVA),
    },
    {
      slug: "adam",
      label: "APP_PASSWORD_HASH_ADAM",
      hash: parseScryptHash(
        "APP_PASSWORD_HASH_ADAM",
        env.APP_PASSWORD_HASH_ADAM,
      ),
    },
  ];
}

/**
 * The member id for a slug, or null if the database will not answer.
 *
 * NOT a throw. The correct password has already been typed at this point, and
 * the only thing standing between this person and their archive is a lookup of
 * two rows that never change. Letting a Supabase outage turn a correct password
 * into a 500 would undo the whole reason the limiter above degrades instead of
 * failing closed: being locked out at 3am because a free-tier project paused is
 * the precise failure mode that design exists to prevent.
 *
 * The cost of the fallback is one tap. A session with no `mid` is a legacy-
 * shaped session: `getIdentity()` falls back to the profile cookie, the client
 * has still been told `who` in the response body, and nothing is attributed to
 * the wrong person.
 */
async function memberIdOrNull(slug: MemberSlug): Promise<Uuid | null> {
  try {
    return await memberIdBySlug(slug);
  } catch (error) {
    console.error("member lookup failed; minting a session without identity", {
      scope: "session",
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

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
