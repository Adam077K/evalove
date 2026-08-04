/**
 * DELETE /api/photos/[id] — remove a photo you authored from every view.
 *
 * WHAT THIS DOES. The photo is soft-deleted: hidden from the interface, bytes
 * retained indefinitely. Removal is non-destructive by design — think "remove
 * from view," not "destroy." The tally is unaffected (`v_days_together` filters
 * on `purged_at`, not `deleted_at`), so tidying an old photo cannot retroactively
 * erase a day they both showed up for.
 *
 * WHAT THIS DOES NOT DO — AND WILL NOT. Permanent purge is a deliberate
 * absence, not an unbuilt feature. Founder ruling (2026-08-03): bytes are never
 * destroyed. `purgePhoto` is not imported and is not reachable from any route,
 * now or in the future. The 30-day sweep is not wired and will not be. Do not
 * build it. Any delete UI must not promise propagation or a deletion window —
 * there is nothing to propagate and no destruction coming.
 *
 * IDENTITY LIMITATION. Identity is self-declared in Phase 1 (see `getIdentity`
 * in lib/session/index.ts). This authorises "someone claiming to be Eva", not
 * "Eva" — no weaker than the status quo where any signed-in person can already
 * do anything. It delivers what Vision §6.4 calls for today: either of them can
 * remove what they made, without asking the other. The proven-identity half
 * arrives with B3, which changes only `getIdentity()` — not this file — so this
 * route upgrades for free on that day.
 */

import { z } from "zod";

import { photoDeps, softDeletePhoto } from "@/lib/data";
import { jsonFail, unauthenticated } from "@/lib/data/http";
import { getIdentity, requireSession, UnauthenticatedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid("photo id must be a uuid"),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  // Require a session first. `requireSession` throws `UnauthenticatedError` for
  // any unusable state — no cookie, bad signature, expired, wrong version.
  // Do NOT use `requireSessionOrRedirect` here: a route handler's caller is a
  // `fetch`, not a browser navigation, so a 307 to an HTML login page is the
  // wrong answer. See lib/session/index.ts:127.
  try {
    await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) return unauthenticated();
    throw thrown;
  }

  // Identity tells us who claims to be holding the phone. Null means the person
  // has not tapped a name yet — we cannot check authorship without it.
  const identity = await getIdentity();
  if (identity === null) return unauthenticated();

  const resolvedParams = await params;
  const parsed = paramsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return Response.json(
      { error: { kind: "invalid", message: "invalid photo id" } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const { id } = parsed.data;

  try {
    await softDeletePhoto(photoDeps(), id, identity.memberId);
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (thrown) {
    return jsonFail("DELETE /api/photos/[id]", thrown);
  }
}
