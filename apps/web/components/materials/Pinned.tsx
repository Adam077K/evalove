import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Pushpin composite wrapper.
 *
 * Drives a pushpin through the top edge of an object, fixing it to the
 * surface. The pin is the real generated asset composited as an <img>.
 *
 * Eva's pushpin is brass — her colour, carried by the object she uses,
 * not by a label. Adam's is cream; the shared pin is matte black. Only
 * the brass pin exists in the keyed set so far; the other two variants
 * render their children with no pin — never a broken img.
 *
 * The keyed asset is trimmed to the pin itself, so the grounding
 * contact shadow is added here as a drop-shadow filter. That is
 * compositing light around a real object, not drawing a material —
 * and it follows the alpha silhouette, which a box-shadow cannot.
 */

export type PinVariant = "eva" | "adam" | "neutral";
export type PinPlacement = "top-left" | "top-center" | "top-right";

export interface PinnedProps {
  /**
   * Eva = brass (pushpin-brass-v2). Adam = cream, neutral = matte
   * black — both pending generation; they render children unpinned.
   */
  variant: PinVariant;
  /** Where the pin pierces the top edge of the child. */
  placement: PinPlacement;
  children: ReactNode;
  className?: string;
}

/** Asset registry. v2 is the accepted brass pin; v1 was rejected. */
const PIN_ASSETS: Partial<Record<PinVariant, string>> = {
  eva: "/materials/pushpin-brass-v2.webp",
  // adam: pending generation
  // neutral: pending generation
};

/**
 * Display size at the source's own aspect (751×1024) — the dome must
 * not squash. Small on purpose: a pin is a fastener, not a subject.
 */
const PIN_WIDTH = 25;
const PIN_HEIGHT = 34;

/**
 * The pin's tip (bottom of the image) lands ~14px inside the child's
 * top edge — piercing the paper, not hovering over it.
 */
const PIN_TOP = -20;

const PIN_X: Record<PinPlacement, CSSProperties> = {
  "top-left": { left: 14 },
  "top-center": { left: "50%", transform: "translateX(-50%)" },
  "top-right": { right: 14 },
};

export function Pinned({ variant, placement, children, className }: PinnedProps) {
  const src = PIN_ASSETS[variant];

  return (
    <div className={cn("relative", className)} style={{ isolation: "isolate" }}>
      {children}
      {src && (
        /* eslint-disable-next-line @next/next/no-img-element -- keyed
           material composite; must keep its own alpha untouched. */
        <img
          src={src}
          alt=""
          aria-hidden="true"
          width={PIN_WIDTH}
          height={PIN_HEIGHT}
          style={{
            position: "absolute",
            top: PIN_TOP,
            width: PIN_WIDTH,
            height: PIN_HEIGHT,
            /* A pin pierces everything it holds — above tape (50). */
            zIndex: 60,
            pointerEvents: "none",
            /* drop-shadow grounds the pin; the brightness/sepia pair
               is `.under-lamp`'s curve — an inline filter would
               override the class, so the lamp rides along here,
               reading the same :root tokens the utility reads. The
               literal fallbacks are last-resort defaults, not a
               second copy of the curve. */
            filter:
              "drop-shadow(0 2px 2px rgba(41, 32, 24, 0.3)) brightness(calc(1 - var(--lamp-dim, 0) * var(--lamp-brightness-drop, 0.27))) sepia(calc(var(--lamp-dim, 0) * var(--lamp-sepia-saturation, 0.22)))",
            transition: "filter var(--dur-3) var(--ease-io)",
            ...PIN_X[placement],
          }}
        />
      )}
    </div>
  );
}
