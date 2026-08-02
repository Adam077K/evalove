"use client";

import { useEffect, useState } from "react";
import type { Identity, Member } from "@/lib/types";
import { memberBySlug } from "@/lib/fixtures/members";

/**
 * Who is holding the phone.
 *
 * The real answer comes from the session ("who's this?" — one tap,
 * `self_declared`); the fixture build reads the same localStorage
 * key that screen writes, with `?as=eva|adam` as a preview override.
 * Identity keeps its `source` on purpose: nothing downstream may
 * mistake a tapped name for proof.
 */
export function useViewer(): { member: Member; identity: Identity } {
  const [slug, setSlug] = useState<"eva" | "adam">("eva");

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("as");
      const stored = window.localStorage.getItem("ea-member");
      const v = q ?? stored;
      if (v === "eva" || v === "adam") setSlug(v);
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

/** The "who's this?" screen writes here; nothing else does. */
export function declareViewer(slug: "eva" | "adam"): void {
  try {
    window.localStorage.setItem("ea-member", slug);
  } catch {
    /* private mode; the session cookie is the real record */
  }
}
