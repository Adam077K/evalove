"use client";

import Link from "next/link";
import { AudioLines } from "lucide-react";
import { partnerOf } from "@/lib/fixtures/members";
import { useViewer } from "@/lib/viewer";

/**
 * The doorway to Echo.
 *
 * It sits under the book's cover, and the pair is deliberately
 * unequal: a wide photograph, then a low strip of solid ink. Every
 * other surface in this app is paper, so the one filled block on Home
 * is the one place a person cannot accidentally scroll past — and it
 * does not need to be square to do that job.
 *
 * It used to be filled with the other person's gradient — amber on
 * Eva's phone, because what's behind it is the record of Adam.
 * Wrapping this particular door in Adam's own colour was the wrong
 * instinct twice over: a person's ink is never a fill, and this is
 * the one surface in the product that must never be mistakable for
 * him.
 *
 * Which is also why it is titled "Echo" and not "Ask Adam". A
 * button that says "Ask Adam" says you are asking Adam; you are
 * not, and hard line 1 of `docs/04-features/AI-PARTNER-SPEC.md`
 * says this surface may never be mistakable for him. The caption
 * names what is actually behind the door: words he already said,
 * kept.
 */
export function EchoTile() {
  const { member } = useViewer();
  const partner = partnerOf(member);

  return (
    <Link
      href="/echo"
      className="press tile-ink flex items-center gap-4 rounded-[0.875rem] px-5 py-4"
    >
      <AudioLines size={20} strokeWidth={1.8} className="shrink-0" />
      <span className="min-w-0">
        <span className="type-card block">Echo</span>
        <span className="type-caption mt-0.5 block opacity-75">
          {partner.displayName}&rsquo;s own words, kept
        </span>
      </span>
    </Link>
  );
}
