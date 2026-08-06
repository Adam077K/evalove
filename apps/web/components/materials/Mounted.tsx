"use client";

import { CSSProperties, ReactNode, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * The foundation primitive of the scrapbook.
 *
 * Every physical object on the surface — photographs, notes, stickers,
 * tape — renders through this. It manages four things:
 *
 *   1. Seeded rotation. The rotation is deterministic from the item's
 *      stable database ID. Same ID → same rotation, every render, every
 *      session. NEVER seeded from an array index: inserting at position 0
 *      shifts every subsequent index by 1, silently re-rolling the entire
 *      page the first time an item is added — a failure mode invisible to
 *      anyone who looks once and only visible after a write operation.
 *
 *   2. Mass hierarchy. A photograph is heavier than a note; a note heavier
 *      than tape; tape heavier than a sticker. Heavier objects sit on top
 *      and cast a wider contact shadow.
 *
 *   3. Contact shadow. Spreads relative to elevation. Not a Tailwind
 *      shadow-* class — the spread is computed from the mass.
 *
 *   4. Settle state. An item composed in a prior session is pre-settled:
 *      no enter animation. An item placed this session runs the settle
 *      animation. Physics activates on interaction, not on mount.
 *
 * Motion constants carried from the codebase, not re-derived:
 *   Spring (content): stiffness 300, damping 30 — SealedCard.tsx:72.
 *   This is deliberately stiffer than motion's 100/10/1 default.
 *   Paper does not bounce; it makes contact and settles.
 *
 * prefers-reduced-motion: full removal via useReducedMotion(), matching
 * the SealedCard.tsx:124-130 pattern. Not opacity-only — full removal.
 */

/** Rotation range (degrees) per context — design law §4 composition law. */
const ROTATION_RANGE: Record<MountedContext, [number, number]> = {
  "today-hero": [-5, 5],
  "book-photo": [-8, 8],
  note: [-5, 5],
  sticker: [-15, 15],
  tape: [-5, 5],
};

/**
 * Contact shadow spread and opacity per elevation level (1=lightest, 4=heaviest).
 * Exported (additive — no existing behaviour changes) so a caller that must
 * reuse this exact SHADOW[3]→SHADOW[4] step outside a <Mounted> instance
 * — the making-metaphor probe's held-object lift — draws the same values
 * rather than a second, drifting copy.
 */
export const SHADOW: Record<1 | 2 | 3 | 4, string> = {
  1: "0 1px 3px rgba(41,32,24,0.08), 0 2px 6px rgba(41,32,24,0.05)",
  2: "0 2px 6px rgba(41,32,24,0.10), 0 4px 12px rgba(41,32,24,0.07)",
  3: "0 2px 8px rgba(41,32,24,0.12), 0 6px 18px rgba(41,32,24,0.09)",
  4: "0 4px 12px rgba(41,32,24,0.18), 0 8px 24px rgba(41,32,24,0.12)",
};

/** Z-index per elevation: heavier objects sit on top. */
const Z_INDEX: Record<1 | 2 | 3 | 4, number> = { 1: 10, 2: 20, 3: 30, 4: 40 };

/**
 * Contact shadow for alpha-silhouette children (sticker context) —
 * drop-shadow follows the cut edge where box-shadow would draw a
 * rectangle. Single layer: filters cannot stack spreads the way
 * box-shadow does, and a sticker is the lightest thing on the table.
 */
const DROP_SHADOW: Record<1 | 2 | 3 | 4, string> = {
  1: "0 1px 3px rgba(41,32,24,0.22)",
  2: "0 2px 6px rgba(41,32,24,0.26)",
  3: "0 2px 8px rgba(41,32,24,0.3)",
  4: "0 4px 12px rgba(41,32,24,0.34)",
};

export type MountedContext = "today-hero" | "book-photo" | "note" | "sticker" | "tape";

export interface MountedProps {
  /**
   * Stable database ID — the PRNG seed. NEVER an array index.
   * Index-seeding re-rolls the whole page on any insert, and the failure
   * only appears on second look, after a write operation.
   */
  id: string;
  /** Determines rotation range per §4 composition law. */
  context: MountedContext;
  /**
   * Mass hierarchy. 4=photograph (heaviest, sits on top),
   * 3=note/torn paper, 2=washi tape, 1=sticker (lightest).
   * Controls z-index and contact-shadow spread.
   * @default 2
   */
  elevation?: 1 | 2 | 3 | 4;
  /**
   * true = pre-settled, no enter animation (item was placed in a prior
   * session). false = item just placed this session, run the settle
   * animation. Paper does not bounce: high damping, rest inside ~400ms.
   * @default true
   */
  settled?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Mulberry32 — a compact, high-quality 32-bit PRNG.
 * Returns a float in [0, 1). Deterministic from seed.
 * Exported (additive) so a caller drawing its OWN sequence from an item's
 * id — e.g. the making-metaphor probe's seeded settle drift, which needs
 * the identical second draw this file already makes for `drift` but a
 * fixed first value instead of a ROTATION_RANGE draw — can replicate it
 * exactly rather than inventing a second PRNG.
 */
export function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive a deterministic numeric seed from an arbitrary string ID.
 * Uses djb2 — fast, collision-resistant enough for a rotation seed.
 * Exported alongside {@link mulberry32}, same reason.
 */
export function seedFromId(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Map a PRNG value in [0, 1) to a rotation in [min, max].
 * Exported alongside {@link mulberry32}, same reason.
 */
export function toRotation(rand: number, min: number, max: number): number {
  return min + rand * (max - min);
}

/**
 * Spring for the settle animation — measured from SealedCard.tsx:72.
 * Exported (additive) so a caller settling an item OUTSIDE a <Mounted>
 * instance still lands on the identical spring rather than a close guess.
 */
export const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

export function Mounted({
  id,
  context,
  elevation = 2,
  settled = true,
  children,
  className,
  style,
}: MountedProps) {
  const reduced = useReducedMotion();

  const { rotation, drift } = useMemo(() => {
    const [min, max] = ROTATION_RANGE[context];
    const rand = mulberry32(seedFromId(id));
    return {
      rotation: toRotation(rand(), min, max),
      /* Second draw: the small over-rotation a just-placed thing
         settles back from. Seeded like the rotation, so the settle
         is the same settle every time it is watched. */
      drift: toRotation(rand(), -2, 2),
    };
  }, [id, context]);

  const zIndex = Z_INDEX[elevation];

  /* Rotation is NOT in this style object. On the animated path,
     motion/react owns the `transform` property outright — a rotate
     passed via `style.transform` is silently discarded the moment
     y/scale animate. The static path adds it back below; the motion
     path carries it through initial/animate instead.

     Stickers cast their shadow with drop-shadow, not box-shadow: a
     sticker is an alpha silhouette, and a box-shadow behind it draws
     a phantom rectangle on the paper (verified on the bench — the
     sunflower grew a ghost card). drop-shadow follows the die-cut
     edge. Everything else on the table genuinely is a rectangle of
     paper, so the cheaper box-shadow stays correct there. */
  const baseStyle: CSSProperties = {
    ...(context === "sticker"
      ? { filter: `drop-shadow(${DROP_SHADOW[elevation]})` }
      : { boxShadow: SHADOW[elevation] }),
    zIndex,
    position: "relative",
    ...style,
  };

  /* Pre-settled items (settled=true): render immediately at final position.
     No enter animation — the page someone composed yesterday is already
     settled when it opens. Physics activates on interaction, not on mount.

     Reduced motion: full removal, never a degrade — SealedCard.tsx
     pattern, Sonner's shipped behaviour. The item simply is where it
     ends up, at its final rotation.

     Freshly placed items (settled=false): drop in from slightly above,
     a couple of degrees over-rotated, and settle. Paper does not
     bounce — 300/30 rests inside ~400ms. */
  if (settled || reduced) {
    return (
      <div
        className={className}
        style={{ ...baseStyle, transform: `rotate(${rotation}deg)` }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={baseStyle}
      initial={{ opacity: 0, scale: 0.96, y: -8, rotate: rotation + drift }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: rotation }}
      transition={SPRING}
    >
      {children}
    </motion.div>
  );
}
