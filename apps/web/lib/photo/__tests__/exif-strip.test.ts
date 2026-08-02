/**
 * The assertion the whole task exists for.
 *
 * These are camera-roll originals from two phones, carrying home addresses in
 * two countries. `photos.exif_stripped` defaults to `true` in the schema,
 * which is a claim. This file is what makes it a fact, and it makes it by
 * **parsing the output bytes** — not by observing that a canvas was involved
 * and reasoning that canvases do not write EXIF.
 *
 * The argument runs in four steps, and all four are needed:
 *
 *   1. The input really carries GPS. Proved by walking the real HEIF container
 *      (see `exif.test.ts`, asserted again here so this file stands alone).
 *   2. Our detector really finds Apple GPS when it is there. Proved against a
 *      genuine JPEG built around the fixture's own Exif payload — a negative
 *      control, so a detector that always answers "clean" cannot pass.
 *   3. The pipeline's output contains no APP1/EXIF segment and no GPS IFD.
 *   4. A codec that cheats — one that forwards the source bytes instead of
 *      re-encoding — is caught and refused. This is the realistic regression:
 *      nobody will delete the strip, someone will add "it's already a JPEG,
 *      skip the re-encode".
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { findExifBlock, readExifSummary, readJpegSegments } from "@/lib/photo/exif";
import {
  MetadataPresentError,
  findMetadataEvidence,
  isFreeOfMetadata,
} from "@/lib/photo/guard";
import { preparePhoto } from "@/lib/photo/prepare";
import type { EncodeRequest, ImageCodec } from "@/lib/photo/types";
import { createNodeCodec } from "@/lib/outbox/__tests__/support/doubles";

const FIXTURE = fileURLToPath(
  new URL("../__fixtures__/iphone-gps.heic", import.meta.url),
);

const CLIENT_UUID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

let source: Uint8Array;
let sourceBlob: Blob;

beforeAll(async () => {
  source = new Uint8Array(await readFile(FIXTURE));
  sourceBlob = new Blob([source as BlobPart], { type: "image/heic" });
});

/* ------------------------------------------------------------------ *
 * 1 — there is something to strip
 * ------------------------------------------------------------------ */

describe("the input", () => {
  it("is a real HEIC carrying a real GPS IFD", () => {
    const summary = readExifSummary(source);
    expect(findExifBlock(source)?.container).toBe("heif");
    expect(summary.hasGps).toBe(true);
    expect(summary.gpsTags).toContain(0x0002);
    expect(summary.gpsTags).toContain(0x0004);
    expect(summary.gps).toBeDefined();
    expect(summary.takenAt).toBe("2026-05-09T15:34:05Z");
  });
});

/* ------------------------------------------------------------------ *
 * 2 — the detector is not a rubber stamp
 * ------------------------------------------------------------------ */

/**
 * Wrap the fixture's own Exif payload in a JPEG APP1 segment.
 *
 * The result is a real Exif-bearing JPEG whose metadata came off an iPhone —
 * the exact thing that must never reach the network, in the exact container it
 * would arrive in if the re-encode were skipped.
 */
function jpegCarryingFixtureExif(): Uint8Array {
  const block = findExifBlock(source);
  if (!block) throw new Error("The fixture lost its Exif block.");
  // Everything from the TIFF header to the end of the item; generous, and a
  // superset is fine because we are constructing evidence, not a valid photo.
  const tiff = source.slice(block.tiffStart, block.tiffStart + 8192);
  const payload = new Uint8Array(6 + tiff.length);
  payload.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0); // "Exif\0\0"
  payload.set(tiff, 6);

  const length = payload.length + 2;
  const out = new Uint8Array(2 + 2 + 2 + payload.length + 2);
  let at = 0;
  out.set([0xff, 0xd8], at);
  at += 2;
  out.set([0xff, 0xe1], at);
  at += 2;
  out.set([(length >> 8) & 0xff, length & 0xff], at);
  at += 2;
  out.set(payload, at);
  at += payload.length;
  out.set([0xff, 0xd9], at);
  return out;
}

describe("the detector", () => {
  it("finds Apple's GPS IFD when it is present in a JPEG", () => {
    const carrier = jpegCarryingFixtureExif();

    // The parser reads it as a JPEG APP1 this time, not as HEIF.
    const summary = readExifSummary(carrier);
    expect(findExifBlock(carrier)?.container).toBe("jpeg");
    expect(summary.hasGps).toBe(true);
    expect(summary.gpsTags).toContain(0x0002);

    const evidence = findMetadataEvidence(carrier);
    expect(evidence.map((e) => e.kind)).toContain("app1-exif");
    expect(evidence.map((e) => e.kind)).toContain("tiff-header");
    expect(isFreeOfMetadata(carrier)).toBe(false);
  });

  it("does not cry wolf on clean JPEG bytes", async () => {
    const codec = createNodeCodec();
    const prepared = await preparePhoto(sourceBlob, {
      clientUuid: CLIENT_UUID,
      codec,
    });
    expect(findMetadataEvidence(prepared.display.bytes)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * 3 — the output, parsed
 * ------------------------------------------------------------------ */

describe("the output of the pipeline", () => {
  it("carries no APP1 segment and no GPS IFD", async () => {
    const codec = createNodeCodec();
    const prepared = await preparePhoto(sourceBlob, {
      clientUuid: CLIENT_UUID,
      codec,
    });

    for (const variant of [prepared.display, prepared.thumb]) {
      const bytes = variant.bytes;

      // Parsed, not assumed. Walk the segments and look at every marker.
      const segments = readJpegSegments(bytes);
      expect(segments.length).toBeGreaterThan(0);
      const app1 = segments.filter((s) => s.marker === 0xe1);
      expect(app1).toEqual([]);

      // No Exif block findable by the same parser that found one in the input.
      expect(findExifBlock(bytes)).toBeNull();
      const summary = readExifSummary(bytes);
      expect(summary.present).toBe(false);
      expect(summary.hasGps).toBe(false);
      expect(summary.gps).toBeUndefined();
      expect(summary.gpsTags).toEqual([]);

      // And a raw byte scan, independent of our own container parsing: neither
      // the `Exif\0\0` magic nor a TIFF header appears anywhere in the file.
      expect(indexOfSequence(bytes, [0x45, 0x78, 0x69, 0x66, 0x00, 0x00])).toBe(-1);
      expect(indexOfSequence(bytes, [0x49, 0x49, 0x2a, 0x00])).toBe(-1);
      expect(indexOfSequence(bytes, [0x4d, 0x4d, 0x00, 0x2a])).toBe(-1);

      expect(findMetadataEvidence(bytes)).toEqual([]);
    }
  });

  it("keeps the capture date the strip destroyed", async () => {
    const prepared = await preparePhoto(sourceBlob, {
      clientUuid: CLIENT_UUID,
      codec: createNodeCodec(),
    });
    // Read at step 2, survives step 3, and is the only thing that does.
    expect(prepared.takenAt).toBe("2026-05-09T15:34:05Z");
    expect(prepared.sourceHadGps).toBe(true);
  });

  it("emits different bytes from the source it was given", async () => {
    const prepared = await preparePhoto(sourceBlob, {
      clientUuid: CLIENT_UUID,
      codec: createNodeCodec(),
    });
    expect(prepared.display.byteLength).toBeGreaterThan(0);
    expect(prepared.display.bytes).not.toEqual(source);
    // A JPEG, not the HEIC that came in.
    expect([prepared.display.bytes[0], prepared.display.bytes[1]]).toEqual([
      0xff, 0xd8,
    ]);
  });

  it("releases the decoded bitmap even though two variants were encoded", async () => {
    const codec = createNodeCodec();
    await preparePhoto(sourceBlob, { clientUuid: CLIENT_UUID, codec });
    expect(codec.decodeCount()).toBe(1);
    expect(codec.leakedBitmaps()).toBe(0);
    expect(codec.peakOpenBitmaps()).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * 4 — the regression that would actually happen
 * ------------------------------------------------------------------ */

describe("a codec that skips the re-encode", () => {
  /** The plausible "optimisation": forward the source bytes untouched. */
  function cheatingCodec(): ImageCodec {
    const honest = createNodeCodec();
    return {
      decode: (file) => honest.decode(file),
      async encode(request: EncodeRequest) {
        const carrier = jpegCarryingFixtureExif();
        return {
          bytes: carrier,
          width: request.width,
          height: request.height,
          colorSpace: "srgb" as const,
        };
      },
    };
  }

  it("is refused, and nothing is returned to be uploaded", async () => {
    await expect(
      preparePhoto(sourceBlob, {
        clientUuid: CLIENT_UUID,
        codec: cheatingCodec(),
      }),
    ).rejects.toBeInstanceOf(MetadataPresentError);
  });

  it("names what it found, so the reason is not a mystery", async () => {
    const error = await preparePhoto(sourceBlob, {
      clientUuid: CLIENT_UUID,
      codec: cheatingCodec(),
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MetadataPresentError);
    const kinds = (error as MetadataPresentError).evidence.map((e) => e.kind);
    expect(kinds).toContain("app1-exif");
  });

  it("still releases the bitmap when the guard refuses", async () => {
    const honest = createNodeCodec();
    const codec: ImageCodec = {
      decode: (file) => honest.decode(file),
      async encode(request: EncodeRequest) {
        return {
          bytes: jpegCarryingFixtureExif(),
          width: request.width,
          height: request.height,
          colorSpace: "srgb" as const,
        };
      },
    };
    await preparePhoto(sourceBlob, { clientUuid: CLIENT_UUID, codec }).catch(
      () => undefined,
    );
    // The `finally` in prepare.ts. Without it, a batch of thirty refusals
    // would hold thirty decoded bitmaps and take the tab down.
    expect(honest.leakedBitmaps()).toBe(0);
  });
});

function indexOfSequence(haystack: Uint8Array, needle: number[]): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}
