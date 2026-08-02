/**
 * What does the iOS picker actually hand a file input?
 *
 * The architecture assumed HEIC and was built so the answer cannot change
 * correctness — `createImageBitmap` decodes whatever arrives. But whether iOS
 * transcodes HEIC to JPEG on the way out depends on the picker path and the
 * device's settings, and it decides whether the 1.4 MB wasm fallback is ever
 * fetched. That is a real difference on a first-run batch over cellular, and
 * it is the kind of thing everyone assumes and nobody measures.
 *
 * So: measure it, once, on Eva's phone and on Adam's, on both the Photos path
 * and the Files path. This module records what came through. It changes no
 * behaviour — reading a probe result to decide anything would reintroduce
 * exactly the assumption it exists to remove.
 */

import type { IsoDateTime } from "@/lib/types";
import { findExifBlock } from "@/lib/photo/exif";

export interface PickerObservation {
  /** MIME the browser reported. Often empty on the Files path. */
  reportedMime: string;
  /** Lower-case extension from the filename, without the dot. */
  extension: string;
  byteLength: number;
  /** What the bytes actually are, by magic number — not by what was claimed. */
  detectedFormat: "heif" | "jpeg" | "png" | "other";
  /** Whether we could find EXIF, which tells us if the capture date survives. */
  carriesExif: boolean;
  /** True when the platform decoder refused and the wasm fallback ran. */
  neededFallbackDecoder: boolean;
  observedAt: IsoDateTime;
}

const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

/** Identify by magic number. The picker's `type` is a claim, not evidence. */
export function detectFormat(bytes: Uint8Array): PickerObservation["detectedFormat"] {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes.length >= 12) {
    const boxType = String.fromCharCode(bytes[4] ?? 0, bytes[5] ?? 0, bytes[6] ?? 0, bytes[7] ?? 0);
    const brand = String.fromCharCode(
      bytes[8] ?? 0,
      bytes[9] ?? 0,
      bytes[10] ?? 0,
      bytes[11] ?? 0,
    );
    if (boxType === "ftyp" && HEIF_BRANDS.has(brand)) return "heif";
  }
  return "other";
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Look at one picked file. Reads the head only; never decodes. */
export async function observePickedFile(
  file: File | Blob,
  neededFallbackDecoder = false,
  nowIso: () => string = () => new Date().toISOString(),
): Promise<PickerObservation> {
  const head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  return {
    reportedMime: file.type || "",
    extension: file instanceof File ? extensionOf(file.name) : "",
    byteLength: file.size,
    detectedFormat: detectFormat(head),
    carriesExif: findExifBlock(head) !== null,
    neededFallbackDecoder,
    observedAt: nowIso(),
  };
}

/**
 * One line per observation, for pasting into the session file.
 *
 * The probe's whole output is a sentence a person reads once and then acts on.
 * It is not telemetry and there is nowhere to send it — there are two devices
 * and one of their owners is running the project.
 */
export function formatObservation(observation: PickerObservation): string {
  const claimed = observation.reportedMime || "(no MIME reported)";
  const ext = observation.extension ? `.${observation.extension}` : "(no extension)";
  const kb = Math.round(observation.byteLength / 1024);
  return [
    `${ext} · claimed ${claimed} · actually ${observation.detectedFormat}`,
    `${kb} KB`,
    observation.carriesExif ? "carries EXIF" : "no EXIF",
    observation.neededFallbackDecoder
      ? "needed the wasm fallback"
      : "decoded natively",
  ].join(" · ");
}

/**
 * Whether the claim and the bytes disagree.
 *
 * Worth surfacing on its own: a file named `.jpg` that is really HEIC is the
 * case where an implementation that trusted the extension would have shipped
 * a broken decode to exactly one of the two people who use this.
 */
export function claimMatchesBytes(observation: PickerObservation): boolean {
  const { reportedMime, detectedFormat, extension } = observation;
  const claimedHeif =
    reportedMime.includes("hei") || extension === "heic" || extension === "heif";
  const claimedJpeg =
    reportedMime.includes("jpeg") || extension === "jpg" || extension === "jpeg";
  if (claimedHeif) return detectedFormat === "heif";
  if (claimedJpeg) return detectedFormat === "jpeg";
  // Nothing was claimed, so nothing disagrees.
  return true;
}
