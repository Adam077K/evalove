/* eslint-disable @next/next/no-img-element -- content photographs are
   fixture-resolved and under the `.photo` law: no filter, and the
   optimizer must never re-encode them. */

import type { ReactNode } from "react";

import type { Return } from "@/lib/resurface";
import { photoSrc } from "@/lib/fixtures/resolve";
import { Mounted, Torn } from "@/components/materials";
import Stamp, { UnsignedMark } from "@/components/item/Stamp";
import { Polaroid } from "./Polaroid";
import {
  authorshipOf,
  chinHandClass,
  DISPLAY_NAME,
  handClass,
  mountFor,
  seededIn,
  unsignedChinHandClass,
  unsignedHandClass,
} from "./compose";

/** Torn sheet or white stock border — the two paper backings. */
function MountBacking({
  mount,
  children,
}: {
  mount: "torn" | "stock";
  children: ReactNode;
}) {
  if (mount === "torn") return <Torn variant={8}>{children}</Torn>;
  return <div className="bg-surface p-1.5">{children}</div>;
}

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
  const authorship = authorshipOf(photo);
  const hasImage = photo.width > 0 && photo.height > 0;
  const caption = photo.caption;

  /* Seeded composition — stable per item, varied across items. The
     mount comes from the ONE shared pick (compose.mountFor): the same
     photograph wears the same frame on every surface. */
  const mount = mountFor(photo.id);
  const widthPct = Math.round(seededIn(`${photo.id}:w`, 74, 86));
  const leftward = seededIn(`${photo.id}:x`, 0, 1) < 0.5;

  /* The why-label: the app speaking. Its offset never matches the
     figure's — no two successive elements share an axis (§4). */
  const labelIndent = leftward ? "ml-10" : "ml-3";

  /* The mark at the foot of the item — both clocks for a signed photo,
     the bare instant for one nobody signed (see UnsignedMark's own
     header for why the two are not the same shape). */
  const mark = authorship.signed ? (
    <Stamp leftAt={photo.createdAt} authorSlug={authorship.slug} />
  ) : (
    <UnsignedMark leftAt={photo.createdAt} tz={photo.sharedDayTz} />
  );

  if (!hasImage) {
    /* What came back is a line they wrote. It is the page. */
    return (
      <div className="pt-2">
        <p className={`type-quote text-mute ${labelIndent}`}>{label}</p>
        {caption !== undefined && (
          <p
            className={`${
              authorship.signed ? handClass(photo, "large") : unsignedHandClass("large")
            } mt-9 ${
              leftward ? "ml-2 mr-10" : "ml-8 mr-3"
            } leading-snug text-ink`}
          >
            {caption}
          </p>
        )}
        <div className={`mt-10 ${leftward ? "ml-12" : "ml-6"}`}>{mark}</div>
      </div>
    );
  }

  const alt =
    caption ??
    (authorship.signed ? `A photograph from ${DISPLAY_NAME[authorship.slug]}` : "A photograph from that day");

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
          style={{
            width: `${widthPct}%`,
            /* Polaroids cast along their keyed cut, not a rectangle;
               torn and stock mounts genuinely are paper rectangles. */
            ...(mount === "chin" || mount === "square" ? { boxShadow: "none" } : {}),
          }}
        >
          {mount === "torn" || mount === "stock" ? (
            <MountBacking mount={mount}>
              <img
                src={photoSrc(photo)}
                alt={alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="photo block h-auto max-h-[58dvh] w-full object-cover"
              />
            </MountBacking>
          ) : (
            <Polaroid photo={photo} variant={mount} alt={alt}>
              {caption !== undefined && (
                <p
                  className={`${
                    authorship.signed ? chinHandClass(photo) : unsignedChinHandClass()
                  } leading-tight text-ink`}
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
          className={`${
            authorship.signed ? handClass(photo) : unsignedHandClass()
          } mt-6 ${
            leftward ? "ml-14 mr-4" : "ml-4 mr-16"
          } max-w-[16rem] leading-snug text-ink`}
        >
          {caption}
        </p>
      )}

      {/* The mark — typeset, absolute. Its own distance from whatever
          came before it (§4: varied vertical rhythm). */}
      <div className={`${caption !== undefined && mount !== "chin" ? "mt-7" : "mt-9"} ${leftward ? "ml-5" : "ml-11"}`}>
        {mark}
      </div>
    </div>
  );
}
