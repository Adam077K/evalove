/* eslint-disable @next/next/no-img-element -- see Print.tsx for the rationale */
/**
 * Bare — a photograph with no mount, lying directly on the wood.
 *
 * height:auto — the table never crops a loose photograph.
 * (design-H:213, spec §"second pass / crop decision")
 *
 * Labels are positioned by the caller as separate Furniture elements,
 * not embedded here — furniture attaches to objects via position offset,
 * never to hardcoded coordinates. (spec §T2, but the rule applies to T1's
 * hardcoded layout too: the label is a sibling, not a child.)
 *
 * filter:none is explicit on every img.
 */

import type { CSSProperties } from "react";

interface BareProps {
  src: string;
  alt: string;
  width: number;
  rotation: number;
  left: number;
  top: number;
  zIndex?: number;
  photoKey?: string;
}

export function Bare({
  src,
  alt,
  width,
  rotation,
  left,
  top,
  zIndex = 10,
  photoKey,
}: BareProps) {
  const style: CSSProperties = {
    left,
    top,
    width,
    zIndex,
  };

  return (
    <div
      className="board-obj board-bare board-pickup"
      style={style}
      data-rot={String(rotation)}
      data-photo={photoKey}
    >
      {/* filter:none — this image must never be treated */}
      <img src={src} alt={alt} style={{ filter: "none" }} />
    </div>
  );
}
