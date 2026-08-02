/**
 * The client photo pipeline.
 *
 * Order of operations, and it is load-bearing:
 *
 *   1. A photograph is picked from the native iOS picker. Nothing leaves the
 *      device.
 *   2. `readExifFromBlob` reads `DateTimeOriginal` into a variable. Step 3
 *      destroys it.
 *   3. `preparePhoto` decodes → canvas → re-encodes JPEG. **The re-encode IS
 *      the EXIF strip**: the canvas emits no EXIF segment, so GPS never leaves
 *      the device.
 *   4. `assertNoMetadata` parses the output and refuses it if anything
 *      survived, before the outbox can hand it to the network.
 *
 * Then `lib/outbox` takes over: durable first, network second.
 *
 * ---
 *
 * ## Things this pipeline loses, on purpose
 *
 * Stated here so they are not rediscovered later as bugs.
 *
 * **Live Photos become their still.** The picker hands a file input only the
 * still frame; the motion component is not exposed to the web at all. There is
 * no work to do and no way to do it — a Live Photo silently becomes an
 * ordinary photograph, which is the correct and only outcome.
 *
 * **HDR gain maps are gone.** The canvas re-encode drops them, so a photo taken
 * in high dynamic range reads slightly flatter here than in Photos.app. This
 * is a real, visible quality loss and it is accepted: a compatible baseline
 * JPEG is the right artifact for a web app, and the untouched original is
 * preserved and uploaded later.
 *
 * **All other metadata.** Orientation is applied during the decode and then
 * discarded, which is why it must be applied there. Camera make, model, lens,
 * exposure and Apple's MakerNote all go. Only the capture date is rescued.
 *
 * **Colour is best-effort.** Display P3 is attempted and sRGB is the fallback;
 * `PreparedPhoto.colorSpace` records which the device actually granted, not
 * which was asked for.
 */

export { readExifFromBlob, readExifSummary, findExifBlock, exifTimestampToIso } from "@/lib/photo/exif";
export type { ExifSummary, GpsFix, ExifBlock } from "@/lib/photo/exif";

export {
  assertNoMetadata,
  findMetadataEvidence,
  isFreeOfMetadata,
  readJpegDimensions,
  MetadataPresentError,
} from "@/lib/photo/guard";
export type { MetadataEvidence, MetadataKind } from "@/lib/photo/guard";

export { createBrowserCodec, UndecodableImageError } from "@/lib/photo/codec";
export { preparePhoto, fitWithin } from "@/lib/photo/prepare";
export type { PrepareOptions, PrepareStage } from "@/lib/photo/prepare";
export { sha256Hex } from "@/lib/photo/checksum";

export { DISPLAY_SPEC, THUMB_SPEC } from "@/lib/photo/types";
export type {
  ImageCodec,
  DecodedImage,
  PreparedPhoto,
  PreparedVariant,
  PhotoVariant,
  VariantSpec,
} from "@/lib/photo/types";

export {
  readConnection,
  mayUploadOriginals,
  describeConnection,
  NO_BACKGROUND_SYNC_NOTICE,
} from "@/lib/photo/network";
export type { ConnectionVerdict } from "@/lib/photo/network";

export {
  observePickedFile,
  detectFormat,
  formatObservation,
  claimMatchesBytes,
} from "@/lib/photo/probe";
export type { PickerObservation } from "@/lib/photo/probe";
