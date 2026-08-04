/**
 * The today pair — the opening object on home.
 *
 * Three states, one server component.
 *
 * Both posted:    two photographs, full bleed, 2px gutter (gap-0.5),
 *                 aspect-[3/4] object-cover. Each author's 2px edge on
 *                 their meta line. Below the grid: the newest photo's
 *                 caption in type-quote and the gap stamp.
 *
 * One posted:     the photograph sets the height; the other side is bare
 *                 paper — no fill, no frame, no +, no border-box, no
 *                 dashed ring, no spinner, no elapsed anything. One
 *                 hairline (border-t on a zero-height element) at the base
 *                 of the photo area stops the bare column reading as a
 *                 failed image load. Caption and stamp belong to the one
 *                 that exists.
 *
 * Neither posted: the photograph-shaped space does not exist, because no
 *                 photograph does. Both sides collapse equally to a bare meta line.
 *                 The hairline belongs to the photograph area, so there is none here
 *                 either. No empty box anywhere.
 *
 * Hard rules enforced here:
 *   - No authorship ink (edge-*, dot-*) on the empty side. Nobody made a
 *     clock. globals.css §6: the mark attaches to a thing that exists and
 *     that someone made.
 *   - Server component, always. No useEffect at or above the pair.
 *     LiveLocalTime initialises server-side — never a skeleton.
 *   - The pair does not animate in. An entrance on the thing she opened
 *     for is a delay charged to the product's only arrival.
 *   - Eva's side is first, in the DOM and on screen. Founder rule.
 *   - Photographs are never dimmed, tinted or scrimmed.
 *
 * Exports two components:
 *   TodayPair         — reads from FIXTURE_TODAY. Used on /home.
 *   TodayPairContent  — accepts explicit photos. Used on /today review
 *                       surface to render all three states.
 */

import type { MemberSlug, Photo } from "@/lib/types";
import { EVA, ADAM } from "@/lib/fixtures/members";
import { PHOTOS, postedAtLocal } from "@/lib/fixtures/photos";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { photoSrc } from "@/lib/fixtures/resolve";
import { LiveLocalTime } from "@/components/spread/LiveLocalTime";
import Stamp from "@/components/item/Stamp";

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/**
 * The today pair as rendered on /home.
 * Reads fixture state for FIXTURE_TODAY automatically.
 */
export function TodayPair() {
  const today = SHARED_DAYS.find((d) => d.date === FIXTURE_TODAY);
  const todayPhotos = Object.values(PHOTOS).filter(
    (p) => p.sharedDay === FIXTURE_TODAY && p.kind === "daily",
  );
  const evaPhoto = today?.evaPosted
    ? todayPhotos.find((p) => p.authorMemberId === EVA.id)
    : undefined;
  const adamPhoto = today?.adamPosted
    ? todayPhotos.find((p) => p.authorMemberId === ADAM.id)
    : undefined;

  return <TodayPairContent evaPhoto={evaPhoto} adamPhoto={adamPhoto} />;
}

/**
 * The today pair with explicit photo props.
 * Used by the /today review surface and tests; identical rendering to TodayPair.
 */
export function TodayPairContent({
  evaPhoto,
  adamPhoto,
}: {
  evaPhoto?: Photo;
  adamPhoto?: Photo;
}) {
  /* The photograph-shaped space exists only when at least one side has
     posted. When neither has, hasAny is false and both the photograph
     area and its hairline are absent; both sides collapse to a bare
     meta line and nothing shaped like an absence appears. */
  const hasAny = evaPhoto !== undefined || adamPhoto !== undefined;

  /* Caption and stamp belong to the newest photo. When only one exists
     it is naturally the newest. When neither exists there is nothing. */
  const captionPhoto: Photo | undefined = (() => {
    if (evaPhoto !== undefined && adamPhoto !== undefined) {
      return evaPhoto.createdAt > adamPhoto.createdAt ? evaPhoto : adamPhoto;
    }
    return evaPhoto ?? adamPhoto;
  })();

  return (
    <div role="region" aria-label="Today">
      {/* The pair grid — Eva before Adam, in the DOM and on screen.
          -mx-5 / md:-mx-8 breaks out of the layout's px-5 / md:px-8
          padding so both photographs bleed to the screen edges.

          The layout adds pt-[max(1.5rem,env(safe-area-inset-top))].
          The matching negative margin is gated on hasAny (photographs
          exist). On a no-photograph day the pair is only 30px — two
          clock lines — and unconditionally pulling them behind the
          status-bar inset (up to 59px on device) hides them entirely.
          When hasAny is false the pair sits below the safe-area band,
          exactly as every other element on the page does.

          The caption and stamp below stay at the normal inset. */}
      <div
        className={[
          "grid grid-cols-2 gap-0.5 -mx-5 md:-mx-8",
          hasAny ? "-mt-[max(1.5rem,env(safe-area-inset-top))]" : "",
        ].filter(Boolean).join(" ")}
      >
        <PairColumn memberSlug="eva" photo={evaPhoto} showPhotoArea={hasAny} />
        <PairColumn memberSlug="adam" photo={adamPhoto} showPhotoArea={hasAny} />
      </div>

      {/* Caption and stamp — only when at least one has posted */}
      {captionPhoto !== undefined && <PairCaption photo={captionPhoto} />}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Internals
 * ------------------------------------------------------------------ */

/**
 * One column of the pair.
 *
 * Photograph (if posted) or bare paper — the only difference.
 * Both sides are typographically identical: one type-micro normal-case
 * line, same baseline. The 2px edge attaches only to the posted side.
 */
function PairColumn({
  memberSlug,
  photo,
  showPhotoArea,
}: {
  memberSlug: MemberSlug;
  photo?: Photo;
  showPhotoArea: boolean;
}) {
  const isEva = memberSlug === "eva";
  const displayName = isEva ? "Eva" : "Adam";
  const tz = isEva ? EVA.homeTimezone : ADAM.homeTimezone;
  /* Edge applies only when a photo exists here. Nobody made a clock. */
  const hasPhoto = photo !== undefined;

  return (
    <div>
      {/* Photo area — present only when at least one side has posted.
          Neither posted: the shaped space does not exist.
          One posted, empty side: an aspect-[3/4] div of bare paper —
          no background, no border-box. The canvas is the page itself. */}
      {showPhotoArea && (
        <div className="aspect-[3/4] overflow-hidden">
          {hasPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photoSrc(photo)}
              alt={
                photo.caption ??
                `${displayName}'s photograph from today`
              }
              width={photo.width}
              height={photo.height}
              className="photo h-full w-full object-cover block"
              loading="eager"
            />
          ) : null
          /* Empty side: bare paper. No fill, no frame, no indicator. */
          }
        </div>
      )}

      {/* Hairline at the base of the photograph area.
          Belongs to the image: it stops a bare column reading as a
          failed image load. When neither has posted there is no image
          area and that job does not exist — a rule running bezel to
          bezel with a 2px notch at the gutter IS something shaped like
          an absence, which is exactly what the neither-posted state
          must not show. Gate matches the photo area above it. */}
      {showPhotoArea && (
        <div className="border-t border-line" aria-hidden="true" />
      )}

      {/* Meta line: "Eva · 4:44 am" / "Adam · 6:20 am".
          Posted: time from photo.createdAt in their own zone (static).
          Empty: live local time — server-rendered first, ticks on the
                 client, never a skeleton, never an elapsed counter.
          No authorship ink on the empty side — nobody made a clock.

          mx-5 md:mx-8 restores the 20px horizontal inset so that type
          sits at the same x as every other text run on the surface.
          The grid's -mx-5 md:-mx-8 bleeds the whole column to x=0;
          without the margin, "Eva" starts at x=0 (bezel) and the
          edge-eva mark reads as a screen artifact. The margin positions
          the element's left edge at x=20, so:
            no photo: text at x=20 (matches window sentence, doorway)
            has photo: 2px mark at x=20, text at x=22+pl-2 */}
      <p
        className={[
          "mt-2.5 pb-1 type-micro normal-case text-mute mx-5 md:mx-8",
          hasPhoto ? (isEva ? "edge-eva" : "edge-adam") : "",
          hasPhoto ? "pl-2" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {displayName} ·{" "}
        {hasPhoto ? (
          postedAtLocal(photo)
        ) : (
          <LiveLocalTime tz={tz} />
        )}
      </p>
    </div>
  );
}

/**
 * Caption and stamp — below the pair, when at least one has posted.
 *
 * The newest photo's caption in type-quote, with the author's 2px edge
 * and the gap stamp. Mirrors the book's treatment exactly.
 */
function PairCaption({ photo }: { photo: Photo }) {
  if (!photo.caption) return null;

  const isEva = photo.authorMemberId === EVA.id;
  const authorSlug: MemberSlug = isEva ? "eva" : "adam";
  const edgeClass = isEva ? "edge-eva" : "edge-adam";

  return (
    <div className={`mt-5 pl-3 ${edgeClass}`}>
      <p className="type-quote text-ink">{photo.caption}</p>
      <div className="mt-2">
        <Stamp leftAt={photo.createdAt} authorSlug={authorSlug} />
      </div>
    </div>
  );
}
