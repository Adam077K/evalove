/* eslint-disable @next/next/no-img-element -- board photographs must be raw
   <img> elements so that filter:none applies directly and the lamp test can
   assert it by walking ancestors. next/image wraps in a <span> and changes
   the ancestor chain in ways that make the lamp test structurally unreliable. */
/**
 * Print — a photograph on a paper mount with a chin caption.
 *
 * The mount's paper tooth comes from background-blend-mode on the mount's
 * OWN two background layers. mix-blend-mode is NOT used: a child paints
 * above its parent's background, so background-blend-mode cannot reach the
 * photograph. mix-blend-mode could, so it is absent. (design-H:217)
 *
 * height:auto — the mount draws around the photograph's own aspect ratio.
 * The table never crops a loose photograph. (design-H:213, spec §"second pass")
 *
 * filter:none is explicit on every img — this component is in scope for
 * lamp-never-reaches-a-photograph.test.tsx if it ever adds a surface sweep.
 */

import type { CSSProperties } from "react";

interface PrintProps {
  /** URL of the photograph. Must resolve without auth in development. */
  src: string;
  /** alt text. Use "" (empty string) when adjacent caption text describes it. */
  alt: string;
  /** Width of the mount in pixels (the photograph is 100% of this). */
  width: number;
  /** Rest rotation in degrees, from data-rot in design-H. */
  rotation: number;
  /** Absolute position on the surface. */
  left: number;
  top: number;
  /** z-index within the surface (default 10). */
  zIndex?: number;
  /** Text in the chin below the photograph. */
  caption?: string;
  /** When true, the chin uses Adam's ink colour. */
  captionHis?: boolean;
  /** When true, caption is left-aligned. */
  captionLeft?: boolean;
  /** data-photo key for the deck opener. */
  photoKey?: string;
  /** Additional data- attributes forwarded to the outer div. */
  "data-rot"?: string;
}

export function Print({
  src,
  alt,
  width,
  rotation,
  left,
  top,
  zIndex = 10,
  caption,
  captionHis,
  captionLeft,
  photoKey,
  ...rest
}: PrintProps) {
  const style: CSSProperties = {
    left,
    top,
    width,
    zIndex,
  };

  const chinClass = [
    "board-chin",
    captionHis ? "board-his" : "",
    captionLeft ? "board-left" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="board-obj board-print board-pickup"
      style={style}
      data-rot={String(rotation)}
      data-photo={photoKey}
      {...rest}
    >
      {/* filter:none is mandatory — this image must never be treated */}
      <img src={src} alt={alt} style={{ filter: "none" }} />
      {caption !== undefined && (
        <span className={chinClass}>{caption}</span>
      )}
    </div>
  );
}
