/* eslint-disable @next/next/no-img-element -- furniture images are static
   assets loaded on the board surface, same reasoning as Print.tsx */
/**
 * Furniture — tape, pins, pressed stickers, and handwritten labels.
 *
 * Furniture is positioned relative to the surface (absolute coordinates),
 * not relative to the object it holds. In T2, furniture will be positioned
 * relative to the object's own box; for T1 with hardcoded coordinates this
 * is fine, and the coordinates are ported directly from design-H.
 *
 * All filter uses here are drop-shadow only — composites behind the subtree,
 * touches no pixel of an image. (design-H:263, 265)
 *
 * Tape rule: real washi is slightly translucent. It is not allowed to tint
 * a photograph, so the tape is opaque and earns depth from its shadow.
 * (design-H:259) No mix-blend-mode, no opacity on any piece of tape.
 */

import type { CSSProperties } from "react";

/* ── Tape ────────────────────────────────────────────────────────── */

interface TapeProps {
  src: string;
  left: number;
  top: number;
  width: number;
  /** Rotation in degrees (CSS transform rotate). */
  rotation: number;
  zIndex?: number;
}

export function Tape({ src, left, top, width, rotation, zIndex = 30 }: TapeProps) {
  const style: CSSProperties = {
    left,
    top,
    width,
    transform: `rotate(${rotation}deg)`,
    zIndex,
  };
  return (
    <div className="board-tape" style={style}>
      <img src={src} alt="" />
    </div>
  );
}

/* ── Pin ─────────────────────────────────────────────────────────── */

interface PinProps {
  src?: string;
  left: number;
  top: number;
  zIndex?: number;
}

export function Pin({
  src = "/materials/pushpin-brass-v2.webp",
  left,
  top,
  zIndex = 16,
}: PinProps) {
  const style: CSSProperties = { left, top, zIndex };
  return (
    <div className="board-pin" style={style}>
      <img src={src} alt="" />
    </div>
  );
}

/* ── Press (sticker) ─────────────────────────────────────────────── */

interface PressProps {
  src: string;
  left: number;
  top: number;
  width: number;
  rotation: number;
  zIndex?: number;
}

export function Press({ src, left, top, width, rotation, zIndex = 28 }: PressProps) {
  const style: CSSProperties = {
    left,
    top,
    width,
    transform: `rotate(${rotation}deg)`,
    zIndex,
  };
  return (
    <div className="board-press" style={style}>
      <img src={src} alt="" />
    </div>
  );
}

/* ── Label ───────────────────────────────────────────────────────── */

interface LabelProps {
  text: string;
  left: number;
  top: number;
  rotation: number;
  /** When true, uses Eva's ink colour. Default uses Adam's. */
  hers?: boolean;
  zIndex?: number;
}

export function Label({ text, left, top, rotation, hers, zIndex = 28 }: LabelProps) {
  const cls = ["board-label", hers ? "board-hers" : ""].filter(Boolean).join(" ");
  const style: CSSProperties = {
    left,
    top,
    transform: `rotate(${rotation}deg)`,
    zIndex,
  };
  return (
    <span className={cls} style={style}>
      {text}
    </span>
  );
}
