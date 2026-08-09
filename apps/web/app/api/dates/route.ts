/**
 * `GET  /api/dates` — what is between them: proposed, agreed, happened.
 * `POST /api/dates` — propose one.
 *
 * The POST body names a kind, a day and a window. It does NOT name the instant,
 * and a body that tries to is not honoured: `proposeDate` resolves the instant
 * itself from `lib/date-windows`. Same rule, and the same reason, as
 * `POST /api/photos` re-deriving `shared_day` instead of trusting the client's
 * claim about which day a photograph belongs to.
 *
 * The proposer is read from the profile cookie via `getIdentity()`, not from
 * the body. That identity is self-declared and everyone involved knows it — it
 * is attribution, not proof, and it gates nothing here. It is read from the
 * session layer anyway rather than accepted as a parameter, because a body
 * field naming the author is a field a bug can get wrong silently, and because
 * the day this product has real accounts, this route needs no edit.
 */

import { z } from "zod";

import {
  MAX_NOTE_LENGTH,
  dateDeps,
  datesBetweenThem,
  proposeDate,
} from "@/lib/data";
import { DataError } from "@/lib/data/errors";
import { invalidInput, jsonFail, jsonOk, unauthenticated } from "@/lib/data/http";
import { getIdentity, requireSession, UnauthenticatedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const bodySchema = z.object({
  kind: z.string().min(1, "kind is required"),
  sharedDay: z.string().regex(ISO_DATE, "sharedDay must be YYYY-MM-DD"),
  windowId: z.string().regex(/^w[1-9]$/, "windowId must be w1..w9"),
  note: z.string().max(MAX_NOTE_LENGTH).optional(),
});

export async function GET(): Promise<Response> {
  try {
    await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) return unauthenticated();
    throw thrown;
  }

  try {
    return jsonOk(await datesBetweenThem(dateDeps()));
  } catch (thrown) {
    return jsonFail("GET /api/dates", thrown);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) return unauthenticated();
    throw thrown;
  }

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidInput("that is not a date anyone could propose", parsed.error.issues);
    }

    const identity = await getIdentity();
    if (identity === null) {
      // Not a 401 — there IS a session. Nobody has tapped a name, and a
      // proposal with no proposer cannot be answered by "the other one".
      throw new DataError("invalid", "tap a name before proposing a date", {});
    }

    const result = await proposeDate(dateDeps(), {
      ...parsed.data,
      proposedBy: identity.memberId,
    });

    return jsonOk(
      { plan: result.plan, created: result.created },
      result.created ? 201 : 200,
    );
  } catch (thrown) {
    return jsonFail("POST /api/dates", thrown);
  }
}
