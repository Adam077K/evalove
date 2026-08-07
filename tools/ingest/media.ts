/**
 * media.ts — HEIC/JPEG/PNG → web JPEG, and MOV/MP4 → web MP4 + poster.
 *
 * Two external tools, both invoked with `spawnSync` and an argv array —
 * never a shell string. The source filenames carry literal `:` characters
 * (`24:7:26-10.HEIC`); an argv array passes them to the child process exactly
 * as given, with no shell metacharacter risk, which is worth more here than
 * anywhere else in this tool.
 *
 * THE ORIENTATION FINDING THIS FILE DEPENDS ON, established empirically before
 * writing this: `sips -s format jpeg` decodes a HEIC into a JPEG whose RAW
 * pixels are stored sensor-orientation (e.g. landscape for a portrait photo)
 * with an EXIF `Orientation` tag doing the rotation — carrying GPS and every
 * other EXIF field forward unchanged. Feeding that intermediate JPEG through
 * ffmpeg's mjpeg decoder (`ffmpeg -i intermediate.jpg ...`) reads the
 * `Orientation` tag and BAKES the rotation into the output raster; combined
 * with `-map_metadata -1` the final JPEG has correct on-screen orientation and
 * carries no EXIF at all — proven against a real file in this batch, see the
 * ingest session notes. `sips`'s own `--resampleHeightWidthMax` does neither
 * of those things (it preserves the tag and the metadata unchanged), which is
 * why sips is used only to decode the container, never to resize or strip.
 *
 * So: sips decodes HEIC → JPEG (Apple's own decoder — the one thing at risk
 * doing this any other way is picking the wrong stream out of a HEIC's many
 * embedded auxiliary images, and sips is what Photos.app itself uses to avoid
 * exactly that). ffmpeg then re-encodes to the two target sizes, orientation
 * baked in, metadata dropped. Plain JPEG/PNG sources skip the sips step and go
 * straight into the same ffmpeg pass — ffmpeg reads JPEG orientation the same
 * way, and PNG carries no EXIF to begin with.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

/** The app's own budget (`apps/web/lib/photo/types.ts` DISPLAY_SPEC/THUMB_SPEC). */
export const DISPLAY_LONG_EDGE = 1600;
export const THUMB_LONG_EDGE = 400;

/**
 * ffmpeg's mjpeg qscale is 2 (best) – 31 (worst), not libjpeg's 0–100 quality
 * — there is no exact numeric translation. These were picked by eye against
 * the app's DISPLAY_SPEC (quality 0.82) and THUMB_SPEC (quality 0.72): low
 * enough qscale to look right at each target size, without chasing an exact
 * equivalence that doesn't exist between the two quality models.
 */
const DISPLAY_QSCALE = 3;
const THUMB_QSCALE = 5;

export interface ToolAvailability {
  sips: boolean;
  ffmpeg: boolean;
  ffprobe: boolean;
}

function commandExists(cmd: string): boolean {
  const result = spawnSync("which", [cmd], { stdio: "ignore" });
  return result.status === 0;
}

export function checkToolAvailability(): ToolAvailability {
  return {
    sips: commandExists("sips"),
    ffmpeg: commandExists("ffmpeg"),
    ffprobe: commandExists("ffprobe"),
  };
}

export class ToolMissingError extends Error {
  constructor(readonly tool: string) {
    super(`Required external tool "${tool}" is not on PATH.`);
    this.name = "ToolMissingError";
  }
}

function run(cmd: string, args: string[]): void {
  const result = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = result.stderr?.toString("utf8") ?? "";
    throw new Error(
      `${cmd} ${args.join(" ")} exited ${result.status}\n${stderr}`,
    );
  }
}

function ensureDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export interface EncodedFile {
  path: string;
  width: number;
  height: number;
  bytes: number;
  checksumSha256: string;
}

function inspect(path: string): EncodedFile {
  const bytes = readFileSync(path);
  const dims = jpegDimensions(bytes);
  return {
    path,
    width: dims?.width ?? 0,
    height: dims?.height ?? 0,
    bytes: bytes.byteLength,
    checksumSha256: sha256Hex(bytes),
  };
}

/**
 * Minimal SOF0/2 width/height reader, used only to report dimensions in the
 * manifest — NOT the metadata-cleanliness check. That check reuses
 * `apps/web/lib/photo/guard.ts` (`readJpegDimensions`) directly; see verify.ts.
 * A second, smaller reader lives here purely so media.ts has no dependency on
 * the app's alias-rooted modules, keeping this file runnable standalone.
 */
function jpegDimensions(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let at = 2;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) {
      at++;
      continue;
    }
    const marker = bytes[at + 1];
    if (marker === undefined) break;
    if (marker === 0xff) {
      at++;
      continue;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
      at += 2;
      continue;
    }
    const length = bytes.readUInt16BE(at + 2);
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      const height = bytes.readUInt16BE(at + 5);
      const width = bytes.readUInt16BE(at + 7);
      return { width, height };
    }
    if (marker === 0xda) break;
    at += 2 + length;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Images
 * ------------------------------------------------------------------ */

export interface ConvertedImage {
  display: EncodedFile;
  thumb: EncodedFile;
}

/**
 * `srcPath` is an original image (HEIC, JPG/JPEG, or PNG). `outDir` receives
 * `<baseName>-display.jpg` and `<baseName>-thumb.jpg`; both are re-encoded,
 * orientation-baked, EXIF/GPS-free JPEGs. The original is never modified.
 */
export function convertImage(
  srcPath: string,
  extension: string,
  outDir: string,
  baseName: string,
  tmpDir: string,
): ConvertedImage {
  let intermediate = srcPath;
  let sipsTemp: string | null = null;

  if (extension === "heic") {
    sipsTemp = join(tmpDir, `${baseName}-sips.jpg`);
    ensureDir(sipsTemp);
    run("sips", ["-s", "format", "jpeg", srcPath, "--out", sipsTemp]);
    intermediate = sipsTemp;
  }

  const displayPath = join(outDir, `${baseName}-display.jpg`);
  const thumbPath = join(outDir, `${baseName}-thumb.jpg`);
  ensureDir(displayPath);

  encodeJpegVariant(intermediate, displayPath, DISPLAY_LONG_EDGE, DISPLAY_QSCALE);
  encodeJpegVariant(intermediate, thumbPath, THUMB_LONG_EDGE, THUMB_QSCALE);

  if (sipsTemp) rmSync(sipsTemp, { force: true });

  return { display: inspect(displayPath), thumb: inspect(thumbPath) };
}

/**
 * One ffmpeg pass: decode (honouring EXIF orientation), scale the long edge
 * down to `longEdge` (never up — `min(1,...)` via the `scale` filter's
 * `if(gt(...))` guards below only ever shrinks because every source here is
 * already larger than 1600px), re-encode, and drop every metadata field with
 * `-map_metadata -1`. This step IS the strip — see the file header.
 */
function encodeJpegVariant(
  srcPath: string,
  outPath: string,
  longEdge: number,
  qscale: number,
): void {
  // Scale so the LONGER side becomes `longEdge`, preserving aspect ratio,
  // without upscaling (`min(iw,longEdge)` / `min(ih,longEdge)` by way of a
  // conditional pick on which side is longer).
  const scaleFilter =
    `scale='if(gt(iw,ih),min(iw,${longEdge}),-2)':` +
    `'if(gt(iw,ih),-2,min(ih,${longEdge}))'`;
  run("ffmpeg", [
    "-y",
    "-i",
    srcPath,
    "-map_metadata",
    "-1",
    "-vf",
    scaleFilter,
    "-q:v",
    String(qscale),
    "-update",
    "1",
    "-frames:v",
    "1",
    outPath,
  ]);
}

/* ------------------------------------------------------------------ *
 * Video
 * ------------------------------------------------------------------ */

export interface ConvertedVideo {
  video: EncodedFile;
  poster: EncodedFile;
  durationSeconds: number;
  width: number;
  height: number;
}

/**
 * Width/height/duration, read with ffprobe.
 *
 * IMPORTANT: several phone-recorded portrait videos in this batch store their
 * frame data landscape with a rotation flag (`side_data_list`) rather than
 * rotating the pixels — `ffprobe`'s plain `width`/`height` on such a file
 * report the UNROTATED raw stream (e.g. 1920x1080 for a video that is
 * portrait on screen). ffmpeg's encoder bakes the rotation into the output
 * during transcode, so `convertVideo` below always probes the WRITTEN mp4,
 * never the source, for the dimensions that go in the manifest — those are
 * the dimensions anything that plays the file back will actually show.
 */
export function probeVideo(path: string): {
  durationSeconds: number;
  width: number;
  height: number;
} {
  const result = spawnSync("ffprobe", [
    "-hide_banner",
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height:format=duration",
    "-of",
    "json",
    path,
  ]);
  if (result.status !== 0) {
    throw new Error(`ffprobe failed on ${path}: ${result.stderr?.toString()}`);
  }
  const parsed = JSON.parse(result.stdout.toString("utf8")) as {
    streams?: { width?: number; height?: number }[];
    format?: { duration?: string };
  };
  const stream = parsed.streams?.[0];
  return {
    width: stream?.width ?? 0,
    height: stream?.height ?? 0,
    durationSeconds: parsed.format?.duration ? Number(parsed.format.duration) : 0,
  };
}

/**
 * Transcode to web-playable H.264/AAC MP4 with metadata stripped, and extract
 * one poster frame (first frame) as a metadata-free JPEG through the exact
 * same encode path as `convertImage`, so the poster gets the same
 * orientation/strip guarantees as every other JPEG this tool produces.
 */
export function convertVideo(
  srcPath: string,
  outDir: string,
  baseName: string,
): ConvertedVideo {
  const videoPath = join(outDir, `${baseName}.mp4`);
  const posterPath = join(outDir, `${baseName}-poster.jpg`);
  ensureDir(videoPath);

  run("ffmpeg", [
    "-y",
    "-i",
    srcPath,
    "-map_metadata",
    "-1",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    videoPath,
  ]);

  run("ffmpeg", [
    "-y",
    "-i",
    srcPath,
    "-map_metadata",
    "-1",
    "-frames:v",
    "1",
    "-update",
    "1",
    "-q:v",
    String(DISPLAY_QSCALE),
    posterPath,
  ]);

  // Probe the WRITTEN mp4, not the source — see the note on probeVideo above.
  const outputProbe = probeVideo(videoPath);

  return {
    video: inspect(videoPath),
    poster: inspect(posterPath),
    durationSeconds: outputProbe.durationSeconds,
    width: outputProbe.width,
    height: outputProbe.height,
  };
}

/** `inspect()`'s width/height for an mp4 comes back 0 — video isn't a JPEG. Patch it in. */
export function withVideoDimensions(
  file: EncodedFile,
  width: number,
  height: number,
): EncodedFile {
  return { ...file, width, height };
}
