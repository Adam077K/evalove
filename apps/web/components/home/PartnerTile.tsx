"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { partnerOf } from "@/lib/fixtures/members";
import { useViewer } from "@/lib/viewer";

/**
 * The doorway to the partner conversation — titled with the OTHER
 * person's name, carried in their colour. On Eva's phone this tile
 * is Adam's: amber, his echo, his memory of their story.
 */
export function PartnerTile() {
  const { member } = useViewer();
  const partner = partnerOf(member);
  const grad =
    partner.slug === "adam" ? "var(--grad-adam)" : "var(--grad-eva)";
  const glow =
    partner.slug === "adam" ? "shadow-glow-adam" : "shadow-glow-eva";

  return (
    <Link
      href="/partner"
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
        <MessageCircle size={18} strokeWidth={1.9} />
      </span>
      <span className="relative">
        <span className="type-card block">Ask {partner.displayName}</span>
        <span className="type-caption block opacity-85">
          an echo that keeps their story
        </span>
      </span>
    </Link>
  );
}
