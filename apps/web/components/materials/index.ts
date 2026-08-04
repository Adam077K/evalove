/**
 * Material primitives — Wave 0 foundation.
 *
 * Every physical object on the scrapbook surface renders through
 * these primitives. Nothing in Wave 1 (Today rebuild) or Wave 2
 * (The Book) can ship without them.
 *
 * Import order reflects the dependency chain:
 *   Mounted → everything (rotation, mass, settle physics)
 *   Taped / Pinned / Torn → composite wrappers over Mounted content
 *   Seam → where the paper tears into the DECO sky — both modes,
 *          always; place, not time (revised §1)
 */
export { Mounted } from "./Mounted";
export type { MountedProps, MountedContext } from "./Mounted";

export { Taped } from "./Taped";
export type { TapedProps, TapeVariant, TapePlacement } from "./Taped";

export { Pinned } from "./Pinned";
export type { PinnedProps, PinVariant, PinPlacement } from "./Pinned";

export { Torn } from "./Torn";
export type { TornProps } from "./Torn";

export { Seam } from "./Seam";
export type { SeamProps, SeamVariant } from "./Seam";
