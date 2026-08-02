/**
 * The order of operations. It is the whole point of this file.
 *
 *   1. The picker hands us a file. Nothing leaves the device.
 *   2. Read `DateTimeOriginal` into a variable. Step 3 destroys it.
 *   3. Decode → canvas → re-encode JPEG. **This step is the EXIF strip**:
 *      the canvas emits no EXIF segment, so GPS never leaves the device.
 *   4. Read the output back and refuse it if any metadata survived.
 *
 * Steps 2 and 3 are in that order for a reason that is easy to reverse by
 * accident: the capture date is the one piece of metadata worth keeping, and
 * after the re-encode there is nothing left to read it from. A photograph from
 * the backlog that dates itself to the evening it was uploaded is filed on the
 * wrong day in the book, forever, and nothing ever surfaces the mistake.
 *
 * Step 4 is here rather than only in the test suite because the regression
 * that leaks GPS is not a bug in the strip — the strip is a platform
 * behaviour and it works. It is somebody adding "the input is already a JPEG,
 * skip the re-encode", which forwards the camera-roll original untouched.
 *
 * One decode at a time. `close()` in a `finally`. A 12 MP HEIC holds tens of
 * megabytes decoded and WKWebView kills the tab well before thirty of them.
 */

import type { ColorSpace, Uuid } from "@/lib/types";
import { sha256Hex } from "@/lib/photo/checksum";
import { readExifSummary } from "@/lib/photo/exif";
import { assertNoMetadata, readJpegDimensions } from "@/lib/photo/guard";
import {
  DISPLAY_SPEC,
  THUMB_SPEC,
  type DecodedImage,
  type ImageCodec,
  type PreparedPhoto,
  type PreparedVariant,
  type VariantSpec,
} from "@/lib/photo/types";

/**
 * How much of the file to read looking for metadata before giving up and
 * reading all of it.
 *
 * Apple writes `meta` and the Exif item near the front, ahead of `mdat`, so
 * this window holds the answer for every file either phone produces. It is a
 * memory optimisation with a correctness backstop, not a heuristic: if the
 * window comes back empty the whole file is read and parsed properly. During a
 * 300-photo batch the difference is a few megabytes of transient allocation
 * per item against tens.
 */
const METADATA_WINDOW_BYTES = 256 * 1024;

export type PrepareStage =
  | "reading-metadata"
  | "decoding"
  | "encoding-display"
  | "encoding-thumb"
  | "verifying";

export interface PrepareOptions {
  /** Stable across retries; names the storage paths and the eventual row. */
  clientUuid: Uuid;
  codec: ImageCodec;
  display?: VariantSpec;
  thumb?: VariantSpec;
  /** Rendering intent to attempt. The codec reports what it was granted. */
  preferredColorSpace?: ColorSpace;
  /** Progress, for the per-item outbox surface. */
  onStage?: (stage: PrepareStage) => void;
  /** Set when the platform decoder threw and the wasm fallback ran. */
  usedFallbackDecoder?: boolean;
  /** True when the original is being held back for wifi. */
  originalDeferred?: boolean;
}

/** Longest edge fitted to `longEdge`, never upscaled, never zero. */
export function fitWithin(
  width: number,
  height: number,
  longEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= 0) return { width: 1, height: 1 };
  const scale = Math.min(1, longEdge / longest);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function readMetadata(file: Blob) {
  const head = new Uint8Array(
    await file.slice(0, METADATA_WINDOW_BYTES).arrayBuffer(),
  );
  const fromHead = readExifSummary(head);
  if (fromHead.present) return fromHead;
  if (file.size <= METADATA_WINDOW_BYTES) return fromHead;
  return readExifSummary(new Uint8Array(await file.arrayBuffer()));
}

async function encodeVariant(
  codec: ImageCodec,
  image: DecodedImage,
  spec: VariantSpec,
  colorSpace: ColorSpace,
): Promise<{ variant: PreparedVariant; colorSpace: ColorSpace }> {
  const size = fitWithin(image.width, image.height, spec.longEdge);
  const encoded = await codec.encode({
    image,
    width: size.width,
    height: size.height,
    quality: spec.quality,
    colorSpace,
  });

  // Refuse before anything is stored, hashed or queued. An item that fails
  // here goes back to the outbox as "needs retry" like any other — it is never
  // dropped, and it is never uploaded either.
  assertNoMetadata(encoded.bytes);

  // Dimensions as the encoded file declares them, not as we asked. Safari
  // clamps very large canvases silently, at sizes an iPhone can produce.
  const declared = readJpegDimensions(encoded.bytes);

  return {
    colorSpace: encoded.colorSpace,
    variant: {
      variant: spec.variant,
      bytes: encoded.bytes,
      width: declared?.width ?? encoded.width,
      height: declared?.height ?? encoded.height,
      byteLength: encoded.bytes.byteLength,
      checksumSha256: await sha256Hex(encoded.bytes),
    },
  };
}

/**
 * Turn one picked file into the two derivatives that get uploaded.
 *
 * Throws rather than returning a partial result: a half-prepared photograph is
 * not a thing the outbox should be able to hold, and the caller's retry path
 * is the same one it uses for a dropped connection.
 */
export async function preparePhoto(
  file: Blob,
  options: PrepareOptions,
): Promise<PreparedPhoto> {
  const {
    clientUuid,
    codec,
    display = DISPLAY_SPEC,
    thumb = THUMB_SPEC,
    preferredColorSpace = "display-p3",
    onStage,
  } = options;

  /* 2. Metadata first — the next step destroys it. */
  onStage?.("reading-metadata");
  const metadata = await readMetadata(file);

  /* 3. Decode once, encode both variants from it, release it no matter what. */
  onStage?.("decoding");
  const image = await codec.decode(file);

  let displayVariant: PreparedVariant;
  let thumbVariant: PreparedVariant;
  let achievedColorSpace: ColorSpace;
  try {
    onStage?.("encoding-display");
    const encodedDisplay = await encodeVariant(
      codec,
      image,
      display,
      preferredColorSpace,
    );
    displayVariant = encodedDisplay.variant;
    achievedColorSpace = encodedDisplay.colorSpace;

    onStage?.("encoding-thumb");
    const encodedThumb = await encodeVariant(
      codec,
      image,
      thumb,
      preferredColorSpace,
    );
    thumbVariant = encodedThumb.variant;
  } finally {
    // Not conditional, not deferred to the collector. This line is the reason
    // a thirty-item batch survives on a phone.
    image.close();
  }

  onStage?.("verifying");
  return {
    clientUuid,
    display: displayVariant,
    thumb: thumbVariant,
    takenAt: metadata.takenAt,
    takenAtLocal: metadata.takenAtLocal,
    colorSpace: achievedColorSpace,
    sourceHadGps: metadata.hasGps,
    sourceMime: file.type || "application/octet-stream",
    sourceByteLength: file.size,
    usedFallbackDecoder: options.usedFallbackDecoder ?? false,
    originalDeferred: options.originalDeferred ?? false,
  };
}
