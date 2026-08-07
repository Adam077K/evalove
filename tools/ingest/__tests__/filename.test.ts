import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DUPLICATE_DROPS,
  FILENAME_EXIF_DATE_MISMATCHES,
  UnparsableFilenameError,
  deriveBaseName,
  isDroppedDuplicate,
  parseFilename,
} from "../filename.ts";

describe("parseFilename", () => {
  it("parses a bare DD:MM:YY filename with no counter", () => {
    const parsed = parseFilename("16:7:26.JPG");
    expect(parsed.isoDate).toBe("2026-07-16");
    expect(parsed.counter).toBe(0);
    expect(parsed.extension).toBe("jpg");
    expect(parsed.kind).toBe("image");
  });

  it("parses DD:MM:YY-N with a counter", () => {
    const parsed = parseFilename("24:7:26-10.HEIC");
    expect(parsed.isoDate).toBe("2026-07-24");
    expect(parsed.counter).toBe(10);
    expect(parsed.extension).toBe("heic");
  });

  it("pads single-digit day and month into the ISO date", () => {
    const parsed = parseFilename("1:8:26-1.MOV");
    expect(parsed.isoDate).toBe("2026-08-01");
    expect(parsed.kind).toBe("video");
  });

  it("pads a single-digit day with a two-digit month", () => {
    const parsed = parseFilename("7:8:26-1.JPG");
    expect(parsed.isoDate).toBe("2026-08-07");
  });

  it("lower-cases a mixed-case extension (24:7:26-22.heic)", () => {
    const parsed = parseFilename("24:7:26-22.heic");
    expect(parsed.extension).toBe("heic");
    expect(parsed.kind).toBe("image");
  });

  it("classifies every extension present in the source folder", () => {
    expect(parseFilename("3:1:26.JPG").kind).toBe("image");
    expect(parseFilename("3:1:26.jpg").kind).toBe("image");
    expect(parseFilename("3:1:26.PNG").kind).toBe("image");
    expect(parseFilename("3:1:26.HEIC").kind).toBe("image");
    expect(parseFilename("3:1:26.MOV").kind).toBe("video");
    expect(parseFilename("3:1:26.MP4").kind).toBe("video");
  });

  it("rejects a filename with no recognisable date grammar", () => {
    expect(() => parseFilename("IMG_1234.JPG")).toThrow(
      UnparsableFilenameError,
    );
  });

  it("rejects an out-of-range month", () => {
    expect(() => parseFilename("1:13:26.JPG")).toThrow(
      UnparsableFilenameError,
    );
  });

  it("rejects an out-of-range day", () => {
    expect(() => parseFilename("32:1:26.JPG")).toThrow(
      UnparsableFilenameError,
    );
  });

  it("rejects an unrecognised extension", () => {
    expect(() => parseFilename("1:1:26.GIF")).toThrow(
      UnparsableFilenameError,
    );
  });

  it("the error names the offending file", () => {
    try {
      parseFilename("not-a-date.JPG");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(UnparsableFilenameError);
      expect((error as UnparsableFilenameError).file).toBe("not-a-date.JPG");
    }
  });
});

describe("deriveBaseName", () => {
  it("differs for two files sharing a date but not an extension (the real collision found in the first full run)", () => {
    expect(deriveBaseName("24:7:26.HEIC")).not.toBe(deriveBaseName("24:7:26.JPG"));
  });

  it("differs for two files sharing a date and counter but not an extension", () => {
    expect(deriveBaseName("24:7:26-22.heic")).not.toBe(
      deriveBaseName("24:7:26-22.HEIC"),
    );
  });

  it("produces no collisions across every real source filename, when one exists", () => {
    let files: string[];
    try {
      files = readdirSync(
        new URL("../../../Eva-app-images", import.meta.url),
      ).filter((f) => !f.startsWith("."));
    } catch {
      return; // Source folder isn't present in this environment — nothing to check.
    }
    const baseNames = files.map(deriveBaseName);
    expect(new Set(baseNames).size).toBe(baseNames.length);
  });
});

describe("known corrections", () => {
  it("flags 24:7:26-12.HEIC as the duplicate to drop, and nothing else", () => {
    expect(isDroppedDuplicate("24:7:26-12.HEIC")).toBe(true);
    expect(isDroppedDuplicate("24:7:26-11.HEIC")).toBe(false);
    expect(Object.keys(DUPLICATE_DROPS)).toEqual(["24:7:26-12.HEIC"]);
  });

  it("records the filename/EXIF date mismatch for 24:7:26-21.HEIC", () => {
    const mismatch = FILENAME_EXIF_DATE_MISMATCHES["24:7:26-21.HEIC"];
    expect(mismatch).toEqual({
      filenameDate: "2026-07-24",
      exifDate: "2026-07-23",
    });
    // The filename date must match what the parser itself derives — the
    // "authoritative" claim only means something if the two agree.
    expect(parseFilename("24:7:26-21.HEIC").isoDate).toBe(
      mismatch!.filenameDate,
    );
  });
});
