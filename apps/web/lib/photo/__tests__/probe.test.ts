/**
 * The picker-format probe, checked against the one real file we have.
 *
 * The probe's job is to record what iOS actually hands a file input rather
 * than what the architecture assumed. Its own correctness is therefore the
 * thing worth testing: it must identify a real iPhone HEIC by its bytes, and
 * it must notice when the claimed type and the bytes disagree — which is the
 * case that would otherwise ship a broken decode to one of the two people who
 * use this.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import {
  claimMatchesBytes,
  detectFormat,
  formatObservation,
  observePickedFile,
} from "@/lib/photo/probe";

const FIXTURE = fileURLToPath(
  new URL("../__fixtures__/iphone-gps.heic", import.meta.url),
);

let heic: Uint8Array;

beforeAll(async () => {
  heic = new Uint8Array(await readFile(FIXTURE));
});

describe("detectFormat", () => {
  it("identifies a real iPhone HEIC by its ftyp brand", () => {
    expect(detectFormat(heic)).toBe("heif");
  });

  it("identifies JPEG and PNG by magic number", () => {
    expect(detectFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(
      detectFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("png");
  });

  it("does not guess at bytes it does not recognise", () => {
    expect(detectFormat(new Uint8Array([1, 2, 3, 4]))).toBe("other");
    expect(detectFormat(new Uint8Array(0))).toBe("other");
  });
});

describe("observePickedFile", () => {
  it("records what came through the picker", async () => {
    const file = new File([heic as BlobPart], "IMG_4546.HEIC", {
      type: "image/heic",
    });

    const observation = await observePickedFile(file);

    expect(observation.reportedMime).toBe("image/heic");
    expect(observation.extension).toBe("heic");
    expect(observation.detectedFormat).toBe("heif");
    expect(observation.carriesExif).toBe(true);
    expect(observation.byteLength).toBe(heic.byteLength);
    expect(observation.neededFallbackDecoder).toBe(false);
  });

  it("copes with the Files path, which often reports no MIME at all", async () => {
    const file = new File([heic as BlobPart], "IMG_4546", { type: "" });
    const observation = await observePickedFile(file);
    expect(observation.reportedMime).toBe("");
    expect(observation.extension).toBe("");
    // The bytes still answer the question.
    expect(observation.detectedFormat).toBe("heif");
    expect(claimMatchesBytes(observation)).toBe(true);
  });
});

describe("claimMatchesBytes", () => {
  it("catches a HEIC wearing a .jpg name", async () => {
    const file = new File([heic as BlobPart], "IMG_4546.jpg", {
      type: "image/jpeg",
    });
    const observation = await observePickedFile(file);
    // An implementation that trusted the extension would have decoded this as
    // JPEG and shipped the failure to exactly one of the two devices.
    expect(claimMatchesBytes(observation)).toBe(false);
  });

  it("is satisfied when the claim and the bytes agree", async () => {
    const file = new File([heic as BlobPart], "IMG_4546.HEIC", {
      type: "image/heic",
    });
    expect(claimMatchesBytes(await observePickedFile(file))).toBe(true);
  });
});

describe("formatObservation", () => {
  it("reads as one sentence a person can paste into a session file", async () => {
    const file = new File([heic as BlobPart], "IMG_4546.HEIC", {
      type: "image/heic",
    });
    const line = formatObservation(await observePickedFile(file));
    expect(line).toContain(".heic");
    expect(line).toContain("actually heif");
    expect(line).toContain("carries EXIF");
    expect(line).toContain("decoded natively");
  });
});
