import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  exifTimestampToIso,
  findExifBlock,
  readExifSummary,
  readJpegSegments,
} from "@/lib/photo/exif";

const FIXTURE = fileURLToPath(
  new URL("../__fixtures__/iphone-gps.heic", import.meta.url),
);

async function fixtureBytes(): Promise<Uint8Array> {
  return new Uint8Array(await readFile(FIXTURE));
}

/**
 * These assertions are about the *input*, and they are load-bearing.
 *
 * The EXIF-strip test proves GPS is absent from the output. That proof is
 * worth nothing unless something independently proves GPS was present in the
 * input — otherwise the strip test passes just as green against a blank file,
 * a JPEG, or a fixture that quietly lost its metadata in a future `git lfs`
 * migration. This file is the "before" half of the argument.
 */
describe("the fixture is a real GPS-tagged iPhone HEIC", () => {
  it("parses as HEIF, not by scanning for the ASCII bytes `Exif`", async () => {
    const block = findExifBlock(await fixtureBytes());
    expect(block).not.toBeNull();
    expect(block?.container).toBe("heif");
    // Located by walking ftyp → meta → iinf → iloc, so a filename containing
    // "Exif" could not have produced this.
    expect(block?.tiffStart).toBeGreaterThan(0);
  });

  it("carries a populated GPS IFD", async () => {
    const summary = readExifSummary(await fixtureBytes());
    expect(summary.present).toBe(true);
    expect(summary.ifds).toEqual(["IFD0", "ExifIFD", "GPS"]);
    expect(summary.hasGps).toBe(true);
    // The full Apple set: refs, coordinates, altitude, timestamp, speed,
    // bearings, datestamp, positioning error.
    expect(summary.gpsTags.length).toBeGreaterThanOrEqual(15);
    expect(summary.gpsTags).toContain(0x0002); // GPSLatitude
    expect(summary.gpsTags).toContain(0x0004); // GPSLongitude
  });

  it("reads the synthetic sentinel coordinate, not a real place", async () => {
    const { gps } = readExifSummary(await fixtureBytes());
    // 1°2'3" N, 4°5'6" E — see __fixtures__/README.md. The founder's real
    // coordinates were rewritten in place before this file entered git.
    expect(gps?.latitude).toBeCloseTo(1 + 2 / 60 + 3 / 3600, 6);
    expect(gps?.longitude).toBeCloseTo(4 + 5 / 60 + 6 / 3600, 6);
  });

  it("reads DateTimeOriginal, which the re-encode is about to destroy", async () => {
    const summary = readExifSummary(await fixtureBytes());
    expect(summary.takenAtLocal).toBe("2026:05:09 18:34:05");
    expect(summary.utcOffset).toBe("+03:00");
    expect(summary.takenAt).toBe("2026-05-09T15:34:05Z");
  });
});

describe("exifTimestampToIso", () => {
  it("applies the recorded offset rather than the device's zone", () => {
    expect(exifTimestampToIso("2026:05:09 18:34:05", "+03:00")).toBe(
      "2026-05-09T15:34:05Z",
    );
    expect(exifTimestampToIso("2026:01:01 00:30:00", "-05:00")).toBe(
      "2026-01-01T05:30:00Z",
    );
  });

  it("returns nothing when there is no offset to apply", () => {
    // A backlog photograph taken in the other country and uploaded from this
    // one: assuming the uploader's zone would file it on the wrong day.
    expect(exifTimestampToIso("2026:05:09 18:34:05")).toBeUndefined();
  });

  it("returns nothing for a timestamp it cannot parse", () => {
    expect(exifTimestampToIso("", "+03:00")).toBeUndefined();
    expect(exifTimestampToIso("not a date", "+03:00")).toBeUndefined();
    expect(exifTimestampToIso("2026:13:45 99:99:99", "+03:00")).toBeUndefined();
  });
});

describe("readExifSummary on files with nothing to read", () => {
  it("reports absence rather than throwing", () => {
    expect(readExifSummary(new Uint8Array(0)).present).toBe(false);
    expect(readExifSummary(new Uint8Array([0xff, 0xd8, 0xff, 0xd9])).present).toBe(
      false,
    );
    expect(readExifSummary(new Uint8Array(64)).present).toBe(false);
  });

  it("survives a truncated HEIC without hanging or throwing", async () => {
    const bytes = (await fixtureBytes()).slice(0, 900);
    expect(() => readExifSummary(bytes)).not.toThrow();
  });
});

describe("readJpegSegments", () => {
  it("stops at the start of scan data", () => {
    // SOI, APP0/JFIF, SOS, then bytes that would look like markers if we kept
    // walking past the scan.
    const jpeg = new Uint8Array([
      0xff, 0xd8, // SOI
      0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, // APP0, length 4
      0xff, 0xda, 0x00, 0x02, // SOS, length 2
      0xff, 0xe1, 0xff, 0xe1, // entropy data that mimics APP1
    ]);
    const markers = readJpegSegments(jpeg).map((s) => s.marker);
    expect(markers).toEqual([0xe0, 0xda]);
  });

  it("returns nothing for bytes that are not a JPEG", () => {
    expect(readJpegSegments(new Uint8Array([0x00, 0x01, 0x02, 0x03]))).toEqual([]);
  });
});
