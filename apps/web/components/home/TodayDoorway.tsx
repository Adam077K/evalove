/**
 * The today doorway — one thing from the archive, right now, → /book.
 *
 * Structure:
 *   Head row  — why-label LEFT, "THE BOOK ↗" RIGHT, one baseline.
 *               The destination link lives here, not buried after the caption.
 *   44/56 row — thumbnail (44%) + caption with author edge (56%), 1rem below.
 *
 * When whatCameBack returns null (genuinely empty archive), nothing renders.
 * Both surfaces (Today and The Book) receive the same now, so they cannot
 * disagree on which item came back within a session.
 */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { MemberSlug } from "@/lib/types";
import { whatCameBack } from "@/lib/resurface";
import { thumbSrc } from "@/lib/fixtures/resolve";
import { memberById } from "@/lib/fixtures/members";

type Returned = NonNullable<ReturnType<typeof whatCameBack>>;

interface TodayDoorwayProps {
  /** The same instant the pair was rendered with. Keeps both surfaces in sync. */
  now: Date;
}

export function TodayDoorway({ now }: TodayDoorwayProps) {
  const returned = whatCameBack(now);
  if (returned === null) return null;
  return <DoorwayItem returned={returned} />;
}

function DoorwayItem({ returned }: { returned: Returned }) {
  const { label, photo } = returned;
  const author = memberById(photo.authorMemberId);
  const authorSlug = author.slug as MemberSlug;
  const edgeClass = authorSlug === "eva" ? "edge-eva" : "edge-adam";
  const hasImage = photo.width > 0 && photo.height > 0;

  return (
    <Link
      href="/book"
      aria-label={`${label} — open in the book`}
      className="press block"
    >
      {/* Head row: why-label LEFT · THE BOOK ↗ RIGHT, one baseline.
          The destination link belongs here, not buried after the caption. */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="type-micro text-mute">{label}</p>
        <span className="type-micro flex shrink-0 items-center gap-1 text-mute">
          The book{" "}
          <ArrowUpRight size={12} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>

      {/* 44/56 content — 1rem below the head row, no rule.
          Thumbnail (44%) + caption with author edge (56%). */}
      {(hasImage || photo.caption) && (
        <div className="mt-4 flex items-start gap-4">
          {hasImage && (
            <div className="w-[44%] shrink-0 aspect-[3/4] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc(photo)}
                alt={photo.caption ?? `A photograph by ${author.displayName}`}
                className="photo h-full w-full object-cover block"
                loading="lazy"
              />
            </div>
          )}
          {photo.caption && (
            <div className={`flex-1 ${edgeClass} pl-3 pt-0.5 min-w-0`}>
              <p className="type-caption text-ink">{photo.caption}</p>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
