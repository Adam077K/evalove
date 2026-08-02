/**
 * The contract between the pipeline and whatever is decoding pixels.
 *
 * `prepare.ts` never touches `createImageBitmap`, `OffscreenCanvas` or
 * `heic2any` directly. It asks an `ImageCodec` for a decoded bitmap and for
 * JPEG bytes, and the browser implementation in `codec.ts` is one
 * implementation of that. This is not indirection for its own sake: it is what
 * lets the ordering — read EXIF, *then* decode, *then* re-encode — be tested
 * as ordering, in Node, without a browser, and lets the tests substitute a
 * codec that deliberately misbehaves to prove the pipeline refuses it.
 */

import type { ColorSpace, IsoDateTime, Sha256Hex, Uuid } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Variants
 * ------------------------------------------------------------------ */

/**
 * `display` is what the book and the spread render. `thumb` is the grid.
 * `original` is the untouched file, uploaded later and only on wifi.
 */
export type PhotoVariant = "display" | "thumb" | "original";

/** Long-edge target and quality, per LDR §5.8's cost table. */
export interface VariantSpec {
  variant: Exclude<PhotoVariant, "original">;
  /** Longest edge in CSS pixels. Never upscales. */
  longEdge: number;
  /** JPEG quality, 0–1. */
  quality: number;
}

/** ~350 KB display, ~30 KB thumb. The numbers the storage budget assumes. */
export const DISPLAY_SPEC: VariantSpec = {
  variant: "display",
  longEdge: 1600,
  quality: 0.82,
};

export const THUMB_SPEC: VariantSpec = {
  variant: "thumb",
  longEdge: 400,
  quality: 0.72,
};

/* ------------------------------------------------------------------ *
 * The codec seam
 * ------------------------------------------------------------------ */

/** A decoded image, plus the handle that has to be released. */
export interface DecodedImage {
  width: number;
  height: number;
  /**
   * Release the decoded pixels.
   *
   * Not optional, and not left to the garbage collector. A 12 MP HEIC holds
   * tens of megabytes decoded; on WKWebView the collector runs too late and
   * the tab is killed before it does. See `prepare.ts`.
   */
  close(): void;
  /** The underlying source the canvas will draw. */
  readonly source: CanvasImageSource;
}

export interface EncodeRequest {
  image: DecodedImage;
  width: number;
  height: number;
  quality: number;
  /** Preferred rendering intent. sRGB is the guaranteed fallback. */
  colorSpace: ColorSpace;
}

export interface EncodeResult {
  bytes: Uint8Array;
  width: number;
  height: number;
  /** Which context the platform actually gave us, not which we asked for. */
  colorSpace: ColorSpace;
}

export interface ImageCodec {
  /**
   * Decode a picked file to pixels.
   *
   * Implementations try the platform decoder first and only then a fallback,
   * because on the devices that matter the platform decoder handles HEIC and
   * the fallback is 1.4 MB of wasm nobody should download to look at a JPEG.
   */
  decode(file: Blob): Promise<DecodedImage>;
  /** Re-encode to baseline JPEG. This step is the EXIF strip. */
  encode(request: EncodeRequest): Promise<EncodeResult>;
}

/* ------------------------------------------------------------------ *
 * The output
 * ------------------------------------------------------------------ */

export interface PreparedVariant {
  variant: Exclude<PhotoVariant, "original">;
  bytes: Uint8Array;
  width: number;
  height: number;
  byteLength: number;
  checksumSha256: Sha256Hex;
}

export interface PreparedPhoto {
  /** Stable across retries. Names the storage paths and the eventual row. */
  clientUuid: Uuid;
  display: PreparedVariant;
  thumb: PreparedVariant;
  /** From EXIF, read before the strip. Absent when the file carried none. */
  takenAt?: IsoDateTime;
  /** The literal EXIF local timestamp, kept for diagnostics. */
  takenAtLocal?: string;
  /** Rendering intent actually achieved on this device. */
  colorSpace: ColorSpace;
  /**
   * True when the source carried GPS. Recorded because "we stripped a
   * coordinate" is a different, stronger statement than "there was nothing to
   * strip", and only the first one is evidence the pipeline works.
   */
  sourceHadGps: boolean;
  /** MIME the picker actually handed us, for the format probe. */
  sourceMime: string;
  sourceByteLength: number;
  /** True when the platform decoder threw and the wasm fallback ran. */
  usedFallbackDecoder: boolean;
  /** True when the original is still on the device, awaiting wifi. */
  originalDeferred: boolean;
}
