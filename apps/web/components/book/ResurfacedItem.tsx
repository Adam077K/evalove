/* eslint-disable @next/next/no-img-element -- content photographs are
   fixture-resolved and under the `.photo` law: no filter, and the
   optimizer must never re-encode them. */

import type { MemberSlug } from "@/lib/types";
import type { Return } from "@/lib/resurface";
import { memberById } from "@/lib/fixtures/members";
import { photoSrc } from "@/lib/fixtures/resolve";
import { Mounted, Torn } from "@/components/materials";
import Stamp from "@/components/item/Stamp";
import { Polaroid } from "./Polaroid";
import { chinHandClass, handClass, seededIn, seededPick } from "./compose";

/**
 * ResurfacedItem — the page the ribbon held: the one item from the
 * archive that is relevant right now, composed on the open sheet.
 *
 * This is the default view of The Book (P4's withdrawal condition:
 * resurface by association, never a date grid), re-skinned from the
 * card idiom to the material one:
 *
 *   why-label   The app's own voice — Fraunces italic (§2 register:
 *               "any moment the system has a voice of its own"), not
 *               a typeset chrome caption. Quiet, mute, small offset.
 *
 *   photograph  Mounted at book rotation (−8°…+8°, seeded from the
 *               photo's stable id) in a real mount — polaroid chin,
 *               polaroid square, or the torn-edge sheet — chosen by
 *               seed, never by array position. The caption sits in
 *               the author's own hand: on the chin when the mount has
 *               one, on the page beside the mount otherwise. Never
 *               centred, never in a container.
 *
 *   stamp       The app observing, typeset, absolute, both clocks.
 *
 *   text-only   The caption IS what came back, written large in the
 *               author's own hand directly on the paper. Zero
 *               photographs anywhere is an ordinary afternoon here,
 *               not an edge case.
 *
 * Composition values (mount, width, offsets) are all seeded from the
 * photo's stable id — the page looks the same every time it is
 * revisited, and the first insert re-rolls nothing.
 */
export function ResurfacedItem({ returned }: { returned: Return }) {
  const { label, photo } = returned;
  const author = memberById(photo.authorMemberId);
  const authorSlug = author.slug as MemberSlug;
  const hasImage = photo.width > 0 && photo.height > 0;
  const caption = photo.caption;

  /* Seeded composition — stable per item, varied across items. */
  const mount = seededPick(photo.id, ["chin", "square", "torn"] as const);
  const widthPct = Math.round(seededIn(`${photo.id}:w`, 74, 86));
  const leftward = seededIn(`${photo.id}:x`, 0, 1) < 0.5;

  /* The why-label: the app speaking. Its offset never matches the
     figure's — no two successive elements share an axis (§4). */
  const labelIndent = leftward ? "ml-10" : "ml-3";

  if (!hasImage) {
    /* What came back is a line they wrote. It is the page. */
    return (
      <div className="pt-2">
        <p className={`type-quote text-mute ${labelIndent}`}>{label}</p>
        {caption !== undefined && (
          <p
            className={`${handClass(photo.authorMemberId, "large")} mt-9 ${
              leftward ? "ml-2 mr-10" : "ml-8 mr-3"
            } leading-snug text-ink`}
          >
            {caption}
          </p>
        )}
        <div className={`mt-10 ${leftward ? "ml-12" : "ml-6"}`}>
          <Stamp leftAt={photo.createdAt} authorSlug={authorSlug} />
        </div>
      </div>
    );
  }

  const alt = caption ?? `A photograph from ${author.displayName}`;

  return (
    <div className="pt-2">
      <p className={`type-quote text-mute ${labelIndent}`}>{label}</p>

      {/* The photograph, mounted. The figure may overhang the sheet
          (a real print overhangs a real page); the sheet never clips.
          Polaroids suppress Mounted's rectangular shadow — their
          frame casts along its own keyed cut. */}
      <div className={`mt-7 ${leftward ? "" : "flex justify-end"}`}>
        <Mounted
          id={photo.id}
          context="book-photo"
          elevation={4}
          className={leftward ? "-ml-2" : "-mr-2"}
          style={{ width: `${widthPct}%`, ...(mount === "torn" ? {} : { boxShadow: "none" }) }}
        >
          {mount === "torn" ? (
            <Torn variant={8}>
              <img
                src={photoSrc(photo)}
                alt={alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="photo block h-auto max-h-[58dvh] w-full object-cover"
              />
            </Torn>
          ) : (
            <Polaroid photo={photo} variant={mount} alt={alt}>
              {caption !== undefined && (
                <p
                  className={`${chinHandClass(photo.authorMemberId)} leading-tight text-ink`}
                  style={{ transform: `rotate(${seededIn(`${photo.id}:c`, -2, 1.2)}deg)` }}
                >
                  {caption}
                </p>
              )}
            </Polaroid>
          )}
        </Mounted>
      </div>

      {/* Caption on the page — only when the mount gave it no chin.
          Their hand, their measure, off the figure's axis. */}
      {caption !== undefined && mount !== "chin" && (
        <p
          className={`${handClass(photo.authorMemberId)} mt-6 ${
            leftward ? "ml-14 mr-4" : "ml-4 mr-16"
          } max-w-[16rem] leading-snug text-ink`}
        >
          {caption}
        </p>
      )}

      {/* The stamp — typeset, absolute, both clocks. Its own distance
          from whatever came before it (§4: varied vertical rhythm). */}
      <div className={`${caption !== undefined && mount !== "chin" ? "mt-7" : "mt-9"} ${leftward ? "ml-5" : "ml-11"}`}>
        <Stamp leftAt={photo.createdAt} authorSlug={authorSlug} />
      </div>
    </div>
  );
}
