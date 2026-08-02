"use client";

import Link from "next/link";
import { AudioLines } from "lucide-react";
import { partnerOf } from "@/lib/fixtures/members";
import { useViewer } from "@/lib/viewer";

/**
 * The doorway to Echo, carried in the OTHER person's colour — on
 * Eva's phone this tile is amber, because what's behind it is the
 * record of Adam.
 *
 * It is titled "Echo" and not "Ask Adam". A button that says "Ask
 * Adam" says you are asking Adam; you are not, and hard line 1 of
 * `docs/04-features/AI-PARTNER-SPEC.md` says this surface may never
 * be mistakable for him. The caption names what is actually behind
 * the door: words he already said, kept.
 */
export function EchoTile() {
  const { member } = useViewer();
  const partner = partnerOf(member);
  const grad =
    partner.slug === "adam" ? "var(--grad-adam)" : "var(--grad-eva)";
  const glow =
    partner.slug === "adam" ? "shadow-glow-adam" : "shadow-glow-eva";

  return (
    <Link
      href="/echo"
      className={`press relative flex min-h-36 flex-col justify-between overflow-hidden rounded-[1.75rem] p-5 text-on-accent ${glow}`}
      style={{ background: grad }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}
      />
      <span
        className="relative flex h-10 w-10 items-center justify-center rounded-full"
        style={{
          background: "rgba(255,255,255,0.2)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        <AudioLines size={18} strokeWidth={1.9} />
      </span>
      <span className="relative">
        <span className="type-card block">Echo</span>
        <span className="type-caption block opacity-85">
          {partner.displayName}&rsquo;s own words, kept
        </span>
      </span>
    </Link>
  );
}
