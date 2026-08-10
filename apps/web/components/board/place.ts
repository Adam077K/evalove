/**
 * place.ts — where things land on the walnut table
 *
 * Pure module. No React, no DOM, no fetch.
 *
 * In:  the day's photographs (up to MAX_LOOSE shown loose) and the archive's
 *      days (each rendered as a pile).
 * Out: for each object, a position, rotation, width, mount kind, attendant
 *      furniture — plus the derived world height.
 *
 * Two rules from the mock (design-H.html):
 *
 *   1. Loose on the wood is for today; every prior day is a stack.
 *      Pile thickness: Math.min(9, 1 + Math.round((n - 1) * 0.42))
 *      Its own comment: "thickness, not a number." Never render a count.
 *
 *   2. Furniture attaches to an object's own box, seeded off that object's
 *      id — never to a coordinate. Otherwise the first photograph in a new
 *      position has its tape floating in mid-air.
 *
 * Extends (does not fork) components/book/compose.ts: seeded / seededIn /
 * seededPick are the PRNG; composition never re-rolls from the same seed.
 */

import { seeded, seededIn, seededPick } from "@/components/book/compose";

// ─── world ────────────────────────────────────────────────────────────────────

/** Fixed world width — the pan budget design-H was tuned against. */
export const WORLD_W = 950;

// ─── zones ────────────────────────────────────────────────────────────────────

// Today's loose photos alternate between two vertical lanes.
//
// Left lane:  x ∈ [44, 400) — never reaches the stacks (which start at x=470)
// Right lane: x ∈ [420, 950) — starts below where stacks end in y
//
// A landscape photograph needs roughly 2.5× the width of a portrait one
// to carry the same presence on the wood (PROBE-4 finding). Both are
// computed from the photo's own aspect ratio, not from a flag.

const LEFT_LANE_X_MIN = 44;
const LEFT_LANE_X_MAX_RIGHT = 400; // right edge must stay left of the stacks

const RIGHT_LANE_X_MIN = 420;

// Maximum placed width — landscape can go wider in the right lane
const PORTRAIT_W_MIN = 140;
const PORTRAIT_W_MAX = 250;
const LANDSCAPE_W_MIN = 280;
const LANDSCAPE_W_LEFT_MAX = 330;  // left lane is narrower
const LANDSCAPE_W_RIGHT_MAX = 480; // right lane has room

// ─── stacks ───────────────────────────────────────────────────────────────────

// Four columns, matching design-H's STACK_AT pattern, extended by row.
// design-H:2145 — hard-coded twelve pairs; we derive from these column positions.
const STACK_COLS: readonly number[] = [470, 588, 700, 812];
const STACKS_PER_ROW = 4;
const STACK_ROW_Y_START = 50;
const STACK_ROW_SPACING = 130; // px between rows

// design-H:2154 — thumbnail dimensions inside a stack
const STACK_IMG_W_LANDSCAPE = 96;
const STACK_IMG_W_PORTRAIT = 76;
const STACK_OUTER_PADDING = 12; // el.style.width = w + 12

// ─── mount geometry ───────────────────────────────────────────────────────────

// A print mount wraps the image with paper padding and a chin (caption bar).
// From design-H CSS (.print / .chin):
const MOUNT_PADDING_V = 18; // 9px top + 9px bottom
const MOUNT_CHIN_H = 33;    // height of the chin element

// A bare photograph gets a label — a small paper tag placed near its foot.
const LABEL_H = 28;

// ─── today ────────────────────────────────────────────────────────────────────

/** Maximum loose photographs on the wood at once. */
export const MAX_LOOSE = 5;

/** Y position where the first today-photo's top sits (below date scrap). */
const LOOSE_START_Y = 220;

// ─── night end ────────────────────────────────────────────────────────────────

// The night end (couple at the window, clocks, invitation) is always present.
// T6 fills this region. T2 derives where it starts.

/** Vertical space T6 requires for its fixed furniture. */
export const NIGHT_END_HEIGHT = 750;

// Bare wood between the last photograph and the night end.
// Below GAP_MIN the objects read as a grid; above GAP_MAX the pan feels broken.
const GAP_MIN = 350; // ≈ 0.4 screens
const GAP_MAX = 800; // ≈ 0.9 screens

// ─── material references ──────────────────────────────────────────────────────

const TAPE_SRCS = [
  "materials/washi-terracotta.webp",
  "materials/washi-ochre-dots.webp",
  "materials/washi-blue-crane.webp",
] as const;

const PIN_SRC = "materials/pushpin-brass-v2.webp";

// ─── public types ─────────────────────────────────────────────────────────────

/**
 * The minimum photo data the placement module needs.
 * `width` and `height` are post-rotation stored dimensions (codec.ts bakes
 * orientation at ingest, guard.ts reads the SOF — callers should trust these
 * dimensions as-is; never re-measure with sips or an EXIF reader).
 */
export interface PhotoInput {
  id: string;
  /** Post-rotation stored width from the photos table. */
  width: number;
  /** Post-rotation stored height from the photos table. */
  height: number;
  /** Caption text, when one was provided at upload. */
  caption?: string | null;
}

/** Archive day, for placement as a stack on the wood. */
export interface ArchiveDayInput {
  /** YYYYMMDD — stable key used for seeding and routing. */
  dayKey: string;
  /** Human label, e.g. "6 August". */
  label: string;
  /** Total photograph count for this day (determines pile thickness). */
  photoCount: number;
  /** Stored width of the top (first) photograph. */
  topPhotoWidth: number;
  /** Stored height of the top (first) photograph. */
  topPhotoHeight: number;
}

export type FurnitureKind = "tape" | "pin" | "label";

/**
 * A piece of furniture (tape, pin, label) expressed as offsets from the
 * host object's top-left corner. Callers convert to world coordinates by
 * adding the host object's (left, top).
 *
 * Furniture is seeded from the host object's id — it stays fixed for the
 * lifetime of the object, across renders, reloads and server/client.
 */
export interface FurnitureItem {
  kind: FurnitureKind;
  /** Offset from host object's left edge (world px). May be negative. */
  dx: number;
  /** Offset from host object's top edge (world px). May be negative. */
  dy: number;
  /** Degrees of rotation (tape only). */
  rotation?: number;
  /** Tape strip width (px). */
  width?: number;
  /** Material file reference (tape or pin). */
  src?: string;
  /** Caption text (label only). */
  text?: string;
}

/** A today-photograph placed loose on the wood. */
export interface PlacedPhoto {
  id: string;
  /** Left edge in world coordinates (px). */
  left: number;
  /** Top edge in world coordinates (px). */
  top: number;
  /** Placed width (px). Image renders at height:auto — never crop. */
  width: number;
  /**
   * Total rendered height of the mount including image, padding, and
   * chin (print) or label (bare). Computed before paint from stored
   * dimensions — zero layout shift.
   */
  paintedHeight: number;
  /** Rotation in degrees. */
  rotation: number;
  /** "print" carries a paper mount with chin; "bare" gets a label tag. */
  mountKind: "print" | "bare";
  /** Tape, pin, label — all positioned relative to this object's own box. */
  furniture: FurnitureItem[];
}

/** An archive day rendered as a pile of photographs. */
export interface PlacedStack {
  dayKey: string;
  label: string;
  /** Left edge in world coordinates (px). */
  left: number;
  /** Top edge in world coordinates (px). */
  top: number;
  /** Outer width of the stack element (image width + padding). */
  width: number;
  rotation: number;
  /**
   * Visual leaf depth — how many shadow slivers stack behind the top.
   * design-H: "thickness, not a number" — never render this as a count.
   */
  thickness: number;
  /** true when the top photograph is landscape. */
  isTopLandscape: boolean;
}

export interface BoardLayout {
  worldWidth: typeof WORLD_W;
  /** Derived height — shrinks when there is less on the table. */
  worldHeight: number;
  /**
   * Y coordinate where the night end begins.
   * T6 places the couple, clocks and invitation starting here.
   */
  nightEndTop: number;
  /** Today's photographs, loose on the wood (up to MAX_LOOSE). */
  photos: PlacedPhoto[];
  /** Archive days, each a pile. */
  stacks: PlacedStack[];
}

// ─── geometry helpers ─────────────────────────────────────────────────────────

/** A minimal axis-aligned bounding box for overlap detection. */
export interface Rect {
  left: number;
  top: number;
  width: number;
  paintedHeight: number;
}

/**
 * Returns true when two objects meaningfully overlap — defined as: the
 * intersection area exceeds 50% of the smaller object's bounding-box area.
 *
 * Why 50% and not "any intersection":
 *   Photographs placed in alternating lanes share y-ranges and may have
 *   small edge-overlaps while remaining visually distinct. A threshold
 *   distinguishes that intentional stagger from a real conflict (two objects
 *   placed at the same position, which produces 100% overlap).
 *
 * This is the assertion the test watches to fail. To confirm it can fail:
 *   1. Force two objects to the same (left, top).
 *   2. hasConflict must return true.
 *   3. Restore the original positions — hasConflict returns false.
 */
export function hasConflict(objects: ReadonlyArray<Rect>): boolean {
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i]!;
      const b = objects[j]!;
      const ix = Math.max(
        0,
        Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left),
      );
      const iy = Math.max(
        0,
        Math.min(a.top + a.paintedHeight, b.top + b.paintedHeight) -
          Math.max(a.top, b.top),
      );
      const area = ix * iy;
      const minArea = Math.min(
        a.width * a.paintedHeight,
        b.width * b.paintedHeight,
      );
      if (minArea > 0 && area > minArea * 0.5) return true;
    }
  }
  return false;
}

// ─── internal helpers ─────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** seededIn with a floor guard — seededIn(id, min, min) = min, not NaN. */
function seedIn(id: string, lo: number, hi: number): number {
  if (hi <= lo) return lo;
  return seededIn(id, lo, hi);
}

function photoIsLandscape(p: { width: number; height: number }): boolean {
  return p.width > p.height;
}

/** Pixel height the image occupies at the given placed width. */
function imageHeightPx(p: PhotoInput, placedW: number): number {
  return Math.round((p.height / p.width) * placedW);
}

/** Full rendered height including mount frame and chin/label. */
function mountedHeightPx(
  p: PhotoInput,
  placedW: number,
  mount: "print" | "bare",
): number {
  const imgH = imageHeightPx(p, placedW);
  return mount === "print"
    ? imgH + MOUNT_PADDING_V + MOUNT_CHIN_H
    : imgH + LABEL_H;
}

/** Placed width for a photo, seeded from its id. */
function computeWidth(p: PhotoInput, lane: "left" | "right"): number {
  if (photoIsLandscape(p)) {
    const max = lane === "left" ? LANDSCAPE_W_LEFT_MAX : LANDSCAPE_W_RIGHT_MAX;
    return Math.round(seedIn(p.id + "~w", LANDSCAPE_W_MIN, max));
  }
  return Math.round(seedIn(p.id + "~w", PORTRAIT_W_MIN, PORTRAIT_W_MAX));
}

/** Left edge x for a photo, constrained to stay within the lane's right bound. */
function computeLeft(p: PhotoInput, placedW: number, lane: "left" | "right"): number {
  if (lane === "left") {
    // right edge must not exceed LEFT_LANE_X_MAX_RIGHT
    const hi = clamp(LEFT_LANE_X_MAX_RIGHT - placedW, LEFT_LANE_X_MIN, LEFT_LANE_X_MAX_RIGHT);
    return Math.round(seedIn(p.id + "~x", LEFT_LANE_X_MIN, hi));
  }
  // right edge must not exceed WORLD_W
  const hi = clamp(WORLD_W - placedW, RIGHT_LANE_X_MIN, WORLD_W - 1);
  return Math.round(seedIn(p.id + "~x", RIGHT_LANE_X_MIN, hi));
}

/** Rotation seeded from id; sign alternates by lane index. */
function computeRotation(p: PhotoInput, laneIndex: number): number {
  const sign = laneIndex % 2 === 0 ? 1 : -1;
  const mag = seedIn(p.id + "~r", 1.4, 6.5);
  return Math.round(sign * mag * 10) / 10; // one decimal place
}

// ─── furniture ────────────────────────────────────────────────────────────────

function tapeFurniture(p: PhotoInput, placedW: number): FurnitureItem {
  const sign = seeded(p.id + "~ts") > 0.5 ? 1 : -1;
  return {
    kind: "tape",
    dx: Math.round(seedIn(p.id + "~tdx", placedW * 0.35, placedW * 0.82)),
    dy: Math.round(seedIn(p.id + "~tdy", -10, 18)),
    rotation: Math.round(seedIn(p.id + "~tr", 14, 34) * sign * 10) / 10,
    width: Math.round(seedIn(p.id + "~tw", 70, 108)),
    src: seededPick(p.id + "~tsrc", TAPE_SRCS),
  };
}

function pinFurniture(p: PhotoInput, placedW: number): FurnitureItem {
  return {
    kind: "pin",
    dx: Math.round(seedIn(p.id + "~pdx", placedW * 0.28, placedW * 0.68)) - 8,
    dy: Math.round(seedIn(p.id + "~pdy", -22, 2)),
    src: PIN_SRC,
  };
}

function labelFurniture(p: PhotoInput, placedW: number, imgH: number): FurnitureItem {
  const sign = seeded(p.id + "~lrs") > 0.5 ? 1 : -1;
  return {
    kind: "label",
    dx: Math.round(seedIn(p.id + "~ldx", -6, 4)),
    dy: imgH - Math.round(seedIn(p.id + "~ldy", 14, 26)),
    rotation: Math.round(seedIn(p.id + "~lr", 2, 7) * sign * 10) / 10,
    text: p.caption ?? undefined,
  };
}

function furnitureFor(
  p: PhotoInput,
  mount: "print" | "bare",
  placedW: number,
  imgH: number,
): FurnitureItem[] {
  if (mount === "print") {
    return [tapeFurniture(p, placedW)];
  }
  const items: FurnitureItem[] = [labelFurniture(p, placedW, imgH)];
  // Seeded probability of a pushpin (~60% of bare photos get one)
  if (seeded(p.id + "~pin") > 0.4) {
    items.push(pinFurniture(p, placedW));
  }
  return items;
}

// ─── placement routines ───────────────────────────────────────────────────────

function placeStacksInternal(
  days: ArchiveDayInput[],
): { stacks: PlacedStack[]; bottomY: number } {
  const stacks: PlacedStack[] = days.map((day, i) => {
    const col = i % STACKS_PER_ROW;
    const row = Math.floor(i / STACKS_PER_ROW);
    const land = day.topPhotoWidth > day.topPhotoHeight;
    const imgW = land ? STACK_IMG_W_LANDSCAPE : STACK_IMG_W_PORTRAIT;
    const imgH = land ? 74 : 100; // thumbnail height, from design-H:2155
    const outerW = imgW + STACK_OUTER_PADDING;

    // Extend STACK_COLS beyond 4 columns by repeating the spacing
    const baseX = STACK_COLS[col] ?? STACK_COLS[0]! + col * 118;
    const left = baseX;
    const top = STACK_ROW_Y_START + row * STACK_ROW_SPACING;

    // thickness: design-H:2153, "thickness, not a number"
    const thickness = Math.min(9, 1 + Math.round((day.photoCount - 1) * 0.42));

    // rotation: design-H:2158 pattern, alternating sign
    const rotation = (i % 2 ? 1 : -1) * (1.4 + (i % 4) * 1.1);

    return {
      dayKey: day.dayKey,
      label: day.label,
      left,
      top,
      width: outerW,
      rotation: Math.round(rotation * 10) / 10,
      thickness,
      isTopLandscape: land,
    };
  });

  if (days.length === 0) {
    return { stacks: [], bottomY: STACK_ROW_Y_START };
  }

  const rows = Math.ceil(days.length / STACKS_PER_ROW);
  // Stack element height: imgH + chin (24px, from design-H:2171) + leaf offsets
  const stackH = 100 + 24 + 9 * 2.2; // portrait worst case
  const bottomY = STACK_ROW_Y_START + rows * STACK_ROW_SPACING + Math.ceil(stackH);

  return { stacks, bottomY };
}

function placePhotosInternal(
  photos: PhotoInput[],
  stacksBottomY: number,
): { placed: PlacedPhoto[]; bottomY: number } {
  const limited = photos.slice(0, MAX_LOOSE);

  // Two y cursors — left lane and right lane.
  // Right lane starts below the stacks so right-column photos don't conflict.
  let leftY = LOOSE_START_Y;
  let rightY = Math.max(LOOSE_START_Y, stacksBottomY);

  const placed: PlacedPhoto[] = limited.map((photo, i) => {
    const lane = i % 2 === 0 ? ("left" as const) : ("right" as const);
    const mount = seededPick(photo.id + "~m", ["print", "bare"] as const);
    const w = computeWidth(photo, lane);
    const left = computeLeft(photo, w, lane);
    const rot = computeRotation(photo, i);
    const imgH = imageHeightPx(photo, w);
    const paintH = mountedHeightPx(photo, w, mount);
    const furniture = furnitureFor(photo, mount, w, imgH);

    const top = lane === "left" ? leftY : rightY;
    // Gap before next photo in the same lane
    const gap = Math.round(seedIn(photo.id + "~g", 60, 130));

    if (lane === "left") {
      leftY = top + paintH + gap;
    } else {
      rightY = top + paintH + gap;
    }

    return {
      id: photo.id,
      left,
      top,
      width: w,
      paintedHeight: paintH,
      rotation: rot,
      mountKind: mount,
      furniture,
    };
  });

  return { placed, bottomY: Math.max(leftY, rightY) };
}

// ─── world height ─────────────────────────────────────────────────────────────

/**
 * Derive the world height from content.
 *
 * The gap between the last photograph and the night end is a function of
 * the total painted height of today's photos — not of their count.
 * "Fewer photos → more gap" is clamped between GAP_MIN and GAP_MAX.
 * "The gap is a function of painted height, not of photograph count."
 * (board-port-decomposition, second pass §4.)
 */
function deriveWorldHeight(
  photosBottomY: number,
  stacksBottomY: number,
  photos: PlacedPhoto[],
): { worldHeight: number; nightEndTop: number } {
  const contentBottomY = Math.max(photosBottomY, stacksBottomY);

  // Sum of painted heights for all today-photos
  const sumPaintedH = photos.reduce((s, p) => s + p.paintedHeight, 0);

  // Reference: one screen-height worth of content saturates the gap to minimum
  const ONE_SCREEN = 852;
  const ratio = clamp(sumPaintedH / (ONE_SCREEN * 3), 0, 1);
  const gap = Math.round(GAP_MAX - ratio * (GAP_MAX - GAP_MIN));

  const nightEndTop = contentBottomY + gap;
  const worldHeight = nightEndTop + NIGHT_END_HEIGHT;

  return { worldHeight, nightEndTop };
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Compute the full board layout.
 *
 * Deterministic: the same photograph ids produce the same board across
 * renders, reloads, and the server/client boundary. Composition never re-rolls.
 *
 * @param todayPhotos  Up to MAX_LOOSE are shown loose; the rest are ignored.
 *                     Their width/height must be post-rotation (as stored in
 *                     the photos table — codec.ts bakes orientation at ingest).
 * @param archiveDays  Prior days, each placed as a pile. The order here sets
 *                     the grid order — callers typically pass chronological,
 *                     oldest first.
 */
export function placeBoard(params: {
  todayPhotos: PhotoInput[];
  archiveDays: ArchiveDayInput[];
}): BoardLayout {
  const { todayPhotos, archiveDays } = params;

  const { stacks, bottomY: stacksBottomY } = placeStacksInternal(archiveDays);
  const { placed: photos, bottomY: photosBottomY } = placePhotosInternal(
    todayPhotos,
    stacksBottomY,
  );
  const { worldHeight, nightEndTop } = deriveWorldHeight(
    photosBottomY,
    stacksBottomY,
    photos,
  );

  return {
    worldWidth: WORLD_W,
    worldHeight,
    nightEndTop,
    photos,
    stacks,
  };
}
