/**
 * Eva & Adam — the session token itself: mint, verify, and the cookie it rides in.
 *
 * RUNTIME-AGNOSTIC ON PURPOSE. Nothing here touches `node:crypto`, `node:buffer`
 * or `scrypt`. `jose` runs on WebCrypto, which both the Node runtime and the
 * Edge runtime provide, and that is what lets the middleware check a session on
 * every request at the edge while the password itself is only ever checked in a
 * Node route handler.
 *
 * This module is INTERNAL to `lib/session/`. Application code goes through the
 * five functions in `./index.ts`; the one exception is `middleware.ts`, which
 * cannot use them because it reads cookies off a `NextRequest` rather than from
 * `next/headers`, and which is a documented part of the session layer rather
 * than a call site that wandered off.
 */

import { jwtVerify, SignJWT } from "jose";

import { env } from "@/lib/env";
import type { Session, Uuid } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

/**
 * Session schema version. THE PANIC BUTTON.
 *
 * Every token carries this integer and every verification rejects a token that
 * does not match. Bumping it by one invalidates every live session everywhere,
 * immediately, without rotating `SESSION_SECRET` and without a table of
 * revocations — which matters because there is no such table: these tokens are
 * stateless, so "log everyone out" is otherwise not an operation this system
 * can perform.
 *
 * Bump it when the payload shape changes, when a device is lost, or when
 * anything about a live session becomes suspect. It costs both of them one
 * re-entry of the password. That is the whole cost.
 */
export const SESSION_VERSION = 1;

/**
 * The cookie name.
 *
 * `__Host-` is deliberately NOT used. It would pin the cookie to a single
 * origin with no `Domain`, which is correct in production and breaks every
 * plain-http localhost, because `__Host-` also mandates `Secure`. The `Secure`
 * flag is applied below on its own terms instead.
 */
export const SESSION_COOKIE = "ea_session";

/**
 * Six months, in seconds. `Max-Age`, and the token's own `exp`.
 *
 * Long because this is a two-person app on two phones and being asked to
 * re-enter a password every fortnight is friction with no attacker on the other
 * side of it. The exposure that buys is bounded by `SESSION_VERSION` above: a
 * lost phone is one integer away from being logged out, which is a better
 * control than a short expiry that only annoys the people who still have their
 * phones.
 */
export const SESSION_MAX_AGE_SECONDS = 15_552_000;

/* ------------------------------------------------------------------ *
 * Key
 * ------------------------------------------------------------------ */

/**
 * `SESSION_SECRET` as bytes, decoded once.
 *
 * `atob` rather than `Buffer.from(..., 'base64')` so this file stays usable on
 * the Edge runtime. `lib/env.ts` has already proved the string is canonical
 * base64 of at least 32 bytes, so there is nothing to validate here.
 */
let keyBytes: Uint8Array | undefined;

function secretKey(): Uint8Array {
  if (keyBytes) return keyBytes;
  const binary = atob(env.SESSION_SECRET);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  keyBytes = bytes;
  return bytes;
}

/* ------------------------------------------------------------------ *
 * Mint
 * ------------------------------------------------------------------ */

/** Everything the caller gets to choose. The rest is computed. */
export interface NewSession {
  /** Session id. One per successful unlock; not reused across logins. */
  sid: Uuid;
  /**
   * Member id, when one is already known.
   *
   * Almost always absent in Phase 1: the front door does not know which of the
   * two people typed the password, because there is one password and they both
   * have it. See `getIdentity` in `./index.ts` for how attribution is handled
   * instead, and why it is not this.
   */
  mid?: Uuid;
}

/** Mint a signed token and the payload that was signed. */
export async function signSession(
  input: NewSession,
  now: Date = new Date(),
): Promise<{ token: string; session: Session }> {
  const iat = Math.floor(now.getTime() / 1000);
  const session: Session = {
    sid: input.sid,
    ...(input.mid ? { mid: input.mid } : {}),
    iat,
    exp: iat + SESSION_MAX_AGE_SECONDS,
    v: SESSION_VERSION,
  };

  const token = await new SignJWT({
    sid: session.sid,
    ...(session.mid ? { mid: session.mid } : {}),
    v: session.v,
  })
    // HS256 and nothing else. `jwtVerify` below is pinned to the same single
    // algorithm, which is what closes the `alg: none` and
    // RS256-downgraded-to-HS256 family of JWT bugs: the verifier never reads
    // the header's opinion about how to check the signature.
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(session.iat)
    .setExpirationTime(session.exp)
    .sign(secretKey());

  return { token, session };
}

/* ------------------------------------------------------------------ *
 * Verify
 * ------------------------------------------------------------------ */

/**
 * Check a token and return the session inside it, or null.
 *
 * Null for every kind of unusable token — bad signature, expired, wrong
 * version, missing claim, outright garbage. The caller's response to all of
 * those is identical (send them to the door), and distinguishing them in the
 * return type would only invite a call site that treats one of them as
 * recoverable.
 */
export async function verifySessionToken(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });

    const { sid, mid, v, iat, exp } = payload as Record<string, unknown>;

    if (typeof sid !== "string" || sid === "") return null;
    if (typeof iat !== "number" || typeof exp !== "number") return null;
    if (v !== SESSION_VERSION) return null;
    if (mid !== undefined && typeof mid !== "string") return null;

    return {
      sid,
      ...(typeof mid === "string" && mid !== "" ? { mid } : {}),
      iat,
      exp,
      v: SESSION_VERSION,
    };
  } catch {
    // `jwtVerify` throws for a tampered signature and for an expired token
    // alike. Both mean "no session", and the distinction is not the client's
    // business — an error body that says which one is a free oracle.
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Cookie attributes
 * ------------------------------------------------------------------ */

/**
 * The four attributes that make this cookie a session cookie and not a
 * liability, plus the two that make it durable:
 *
 *   httpOnly — script cannot read it, so an XSS cannot exfiltrate the session.
 *   secure   — never sent over plain http, so it cannot be sniffed. Set
 *              unconditionally, with no development exemption: browsers treat
 *              `http://localhost` as a secure context and accept `Secure`
 *              cookies there, so the usual "relax it in dev" branch buys
 *              nothing and costs the one guarantee that has to hold in
 *              production. An attribute that is only sometimes set is an
 *              attribute nobody can assert on.
 *   sameSite lax — not sent on cross-site POSTs, which is the CSRF class this
 *              app is exposed to. `strict` would break following a link into
 *              the app from a message, which is how it is actually opened.
 *   path /   — one app, one scope.
 */
export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
