/**
 * The spine-hinged page turn — pure pose math.
 *
 * The founder: "the pages are not really flipping, it's only like an
 * illusion... make it look like real pages in a book, with the pages
 * dynamic, like when you lift it up." CTO confirmed the diagnosis:
 * the old `.leaf-turn` (globals.css, retired) was a rigid ±24°
 * decoration riding a native horizontal scroll-snap carousel — the
 * leaf TRANSLATED across the screen while tilting a little, never
 * rotated around a fixed hinge, never showed a back face, never
 * crossed edge-on. That is why it read as an illusion instead of
 * paper.
 *
 * This reopens the "scroll-driven, no JS" half of the standing
 * ruling (architecture §8.1 / globals.css's retired §8b comment). A
 * native scroll-snap carousel structurally cannot hold a hinge fixed
 * on screen while a leaf rotates around it — the whole model is
 * leaves translating past a fixed viewport, and a real hinge needs
 * the OPPOSITE: the hinge fixed, the leaves stacked in place, one on
 * top of another. A CSS-only decoupled-scrubber version was tried
 * first (an invisible native-scroll proxy driving `animation-timeline`
 * on absolutely-stacked, visible leaves via `timeline-scope`) and
 * abandoned — see the session file for why. This is the JS
 * pointer-driven fallback the brief allows, reported prominently
 * rather than silently.
 *
 * The RIGID-LEAF half of the ruling still holds (Design-Lead
 * 2026-08-02, globals.css's retired §8b comment): this is a CSS 3D
 * transform on a flat plane, never a WebGL mesh.
 *
 * `progress` is one number per leaf: 0 = flat, facing the reader
 * (its resting "this is the current page" pose); 1 = flat, turned
 * away (its resting "already read, lying under the stack" pose).
 * Whatever drives progress — a dragging thumb, a released settle, a
 * tapped control — a leaf only ever asks "how turned am I", which is
 * what makes the motion a pure, testable function of one number
 * instead of something only a live browser can confirm.
 */

/** Matches `.cover-flap`'s rest angle (globals.css §8c, BookCover's
    swing) — one hinge idiom for the whole object, not a second
    vocabulary for the leaves. "Just short of flat," per that
    precedent's own reasoning: a leaf resting at exactly 180° can
    self-occlude its own front/back seam at some viewing angles;
    172° reads as fully turned without landing on the exact
    degenerate case. */
export const LEAF_TURN_END_DEG = 172;

/** Peak lift, px — rounded up from the retired keyframe's -7px
    (globals.css, retired) for the wider arc this turn now travels. */
const LIFT_PX = 8;

export interface LeafTurnPose {
  /** deg, 0 (facing the reader) → LEAF_TURN_END_DEG (turned away).
      Crosses 90° partway through the arc — the point past which the
      front face's `backface-visibility: hidden` hides it and the
      back face (plain paper) takes over. */
  rotateY: number;
  /** px, negative = lifted off the table. 0 at both rest poses
      (progress 0 and 1) — a page lies flat when it isn't moving. */
  translateY: number;
  /** 0..1 — contact-shadow intensity. Peaks as the leaf lifts off
      the table, per the sheet's-own-shadow precedent (globals.css's
      retired §8b comment: "the sheet's own contact shadow deepens
      as it lifts"). */
  shadow: number;
  /** 0..1 — the hinge-shade + grazing-highlight gradient inside
      BookSheet (`.leaf-sheen`). Peaks edge-on, near-zero at both
      flat rest poses — the same "high when tilted, near-zero when
      flat" shape the retired keyframes used, ported to the wider
      arc. */
  sheen: number;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Zero slope at both ends. This is how "the first pixels of drag
 * lift, not rotate" (globals.css's retired §8b comment, Design-Lead's
 * cheapest, highest-yield detail — "the sheet picks up off the table
 * before it starts to turn") survives without a separate keyframe
 * wedge: smoothstep's own derivative is 0 at p=0, so early progress
 * barely rotates the leaf even while (see `leafTurnPose`) the lift
 * is already moving at its steepest.
 */
function smoothstep(p: number): number {
  return p * p * (3 - 2 * p);
}

export function leafTurnPose(progress: number): LeafTurnPose {
  const p = clamp01(progress);
  // 0 → 1 → 0, steepest exactly at p=0 and p=1 (the derivative of
  // sin(πp) is ±π there): the lift is already moving while rotation
  // is still near-zero (smoothstep's derivative is 0 at the same
  // points), and it eases back down as the leaf settles on the far
  // side — the same wedge the retired keyframes hand-tuned, as one
  // continuous curve instead of two.
  const arc = Math.sin(Math.PI * p);
  return {
    rotateY: LEAF_TURN_END_DEG * smoothstep(p),
    translateY: -LIFT_PX * arc,
    shadow: arc,
    sheen: arc,
  };
}
