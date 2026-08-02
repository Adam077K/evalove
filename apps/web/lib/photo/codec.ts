/**
 * The browser end of the pipeline: pixels in, baseline JPEG out.
 *
 * Everything platform-specific lives here so that `prepare.ts` — which is
 * where the ordering guarantees are, and where a mistake leaks GPS — stays
 * testable in Node.
 *
 * Two decisions in this file are not preferences.
 *
 * **`heic2any` loads lazily, and only after the platform decoder throws.** On
 * Eva's and Adam's phones the OS decoder handles HEIC natively, so the 1.4 MB
 * wasm bundle should never be fetched. Importing it eagerly would put that
 * download on the critical path of a first-run batch over cellular, to serve a
 * case that does not arise on the only two devices this product has.
 *
 * **The re-encode is the EXIF strip.** Not a step near it, not a step after
 * it — the canvas has no metadata to write, so what comes out carries none.
 * There is no "skip the re-encode when the input is already a JPEG" fast path
 * here, and there must never be one: that input is a camera-roll original with
 * a home address in it.
 */

import type { ColorSpace } from "@/lib/types";
import type {
  DecodedImage,
  EncodeRequest,
  EncodeResult,
  ImageCodec,
} from "@/lib/photo/types";

/* ------------------------------------------------------------------ *
 * Decoding
 * ------------------------------------------------------------------ */

/** Raised when neither the platform decoder nor the fallback could read it. */
export class UndecodableImageError extends Error {
  readonly platformReason: string;
  readonly fallbackReason?: string;

  constructor(platformReason: string, fallbackReason?: string) {
    super("This image could not be read on this device.");
    this.name = "UndecodableImageError";
    this.platformReason = platformReason;
    this.fallbackReason = fallbackReason;
  }
}

interface Heic2Any {
  (options: { blob: Blob; toType?: string; quality?: number }):
    | Promise<Blob | Blob[]>;
}

let heicFallback: Promise<Heic2Any> | null = null;

/**
 * Load the wasm HEIC decoder once, on the first file the platform refused.
 *
 * Memoised on the promise rather than the module so a batch of thirty
 * unreadable files triggers one download, not thirty.
 */
async function loadHeicFallback(): Promise<Heic2Any> {
  if (!heicFallback) {
    heicFallback = import("heic2any").then(
      (m) => (m.default ?? m) as unknown as Heic2Any,
    );
  }
  return heicFallback;
}

function bitmapToDecoded(bitmap: ImageBitmap): DecodedImage {
  return {
    width: bitmap.width,
    height: bitmap.height,
    source: bitmap,
    close: () => bitmap.close(),
  };
}

/** Whether the platform decoder is available at all. */
function canDecodeNatively(): boolean {
  return typeof createImageBitmap === "function";
}

async function decodeWithPlatform(file: Blob): Promise<ImageBitmap> {
  // `imageOrientation: 'from-image'` makes the decoder apply the EXIF
  // orientation tag for us. It has to happen here: the re-encode discards that
  // tag, so a portrait photo whose rotation lived only in metadata would
  // otherwise be stored on its side, permanently, with nothing left to fix it.
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

/* ------------------------------------------------------------------ *
 * Canvas surfaces
 * ------------------------------------------------------------------ */

interface Surface {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  colorSpace: ColorSpace;
  toJpeg(quality: number): Promise<Blob>;
  release(): void;
}

function requestedContext(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  colorSpace: ColorSpace,
):
  | { context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D; granted: ColorSpace }
  | null {
  let context:
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null = null;
  try {
    context = canvas.getContext("2d", {
      colorSpace,
      alpha: false,
    } as CanvasRenderingContext2DSettings) as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
  } catch {
    context = null;
  }
  if (!context) return null;

  // Ask what we were actually given. A browser that does not understand
  // `display-p3` ignores the attribute and hands back an sRGB context without
  // complaining — recording the request rather than the grant would write a
  // wrong `photos.color_space` for every photo on that device.
  const attributes = context.getContextAttributes?.() as
    | { colorSpace?: string }
    | undefined;
  const granted: ColorSpace =
    attributes?.colorSpace === "display-p3" ? "display-p3" : "srgb";
  return { context, granted };
}

function createSurface(
  width: number,
  height: number,
  preferred: ColorSpace,
): Surface {
  const attempts: ColorSpace[] =
    preferred === "display-p3" ? ["display-p3", "srgb"] : ["srgb"];

  if (typeof OffscreenCanvas === "function") {
    const canvas = new OffscreenCanvas(width, height);
    for (const attempt of attempts) {
      const got = requestedContext(canvas, attempt);
      if (!got) continue;
      return {
        context: got.context,
        colorSpace: got.granted,
        toJpeg: (quality) =>
          canvas.convertToBlob({ type: "image/jpeg", quality }),
        release: () => {
          canvas.width = 0;
          canvas.height = 0;
        },
      };
    }
  }

  if (typeof document === "undefined") {
    throw new Error("No canvas implementation is available in this context.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  for (const attempt of attempts) {
    const got = requestedContext(canvas, attempt);
    if (!got) continue;
    return {
      context: got.context,
      colorSpace: got.granted,
      toJpeg: (quality) =>
        new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) =>
              blob
                ? resolve(blob)
                : reject(new Error("The canvas produced no bytes.")),
            "image/jpeg",
            quality,
          );
        }),
      release: () => {
        canvas.width = 0;
        canvas.height = 0;
      },
    };
  }

  throw new Error("A 2D canvas context could not be created on this device.");
}

/* ------------------------------------------------------------------ *
 * The codec
 * ------------------------------------------------------------------ */

export interface BrowserCodecOptions {
  /**
   * Rendering intent to attempt. Defaults to Display P3 — an iPhone photograph
   * is P3, and clamping it to sRGB on a device that can show the difference
   * throws away colour for nothing.
   */
  preferredColorSpace?: ColorSpace;
  /** Notified when the wasm fallback had to run, for the probe log. */
  onFallbackDecode?: (reason: string) => void;
}

export function createBrowserCodec(
  options: BrowserCodecOptions = {},
): ImageCodec {
  const preferred = options.preferredColorSpace ?? "display-p3";

  return {
    async decode(file: Blob): Promise<DecodedImage> {
      let platformReason = "createImageBitmap is not available.";
      if (canDecodeNatively()) {
        try {
          return bitmapToDecoded(await decodeWithPlatform(file));
        } catch (error) {
          platformReason =
            error instanceof Error ? error.message : String(error);
        }
      }

      // Only now — and this is the only place the 1.4 MB fetch is reachable.
      options.onFallbackDecode?.(platformReason);
      try {
        const heic2any = await loadHeicFallback();
        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.92,
        });
        const jpeg = Array.isArray(converted) ? converted[0] : converted;
        if (!jpeg) throw new Error("The fallback decoder returned nothing.");
        return bitmapToDecoded(await decodeWithPlatform(jpeg));
      } catch (error) {
        throw new UndecodableImageError(
          platformReason,
          error instanceof Error ? error.message : String(error),
        );
      }
    },

    async encode(request: EncodeRequest): Promise<EncodeResult> {
      const { image, width, height, quality } = request;
      const surface = createSurface(width, height, request.colorSpace);
      try {
        surface.context.drawImage(image.source, 0, 0, width, height);
        const blob = await surface.toJpeg(quality);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        return {
          bytes,
          width,
          height,
          colorSpace: surface.colorSpace,
        };
      } finally {
        surface.release();
      }
    },
  };
}
