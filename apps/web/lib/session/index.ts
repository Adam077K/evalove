/**
 * Eva & Adam — the session seam. FIVE FUNCTIONS, AND NOTHING ELSE.
 *
 *     getSession() · requireSession() · getIdentity() · createSession() · destroySession()
 *
 * NO OTHER MODULE IN THE APP MAY READ THE SESSION COOKIE. Not a route handler,
 * not a Server Component, not a helper that "just needs to check". There is
 * exactly one documented exception, `middleware.ts`, which runs on the Edge
 * runtime and reads cookies off a `NextRequest` rather than from `next/headers`
 * — it uses `./token.ts` directly and is part of this layer, not a call site
 * that wandered off.
 *
 * WHY THE CONSTRAINT IS WORTH THE INCONVENIENCE. Phase 2 replaces this password
 * with real per-person accounts on Supabase Auth. When that happens, these five
 * functions get reimplemented against Supabase's session and NOT ONE CALL SITE
 * CHANGES. Every component that has learned to ask `getIdentity()` keeps
 * asking. If instead twenty files each parsed `cookies().get('ea_session')`,
 * that migration would be a rewrite with twenty chances to leave one behind —
 * and the one left behind would be the one that still trusts a self-declared
 * name after real identity became available.
 *
 * The corollary is that `Session` and `Identity` are the vocabulary. A caller
 * that wants "the JWT" wants something this layer does not promise to keep
 * having.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { memberIdBySlug } from "@/lib/data/members";
import { parseProfile, PROFILE_KEY } from "@/lib/session/profile";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
  signSession,
  verifySessionToken,
  type NewSession,
} from "@/lib/session/token";
import type { Identity, Session } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * 1. getSession
 * ------------------------------------------------------------------ */

/**
 * The current session, or null.
 *
 * Null covers every unusable state — no cookie, bad signature, expired, wrong
 * `SESSION_VERSION`. Callers that can render something for a signed-out person
 * use this; callers that cannot use `requireSession()` below.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/* ------------------------------------------------------------------ *
 * 2. requireSession
 * ------------------------------------------------------------------ */

/**
 * The current session, or a redirect to the door. Never returns null.
 *
 * `redirect()` throws, so control does not come back — which is the property
 * that makes this safe to call at the top of a Server Component and then use
 * the result below without a null check. The middleware already turns most
 * signed-out requests away; this is the check that still holds if a route is
 * ever added outside the matcher, and belt-and-braces is the correct posture
 * for the only door in the app.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/* ------------------------------------------------------------------ *
 * 3. getIdentity
 * ------------------------------------------------------------------ */

/**
 * Who we believe is holding the phone, and how sure we are — which is: not.
 *
 * `source` is in the return type ON PURPOSE. It is always `'self_declared'` in
 * Phase 1, and it will not always be, and every caller that needs proven
 * identity is forced to look at this field and notice that it does not have
 * any. A bare `memberId` would let that mistake pass silently, which is the
 * entire failure mode this shape exists to prevent. Do not destructure it away
 * at the boundary and pass a naked id inwards.
 *
 * Null when nobody has tapped a name yet. Not an error and not a redirect: the
 * picker gates nothing, so a request without it is ordinary. A write that needs
 * an author should ask the person rather than guess, and a read should simply
 * not personalise.
 */
export async function getIdentity(): Promise<Identity | null> {
  const jar = await cookies();
  const slug = parseProfile(jar.get(PROFILE_KEY)?.value);
  if (!slug) return null;

  return {
    memberId: await memberIdBySlug(slug),
    source: "self_declared",
  };
}

/* ------------------------------------------------------------------ *
 * 4. createSession
 * ------------------------------------------------------------------ */

/**
 * Mint a session and set the cookie. Call only after the secret has matched.
 *
 * A fresh `sid` every time rather than a reused one: two devices signed in at
 * once are two sessions, and an id that identifies the credential rather than
 * the sign-in cannot tell them apart in a log.
 *
 * Mutating cookies is only legal inside a Route Handler or a Server Action —
 * Next throws from a Server Component — so this belongs to `POST /api/session`
 * and to any future action that establishes a session.
 */
export async function createSession(
  input: Partial<NewSession> = {},
): Promise<Session> {
  const { token, session } = await signSession({
    sid: input.sid ?? crypto.randomUUID(),
    ...(input.mid ? { mid: input.mid } : {}),
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));

  return session;
}

/* ------------------------------------------------------------------ *
 * 5. destroySession
 * ------------------------------------------------------------------ */

/**
 * End the session.
 *
 * Overwritten with an empty value at `Max-Age=0` rather than deleted, and with
 * the SAME attributes it was set with. A browser matches a deletion on name,
 * path and domain; a `delete` that disagrees about `path` leaves the original
 * cookie sitting there and the person stays signed in while the UI insists they
 * are not.
 *
 * The profile cookie is cleared too. It is not a credential, but leaving a name
 * behind on a shared or borrowed device would mean the next person to open the
 * app is greeted as Eva, and the tap that says otherwise is one tap.
 *
 * Nothing server-side is revoked, because there is nothing server-side to
 * revoke — these tokens are stateless. Signing every device out at once is
 * `SESSION_VERSION` in `./token.ts`.
 */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  jar.set(PROFILE_KEY, "", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
