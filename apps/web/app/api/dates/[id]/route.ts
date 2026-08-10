/**
 * `PATCH /api/dates/[id]` — answer a proposal, or mark that a date happened.
 *
 * Three verbs, one route, because they are three transitions of one row and
 * splitting them into three paths would make the state machine something a
 * reader has to reassemble from a directory listing:
 *
 *   { "answer": "agreed"   }  proposed → agreed
 *   { "answer": "declined" }  proposed → declined
 *   { "happened": true     }  agreed   → happened
 *
 * There is no transition out of `agreed` back to `proposed`, and none out of
 * `happened` at all. Changing when a date is means proposing a different one —
 * `lib/data/gateway.ts`'s `DatePlanPatch` cannot express a change to the kind,
 * the day, the window or the instant, so nothing reachable from this route can
 * quietly move a date either of them has already said yes to.
 *
 * IDENTITY LIMITATION, same as `DELETE /api/photos/[id]`. `getIdentity()` is
 * self-declared in Phase 1 and this route authorises "someone claiming to be
 * Eva", not Eva. The rule that the proposer cannot answer their own proposal is
 * enforced in `lib/data/dates.ts` as a `conflict` rather than a `forbidden`,
 * precisely so nobody reads it as an authorisation boundary it is not.
 */

import { z } from "zod";

import { answerDatePlan, dateDeps, markDateHappened } from "@/lib/data";
import { DataError } from "@/lib/data/errors";
import { invalidInput, jsonFail, jsonOk, unauthenticated } from "@/lib/data/http";
import { getIdentity, requireSession, UnauthenticatedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid("date id must be a uuid"),
});

/**
 * Exactly one of the two verbs, never both and never neither.
 *
 * A union rather than two optional fields: `{}` and `{ answer, happened }` are
 * both refused by the parser, so no branch below has to decide what an empty or
 * a contradictory patch means. `patchBookEntry` refuses an empty patch for the
 * same reason — a PATCH that changes nothing is a client sending the wrong
 * field name, and answering 200 to it ships that bug.
 */
const bodySchema = z.union([
  z.object({ answer: z.enum(["agreed", "declined"]) }).strict(),
  z.object({ happened: z.literal(true) }).strict(),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) return unauthenticated();
    throw thrown;
  }

  try {
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return invalidInput("that is not a date id", parsedParams.error.issues);
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidInput(
        "say either how it was answered or that it happened",
        parsed.error.issues,
      );
    }

    const deps = dateDeps();

    if ("happened" in parsed.data) {
      return jsonOk({ plan: await markDateHappened(deps, parsedParams.data.id) });
    }

    const identity = await getIdentity();
    if (identity === null) {
      // There is a session; nobody has tapped a name. An answer with no
      // answerer cannot be checked against "the other one", and recording it
      // anonymously would make `answered_by` a field that sometimes lies.
      throw new DataError("invalid", "tap a name before answering", {});
    }

    return jsonOk({
      plan: await answerDatePlan(deps, parsedParams.data.id, {
        answer: parsed.data.answer,
        answeredBy: identity.memberId,
      }),
    });
  } catch (thrown) {
    return jsonFail("PATCH /api/dates/[id]", thrown);
  }
}
