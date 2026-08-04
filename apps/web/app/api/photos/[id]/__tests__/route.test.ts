/**
 * DELETE /api/photos/[id] — unit tests.
 *
 * No database, no network. The data layer and session layer are both stubbed so
 * this suite tests the route's own decisions: which status codes come back, and
 * that `softDeletePhoto` is called with the right arguments.
 *
 * The seven behaviours under test:
 *
 *   1. No session → 401
 *   2. Session but no declared identity → 401
 *   3. Authored-by-me → 204
 *   4. Authored-by-the-other → 403
 *   5. Unknown photo id → 404
 *   6. Already-removed photo → 204 (idempotent)
 *   7. Malformed id → 400
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ *
 * Hoisted stubs
 * ------------------------------------------------------------------ */

const softDeletePhotoMock = vi.hoisted(() => vi.fn<() => Promise<void>>());
const requireSessionMock = vi.hoisted(() => vi.fn<() => Promise<void>>());
const getIdentityMock = vi.hoisted(() => vi.fn());

/* ------------------------------------------------------------------ *
 * Module mocks
 *
 * `@/lib/data` is mocked entirely: the route handler calls photoDeps() and
 * softDeletePhoto() through it, and neither needs a real gateway in tests.
 *
 * `@/lib/session` is mocked with importActual so the real UnauthenticatedError
 * class is preserved — the route catches `instanceof UnauthenticatedError`, and
 * that check fails silently if the class is a different object.
 * ------------------------------------------------------------------ */

vi.mock("@/lib/data", () => ({
  photoDeps: vi.fn(() => ({})),
  softDeletePhoto: softDeletePhotoMock,
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
import { DELETE } from "@/app/api/photos/[id]/route";

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

// Valid RFC 9562 / Zod v4 UUIDs: version nibble 1-8 at position 13,
// variant nibble 8/9/a/b at position 17. These are UUID v4 fixtures.
const EVA_ID = "550e8400-e29b-41d4-8716-446655440001";
const ADAM_ID = "550e8400-e29b-41d4-8716-446655440002";
const PHOTO_ID = "550e8400-e29b-41d4-8716-446655440000";

function deleteRequest(id: string): Request {
  return new Request(`https://evalove.test/api/photos/${id}`, {
    method: "DELETE",
  });
}

function buildParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

/* ------------------------------------------------------------------ *
 * Setup
 * ------------------------------------------------------------------ */

beforeEach(() => {
  // Clear call history so `.not.toHaveBeenCalled()` only sees the current test.
  softDeletePhotoMock.mockClear();
  requireSessionMock.mockClear();
  getIdentityMock.mockClear();

  // Default: valid session, Eva is holding the phone.
  requireSessionMock.mockResolvedValue(undefined);
  getIdentityMock.mockResolvedValue({
    memberId: EVA_ID,
    source: "self_declared",
  });
  // Default: soft delete succeeds.
  softDeletePhotoMock.mockResolvedValue(undefined);
});

/* ------------------------------------------------------------------ *
 * 1. No session
 * ------------------------------------------------------------------ */

describe("no session", () => {
  it("answers 401", async () => {
    requireSessionMock.mockRejectedValue(new UnauthenticatedError());

    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(response.status).toBe(401);
  });

  it("does not call softDeletePhoto", async () => {
    requireSessionMock.mockRejectedValue(new UnauthenticatedError());

    await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(softDeletePhotoMock).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ *
 * 2. Session but no declared identity
 * ------------------------------------------------------------------ */

describe("session but no identity", () => {
  it("answers 401", async () => {
    getIdentityMock.mockResolvedValue(null);

    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(response.status).toBe(401);
  });
});

/* ------------------------------------------------------------------ *
 * 3. Authored-by-me
 * ------------------------------------------------------------------ */

describe("authored-by-me", () => {
  it("answers 204", async () => {
    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(response.status).toBe(204);
  });

  it("calls softDeletePhoto with the correct memberId", async () => {
    await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(softDeletePhotoMock).toHaveBeenCalledWith(
      expect.anything(), // deps
      PHOTO_ID,
      EVA_ID,
    );
  });

  it("204 response has an empty body", async () => {
    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    // 204 No Content — the body must be empty, not a JSON payload.
    const text = await response.text();
    expect(text).toBe("");
  });
});

/* ------------------------------------------------------------------ *
 * 4. Authored-by-the-other
 * ------------------------------------------------------------------ */

describe("authored-by-the-other", () => {
  it("answers 403", async () => {
    softDeletePhotoMock.mockRejectedValue(
      new DataError("forbidden", "forbidden", { photoId: PHOTO_ID }),
    );

    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(response.status).toBe(403);
  });

  it("body does not reveal whose photo it is", async () => {
    softDeletePhotoMock.mockRejectedValue(
      new DataError("forbidden", "forbidden", { photoId: PHOTO_ID }),
    );

    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));
    const body = await response.json() as { error: { kind: string; message: string } };

    // Status code only — no hint about the other person, no photo author info.
    expect(body.error.kind).toBe("forbidden");
    expect(body.error.message).not.toMatch(/eva|adam|author|owner/i);
  });

  it("works the same way when Adam is holding the phone", async () => {
    getIdentityMock.mockResolvedValue({ memberId: ADAM_ID, source: "self_declared" });
    softDeletePhotoMock.mockRejectedValue(
      new DataError("forbidden", "forbidden", { photoId: PHOTO_ID }),
    );

    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(response.status).toBe(403);
  });
});

/* ------------------------------------------------------------------ *
 * 5. Unknown photo id
 * ------------------------------------------------------------------ */

describe("unknown photo id", () => {
  it("answers 404", async () => {
    softDeletePhotoMock.mockRejectedValue(
      new DataError("not_found", "no such photo", { photoId: PHOTO_ID }),
    );

    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(response.status).toBe(404);
  });
});

/* ------------------------------------------------------------------ *
 * 6. Already-removed photo (idempotent)
 * ------------------------------------------------------------------ */

describe("already-removed photo", () => {
  it("answers 204, not a crash", async () => {
    // softDeletePhoto already handles idempotency internally: a photo with
    // deleted_at !== null returns early. The mock resolves to signal that.
    softDeletePhotoMock.mockResolvedValue(undefined);

    const response = await DELETE(deleteRequest(PHOTO_ID), buildParams(PHOTO_ID));

    expect(response.status).toBe(204);
  });
});

/* ------------------------------------------------------------------ *
 * 7. Malformed id
 * ------------------------------------------------------------------ */

describe("malformed id", () => {
  it("answers 400 for a non-uuid id", async () => {
    const badId = "not-a-uuid";
    const response = await DELETE(deleteRequest(badId), buildParams(badId));

    expect(response.status).toBe(400);
    expect(softDeletePhotoMock).not.toHaveBeenCalled();
  });

  it("answers 400 for an empty id", async () => {
    const response = await DELETE(deleteRequest(""), buildParams(""));

    expect(response.status).toBe(400);
  });
});
