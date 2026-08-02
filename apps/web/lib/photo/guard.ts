/**
 * The last thing that looks at the bytes before they are allowed onto a wire.
 *
 * `photos.exif_stripped` defaults to `true` in the schema. That column is a
 * claim, and a claim nothing checks is a comment with a data type. This module
 * is what turns it into a fact: every blob the pipeline produces is walked,
 * segment by segment, and if anything metadata-bearing survived the re-encode
 * the upload does not happen.
 *
 * It exists as a runtime guard rather than only as a test because the failure
 * it prevents is not a code failure. The canvas re-encode genuinely emits no
 * EXIF; the way GPS reaches the server is somebody adding a fast path —
 * "it's already a JPEG, skip the re-encode" — which is a reasonable-sounding
 * optimisation that quietly forwards the camera-roll original with the home
 * address still in it. A test can only catch that on the day someone runs it.
 * A guard catches it on the device, before the PUT.
 *
 * The bias is deliberate and one-directional. A false positive costs one
 * upload and shows a message she can act on. A false negative publishes two
 * people's home addresses. Every ambiguous case here resolves toward refusing.
 */

import { readJpegSegments } from "@/lib/photo/exif";

/* ------------------------------------------------------------------ *
 * What we look for
 * ------------------------------------------------------------------ */

export type MetadataKind =
  | "not-a-jpeg"
  | "app1-exif"
  | "app1-xmp"
  | "app13-iptc"
  | "exif-magic-bytes"
  | "tiff-header";

export interface MetadataEvidence {
  kind: MetadataKind;
  /** Byte offset the evidence was found at. */
  at: number;
  /** Plain-language description, safe to show a person. */
  detail: string;
}

/**
 * Raised when a blob about to be uploaded still carries metadata.
 *
 * Named for what happened, not for who is at fault. It surfaces as "this
 * photograph didn't go through" with a retry, like everything else in the
 * outbox — the person did nothing wrong and there is nothing for them to fix.
 */
export class MetadataPresentError extends Error {
  readonly evidence: MetadataEvidence[];

  constructor(evidence: MetadataEvidence[]) {
    super(
      `The processed image still carries metadata (${evidence
        .map((e) => e.kind)
        .join(", ")}); it was not uploaded.`,
    );
    this.name = "MetadataPresentError";
    this.evidence = evidence;
  }
}

const EXIF_MAGIC = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const;
const XMP_NAMESPACE = "http://ns.adobe.com/xap/1.0/";

function startsWith(
  bytes: Uint8Array,
  at: number,
  signature: readonly number[],
): boolean {
  if (at + signature.length > bytes.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[at + i] !== signature[i]) return false;
  }
  return true;
}

function asciiAt(bytes: Uint8Array, at: number, length: number): string {
  let out = "";
  const end = Math.min(at + length, bytes.length);
  for (let i = at; i < end; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/** A TIFF header — the thing every EXIF payload begins with. */
function isTiffHeader(bytes: Uint8Array, at: number): boolean {
  if (at + 4 > bytes.length) return false;
  const [a, b, c, d] = [bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]];
  return (
    (a === 0x49 && b === 0x49 && c === 0x2a && d === 0x00) ||
    (a === 0x4d && b === 0x4d && c === 0x00 && d === 0x2a)
  );
}

/* ------------------------------------------------------------------ *
 * The scan
 * ------------------------------------------------------------------ */

/**
 * Every reason to refuse these bytes. Empty means clean.
 *
 * Two passes, and both are needed. The segment walk is the correct, structural
 * check — it is how a decoder would read the file, so it catches anything a
 * decoder would honour. The raw scan afterwards is the paranoid one: it finds
 * an EXIF payload smuggled somewhere a segment walk would skip, such as inside
 * a comment, past EOI, or in a container we did not anticipate. The raw scan
 * alone would be superstition; the segment walk alone would trust our own
 * parser to be complete. Together they do not share a failure mode.
 */
export function findMetadataEvidence(bytes: Uint8Array): MetadataEvidence[] {
  const evidence: MetadataEvidence[] = [];

  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    evidence.push({
      kind: "not-a-jpeg",
      at: 0,
      detail:
        "These bytes are not a JPEG. Only re-encoded JPEG derivatives are ever uploaded.",
    });
    return evidence;
  }

  for (const segment of readJpegSegments(bytes)) {
    if (segment.marker === 0xe1) {
      if (startsWith(bytes, segment.bodyStart, EXIF_MAGIC)) {
        evidence.push({
          kind: "app1-exif",
          at: segment.start,
          detail: "An APP1 EXIF segment survived the re-encode.",
        });
      } else if (
        asciiAt(bytes, segment.bodyStart, XMP_NAMESPACE.length) === XMP_NAMESPACE
      ) {
        evidence.push({
          kind: "app1-xmp",
          at: segment.start,
          detail:
            "An APP1 XMP packet survived the re-encode. XMP can carry a location.",
        });
      }
    }
    if (segment.marker === 0xed) {
      evidence.push({
        kind: "app13-iptc",
        at: segment.start,
        detail:
          "An APP13 segment survived the re-encode. IPTC records can carry a location.",
      });
    }
  }

  // The paranoid pass. `Exif\0\0` is six specific bytes; entropy-coded scan
  // data reproduces them by chance roughly once in 2.8e14 positions, so a hit
  // in a 350 KB file is not a coincidence worth designing around.
  for (let i = 0; i + EXIF_MAGIC.length <= bytes.length; i++) {
    if (!startsWith(bytes, i, EXIF_MAGIC)) continue;
    evidence.push({
      kind: "exif-magic-bytes",
      at: i,
      detail: "The bytes `Exif\\0\\0` appear in the output.",
    });
    if (isTiffHeader(bytes, i + EXIF_MAGIC.length)) {
      evidence.push({
        kind: "tiff-header",
        at: i + EXIF_MAGIC.length,
        detail: "A TIFF header follows them — this is a real EXIF payload.",
      });
    }
    break;
  }

  return evidence;
}

/** Convenience: is this blob clean? */
export function isFreeOfMetadata(bytes: Uint8Array): boolean {
  return findMetadataEvidence(bytes).length === 0;
}

/**
 * Refuse to continue if the bytes carry metadata.
 *
 * Called by `prepare.ts` on every derivative, on the device, before the outbox
 * ever hands anything to the network.
 */
export function assertNoMetadata(bytes: Uint8Array): void {
  const evidence = findMetadataEvidence(bytes);
  if (evidence.length > 0) throw new MetadataPresentError(evidence);
}

/* ------------------------------------------------------------------ *
 * Dimensions, read back from the encoded output
 * ------------------------------------------------------------------ */

/**
 * Width and height as the *encoded file* declares them, from SOF.
 *
 * Read back from the output rather than carried forward from the canvas, so
 * the numbers written to `photos.width` / `photos.height` describe the bytes
 * that were actually stored. A canvas that silently clamped to a maximum
 * surface size — which Safari does, at sizes an iPhone can produce — would
 * otherwise be recorded at the size we asked for rather than the size we got.
 */
export function readJpegDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  for (const segment of readJpegSegments(bytes)) {
    const isStartOfFrame =
      segment.marker >= 0xc0 &&
      segment.marker <= 0xcf &&
      segment.marker !== 0xc4 && // DHT
      segment.marker !== 0xc8 && // JPG extension
      segment.marker !== 0xcc; // DAC
    if (!isStartOfFrame) continue;
    const at = segment.bodyStart; // precision(1) height(2) width(2)
    if (at + 5 > bytes.length) return null;
    return {
      height: (bytes[at + 1] << 8) | bytes[at + 2],
      width: (bytes[at + 3] << 8) | bytes[at + 4],
    };
  }
  return null;
}
