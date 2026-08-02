/**
 * The one noise layer for the whole app. Fixed, pointer-events none,
 * never inside a scrolling container. SVG feTurbulence, no asset.
 */
export function NoiseLayer() {
  return (
    <svg className="noise-layer" aria-hidden="true" width="100%" height="100%">
      <filter id="ea-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ea-grain)" />
    </svg>
  );
}
