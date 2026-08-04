/**
 * GET /p/[photoId]/[variant] — unit tests.
 *
 * `photoObjectResponse` itself (the byte-serving logic, the cache headers) is
 * not re-tested here — it is tested where it is defined. This file tests only
 * what this route file adds: authorisation, path parsing, and that a bad
 * variant segment is refused before `photoObjectResponse` is ever called.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ *
 * Hoisted stubs
 * ------------------------------------------------------------------ */

const photoObjectResponseMock = vi.hoisted(() => vi.fn());
const requireSessionMock = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock("@/lib/data", () => ({
  photoDeps: () => ({}),
}));

vi.mock("@/lib/data/http", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/data/http")>();
  return { ...actual, photoObjectResponse: photoObjectResponseMock };
});

vi.mock("@/lib/session", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/session")>();
  return { ...actual, requireSession: requireSessionMock };
});

/* ------------------------------------------------------------------ *
 * Import after mocks are declared
 * ------------------------------------------------------------------ */

import { DataError } from "@/lib/data/errors";
import { UnauthenticatedError } from "@/lib/session";
import { GET } from "@/app/p/[photoId]/[variant]/route";

const PHOTO_ID = "550e8400-e29b-41d4-8716-446655440000";

function getRequest(photoId: string, variant: string): Request {
  return new Request(`https://evalove.test/p/${photoId}/${variant}`);
}

function buildParams(
  photoId: string,
  variant: string,
): { params: Promise<{ photoId: string; variant: string }> } {
  return { params: Promise.resolve({ photoId, variant }) };
}

beforeEach(() => {
  photoObjectResponseMock.mockReset();
  requireSessionMock.mockReset();
  requireSessionMock.mockResolvedValue(undefined);
  photoObjectResponseMock.mockResolvedValue(
    new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    }),
  );
});

describe("no session", () => {
  it("answers 401 and never calls photoObjectResponse", async () => {
    requireSessionMock.mockRejectedValue(new UnauthenticatedError());

    const response = await GET(
      getRequest(PHOTO_ID, "display.jpg"),
      buildParams(PHOTO_ID, "display.jpg"),
    );

    expect(response.status).toBe(401);
    expect(photoObjectResponseMock).not.toHaveBeenCalled();
  });
});

describe("a malformed photo id", () => {
  it("answers 400 and never calls photoObjectResponse", async () => {
    const response = await GET(
      getRequest("not-a-uuid", "display.jpg"),
      buildParams("not-a-uuid", "display.jpg"),
    );

    expect(response.status).toBe(400);
    expect(photoObjectResponseMock).not.toHaveBeenCalled();
  });
});

describe("an unknown variant", () => {
  it("answers 400 for a segment that names no real variant", async () => {
    const response = await GET(
      getRequest(PHOTO_ID, "original.jpg"),
      buildParams(PHOTO_ID, "original.jpg"),
    );

    expect(response.status).toBe(400);
    expect(photoObjectResponseMock).not.toHaveBeenCalled();
  });
});

describe("display.jpg and thumb.jpg", () => {
  it("resolves display.jpg to the display variant", async () => {
    await GET(getRequest(PHOTO_ID, "display.jpg"), buildParams(PHOTO_ID, "display.jpg"));

    expect(photoObjectResponseMock).toHaveBeenCalledWith(
      expect.anything(),
      PHOTO_ID,
      "display",
    );
  });

  it("resolves thumb.jpg to the thumb variant", async () => {
    await GET(getRequest(PHOTO_ID, "thumb.jpg"), buildParams(PHOTO_ID, "thumb.jpg"));

    expect(photoObjectResponseMock).toHaveBeenCalledWith(
      expect.anything(),
      PHOTO_ID,
      "thumb",
    );
  });

  it("returns exactly the response photoObjectResponse produced", async () => {
    const response = await GET(
      getRequest(PHOTO_ID, "display.jpg"),
      buildParams(PHOTO_ID, "display.jpg"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });
});

describe("a photo that does not exist", () => {
  it("answers 404", async () => {
    photoObjectResponseMock.mockRejectedValue(
      new DataError("not_found", "no such photo", { photoId: PHOTO_ID }),
    );

    const response = await GET(
      getRequest(PHOTO_ID, "display.jpg"),
      buildParams(PHOTO_ID, "display.jpg"),
    );

    expect(response.status).toBe(404);
  });
});
