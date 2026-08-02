/**
 * Test doubles for the queue: in-memory OPFS and IndexedDB, a codec that
 * refuses to decode two things at once, and a transport whose connection the
 * test can drop mid-batch.
 *
 * The doubles are deliberately strict rather than permissive. The in-memory
 * blob store refuses a zero-byte write; the codec throws if a second decode
 * starts before the first is closed; the transport refuses to commit anything
 * that is not already durable on the "device". Each of those is a real
 * invariant of the design, and a double that quietly tolerates a violation
 * turns a green test into a false one.
 */

import { vi } from "vitest";

import type { Uuid } from "@/lib/types";
import { encodeBaselineJpeg } from "@/lib/photo/__tests__/support/jpeg-encoder";
import type {
  DecodedImage,
  EncodeRequest,
  EncodeResult,
  ImageCodec,
} from "@/lib/photo/types";
import type { BlobStore } from "@/lib/outbox/blobs";
import type { RecordStore } from "@/lib/outbox/records";
import {
  TransportError,
  type CommitPhotoInput,
  type UploadTicket,
  type UploadTransport,
} from "@/lib/outbox/transport";
import type { OutboxRecord } from "@/lib/outbox/types";

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

export interface MemoryBlobStore extends BlobStore {
  readonly writes: string[];
  size(): number;
  has(key: string): boolean;
}

export function createMemoryBlobStore(): MemoryBlobStore {
  const files = new Map<string, Blob>();
  const writes: string[] = [];

  return {
    writes,
    size: () => files.size,
    has: (key) => files.has(key),

    async put(key, data) {
      if (data.size === 0) {
        throw new Error(`Refusing to store zero bytes for ${key}.`);
      }
      files.set(key, data);
      writes.push(key);
    },
    async get(key) {
      return files.get(key) ?? null;
    },
    async delete(key) {
      files.delete(key);
    },
    async keys() {
      return [...files.keys()];
    },
    async totalBytes() {
      let total = 0;
      for (const blob of files.values()) total += blob.size;
      return total;
    },
  };
}

export function createMemoryRecordStore(): RecordStore {
  const rows = new Map<Uuid, OutboxRecord>();
  const oldestFirst = (a: OutboxRecord, b: OutboxRecord) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;

  return {
    async putMany(records) {
      for (const record of records) rows.set(record.clientUuid, { ...record });
    },
    async put(record) {
      rows.set(record.clientUuid, { ...record });
    },
    async get(clientUuid) {
      const found = rows.get(clientUuid);
      return found ? { ...found } : null;
    },
    async all() {
      return [...rows.values()].map((r) => ({ ...r })).sort(oldestFirst);
    },
    async pending() {
      return [...rows.values()]
        .filter((r) => r.state !== "committed")
        .map((r) => ({ ...r }))
        .sort(oldestFirst);
    },
    async delete(clientUuid) {
      rows.delete(clientUuid);
    },
  };
}

/* ------------------------------------------------------------------ *
 * The codec
 * ------------------------------------------------------------------ */

interface FakeSource {
  samples: Uint8Array;
  width: number;
  height: number;
}

export interface CountingCodec extends ImageCodec {
  /** How many decodes have run. */
  readonly decodeCount: () => number;
  /** The largest number of bitmaps open simultaneously. Must stay 1. */
  readonly peakOpenBitmaps: () => number;
  /** Bitmaps decoded but never closed. Must end at 0. */
  readonly leakedBitmaps: () => number;
}

export interface NodeCodecOptions {
  /** Pixel size the "decoder" reports. */
  width?: number;
  height?: number;
  /** Throw on the nth decode (1-based), to model an undecodable file. */
  throwOnDecode?: (index: number) => Error | null;
}

/**
 * A codec that decodes to a deterministic gradient and encodes real JPEG bytes.
 *
 * The pixels are synthetic — Node has no HEIC decoder — but the *contract* is
 * the one the browser codec implements, and the output is a genuine baseline
 * JPEG carrying no metadata, which is the property everything downstream is
 * asserting about.
 */
export function createNodeCodec(options: NodeCodecOptions = {}): CountingCodec {
  const width = options.width ?? 640;
  const height = options.height ?? 480;
  let decodes = 0;
  let open = 0;
  let peak = 0;
  let leaked = 0;

  return {
    decodeCount: () => decodes,
    peakOpenBitmaps: () => peak,
    leakedBitmaps: () => leaked,

    async decode(file: Blob): Promise<DecodedImage> {
      decodes++;
      const explode = options.throwOnDecode?.(decodes);
      if (explode) throw explode;

      if (open > 0) {
        throw new Error(
          `A second decode started while ${open} bitmap(s) were still open. ` +
            "Decoding must be sequential with close() after each.",
        );
      }
      open++;
      leaked++;
      peak = Math.max(peak, open);

      // Deterministic, and different per source, so an item that gets crossed
      // with another one produces different bytes rather than passing quietly.
      const seed = (await file.slice(0, 64).arrayBuffer()).byteLength + file.size;
      const samples = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          samples[y * width + x] = (x * 3 + y * 5 + seed) % 256;
        }
      }

      let closed = false;
      return {
        width,
        height,
        source: { samples, width, height } as unknown as CanvasImageSource,
        close() {
          if (closed) return;
          closed = true;
          open--;
          leaked--;
        },
      };
    },

    async encode(request: EncodeRequest): Promise<EncodeResult> {
      const source = request.image.source as unknown as FakeSource;
      const out = new Uint8Array(request.width * request.height);
      for (let y = 0; y < request.height; y++) {
        const sy = Math.min(
          source.height - 1,
          Math.floor((y * source.height) / request.height),
        );
        for (let x = 0; x < request.width; x++) {
          const sx = Math.min(
            source.width - 1,
            Math.floor((x * source.width) / request.width),
          );
          out[y * request.width + x] = source.samples[sy * source.width + sx] ?? 0;
        }
      }
      return {
        bytes: encodeBaselineJpeg(out, request.width, request.height),
        width: request.width,
        height: request.height,
        // Model a device that granted sRGB rather than the P3 we asked for.
        colorSpace: "srgb",
      };
    },
  };
}

/* ------------------------------------------------------------------ *
 * The transport
 * ------------------------------------------------------------------ */

export interface ScriptedTransport extends UploadTransport {
  /** Every network call, in order. */
  readonly calls: { name: string; at: number }[];
  readonly committed: Set<Uuid>;
  /** Flip to make every subsequent call behave as a dropped connection. */
  online: boolean;
  /** Called before each network call, so a test can drop the line mid-batch. */
  beforeCall?: (name: string, index: number) => void;
}

export interface ScriptedTransportOptions {
  /** Consulted so the transport can refuse to commit undurable items. */
  isDurable: (clientUuid: Uuid) => Promise<boolean>;
}

export function createScriptedTransport(
  options: ScriptedTransportOptions,
): ScriptedTransport {
  let nextId = 0;

  /**
   * Every call goes through here: it logs, gives the test its chance to drop
   * the line, and then drops it. One funnel, so a new method cannot
   * accidentally be exempt from the failure the test is trying to inject.
   */
  const record = (name: string): void => {
    const index = transport.calls.length;
    transport.calls.push({ name, at: index });
    transport.beforeCall?.(name, index);
    if (!transport.online) {
      throw new TransportError("The connection dropped partway through.");
    }
  };

  const transport: ScriptedTransport = {
    calls: [],
    committed: new Set<Uuid>(),
    online: true,

    async requestUploadUrls({ count }) {
      record("upload-url");
      const tickets: UploadTicket[] = [];
      for (let i = 0; i < count; i++) {
        nextId++;
        const photoId =
          `00000000-0000-4000-8000-${String(nextId).padStart(12, "0")}` as Uuid;
        tickets.push({
          photoId,
          urls: {
            display: `https://storage.test/${photoId}/display`,
            thumb: `https://storage.test/${photoId}/thumb`,
          },
        });
      }
      return tickets;
    },

    async putObject(url: string) {
      record(`put:${url}`);
    },

    async commitPhoto(input: CommitPhotoInput) {
      record(`commit:${input.clientUuid}`);
      // Durability is not optional and not something a later step can repair.
      // If the queue ever reaches the network for something it has not written
      // to disk, that is the photo-loss bug, and the test must see it here.
      if (!(await options.isDurable(input.clientUuid))) {
        throw new Error(
          `commit for ${input.clientUuid} reached the network before its bytes were durable.`,
        );
      }
      transport.committed.add(input.clientUuid);
    },
  };

  return transport;
}

/** Deterministic client ids, so assertions can name specific items. */
export function sequentialUuids(prefix = "11111111-1111-4111-8111") {
  let n = 0;
  return (): Uuid => {
    n++;
    return `${prefix}-${String(n).padStart(12, "0")}`;
  };
}

/** A clock that does not move, so backoff never actually sleeps in a test. */
export function frozenClock(iso = "2026-08-02T09:00:00.000Z") {
  const at = new Date(iso);
  return () => at;
}

export const noJitter = () => 0;

/** Silence the pool's unhandled-rejection noise if a double misbehaves. */
export function quietConsole() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}
