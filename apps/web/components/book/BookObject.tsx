"use client";

/* eslint-disable @next/next/no-img-element -- the ribbon is a keyed
   material composite; the optimizer must never re-encode its alpha. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimationEvent, CSSProperties } from "react";

import type { IsoDate } from "@/lib/types";
import type { Return } from "@/lib/resurface";
import { photoSrc } from "@/lib/fixtures/resolve";
import { Spread } from "@/components/spread/Spread";
import {
  BOARD_HEIGHT_PX,
  BOARD_WIDTH_PX,
  BOOK_LEFT_MARGIN_PX,
  BookCover,
  CoverBoard,
  ForeEdge,
  LampShade,
  foreEdgePx,
} from "./BookCover";
import { BookSheet } from "./BookSheet";
import { BookTurnControls, BookTurnStage } from "./BookTurnStage";
import { ResurfacedItem } from "./ResurfacedItem";
import { useBookTurn } from "./useBookTurn";
import type { BookLeaf } from "./leaves";

/**
 * The Book as a usable object — it opens.
 *
 * The founder walked the closed cover and said "you can't open and
 * use the book", and he was right: it rendered as a beautiful object
 * with no way in. This component is the way in, under his explicit
 * ruling: THE BOOK OPENS ON TAP — chosen over dragging the ribbon
 * for discoverability (two users who will never read a tooltip). The
 * tap must still look like an object opening, not a route changing,
 * so the cover SWINGS on the same rigid-leaf mechanism the days rail
 * proved: a hinged plane, hinge at the spine — the board's own left
 * edge, BOOK_LEFT_MARGIN_PX in from the table's edge, on-screen and
 * no longer bled off it (proportion spec §1) — high damping, resting
 * inside the drawer-class duration.
 *
 * Four phases, one object:
 *
 *   closed    The cover on the table (BookCover, unchanged) wrapped
 *             in a real button. Tap anywhere on the book to open.
 *   opening   The flap — the SAME board via CoverBoard — swings from
 *             0° past edge-on to 172°, revealing the page the ribbon
 *             held. Its back face is the endpaper, bone stock. The
 *             page block squares up (−1.6° → 0°) as it is revealed:
 *             you square a book as you open it.
 *   open      Inside. The ribbon's page first — `whatCameBack` is
 *             the live wiring — then the kept days, newest first, on
 *             the same spine-hinged BookTurnStage /book/days shares:
 *             the turn follows the thumb here too, hinged at
 *             BOOK_LEFT_MARGIN_PX with a real back face past
 *             edge-on (turn.ts). The ribbon lies on its page, under
 *             everything mounted: a bookmark,
 *             which is its real job. The fore-edge stays at the
 *             right — an open book still shows the rest of its pages
 *             stacked under your thumb (the anti-counter, in both
 *             poses).
 *   closing   The flap swings back; the block re-tilts to −1.6°; at
 *             rest the closed cover returns.
 *
 * Closing is as available as opening and is never the browser back
 * button: the cloth visible above the pages is tappable ("Close the
 * book"), a quiet caption line sits under the object, and Escape
 * works. Focus follows the object: into the pages on open, back to
 * the cover on close.
 *
 * Reduced motion is FULL removal (the global kill in globals.css):
 * the handlers check the media query and jump straight to the
 * settled phase, because an animationend that will never fire must
 * not be what the state machine waits for. The settled poses are
 * plain CSS, not animation fill state, for the same reason.
 */

interface BookObjectProps {
  /** The page the ribbon held — null on day one (bare paper). */
  returned: Return | null;
  /** The kept days, newest first — the pages you can turn to. */
  leaves: BookLeaf[];
  /** Drives the fore-edge width only. Never rendered as a number. */
  leafCount: number;
  /** The archive's earliest day — the colophon derives from it. */
  begun: IsoDate;
}

type Phase = "closed" | "opening" | "open" | "closing";

/** The gutter — pages curving into the spine at the screen's left
    edge. Static shade on the open page, substrate-level: above the
    stock, below every mounted thing (the lamp precedent). */
const GUTTER: CSSProperties = {
  background:
    "linear-gradient(to right, rgb(41 32 24 / 0.15), rgb(41 32 24 / 0.05) 14px, rgb(41 32 24 / 0) 36px)",
};

export function BookObject({ returned, leaves, leafCount, begun }: BookObjectProps) {
  const [phase, setPhase] = useState<Phase>("closed");
  const insideRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLButtonElement>(null);
  const prevPhase = useRef<Phase>("closed");
  const edge = foreEdgePx(leafCount);
  // +1: the ribbon's own page is leaf zero, ahead of the kept days —
  // called unconditionally (before the closed-phase early return
  // below) because it's a hook; it costs nothing while the book is
  // shut, and phase never controls whether it runs.
  const turn = useBookTurn(leaves.length + 1);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const open = useCallback(() => {
    setPhase((p) => (p === "closed" ? (reduced() ? "open" : "opening") : p));
  }, []);

  const close = useCallback(() => {
    setPhase((p) => (p === "open" ? (reduced() ? "closed" : "closing") : p));
  }, []);

  /* Focus follows the object — into the pages on open, back to the
     cover on close. Guarded by the previous phase so mounting never
     steals focus. */
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = phase;
    if (prev === "closed" && phase !== "closed") {
      insideRef.current?.focus({ preventScroll: true });
    }
    if (prev !== "closed" && phase === "closed") {
      coverRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  /* Escape closes — the keyboard's way back out. */
  useEffect(() => {
    if (phase !== "open") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, close]);

  const onFlapAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === "cover-open" && phase === "opening") setPhase("open");
    if (event.animationName === "cover-close" && phase === "closing") setPhase("closed");
  };

  if (phase === "closed") {
    return (
      <button
        ref={coverRef}
        type="button"
        onClick={open}
        aria-expanded="false"
        aria-label="Open the book"
        className="block w-full cursor-pointer rounded-[3px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
      >
        {/* The held page's photograph and the bone stock start
            fetching while the book is still closed: the pages only
            mount on tap, and a material arriving AFTER its page is
            revealed reads as broken (measured twice: an empty
            polaroid frame 260ms into the swing; a cold open painting
            the composition on bare cloth while the bone PNG's first
            progressive rows were all that had arrived). Every other
            open-pose material is already warm from the closed pose —
            bone is the one the cover never shows. React hoists these
            to <head>. */}
        {returned !== null && returned.photo.width > 0 && (
          <link rel="preload" as="image" href={photoSrc(returned.photo)} />
        )}
        <link rel="preload" as="image" href="/materials/paper-bone-v2.png" />
        <BookCover leafCount={leafCount} begun={begun} />
      </button>
    );
  }

  return (
    <div className="relative [perspective:1400px]">
      {/* ---- The open book ---- */}
      <div
        ref={insideRef}
        tabIndex={-1}
        role="region"
        aria-label="The book, open"
        data-phase={phase}
        className="book-contents outline-none"
      >
        {/* The back board — the open book lies on its own cover.
            Same cloth, same lamp; the pages sit inside its squares.
            Sits on the same real 34px table margin as the closed
            cover and the flap — no bleed to escape any more, so the
            pages wrapper below no longer needs a compensating pl-9.

            THE BOARD IS A LAYER, NOT A WRAPPER. `.under-lamp` used to
            sit on this element, with the pages inside it. A CSS
            `filter` composites its entire subtree and then filters the
            result: every photograph in the open book was dimmed ×0.73
            and sepia'd at night, and no child-side `filter: none` can
            undo that — `.photo` genuinely computed `none`, which is
            why every check that measured the <img> passed. It broke
            the one rule this product treats as absolute: at 11pm the
            brightest thing on the screen is the other one's face.

            So the cloth is now a SIBLING layer beneath the pages
            (Paper.tsx's own precedent, which is why the table never
            had this bug), and the lamp reaches the cloth alone. The
            board's LampShade stays INSIDE that layer so the cloth and
            the shade composite exactly as before — the lamp is not
            retuned, only re-aimed. The box-shadow moves with it, so
            the board's cast shadow still dims with the room.

            Two things stop being dimmed besides the photographs, both
            correctly: the page block's own text (already dim through
            the night token swap — `.under-lamp` on top was the double
            dim globals.css §6 forbids) and the mounted items' contact
            shadows. Both now behave exactly as they do on every other
            paper surface in the product.

            `isolation: isolate` replaces the stacking context the
            filter used to create. Not cosmetic: the turning leaves
            carry z-index 1000+ (useBookTurn.zIndexFor), and without a
            context here they would paint over the flap (z-20) and the
            close affordance (z-30) mid-swing. */}
        <div
          className="relative rounded-[3px]"
          style={{ marginLeft: BOOK_LEFT_MARGIN_PX, isolation: "isolate" }}
        >
          <div
            aria-hidden="true"
            className="under-lamp absolute inset-0 rounded-[inherit] bg-cover bg-center"
            style={{
              backgroundImage: "url(/materials/book-cloth-olive.webp)",
              boxShadow:
                "0 4px 12px rgba(41,32,24,0.18), 0 10px 28px rgba(41,32,24,0.13)",
            }}
          >
            <LampShade />
          </div>

          <div className="relative flex items-stretch pr-1.5">
            {/* The pages — a spine-hinged turn (BookTurnStage.tsx),
                not a scroll-snap carousel: the leaf rotates around
                the fixed hinge at the gutter instead of translating
                across the screen. The vertical padding is headroom
                for the lift before it rotates and shows the cloth
                above and below the page block: the boards' squares. */}
            <BookTurnStage
              className="min-w-0 flex-1 pb-4 pt-3"
              ariaLabel="The pages"
              turn={turn}
              leaves={[
                /* Leaf one: the page the ribbon held. The ribbon lies
                   on it — under everything mounted — because marking
                   this place is its job. */
                <BookSheet
                  key="ribbon"
                  className="h-full"
                  underlay={
                    <>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-10"
                        style={GUTTER}
                      />
                      {/* The bookmark, exactly where the closed pose
                          taught it to be: exiting between the pages
                          at the foot, lower-right. Draped down the
                          page from the head it crossed the caption
                          and the stamp on the Tuesday (text-only)
                          test — text over burgundy is legible in
                          neither direction, and a text page has no
                          figure for the silk to slip under. Down
                          here the lower page is bare on every
                          composition. Mirrored (scaleY) so the
                          asset's twist sits AT the exit — the ribbon
                          folds as it leaves the pages — and its cut
                          end rests on the paper; the drop-shadow
                          offset is negated because the filter is
                          drawn before the flip. */}
                      <img
                        src="/materials/book-ribbon.webp"
                        alt=""
                        aria-hidden="true"
                        width={221}
                        height={1024}
                        className="pointer-events-none absolute h-auto w-[68px]"
                        style={{
                          right: "2%",
                          bottom: -26,
                          transform: "rotate(1.8deg) scaleY(-1)",
                          filter:
                            "drop-shadow(0 -2px 4px rgba(41,32,24,0.30)) brightness(calc(1 - var(--lamp-dim, 0) * var(--lamp-brightness-drop, 0.27))) sepia(calc(var(--lamp-dim, 0) * var(--lamp-sepia-saturation, 0.22)))",
                        }}
                      />
                    </>
                  }
                >
                  {returned !== null ? (
                    <ResurfacedItem returned={returned} />
                  ) : (
                    /* Day one: bare paper. A clear table, not an
                       empty container — no copy, no reserved
                       rectangle. */
                    <div className="h-[42dvh]" aria-hidden="true" />
                  )}
                </BookSheet>,

                /* Then the kept days, newest first — the same leaves
                   /book/days turns, reachable without leaving the
                   object. */
                ...leaves.map((leaf) => (
                  <BookSheet
                    key={leaf.key}
                    className="h-full"
                    underlay={
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-10"
                        style={GUTTER}
                      />
                    }
                  >
                    <Spread
                      day={leaf.day}
                      evaPhoto={leaf.evaPhoto}
                      adamPhoto={leaf.adamPhoto}
                      unsignedPhoto={leaf.unsignedPhoto}
                    />
                  </BookSheet>
                )),
              ]}
            />

            <ForeEdge
              width={edge}
              className="my-[3px] rounded-r-[2px]"
              style={{ boxShadow: "0 3px 10px rgba(41,32,24,0.14)" }}
            />
          </div>
        </div>

        {/* Under the object: the turn controls (the WCAG 2.5.7 path —
            drag turns the page too, but this is the one that doesn't
            need a thumb) and the way out. */}
        <BookTurnControls
          turn={turn}
          footer={
            <button
              type="button"
              onClick={close}
              className="type-caption press py-3.5 pl-1 pr-1 text-mute"
            >
              close the book
            </button>
          }
        />
      </div>

      {/* The cloth above the pages closes the book — tapping the
          object's own edge, with a hit area that reaches onto the
          table. Invisible: the affordance is the cloth itself. */}
      {phase === "open" && (
        <button
          type="button"
          onClick={close}
          aria-label="Close the book"
          className="absolute -top-6 left-0 right-0 z-30 h-12 cursor-pointer rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        />
      )}

      {/* ---- The flap: the front board, swinging on its hinge ----
          Same BOARD_WIDTH_PX × BOARD_HEIGHT_PX rectangle as the closed
          cover, at the same BOOK_LEFT_MARGIN_PX — the board is the
          same board, pixel for pixel, in both poses. `edge` no longer
          sizes the flap (it used to widen the flap to cover the
          fore-edge during the swing); the flap is the board only. */}
      <div
        data-phase={phase}
        onAnimationEnd={onFlapAnimationEnd}
        className={`cover-flap absolute top-0 z-20 ${phase === "open" ? "pointer-events-none" : ""}`}
        style={{
          left: BOOK_LEFT_MARGIN_PX,
          width: BOARD_WIDTH_PX,
          height: BOARD_HEIGHT_PX,
        }}
      >
        {/* Front face: the same board that lay closed. */}
        <CoverBoard
          begun={begun}
          className="absolute inset-0 rounded-[3px] rounded-r-none [backface-visibility:hidden]"
          style={{
            boxShadow:
              "0 4px 12px rgba(41,32,24,0.18), 0 10px 28px rgba(41,32,24,0.13), 7px 0 12px -5px rgba(41,32,24,0.35)",
          }}
        />
        {/* Back face: the endpaper — bone stock glued to the board,
            with the hinge's shade deepening toward the spine. */}
        <div
          aria-hidden="true"
          className="under-lamp absolute inset-0 rounded-[3px] rounded-l-none [backface-visibility:hidden]"
          style={{
            transform: "rotateY(180deg)",
            backgroundImage: "url(/materials/paper-bone-v2.png)",
            backgroundSize: "cover",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background:
                "linear-gradient(to left, rgb(41 32 24 / 0.18), rgb(41 32 24 / 0.04) 22%, rgb(41 32 24 / 0) 45%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
