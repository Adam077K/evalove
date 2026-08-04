/**
 * POST /api/photos — the physical acceptance test.
 *
 * A genuine Apple HEIC (`lib/photo/__fixtures__/iphone-gps.heic`) carrying a
 * genuine GPS IFD is run through the real client pipeline (`preparePhoto`)
 * and the resulting bytes are what gets posted to this route. `commitPhoto`
 * itself is the REAL implementation here — only the `DataGateway` underneath
 * `photoDeps()` is swapped for an in-memory one, because there is no live
 * Supabase project in CI. Session handling is stubbed for the same reason
 * every other route test stubs it: `requireSession()` needs cookies this
 * environment does not have.
 *
 * The assertion that matters is not "the route returned 201". It is that the
 * checksum this route hands to `insertPhotoIfAbsent` — the thing that would
 * actually reach the database — names bytes independently re-parsed and
 * proven to carry no APP1/EXIF segment and no GPS IFD. What gets committed is
 * provably not the original upload.
 *
 * `storageObjects` is a second, independent fake: what `downloadObject`
 * actually returns for a given path. It exists because `commitPhoto` now
 * re-downloads and re-scans the display/thumb objects before it will write
 * `exif_stripped: true` (see `verifyDerivativesAreClean` in
 * `lib/data/photos.ts`) — the request body's own claims about width, bytes
 * and checksum are no longer enough on their own. The two "GPS bypass" tests
 * below populate this map with bytes that never went through
 * `preparePhoto` at all, which is exactly the attack the fix closes: a
 * session PUTting raw camera-roll bytes straight to the signed URLs and then
 * committing as if the client pipeline had run.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ *
 * Hoisted stubs and the fake gateway
 * ------------------------------------------------------------------ */

const requireSessionMock = vi.hoisted(() => vi.fn<() => Promise<void>>());
const getIdentityMock = vi.hoisted(() => vi.fn());

const EVA_ID = "550e8400-e29b-41d4-8716-446655440001";
const ADAM_ID = "550e8400-e29b-41d4-8716-446655440002";
const PHOTO_ID = "550e8400-e29b-41d4-8716-446655440000";
const CLIENT_UUID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

/** What `downloadObject` answers for a given storage path. Reset per test. */
const storageObjects = vi.hoisted(() => new Map<string, ArrayBuffer>());

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

const ROSTER = vi.hoisted(() => [
  {
    id: "550e8400-e29b-41d4-8716-446655440001",
    slug: "eva" as const,
    display_name: "Eva",
    home_timezone: "America/New_York",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "550e8400-e29b-41d4-8716-446655440002",
    slug: "adam" as const,
    display_name: "Adam",
    home_timezone: "Asia/Jerusalem",
    created_at: "2026-01-01T00:00:00.000Z",
  },
]);

/** Every row this run's `insertPhotoIfAbsent` actually received. */
const inserted = vi.hoisted(() => [] as Record<string, unknown>[]);

vi.mock("@/lib/data", async (importActual) => {
  // `commitPhoto` is the REAL implementation, imported through unchanged.
  // Only `photoDeps()` is swapped, for an in-memory gateway.
  const actual = await importActual<typeof import("@/lib/data")>();
  return {
    ...actual,
    photoDeps: () => ({
      gateway: {
        async listMembers() {
          return ROSTER;
        },
        async findPhotoByClientUuid() {
          return null; // First commit of this clientUuid in this test.
        },
        async insertPhotoIfAbsent(row: Record<string, unknown>) {
          inserted.push(row);
          return row;
        },
        async supersedePriorDaily() {
          return 0; // kind is "book" here; this must never even be reachable.
        },
        async downloadObject(path: string) {
          return storageObjects.get(path) ?? null;
        },
      },
      now: () => new Date("2026-05-09T20:00:00.000Z"),
      newId: () => PHOTO_ID,
    }),
  };
});

vi.mock("@/lib/session", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/session")>();
  return {
    ...actual,
    requireSession: requireSessionMock,
    getIdentity: getIdentityMock,
  };
});

/* ------------------------------------------------------------------ *
 * Import after mocks are declared
 * ------------------------------------------------------------------ */

import { findExifBlock } from "@/lib/photo/exif";
import { findMetadataEvidence } from "@/lib/photo/guard";
import { preparePhoto } from "@/lib/photo/prepare";
import { createNodeCodec } from "@/lib/outbox/__tests__/support/doubles";
import { photoDisplayPath, photoThumbPath } from "@/lib/schema";
import { POST } from "@/app/api/photos/route";

const FIXTURE = fileURLToPath(
  new URL("../../../../lib/photo/__fixtures__/iphone-gps.heic", import.meta.url),
);

function postRequest(body: unknown): Request {
  return new Request("https://evalove.test/api/photos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Seed "storage" with what the client claims it PUT — the same bytes
 * `commitPhoto` will now download and re-scan before it trusts the commit.
 * Every test that expects success has to do this, because a real gateway's
 * `downloadObject` answers with whatever actually landed at the path, not
 * with the request body's say-so.
 */
function seedCleanStorage(prepared: { display: { bytes: Uint8Array }; thumb: { bytes: Uint8Array } }): void {
  storageObjects.set(photoDisplayPath(PHOTO_ID), toArrayBuffer(prepared.display.bytes));
  storageObjects.set(photoThumbPath(PHOTO_ID), toArrayBuffer(prepared.thumb.bytes));
}

beforeEach(() => {
  inserted.length = 0;
  storageObjects.clear();
  requireSessionMock.mockReset().mockResolvedValue(undefined);
  getIdentityMock
    .mockReset()
    .mockResolvedValue({ memberId: EVA_ID, source: "self_declared" });
});

describe("a real HEIC with GPS, through the picker", () => {
  it("commits a checksum that names GPS-free bytes, not the original upload", async () => {
    const source = new Uint8Array(await readFile(FIXTURE));
    const sourceBlob = new Blob([source as BlobPart], { type: "image/heic" });

    // The exact pipeline QuickSend's picker runs: a real GPS-bearing HEIC in,
    // a prepared JPEG out.
    const prepared = await preparePhoto(sourceBlob, {
      clientUuid: CLIENT_UUID,
      codec: createNodeCodec(),
    });

    // Proved independently by re-parsing the exact bytes about to be posted
    // — not assumed because `preparePhoto` is trusted elsewhere in the suite.
    expect(findMetadataEvidence(prepared.display.bytes)).toEqual([]);
    expect(prepared.sourceHadGps).toBe(true);

    // What actually lands in storage — the server verifies against this, not
    // against the request body.
    seedCleanStorage(prepared);

    const response = await POST(
      postRequest({
        clientUuid: CLIENT_UUID,
        photoId: PHOTO_ID,
        kind: "book",
        author: EVA_ID,
        clientTz: "America/New_York",
        takenAt: prepared.takenAt,
        caption: "from the picker",
        width: prepared.display.width,
        height: prepared.display.height,
        bytes: prepared.display.byteLength,
        colorSpace: prepared.colorSpace,
        checksumSha256: prepared.display.checksumSha256,
      }),
    );

    expect(response.status).toBe(201);
    expect(inserted).toHaveLength(1);

    const row = inserted[0]!;
    // What actually reached the "database" is the stripped derivative's
    // checksum — proven GPS-free above — not a checksum of the raw upload.
    expect(row.checksum_sha256).toBe(prepared.display.checksumSha256);
    expect(row.exif_stripped).toBe(true);
    expect(row.author_member_id).toBe(EVA_ID);
    expect(row.kind).toBe("book");
    // The capture date survived the strip even though the GPS did not.
    expect(row.taken_at).toBe("2026-05-09T15:34:05Z");
  });

  it("never lets a raw-upload checksum (source bytes) reach the gateway", async () => {
    const source = new Uint8Array(await readFile(FIXTURE));
    const sourceBlob = new Blob([source as BlobPart], { type: "image/heic" });
    const { sha256Hex } = await import("@/lib/photo/checksum");
    const sourceChecksum = await sha256Hex(source);

    const prepared = await preparePhoto(sourceBlob, {
      clientUuid: CLIENT_UUID,
      codec: createNodeCodec(),
    });
    seedCleanStorage(prepared);

    await POST(
      postRequest({
        clientUuid: CLIENT_UUID,
        photoId: PHOTO_ID,
        kind: "book",
        author: ADAM_ID,
        clientTz: "Asia/Jerusalem",
        width: prepared.display.width,
        height: prepared.display.height,
        bytes: prepared.display.byteLength,
        colorSpace: prepared.colorSpace,
        checksumSha256: prepared.display.checksumSha256,
      }),
    );

    const row = inserted[0]!;
    expect(row.checksum_sha256).not.toBe(sourceChecksum);
    expect(row.author_member_id).toBe(ADAM_ID);
  });
});

/* ------------------------------------------------------------------ *
 * The bypass this fix exists for
 * ------------------------------------------------------------------ */

/**
 * Wrap the fixture's own Exif payload in a JPEG APP1 segment.
 *
 * The result is a real, GPS-bearing Exif segment in a JPEG container — the
 * exact shape of bytes a session could PUT straight to the signed upload
 * URLs, skipping `preparePhoto`/`assertNoMetadata` entirely, and then name in
 * a commit request that otherwise looks unremarkable. Mirrors the fixture
 * builder in `lib/photo/__tests__/exif-strip.test.ts`.
 */
function jpegCarryingFixtureExif(source: Uint8Array): Uint8Array {
  const block = findExifBlock(source);
  if (!block) throw new Error("The fixture lost its Exif block.");
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

describe("a commit whose stored bytes still carry GPS", () => {
  it("is refused, even though the request itself looks unremarkable", async () => {
    const source = new Uint8Array(await readFile(FIXTURE));

    // The bypass: no `preparePhoto`, no `assertNoMetadata`. Whatever landed
    // at the signed URLs is what storage actually holds — here, a JPEG
    // carrying the fixture's real GPS IFD.
    const gpsBearingJpeg = jpegCarryingFixtureExif(source);
    expect(findMetadataEvidence(gpsBearingJpeg).map((e) => e.kind)).toContain(
      "app1-exif",
    );
    storageObjects.set(photoDisplayPath(PHOTO_ID), toArrayBuffer(gpsBearingJpeg));
    storageObjects.set(photoThumbPath(PHOTO_ID), toArrayBuffer(gpsBearingJpeg));

    const { sha256Hex } = await import("@/lib/photo/checksum");

    const response = await POST(
      postRequest({
        clientUuid: CLIENT_UUID,
        photoId: PHOTO_ID,
        kind: "book",
        author: EVA_ID,
        clientTz: "America/New_York",
        caption: "a checksum computed honestly over dishonest bytes",
        width: 640,
        height: 480,
        bytes: gpsBearingJpeg.byteLength,
        colorSpace: "srgb",
        // The request is otherwise entirely well-formed — a self-computed
        // checksum over the bytes actually uploaded. Nothing about the
        // request shape signals the bypass; only the server's own re-scan of
        // storage does.
        checksumSha256: await sha256Hex(gpsBearingJpeg),
      }),
    );

    // Refused outright, and nothing was written — see `verifyDerivativesAreClean`
    // in `lib/data/photos.ts` for why a plain rejection (rather than a
    // "quarantined" row) is the right shape here.
    expect(response.status).toBe(400);
    expect(inserted).toHaveLength(0);

    const body = (await response.json()) as { error: { kind: string } };
    expect(body.error.kind).toBe("invalid");
  });
});
