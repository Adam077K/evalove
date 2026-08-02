/**
 * The HTTP shapes the photo routes return.
 *
 * Kept out of the route files for one reason: it makes them testable. A route
 * handler reaches for `cookies()` and for the environment the moment it is
 * imported, so a test cannot hold one. The functions here take their
 * dependencies as arguments and return a real `Response`, so the headers a
 * caller will actually receive can be asserted directly — which matters most
 * for the one header this product's offline story depends on.
 */

import { DataError, isDataError, statusOf } from "./errors";
import { readPhotoBytes, type PhotoDeps, type PhotoVariant } from "./photos";

/* ------------------------------------------------------------------ *
 * JSON
 * ------------------------------------------------------------------ */

export function jsonOk(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    // An API answer is never cacheable here: every one of them is about what
    // is true right now, and there is exactly one client.
    headers: { "cache-control": "no-store" },
  });
}

/**
 * Turn a thrown value into a response, and log it once, structured.
 *
 * The message that reaches the client is the `DataError`'s own — those are
 * written to be read by the person holding the phone. Anything that is not a
 * `DataError` is a bug, and its message is NOT forwarded: an unexpected
 * exception's text is as likely to contain a connection string as an
 * explanation.
 */
export function jsonFail(operation: string, thrown: unknown): Response {
  if (isDataError(thrown)) {
    console.error(
      JSON.stringify({
        level: "error",
        operation,
        kind: thrown.kind,
        message: thrown.message,
        detail: thrown.detail,
      }),
    );
    return Response.json(
      { error: { kind: thrown.kind, message: thrown.message } },
      { status: statusOf(thrown.kind), headers: { "cache-control": "no-store" } },
    );
  }

  console.error(
    JSON.stringify({
      level: "error",
      operation,
      kind: "unhandled",
      message: thrown instanceof Error ? thrown.message : String(thrown),
      stack: thrown instanceof Error ? thrown.stack : undefined,
    }),
  );
  return Response.json(
    { error: { kind: "unhandled", message: "something went wrong" } },
    { status: 500, headers: { "cache-control": "no-store" } },
  );
}

/**
 * 400 for input that never reached the data layer.
 *
 * Zod's issues are forwarded — field path and message, nothing else. There is
 * one client and it is ours; telling it exactly which field it got wrong turns
 * a debugging session into a glance at the network tab.
 */
export function invalidInput(
  message: string,
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Response {
  return Response.json(
    {
      error: {
        kind: "invalid",
        message,
        issues: issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
    },
    { status: 400, headers: { "cache-control": "no-store" } },
  );
}

/** 401, in the one shape every route uses. */
export function unauthenticated(): Response {
  return Response.json(
    { error: { kind: "unauthenticated", message: "sign in first" } },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}

/* ------------------------------------------------------------------ *
 * The photo proxy
 * ------------------------------------------------------------------ */

/**
 * THE HEADER THE OFFLINE BOOK IS BUILT ON.
 *
 * `private` — this is one couple's photograph. It may sit in their browser's
 * cache and in their service worker; it may not sit in a CDN edge cache or in
 * a corporate proxy, both of which would serve it to whoever asked next.
 *
 * `max-age=31536000, immutable` — the bytes at `/p/{id}/display.jpg` never
 * change. `immutable` tells the browser not to revalidate even on a reload,
 * which is what lets the service worker answer from cache with no network at
 * all. That is Eva's commute: a book that opens on a subway platform with no
 * signal, because every image it needs is already on the phone under a URL
 * that will never rotate.
 *
 * This is the second half of the argument against signed read URLs. The first
 * half is that a signed URL is a bearer token in a URL — leak it in a log line,
 * a screenshot or a `Referer` header and anyone holding it can fetch the photo
 * for the life of the token. The second half is this header: a rotating query
 * string is a different cache key every time, so `CacheFirst` never hits and
 * the offline book quietly stops working. A cookie-gated proxy on a stable path
 * fixes both, at the cost of the bytes passing through a function on the way
 * out — which is a cost worth paying for a two-person app, and is the only
 * direction the bytes are allowed to take that route. Uploads still go direct.
 */
export const PHOTO_CACHE_CONTROL = "private, max-age=31536000, immutable";

/**
 * `GET /p/{photoId}/{variant}.jpg`, as a `Response`.
 *
 * The caller has already established that there is a session. Authorisation is
 * checked on EVERY request — there is no token that makes a later request
 * cheaper, because a token that made a later request cheaper is a token that
 * makes a leaked URL work.
 */
export async function photoObjectResponse(
  deps: PhotoDeps,
  photoId: string,
  variant: PhotoVariant,
): Promise<Response> {
  const { body, contentType } = await readPhotoBytes(deps, photoId, variant);

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-length": String(body.byteLength),
      "cache-control": PHOTO_CACHE_CONTROL,
      // The path is a uuid and a fixed variant name, so the bytes behind it
      // never change; the etag is the path's own identity and costs nothing.
      etag: `"${photoId}-${variant}"`,
      // Belt and braces against a cache that ignores `private`: never let this
      // response be reused for a different signed-in identity.
      vary: "cookie",
    },
  });
}

/** The variant a `/p/` path segment names, or `null` if it names nothing. */
export function variantOf(segment: string): PhotoVariant | null {
  if (segment === "display.jpg") return "display";
  if (segment === "thumb.jpg") return "thumb";
  return null;
}

/* ------------------------------------------------------------------ *
 * Request details
 * ------------------------------------------------------------------ */

/**
 * The caller's IP, for the purge audit.
 *
 * Vercel sets `x-forwarded-for` and it is the only source available inside a
 * route handler. It is spoofable in general; behind Vercel's proxy the
 * left-most entry is the one the platform observed, and for an audit row whose
 * other identity field is explicitly self-declared, that is the right level of
 * confidence to record. `null` rather than a guess when there is no header.
 */
export function clientIpOf(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first !== undefined && first !== "" ? first : null;
}

/** Re-exported so route files import errors and responses from one place. */
export { DataError };
