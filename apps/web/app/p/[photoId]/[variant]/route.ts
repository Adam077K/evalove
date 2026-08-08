/**
 * GET /p/{photoId}/{variant}.jpg — the ordinary photo proxy.
 *
 * `lib/data/http.ts` already carries the whole argument for why this is a
 * cookie-gated proxy rather than a signed URL (§5.4 of
 * `docs/03-system-design/LDR-APP-ARCHITECTURE.md`) — `photoObjectResponse`
 * and `variantOf` were built there and are unmounted until this file exists.
 * This route is the mount point and does nothing else: authorise, parse the
 * two path segments, hand off.
 *
 * This is the read half of the photo path. It is what `lib/fixtures/resolve.ts`
 * points at once it stops returning picsum URLs — without it, that swap would
 * trade one placeholder for a 404.
 *
 * Not covered by this route: `/v/{id}.jpg`, the vault's own proxy. That is a
 * structurally separate namespace (§5.5) behind its own re-authentication
 * (§5.6, `vault_claim`) and is not built here — it is out of scope for wiring
 * the ordinary photo path and touches privacy guarantees this task has no
 * mandate to change.
 */

import { z } from "zod";

import { photoDeps } from "@/lib/data";
import {
  invalidInput,
  jsonFail,
  photoObjectResponse,
  unauthenticated,
  variantOf,
} from "@/lib/data/http";
import { requireSession, UnauthenticatedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  // UUID *shape*, deliberately not `z.uuid()`. Ids written by `tools/ingest`
  // are derived from the source filename so that re-running the loader is
  // idempotent, which means their version and variant nibbles are whatever
  // the hash produced rather than RFC 4122's. Postgres stores those happily;
  // `z.uuid()` rejected roughly half of them, and the archive rendered with
  // holes in it. This check exists to reject garbage before it reaches a
  // database lookup, and a hex shape does that: the id is a key into our own
  // table, an unknown one simply misses, and `requireSession()` above already
  // decided whether this person may see anything at all.
  photoId: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "photo id must be a uuid",
    ),
  variant: z.string().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string; variant: string }> },
): Promise<Response> {
  // Same rule as every other route here: authorisation is checked on every
  // request, not once at signing time. See `photoObjectResponse`'s own
  // header comment for why that is the point of this proxy existing at all.
  try {
    await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) return unauthenticated();
    throw thrown;
  }

  const resolvedParams = await params;
  const parsed = paramsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return invalidInput("invalid photo path", parsed.error.issues);
  }

  const variant = variantOf(parsed.data.variant);
  if (variant === null) {
    return Response.json(
      { error: { kind: "invalid", message: "unknown photo variant" } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    return await photoObjectResponse(photoDeps(), parsed.data.photoId, variant);
  } catch (thrown) {
    return jsonFail("GET /p/[photoId]/[variant]", thrown);
  }
}
