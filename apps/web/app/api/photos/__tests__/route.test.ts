/**
 * POST /api/photos — the route's own decisions.
 *
 * No database, no network: `@/lib/data` is mocked entirely. This suite tests
 * status codes, validation, and the one translation this route does — the
 * outbox's `author` (a member row id) resolved against the roster into the
 * slug `commitPhoto` expects. See the file header of `../route.ts` for why
 * that translation exists.
 *
 * The physical acceptance test — a real GPS-bearing HEIC through the real
 * `commitPhoto`, verifying the checksum this route commits names EXIF-free
 * bytes — lives in `route.gps-integration.test.ts`. It needs the real data
 * layer rather than this file's stub, so it is a separate file: Vitest's
 * `vi.mock` for a given module path is file-scoped, not describe-scoped.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ *
 * Hoisted stubs
 * ------------------------------------------------------------------ */

const commitPhotoMock = vi.hoisted(() => vi.fn());
const requireSessionMock = vi.hoisted(() => vi.fn<() => Promise<void>>());
const getIdentityMock = vi.hoisted(() => vi.fn());
const listMembersMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data", () => ({
  photoDeps: () => ({ gateway: { listMembers: listMembersMock } }),
  commitPhoto: commitPhotoMock,
}));

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

import { DataError } from "@/lib/data/errors";
import { UnauthenticatedError } from "@/lib/session";
import { POST } from "@/app/api/photos/route";
import type { MemberRow } from "@/lib/data/gateway";

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const EVA_ID = "550e8400-e29b-41d4-8716-446655440001";
const ADAM_ID = "550e8400-e29b-41d4-8716-446655440002";
const PHOTO_ID = "550e8400-e29b-41d4-8716-446655440000";
const CLIENT_UUID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

const ROSTER: MemberRow[] = [
  {
    id: EVA_ID,
    slug: "eva",
    display_name: "Eva",
    home_timezone: "America/New_York",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: ADAM_ID,
    slug: "adam",
    display_name: "Adam",
    home_timezone: "Asia/Jerusalem",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    clientUuid: CLIENT_UUID,
    photoId: PHOTO_ID,
    kind: "book",
    author: EVA_ID,
    clientTz: "America/New_York",
    caption: "a small thing, for you",
    width: 320,
    height: 240,
    bytes: 12345,
    colorSpace: "srgb",
    checksumSha256: "a".repeat(64),
    // What the outbox sends for its own bookkeeping; the route must ignore it.
    sharedDay: "1999-01-01",
    sharedDayTz: "Pacific/Kiritimati",
    ...overrides,
  };
}

function postRequest(body: unknown): Request {
  return new Request("https://evalove.test/api/photos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ *
 * Setup
 * ------------------------------------------------------------------ */

beforeEach(() => {
  commitPhotoMock.mockReset();
  requireSessionMock.mockReset();
  getIdentityMock.mockReset();
  listMembersMock.mockReset();

  requireSessionMock.mockResolvedValue(undefined);
  getIdentityMock.mockResolvedValue({ memberId: EVA_ID, source: "self_declared" });
  listMembersMock.mockResolvedValue(ROSTER);
  commitPhotoMock.mockResolvedValue({
    photo: { id: PHOTO_ID, checksumSha256: "a".repeat(64) },
    created: true,
  });
});

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

describe("no session", () => {
  it("answers 401 and never reaches commitPhoto", async () => {
    requireSessionMock.mockRejectedValue(new UnauthenticatedError());

    const response = await POST(postRequest(validBody()));

    expect(response.status).toBe(401);
    expect(commitPhotoMock).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

describe("a malformed body", () => {
  it("400s when a required field is missing", async () => {
    const { checksumSha256: _drop, ...incomplete } = validBody();
    const response = await POST(postRequest(incomplete));

    expect(response.status).toBe(400);
    expect(commitPhotoMock).not.toHaveBeenCalled();
  });

  it("400s a checksum that is not 64 hex characters", async () => {
    const response = await POST(postRequest(validBody({ checksumSha256: "nope" })));

    expect(response.status).toBe(400);
    expect(commitPhotoMock).not.toHaveBeenCalled();
  });

  it("400s a clientUuid that is not a uuid", async () => {
    const response = await POST(postRequest(validBody({ clientUuid: "not-a-uuid" })));

    expect(response.status).toBe(400);
    expect(commitPhotoMock).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ *
 * The Uuid → slug translation
 * ------------------------------------------------------------------ */

describe("the author translation", () => {
  it("400s an author that is not on the roster, and never reaches commitPhoto", async () => {
    const strangerId = "00000000-0000-4000-8000-000000000000";

    const response = await POST(postRequest(validBody({ author: strangerId })));

    expect(response.status).toBe(400);
    expect(commitPhotoMock).not.toHaveBeenCalled();
  });

  it("translates the author's row id to their slug before calling commitPhoto", async () => {
    await POST(postRequest(validBody({ author: ADAM_ID })));

    expect(commitPhotoMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ author: "adam" }),
      expect.anything(),
    );
  });

  it("never forwards the outbox's own sharedDay/sharedDayTz bookkeeping fields", async () => {
    await POST(postRequest(validBody()));

    const [, input] = commitPhotoMock.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(input).not.toHaveProperty("sharedDay");
    expect(input).not.toHaveProperty("sharedDayTz");
  });
});

/* ------------------------------------------------------------------ *
 * Idempotency status codes
 * ------------------------------------------------------------------ */

describe("idempotency", () => {
  it("answers 201 when a new row was created", async () => {
    commitPhotoMock.mockResolvedValue({ photo: { id: PHOTO_ID }, created: true });

    const response = await POST(postRequest(validBody()));

    expect(response.status).toBe(201);
    const body = (await response.json()) as { created: boolean };
    expect(body.created).toBe(true);
  });

  it("answers 200, not 201, on a replayed clientUuid", async () => {
    commitPhotoMock.mockResolvedValue({ photo: { id: PHOTO_ID }, created: false });

    const response = await POST(postRequest(validBody()));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { created: boolean };
    expect(body.created).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * Errors from the data layer pass through honestly
 * ------------------------------------------------------------------ */

describe("a DataError from commitPhoto", () => {
  it("keeps its status code", async () => {
    commitPhotoMock.mockRejectedValue(
      new DataError("invalid", 'no member with slug "eva"', {}),
    );

    const response = await POST(postRequest(validBody()));

    expect(response.status).toBe(400);
  });
});
