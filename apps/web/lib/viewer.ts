"use client";

import { useEffect, useState } from "react";
import type { Identity, Member, MemberSlug } from "@/lib/types";
import { memberBySlug } from "@/lib/fixtures/members";
import {
  parseProfile,
  profileCookieString,
  PROFILE_KEY,
} from "@/lib/session/profile";

/**
 * Who is holding the phone, on the client.
 *
 * The server's answer is `getIdentity()` in `lib/session/`, which reads
 * the same `profile` cookie this file writes. Two readers, one key —
 * the constant comes from `lib/session/profile.ts` so they cannot drift
 * apart, which is the bug where the picker writes one name and SSR
 * renders the other.
 *
 * Identity keeps its `source` on purpose. Nothing downstream may
 * mistake a tapped name for proof: the picker is attribution, both
 * people can set it to either value, and it gates nothing.
 */
export function useViewer(): { member: Member; identity: Identity } {
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

  const member = memberBySlug(slug);
  return {
    member,
    identity: { memberId: member.id, source: "self_declared" },
  };
}

/**
 * The "who's this?" screen writes here; nothing else does.
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

/** The `profile` value out of `document.cookie`, if it is there. */
function readProfileCookie(): string | null {
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === PROFILE_KEY) return rest.join("=");
  }
  return null;
}
