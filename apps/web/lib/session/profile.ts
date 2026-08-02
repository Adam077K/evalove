/**
 * Eva & Adam — the attribution cookie. NOT a credential.
 *
 * READ THIS BEFORE USING ANYTHING IN HERE.
 *
 * The "who's this?" picker is ATTRIBUTION, NOT AUTHENTICATION. There is one
 * password and both of them know it, so the front door genuinely cannot tell
 * which of the two typed it. The picker is one tap that says "it's me holding
 * the phone", and it exists so a photo gets the right name on it — not so that
 * anything can be allowed or refused.
 *
 * Concretely, and every one of these is deliberate:
 *
 *   - Either person can set it to either value. There is no check.
 *   - It gates NOTHING. No route, no query, no field is conditional on it.
 *   - It is written by client JavaScript, and it is not `HttpOnly`, because it
 *     is not a secret and pretending otherwise would be the beginning of
 *     someone trusting it.
 *   - The server stamps `author_member_id` from it together with
 *     `attribution_source = 'self_declared'`, and `getIdentity()` returns that
 *     `source` in its type so no caller can use the id without seeing the
 *     caveat attached to it.
 *
 * If a future feature needs to know who is really acting, it does not read this
 * cookie harder. It needs real identity, which Phase 2's per-person accounts
 * will provide, and until then the honest answer is that we do not have it.
 *
 * A cookie rather than only `localStorage` because a Server Component rendering
 * during SSR cannot see `localStorage`, and the alternative is a flash of the
 * wrong person's name on every first paint. Both are written; the cookie is
 * what the server reads.
 */

import type { MemberSlug } from "@/lib/types";

/** The cookie name, and the `localStorage` key. Same word for the same thing. */
export const PROFILE_KEY = "profile";

/** Six months, matching the session it accompanies. */
export const PROFILE_MAX_AGE_SECONDS = 15_552_000;

/**
 * Narrow an untrusted string to a slug, or undefined.
 *
 * `eva` and `adam`, never `a`/`b` and never an index. An index-style value is
 * exactly how a wrong-attribution bug gets written: someone reorders an array
 * for a display reason and the other person's name lands on the photo.
 */
export function parseProfile(raw: string | null | undefined): MemberSlug | undefined {
  return raw === "eva" || raw === "adam" ? raw : undefined;
}

/**
 * The `document.cookie` string that records a choice. Client-side.
 *
 * Not `HttpOnly` — it cannot be, it is set from script — and not `Secure`,
 * because a value that says "eva" is not worth a broken dev server. `SameSite`
 * is still `Lax`: a cross-site request has no business relabelling who is
 * holding the phone, even though the label grants nothing.
 */
export function profileCookieString(slug: MemberSlug): string {
  return `${PROFILE_KEY}=${slug}; Path=/; Max-Age=${PROFILE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
