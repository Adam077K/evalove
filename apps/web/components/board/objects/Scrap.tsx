/**
 * Scrap — torn paper lying on the table.
 *
 * Two variants:
 *   - "torn-b"  — torn at the bottom only (the day date scrap)
 *   - "torn-tb" — torn at top and bottom (handwritten notes)
 *
 * Clip-path polygons are verbatim from design-H.html:244-252.
 * They live in board.css as .board-torn-b and .board-torn-tb.
 *
 * filter:drop-shadow is permitted on .board-scrap — drop-shadow
 * composites outside the alpha channel and touches no pixel of the image
 * beneath. The paper itself is not a photograph; the rule is "no filter on
 * any img", and scraps contain no img.
 */

import type { CSSProperties, ReactNode } from "react";

interface ScrapProps {
  /** "torn-b" = torn bottom only; "torn-tb" = torn top and bottom. */
  torn: "torn-b" | "torn-tb";
  rotation: number;
  left: number;
  top: number;
  width: number;
  zIndex?: number;
  /** Inner content: hand-written text, city/clock, etc. */
  children: ReactNode;
  /** Optional explicit padding override for the sheet (e.g. "16px 15px 20px"). */
  sheetPadding?: string;
}

export function Scrap({
  torn,
  rotation,
  left,
  top,
  width,
  zIndex = 10,
  children,
  sheetPadding,
}: ScrapProps) {
  const outerStyle: CSSProperties = {
    left,
    top,
    width,
    zIndex,
  };

  const sheetClass = `board-sheet board-${torn}`;
  const sheetStyle: CSSProperties = sheetPadding ? { padding: sheetPadding } : {};

  return (
    <div
      className="board-obj board-scrap board-pickup"
      style={outerStyle}
      data-rot={String(rotation)}
    >
      <div className={sheetClass} style={sheetStyle}>
        {children}
      </div>
    </div>
  );
}
