/**
 * Stack — a day pile: one pile per day, as thick as the day was.
 *
 * Thickness formula from design-H:2153:
 *   leaves = min(9, 1 + round((n - 1) * 0.42))
 * "thickness, not a number" — the count is never rendered visibly.
 * It is encoded in the aria-label for screen-reader users.
 *
 * Stack top image is cropped to its cell — this is the one surface
 * where cropping is correct (design-H:747, spec §"second pass" table).
 * Do NOT change to height:auto here.
 *
 * In T1, the thumbSrc is a placeholder (a material asset, never a real
 * photograph). T3 wires real photograph thumbnails.
 *
 * NOTE: The top img uses object-fit:cover and a fixed height, which means
 * filter:none is still the correct value (no lamp treatment on thumbnails
 * either). The photo treatment rule applies to all img elements that carry
 * user photographs.
 */

import type { CSSProperties } from "react";

interface StackProps {
  dayKey: string;
  label: string;
  count: number;
  /** "p" = portrait, "l" = landscape */
  orient: "p" | "l";
  left: number;
  top: number;
  rotation: number;
  zIndex?: number;
  /** URL of the top photograph thumbnail. */
  thumbSrc: string;
}

export function Stack({
  dayKey,
  label,
  count,
  orient,
  left,
  top,
  rotation,
  zIndex = 10,
  thumbSrc,
}: StackProps) {
  // design-H:2153 — verbatim thickness formula
  const leaves = Math.min(9, 1 + Math.round((count - 1) * 0.42));
  // design-H:2154 — width/height from orientation
  const imgW = orient === "l" ? 96 : 76;
  const imgH = orient === "l" ? 74 : 100;
  const mountW = imgW + 12;

  const outerStyle: CSSProperties = {
    left,
    top,
    width: mountW,
    zIndex,
  };

  const pileStyle: CSSProperties = {
    height: imgH + 24 + leaves * 2.2,
  };

  return (
    <div
      className="board-obj board-stack board-pickup"
      style={outerStyle}
      data-rot={String(rotation)}
      data-day={dayKey}
      role="button"
      tabIndex={0}
      aria-label={`${label}, ${count} ${count === 1 ? "photograph" : "photographs"}. Open this day.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      }}
    >
      <div className="board-pile" style={pileStyle}>
        {/* Backing sheets — the edges of prints underneath */}
        {Array.from({ length: leaves }, (_, k) => {
          const layer = leaves - k;
          return (
            <span
              key={layer}
              className="board-sh"
              style={{
                top: layer * 2.2,
                left: layer * 0.7,
                width: imgW,
                height: imgH + 24,
              }}
            />
          );
        })}
        {/* Top print */}
        <div className="board-top" style={{ width: imgW }}>
          {/* Cropped thumbnail — height fixed, object-fit:cover, filter:none */}
          <img
            src={thumbSrc}
            alt={`Photograph, ${label} 2026`}
            style={{ height: imgH, filter: "none" }}
          />
          <span className="board-cap">{label}</span>
        </div>
      </div>
    </div>
  );
}
