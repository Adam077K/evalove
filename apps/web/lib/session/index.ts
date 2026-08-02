/**
 * Eva & Adam — the session seam.
 *
 *     getSession() · requireSession() · requireSessionOrRedirect()
 *     getIdentity() · createSession() · destroySession()
 *     UnauthenticatedError
 *
 * THE RULE IS NOT "FIVE SYMBOLS". The rule is that nothing outside this module
 * parses the session cookie, and every symbol above upholds it: none of them
 * hands out a token, a cookie name, or anything a caller could read one with.
 *
 * NO OTHER MODULE IN THE APP MAY READ THE SESSION COOKIE. Not a route handler,
 * not a Server Component, not a helper that "just needs to check". There is
 * exactly one documented exception, `middleware.ts`, which runs on the Edge
 * runtime and reads cookies off a `NextRequest` rather than from `next/headers`
 * — it uses `./token.ts` directly and is part of this layer, not a call site
 * that wandered off.
 *
 * WHY THE CONSTRAINT IS WORTH THE INCONVENIENCE. Phase 2 replaces this password
 * with real per-person accounts on Supabase Auth. When that happens, these
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
 * use this; callers that cannot use one of the two `require*` functions below.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/* ------------------------------------------------------------------ *
 * 2. requireSession — FOR ROUTE HANDLERS
 * ------------------------------------------------------------------ */

/**
 * There is no session.
 *
 * A named class rather than a bare `Error` so a route handler can tell "not
 * signed in" — an ordinary, expected outcome with a 401 attached — apart from
 * a database being down, which is not. A `catch` that cannot make that
 * distinction ends up answering 401 to an outage, and then nobody investigates
 * it because 401 looks like a user error.
 *
 * Carries nothing. Why there is no session is not the client's business, and a
 * field saying "expired" versus "bad signature" is an oracle.
 */
export class UnauthenticatedError extends Error {
  override readonly name = "UnauthenticatedError";

  constructor() {
    super("No session.");
  }
}

/**
 * The current session, or `UnauthenticatedError`. FOR ROUTE HANDLERS.
 *
 * READ THE DISTINCTION BELOW BEFORE COLLAPSING THESE TWO FUNCTIONS BACK INTO
 * ONE. They are not duplicates. They differ in the only thing that matters
 * here — what a signed-out caller is handed — and the two callers want
 * genuinely different answers:
 *
 *   - A ROUTE HANDLER's caller is a `fetch`. It must get a 401 with a JSON
 *     body it can act on. Answering with a 307 to an HTML login page gives a
 *     client that asked for JSON a page it cannot parse, and the error it
 *     eventually reports is about JSON syntax, three layers away from the
 *     actual cause: nobody is signed in.
 *   - A PAGE's caller is a browser following a navigation. It must get the
 *     login screen. Throwing there produces an error page, which is a worse
 *     answer to "you need to sign in" than the sign-in screen is.
 *
 * This one throws, which makes it the honest primitive: it reports the fact
 * and lets the caller choose the response. `requireSessionOrRedirect()` below
 * is the page-shaped wrapper around it.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthenticatedError();
  return session;
}

/* ------------------------------------------------------------------ *
 * 3. requireSessionOrRedirect — FOR PAGES AND LAYOUTS
 * ------------------------------------------------------------------ */

/**
 * The current session, or a redirect to the door. FOR SERVER COMPONENTS.
 *
 * Never returns null: `redirect()` throws Next's own control-flow signal, so
 * execution does not come back, which is the property that makes this safe to
 * call at the top of a Server Component and use the result below without a
 * null check.
 *
 * DO NOT CALL THIS FROM A ROUTE HANDLER. Next will honour the redirect there
 * too and answer 307 with HTML, and the `fetch` on the other end will fail
 * somewhere that looks nothing like the cause. Use `requireSession()`.
 *
 * The redirect signal is deliberately not caught and rethrown here — it is
 * Next's, it is not an error, and interfering with it is how a redirect turns
 * into a 500.
 */
export async function requireSessionOrRedirect(): Promise<Session> {
  try {
    return await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) redirect("/login");
    throw thrown;
  }
}

/* ------------------------------------------------------------------ *
 * 4. getIdentity
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
 * 5. createSession
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
 * 6. destroySession
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
