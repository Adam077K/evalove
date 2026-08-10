"use client";

import { useEffect, useState } from "react";
import type { Member, MemberSlug } from "@/lib/types";
import { memberBySlug } from "@/lib/fixtures/members";
import {
  parseProfile,
  profileCookieString,
  PROFILE_KEY,
} from "@/lib/session/profile";

/**
 * Which of the two is holding the phone, on the client — a name and a
 * display record, and DELIBERATELY NOT AN IDENTITY.
 *
 * WHAT THIS USED TO RETURN, AND WHY IT NO LONGER DOES. Until 2026-08-10
 * this hook also handed back `identity: { memberId, source }`, built
 * from the FIXTURE member record. The fixture uuids and the database's
 * uuids were different strings for the same two people, so
 * `useViewer().identity.memberId` was an id that did not exist in the
 * database. It was harmless only for as long as nothing wrote with it:
 * the first client-side write to take that id would have attributed a
 * row to nobody, and no type would have complained, because the shape
 * was exactly right and only the value was wrong.
 *
 * There is now no `Identity` on this side of the wire at all. A caller
 * that needs one asks the server, where it is derived from the signed
 * session (`getIdentity()` in `lib/session/`) — the only place that
 * knows a real member id. That is a structural fix rather than a
 * corrected constant: a value that does not exist cannot be passed to a
 * write by mistake. `lib/fixtures/__tests__/member-ids.test.ts`
 * separately pins the fixture ids to `supabase/seed.sql`, so the
 * `member` record below is not a second lie waiting to be found.
 *
 * The server reads the same `profile` cookie this file writes, and the
 * key comes from `lib/session/profile.ts` so the two cannot drift —
 * that drift is the bug where the picker writes one name and SSR
 * renders the other.
 */
export function useViewer(): { member: Member } {
  const [slug, setSlug] = useState<MemberSlug>("eva");

  useEffect(() => {
    try {
      // `?as=` is the preview override, then the cookie the picker
      // wrote, then localStorage as the survivor of a cleared cookie.
      const q = new URLSearchParams(window.location.search).get("as");
      const v =
        parseProfile(q) ??
        parseProfile(readProfileCookie()) ??
        parseProfile(window.localStorage.getItem(PROFILE_KEY));
      if (v) setSlug(v);
    } catch {
      /* stay Eva-first */
    }
  }, []);

  return { member: memberBySlug(slug) };
}

/**
 * The door writes here — the "who's this?" tap, or the server's own
 * answer once it started knowing which password was typed. Nothing else
 * does.
 *
 * Both a cookie and localStorage. The cookie is the one that matters —
 * a Server Component cannot see localStorage, and without it every
 * first paint after a reload shows the wrong name until the client
 * catches up. localStorage is the backup for the day a cookie is
 * cleared and nobody wants to be asked again.
 */
export function declareViewer(slug: MemberSlug): void {
  try {
    document.cookie = profileCookieString(slug);
  } catch {
    /* the picker can be shown again; nothing is lost */
  }
  try {
    window.localStorage.setItem(PROFILE_KEY, slug);
  } catch {
    /* private mode; the cookie is the real record */
  }
}

/**
 * Forget the name on the way out. Signing out calls this.
 *
 * `destroySession()` already expires the profile COOKIE server-side, and
 * that is not enough on its own: `useViewer` above falls back to
 * localStorage precisely so a cleared cookie does not lose the name, and
 * that fallback would greet the next person to open the app by the last
 * one's name. The cookie is left to the server, which is the only side
 * that can expire it with the attributes it was set with.
 */
export function forgetViewer(): void {
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* private mode; there was nothing stored to forget */
  }
}

/** The `profile` value out of `document.cookie`, if it is there. */
function readProfileCookie(): string | null {
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === PROFILE_KEY) return rest.join("=");
  }
  return null;
}
