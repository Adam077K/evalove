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

import { findMetadataEvidence } from "@/lib/photo/guard";
import { preparePhoto } from "@/lib/photo/prepare";
import { createNodeCodec } from "@/lib/outbox/__tests__/support/doubles";
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

beforeEach(() => {
  inserted.length = 0;
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
