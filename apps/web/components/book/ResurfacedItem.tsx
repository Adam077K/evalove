import type { MemberSlug } from "@/lib/types";
import type { Return } from "@/lib/resurface";
import { memberById } from "@/lib/fixtures/members";
import { photoSrc } from "@/lib/fixtures/resolve";
import Stamp from "@/components/item/Stamp";

/**
 * ResurfacedItem — the single item from the archive that is relevant
 * right now, shown as the default view of The Book.
 *
 * Two render paths:
 *
 *   photo — full bleed on mobile (0→viewport); at 768 the -mx-8 breakout
 *           leaves 48px of paper each side. Capped at 70dvh so a very
 *           tall future photograph does not push the caption off-screen.
 *           The cap uses max-h-[70dvh] + object-cover, which preserves
 *           the full-bleed read while bounding the element height.
 *           Caption below on paper with the author's 2px edge.
 *           Never dimmed, tinted, scrimmed — filter: none everywhere.
 *
 *   text  — caption at 28px (Fraunces italic) with author's 2px edge.
 *           This is the larger size, not type-quote's 17px, because
 *           with zero photographs anywhere the line IS the thing that
 *           came back, and it must not be outranked by the navigation
 *           row below it.
 *           Zero photographs anywhere is an ordinary afternoon in this
 *           product, not an edge case.
 *
 * Hierarchy: colophon (type-micro, 11px) dates the object permanently.
 * Why-label (type-caption, 13px) explains why this item is here right
 * now. They must not read as a pair — the why-label is slightly larger
 * and lowercase so it reads as contextual explanation, not metadata.
 *
 * The 2px author edge attaches to the caption block, not to the
 * photograph — a full-bleed photograph has no left edge to mark.
 */
export function ResurfacedItem({ returned }: { returned: Return }) {
  const { label, photo } = returned;
  const author = memberById(photo.authorMemberId);
  const authorSlug = author.slug as MemberSlug;
  const edgeClass = authorSlug === "eva" ? "edge-eva" : "edge-adam";
  const hasImage = photo.width > 0 && photo.height > 0;

  return (
    <div className="mt-8">
      {/* Why it came back — type-caption (13px, lowercase), one rank
          above the colophon's type-micro (11px, uppercase). These are
          different kinds of statement and must not read as a pair. */}
      <p className="type-caption text-mute mb-4">{label}</p>

      {hasImage ? (
        <>
          {/* Photograph at its own aspect ratio. -mx-5 md:-mx-8 breaks
              out of the column; full bleed on mobile, 48px margin each
              side at 768px. max-h-[70dvh] guards against future photos
              taller than the cap: the current archive is 1200×1600 and
              1200×900, which at 393px width render at 524px and 294.8px —
              both under the 596.4px cap at a 852px viewport. Object-cover
              fills the bounded element, preserving the bleed read.
              dvh, never vh — on iOS Safari vh is the expanded viewport. */}
          <div className="-mx-5 md:-mx-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixture
                sources are remote seeds; resolve.ts is the only wiring seam. */}
            <img
              src={photoSrc(photo)}
              alt={photo.caption ?? `A photograph from ${author.displayName}`}
              width={photo.width}
              height={photo.height}
              className="photo block w-full max-h-[70dvh] object-cover"
            />
          </div>
          {/* Caption and stamp on paper, below the photograph.
              The 2px edge marks the caption block, not the image. */}
          <div className={`mt-4 pl-3 ${edgeClass}`}>
            {photo.caption && (
              <p className="type-quote text-ink">{photo.caption}</p>
            )}
            <div className={photo.caption ? "mt-2" : ""}>
              <Stamp leftAt={photo.createdAt} authorSlug={authorSlug} />
            </div>
          </div>
        </>
      ) : (
        /* Text-quote case — caption as the resurfaced item, no image.
           28px (1.75rem) Fraunces italic: larger than type-quote's 17px
           because this line IS what came back, and it must stand above
           the navigation rows below it. */
        <div className={`pl-3 ${edgeClass}`}>
          {photo.caption && (
            <p
              className="type-quote text-ink"
              style={{ fontSize: "1.75rem", lineHeight: "1.45" }}
            >
              {photo.caption}
            </p>
          )}
          <div className={photo.caption ? "mt-3" : ""}>
            <Stamp leftAt={photo.createdAt} authorSlug={authorSlug} />
          </div>
        </div>
      )}
    </div>
  );
}
