/**
 * CoupleAtWindow — the Art Deco couple illustration, mounted on paper.
 *
 * The illustration is a static asset in /materials/. It is not user media,
 * no gate touches it, and it ships with T1. (spec §"What cannot be ported yet")
 *
 * Mount rules:
 *   - Hard paper edges — no radial mask, no masked bleed.
 *   - The background artwork asset referenced here is deco-window-interior.webp
 *     from /materials/ (the couple-at-a-window from the design reference).
 *   - No filter on the illustration element; no mix-blend-mode above z-index 10.
 *   (design-H:181-196 documents the removal of radial masks at the founder's instruction)
 *
 * The art element uses background-image (not img) because it is a decorative
 * illustration, not a user photograph. The photo treatment rule applies only
 * to user photographs (img elements carrying personal images). That said,
 * no filter is applied to this element either, consistent with the spirit
 * of the law.
 */

import type { CSSProperties } from "react";

interface CoupleAtWindowProps {
  rotation: number;
  left: number;
  top: number;
  zIndex?: number;
}

export function CoupleAtWindow({
  rotation,
  left,
  top,
  zIndex = 10,
}: CoupleAtWindowProps) {
  const outerStyle: CSSProperties = {
    left,
    top,
    zIndex,
  };

  return (
    <div
      className="board-obj board-couple board-pickup"
      style={outerStyle}
      data-rot={String(rotation)}
    >
      <div className="board-mount">
        {/* Decorative illustration — not a user photograph */}
        <span
          className="board-couple-art"
          role="img"
          aria-label="An Art Deco illustration: two people standing face to face at a tall window, curtains swagged either side, silhouetted against a band of orange sunset over a city of lit towers."
        />
      </div>
    </div>
  );
}
