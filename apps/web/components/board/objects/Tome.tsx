/**
 * Tome — the closed hardback book lying on the table.
 *
 * Tapping navigates to /book (T3 concern; for T1 the caller receives
 * onTomeClick and handles it). The element is interactive (role=button,
 * tabIndex=0, keyboard Enter/Space handler).
 *
 * Ported from design-H.html:1195-1200 and the .tome CSS at lines 457-490.
 */

import type { CSSProperties } from "react";

interface TomeProps {
  rotation: number;
  left: number;
  top: number;
  zIndex?: number;
}

export function Tome({ rotation, left, top, zIndex = 10 }: TomeProps) {
  const style: CSSProperties = { left, top, zIndex };

  return (
    <div
      id="board-tome"
      className="board-obj board-tome board-pickup"
      style={style}
      data-rot={String(rotation)}
      role="button"
      tabIndex={0}
      aria-label="Open the book"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      }}
    >
      <div className="board-lid">
        <span className="board-emb">
          The&nbsp;Book
          <small>Nine leaves, so far</small>
        </span>
      </div>
    </div>
  );
}
