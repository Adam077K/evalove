/**
 * Reading EXIF out of what the iOS picker hands us — HEIC or JPEG.
 *
 * Two jobs, and they pull in opposite directions.
 *
 * The first is to rescue `DateTimeOriginal` before the canvas re-encode
 * destroys it. That is the only thing in the metadata worth keeping: a photo
 * from the backlog is meaningless in the book if it dates itself to the
 * evening it was uploaded rather than the afternoon it was taken.
 *
 * The second is to *prove GPS was there*, so the strip test can prove it left.
 * A test asserting "no GPS in the output" is worth nothing unless something
 * also asserts there was GPS in the input; otherwise it passes just as green
 * against an empty file. That is why this module parses the container properly
 * — ISOBMFF boxes, `iinf` item types, `iloc` extents, the TIFF IFD chain —
 * instead of scanning for the ASCII bytes `Exif`. A magic-string scan can be
 * fooled by a filename, and the one moment we would need it to be right is the
 * moment somebody's home address is in the file.
 *
 * Nothing here mutates. Stripping is not done by understanding the metadata
 * and removing it; it is done by re-encoding pixels and never writing any
 * (see `prepare.ts`). This module only ever reads.
 */

import type { IsoDateTime } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * The located Exif block
 * ------------------------------------------------------------------ */

export interface ExifBlock {
  /** The whole file. */
  bytes: Uint8Array;
  /** Absolute offset of the TIFF header (`II*\0` or `MM\0*`). */
  tiffStart: number;
  /** True when the TIFF header says little-endian. */
  littleEndian: boolean;
  /** How the block was located, for diagnostics and for the probe log. */
  container: "heif" | "jpeg";
}

export interface GpsFix {
  /** Signed decimal degrees, south negative. */
  latitude: number;
  /** Signed decimal degrees, west negative. */
  longitude: number;
}

export interface ExifSummary {
  /** Whether any Exif block was found at all. */
  present: boolean;
  /**
   * Capture instant in UTC, when the file carried enough to place it on the
   * timeline. Absent when `DateTimeOriginal` is missing — and absent, not
   * guessed, because a wrong capture date silently mis-files a photograph in
   * the book and nothing ever surfaces the mistake.
   */
  takenAt?: IsoDateTime;
  /** The literal EXIF string, unconverted: `2026:05:09 18:34:05`. */
  takenAtLocal?: string;
  /** `OffsetTimeOriginal`, e.g. `+03:00`. Absent on older files. */
  utcOffset?: string;
  /** True when a GPS IFD exists and carries a usable coordinate pair. */
  hasGps: boolean;
  /** The coordinate itself. Read only so tests can prove it was there. */
  gps?: GpsFix;
  /** Every IFD present, by name. Diagnostic; used by the fixture assertions. */
  ifds: string[];
  /** Tag ids seen in the GPS IFD. Diagnostic. */
  gpsTags: number[];
}

/* ------------------------------------------------------------------ *
 * TIFF tag ids we care about
 * ------------------------------------------------------------------ */

const TAG_EXIF_IFD_POINTER = 0x8769;
const TAG_GPS_IFD_POINTER = 0x8825;
const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TAG_OFFSET_TIME_ORIGINAL = 0x9011;
const TAG_DATE_TIME = 0x0132;

const GPS_LATITUDE_REF = 0x0001;
const GPS_LATITUDE = 0x0002;
const GPS_LONGITUDE_REF = 0x0003;
const GPS_LONGITUDE = 0x0004;

/** Byte width of each TIFF field type, indexed by the type code. 0 = unknown. */
const TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8] as const;

/* ------------------------------------------------------------------ *
 * ISOBMFF — enough of it to find one item
 * ------------------------------------------------------------------ */

interface Box {
  type: string;
  /** First byte of the box, including its header. */
  start: number;
  /** First byte after the box. */
  end: number;
  /** First byte of the payload. */
  bodyStart: number;
}

function fourCc(v: DataView, at: number): string {
  return String.fromCharCode(
    v.getUint8(at),
    v.getUint8(at + 1),
    v.getUint8(at + 2),
    v.getUint8(at + 3),
  );
}

/**
 * Walk one level of boxes between `start` and `end`.
 *
 * Handles the two size encodings that occur in practice: a 32-bit size, and
 * `size === 1` meaning a 64-bit `largesize` follows the type. `size === 0`
 * ("to end of file") is honoured rather than treated as malformed — it is
 * legal, and a parser that throws on legal input is a parser that will one day
 * reject a photograph for no reason the person can act on.
 */
function readBoxes(v: DataView, start: number, end: number): Box[] {
  const boxes: Box[] = [];
  let at = start;
  while (at + 8 <= end) {
    const size32 = v.getUint32(at);
    const type = fourCc(v, at + 4);
    let bodyStart = at + 8;
    let size = size32;
    if (size32 === 1) {
      if (at + 16 > end) break;
      const hi = v.getUint32(at + 8);
      const lo = v.getUint32(at + 12);
      size = hi * 0x100000000 + lo;
      bodyStart = at + 16;
    } else if (size32 === 0) {
      size = end - at;
    }
    if (size < 8 || at + size > end) {
      // Truncated or nonsense length. Stop; report what we have.
      break;
    }
    boxes.push({ type, start: at, end: at + size, bodyStart });
    at += size;
  }
  return boxes;
}

function findBox(boxes: Box[], type: string): Box | undefined {
  return boxes.find((b) => b.type === type);
}

/** Item id of the `Exif` entry in `iinf`, or 0. */
function exifItemIdFromIinf(v: DataView, box: Box): number {
  const version = v.getUint8(box.bodyStart);
  let at = box.bodyStart + 4; // version + flags
  let count: number;
  if (version === 0) {
    count = v.getUint16(at);
    at += 2;
  } else {
    count = v.getUint32(at);
    at += 4;
  }
  const entries = readBoxes(v, at, box.end);
  let seen = 0;
  for (const entry of entries) {
    if (entry.type !== "infe") continue;
    seen++;
    const infeVersion = v.getUint8(entry.bodyStart);
    let p = entry.bodyStart + 4;
    if (infeVersion < 2) continue; // version 0/1 has no item_type
    const itemId = infeVersion === 2 ? v.getUint16(p) : v.getUint32(p);
    p += infeVersion === 2 ? 2 : 4;
    p += 2; // item_protection_index
    const itemType = fourCc(v, p);
    if (itemType === "Exif") return itemId;
    if (seen >= count) break;
  }
  return 0;
}

/** `[offset, length]` of an item's first extent, from `iloc`. */
function extentFromIloc(
  v: DataView,
  box: Box,
  wantedItemId: number,
): [number, number] | null {
  const version = v.getUint8(box.bodyStart);
  let at = box.bodyStart + 4;

  const sizesByte = v.getUint8(at);
  const baseByte = v.getUint8(at + 1);
  at += 2;
  const offsetSize = sizesByte >> 4;
  const lengthSize = sizesByte & 0x0f;
  const baseOffsetSize = baseByte >> 4;
  const indexSize = version === 1 || version === 2 ? baseByte & 0x0f : 0;

  let itemCount: number;
  if (version < 2) {
    itemCount = v.getUint16(at);
    at += 2;
  } else {
    itemCount = v.getUint32(at);
    at += 4;
  }

  const readSized = (p: number, width: number): number => {
    if (width === 0) return 0;
    if (width === 4) return v.getUint32(p);
    if (width === 8) return v.getUint32(p) * 0x100000000 + v.getUint32(p + 4);
    if (width === 2) return v.getUint16(p);
    if (width === 1) return v.getUint8(p);
    return 0;
  };

  for (let i = 0; i < itemCount && at < box.end; i++) {
    const itemId = version < 2 ? v.getUint16(at) : v.getUint32(at);
    at += version < 2 ? 2 : 4;
    if (version === 1 || version === 2) at += 2; // reserved + construction_method
    at += 2; // data_reference_index
    const baseOffset = readSized(at, baseOffsetSize);
    at += baseOffsetSize;
    const extentCount = v.getUint16(at);
    at += 2;
    for (let e = 0; e < extentCount; e++) {
      at += indexSize;
      const extentOffset = readSized(at, offsetSize);
      at += offsetSize;
      const extentLength = readSized(at, lengthSize);
      at += lengthSize;
      if (itemId === wantedItemId && e === 0) {
        return [baseOffset + extentOffset, extentLength];
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Locating the Exif block
 * ------------------------------------------------------------------ */

function tiffEndianAt(v: DataView, at: number): boolean | null {
  if (at + 4 > v.byteLength) return null;
  const a = v.getUint8(at);
  const b = v.getUint8(at + 1);
  const marker = v.getUint16(at + 2, a === 0x49);
  if (a === 0x49 && b === 0x49 && marker === 42) return true;
  if (a === 0x4d && b === 0x4d && marker === 42) return false;
  return null;
}

function findExifInHeif(bytes: Uint8Array, v: DataView): ExifBlock | null {
  const top = readBoxes(v, 0, bytes.length);
  if (!findBox(top, "ftyp")) return null;
  const meta = findBox(top, "meta");
  if (!meta) return null;

  // `meta` is a FullBox: four bytes of version+flags before its children.
  const metaChildren = readBoxes(v, meta.bodyStart + 4, meta.end);
  const iinf = findBox(metaChildren, "iinf");
  const iloc = findBox(metaChildren, "iloc");
  if (!iinf || !iloc) return null;

  const itemId = exifItemIdFromIinf(v, iinf);
  if (!itemId) return null;

  const extent = extentFromIloc(v, iloc, itemId);
  if (!extent) return null;

  const [payloadStart, payloadLength] = extent;
  if (payloadStart + 4 > bytes.length || payloadLength < 8) return null;

  // The Exif item payload opens with a big-endian offset to the TIFF header,
  // measured from the byte after that offset field. Apple writes 6 and follows
  // it with `Exif\0\0`; the spec allows anything, so we honour the field.
  const tiffStart = payloadStart + 4 + v.getUint32(payloadStart);
  const littleEndian = tiffEndianAt(v, tiffStart);
  if (littleEndian === null) return null;

  return { bytes, tiffStart, littleEndian, container: "heif" };
}

const EXIF_APP1_SIGNATURE = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const;

function matchesAt(
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

function findExifInJpeg(bytes: Uint8Array, v: DataView): ExifBlock | null {
  for (const segment of readJpegSegments(bytes)) {
    if (segment.marker !== 0xe1) continue;
    if (!matchesAt(bytes, segment.bodyStart, EXIF_APP1_SIGNATURE)) continue;
    const tiffStart = segment.bodyStart + EXIF_APP1_SIGNATURE.length;
    const littleEndian = tiffEndianAt(v, tiffStart);
    if (littleEndian === null) continue;
    return { bytes, tiffStart, littleEndian, container: "jpeg" };
  }
  return null;
}

/**
 * Locate the Exif block in whatever arrived, or `null`.
 *
 * `null` means "this file carries no EXIF", which is an ordinary outcome — a
 * screenshot, a downloaded image, anything already processed once.
 */
export function findExifBlock(bytes: Uint8Array): ExifBlock | null {
  if (bytes.length < 16) return null;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return findExifInJpeg(bytes, v);
  return findExifInHeif(bytes, v);
}

/* ------------------------------------------------------------------ *
 * JPEG segment walking — shared with the strip guard
 * ------------------------------------------------------------------ */

export interface JpegSegment {
  /** The marker byte after `0xFF`. `0xE1` is APP1. */
  marker: number;
  /** Offset of the `0xFF`. */
  start: number;
  /** First byte of the payload, past the two-byte length. */
  bodyStart: number;
  /** First byte after the payload. */
  bodyEnd: number;
}

/**
 * Walk a JPEG's marker segments from SOI up to the start of scan data.
 *
 * Deliberately stops at SOS: past that point the bytes are entropy-coded and
 * `0xFF` no longer introduces a marker, so continuing would produce phantom
 * segments. Everything metadata-bearing lives before SOS.
 */
export function readJpegSegments(bytes: Uint8Array): JpegSegment[] {
  const segments: JpegSegment[] = [];
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return segments;
  let at = 2;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) {
      at++;
      continue;
    }
    const marker = bytes[at + 1];
    // Padding fill bytes, and the standalone markers that carry no length.
    if (marker === 0xff) {
      at++;
      continue;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
      at += 2;
      continue;
    }
    const length = (bytes[at + 2] << 8) | bytes[at + 3];
    if (length < 2 || at + 2 + length > bytes.length) break;
    segments.push({
      marker,
      start: at,
      bodyStart: at + 4,
      bodyEnd: at + 2 + length,
    });
    if (marker === 0xda) break; // SOS — scan data follows
    at += 2 + length;
  }
  return segments;
}

/* ------------------------------------------------------------------ *
 * TIFF IFD reading
 * ------------------------------------------------------------------ */

interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  /** Offset of the 4-byte value/offset field. */
  fieldStart: number;
}

function readIfd(block: ExifBlock, ifdOffset: number): IfdEntry[] {
  const { bytes, littleEndian } = block;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (ifdOffset + 2 > bytes.length) return [];
  const count = v.getUint16(ifdOffset, littleEndian);
  const entries: IfdEntry[] = [];
  for (let i = 0; i < count; i++) {
    const at = ifdOffset + 2 + i * 12;
    if (at + 12 > bytes.length) break;
    entries.push({
      tag: v.getUint16(at, littleEndian),
      type: v.getUint16(at + 2, littleEndian),
      count: v.getUint32(at + 4, littleEndian),
      fieldStart: at + 8,
    });
  }
  return entries;
}

/** Absolute offset of an entry's data, inlined or pointed to. */
function valueOffset(block: ExifBlock, entry: IfdEntry): number {
  const { bytes, littleEndian, tiffStart } = block;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = (TYPE_SIZE[entry.type] ?? 0) * entry.count;
  if (width <= 4) return entry.fieldStart;
  return tiffStart + v.getUint32(entry.fieldStart, littleEndian);
}

function readAscii(block: ExifBlock, entry: IfdEntry): string {
  const at = valueOffset(block, entry);
  const end = Math.min(at + entry.count, block.bytes.length);
  let out = "";
  for (let i = at; i < end; i++) {
    const c = block.bytes[i];
    if (c === 0) break;
    out += String.fromCharCode(c);
  }
  return out;
}

function readRationals(block: ExifBlock, entry: IfdEntry): number[] {
  const { bytes, littleEndian } = block;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = valueOffset(block, entry);
  const out: number[] = [];
  for (let i = 0; i < entry.count; i++) {
    const p = at + i * 8;
    if (p + 8 > bytes.length) break;
    const numerator = v.getUint32(p, littleEndian);
    const denominator = v.getUint32(p + 4, littleEndian);
    out.push(denominator === 0 ? 0 : numerator / denominator);
  }
  return out;
}

function firstIfdOffset(block: ExifBlock): number {
  const v = new DataView(
    block.bytes.buffer,
    block.bytes.byteOffset,
    block.bytes.byteLength,
  );
  return block.tiffStart + v.getUint32(block.tiffStart + 4, block.littleEndian);
}

function pointerTarget(block: ExifBlock, entry: IfdEntry): number {
  const v = new DataView(
    block.bytes.buffer,
    block.bytes.byteOffset,
    block.bytes.byteLength,
  );
  return block.tiffStart + v.getUint32(entry.fieldStart, block.littleEndian);
}

/* ------------------------------------------------------------------ *
 * The summary
 * ------------------------------------------------------------------ */

const EXIF_TIMESTAMP =
  /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;
const UTC_OFFSET = /^[+-]\d{2}:\d{2}$/;

/**
 * `2026:05:09 18:34:05` plus `+03:00` becomes `2026-05-09T15:34:05Z`.
 *
 * Without an offset the local wall time is all we have, and there is no honest
 * conversion — so we return the local string and no instant, and the caller
 * decides. The alternative, assuming the uploading device's current zone, is
 * wrong for exactly the case this exists to serve: a backlog photograph taken
 * in the other country, uploaded from this one.
 */
export function exifTimestampToIso(
  local: string,
  offset?: string,
): IsoDateTime | undefined {
  const m = EXIF_TIMESTAMP.exec(local.trim());
  if (!m) return undefined;
  const [, year, month, day, hour, minute, second] = m;
  if (!offset || !UTC_OFFSET.test(offset)) return undefined;
  const stamp = `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
  const ms = Date.parse(stamp);
  if (Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function decimalDegrees(parts: number[], ref: string): number | undefined {
  if (parts.length < 3) return undefined;
  const [degrees, minutes, seconds] = parts;
  const magnitude = degrees + minutes / 60 + seconds / 3600;
  if (!Number.isFinite(magnitude)) return undefined;
  const negative = ref === "S" || ref === "W";
  return negative ? -magnitude : magnitude;
}

/** Everything we want to know about a file's metadata, in one pass. */
export function readExifSummary(bytes: Uint8Array): ExifSummary {
  const empty: ExifSummary = { present: false, hasGps: false, ifds: [], gpsTags: [] };
  const block = findExifBlock(bytes);
  if (!block) return empty;

  const ifds = ["IFD0"];
  const ifd0 = readIfd(block, firstIfdOffset(block));
  if (ifd0.length === 0) return { ...empty, present: true };

  let takenAtLocal: string | undefined;
  let utcOffset: string | undefined;
  let gps: GpsFix | undefined;
  let gpsTags: number[] = [];

  for (const entry of ifd0) {
    if (entry.tag === TAG_DATE_TIME && !takenAtLocal) {
      // Weaker than DateTimeOriginal — this is the last-modified stamp — so it
      // is only a floor, overwritten below if the real one exists.
      takenAtLocal = readAscii(block, entry);
    }
    if (entry.tag === TAG_EXIF_IFD_POINTER) {
      ifds.push("ExifIFD");
      for (const sub of readIfd(block, pointerTarget(block, entry))) {
        if (sub.tag === TAG_DATE_TIME_ORIGINAL) takenAtLocal = readAscii(block, sub);
        if (sub.tag === TAG_OFFSET_TIME_ORIGINAL) utcOffset = readAscii(block, sub);
      }
    }
    if (entry.tag === TAG_GPS_IFD_POINTER) {
      ifds.push("GPS");
      const gpsIfd = readIfd(block, pointerTarget(block, entry));
      gpsTags = gpsIfd.map((e) => e.tag);
      let latitude: number | undefined;
      let longitude: number | undefined;
      let latitudeRef = "N";
      let longitudeRef = "E";
      for (const g of gpsIfd) {
        if (g.tag === GPS_LATITUDE_REF) latitudeRef = readAscii(block, g) || "N";
        if (g.tag === GPS_LONGITUDE_REF) longitudeRef = readAscii(block, g) || "E";
        if (g.tag === GPS_LATITUDE) {
          latitude = decimalDegrees(readRationals(block, g), latitudeRef);
        }
        if (g.tag === GPS_LONGITUDE) {
          longitude = decimalDegrees(readRationals(block, g), longitudeRef);
        }
      }
      // The refs can be listed after the values in the IFD, so resolve signs
      // once both halves are known rather than trusting document order.
      if (latitude !== undefined && longitude !== undefined) {
        gps = {
          latitude: latitudeRef === "S" ? -Math.abs(latitude) : Math.abs(latitude),
          longitude: longitudeRef === "W" ? -Math.abs(longitude) : Math.abs(longitude),
        };
      }
    }
  }

  return {
    present: true,
    takenAtLocal: takenAtLocal || undefined,
    utcOffset: utcOffset || undefined,
    takenAt: takenAtLocal ? exifTimestampToIso(takenAtLocal, utcOffset) : undefined,
    hasGps: gps !== undefined,
    gps,
    ifds,
    gpsTags,
  };
}

/**
 * Read the metadata from a picked file, before anything else happens to it.
 *
 * Step 2 of the pipeline, and it has to be step 2 — step 3 destroys the answer.
 */
export async function readExifFromBlob(blob: Blob): Promise<ExifSummary> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return readExifSummary(bytes);
}
