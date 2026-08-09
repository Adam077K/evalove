/**
 * Dates they go on: proposing one, answering it, and marking that it happened.
 *
 * Three rules live here and nowhere else.
 *
 * THE INSTANT IS DERIVED, NEVER ACCEPTED. A client sends a kind, a shared day
 * and a window. It does not send `startsAt`, and if it did, this module would
 * ignore it — the instant is resolved here from `lib/date-windows`, the same
 * way `commitPhoto` re-derives `shared_day` rather than trusting a client's
 * claim about which day a photograph belongs to. A client that could name the
 * instant could put a date outside the window both of them agreed on.
 *
 * THE WINDOW MUST FIT THE KIND. Reading aloud until Eva falls asleep is written
 * for the band where she is going to bed and Adam has just got up. Proposing it
 * for Adam's lunchtime is not a preference, it is a mistake, and it is refused
 * here rather than rendered as a card nobody can act on.
 *
 * AN AGREEMENT NEEDS TWO PEOPLE. The one who proposed a date cannot be the one
 * who agrees to it. That is a statement about what an agreement is, not an
 * authorisation check — identity in this product is self-declared and gates
 * nothing (`lib/session`), so this is refused as a `conflict` and never as a
 * `forbidden`. If the wrong name is on the picker, the fix is one tap.
 */

import { placeWindow } from "@/lib/date-windows";
import { dateKind } from "@/lib/dates/kinds";
import { windowById } from "@/lib/shared-day";

import { DataError, isDataError } from "./errors";
import type { DatePlanPatch, DatePlanQuery, DataGateway } from "./gateway";
import { toDatePlan, type DatePlanRow } from "./rows";

import type { WindowId } from "@/lib/shared-day";
import type { DatePlan, DatePlanStatus, IsoDate, Uuid } from "@/lib/types";

export interface DateDeps {
  gateway: DataGateway;
  now: () => Date;
  newId: () => string;
}

/** Nobody needs more than this on one screen, and a bug cannot outgrow it. */
export const MAX_DATE_PLANS_PER_READ = 50;

/** The longest note a proposal may carry. Matches the column's check. */
export const MAX_NOTE_LENGTH = 280;

/** How far ahead a date may be proposed, in days. */
export const MAX_DAYS_AHEAD = 60;

/** PostgreSQL undefined_table. Its own case, because it has its own cause. */
const UNDEFINED_TABLE = "42P01";

/**
 * Turn "the migration has not been applied" into a sentence a person can act on.
 *
 * `date_plans` is the one table in this schema that has never been applied
 * anywhere — it is handed to the founder as SQL to run by hand, and until they
 * run it every write here fails with PostgREST's own wording about a missing
 * relation. That wording sends whoever reads it looking at the query. The cause
 * is three steps earlier and is written down.
 */
function withSchemaHint<T>(operation: string, thrown: unknown): T {
  if (isDataError(thrown) && thrown.detail.code === UNDEFINED_TABLE) {
    throw new DataError(
      "upstream",
      "the dates table is not in this database yet",
      {
        operation,
        code: UNDEFINED_TABLE,
        likelyCause:
          "supabase/migrations/20260810120000_date_plans.sql has not been " +
          "applied. It is Irreversible tier and is applied by the founder by " +
          "hand; see supabase/migrations/README.md.",
      },
      { cause: thrown },
    );
  }
  throw thrown;
}

/* ------------------------------------------------------------------ *
 * Proposing
 * ------------------------------------------------------------------ */

export interface ProposeDateInput {
  /** A slug from `lib/dates/kinds.ts`. */
  kind: string;
  /** The named day, `YYYY-MM-DD`. */
  sharedDay: IsoDate;
  /** One of `w1`..`w9`. */
  windowId: string;
  /** The member proposing it. */
  proposedBy: Uuid;
  note?: string;
}

export interface ProposeDateResult {
  plan: DatePlan;
  /**
   * False when this proposal already existed.
   *
   * A double tap on a flaky connection collides with the partial unique index
   * on (kind, shared_day, window_id), and the row that is already there is
   * returned instead. The caller cannot tell the two apart from `plan` alone,
   * and must not need to — that indistinguishability is the idempotency.
   */
  created: boolean;
}

export async function proposeDate(
  deps: DateDeps,
  input: ProposeDateInput,
): Promise<ProposeDateResult> {
  const kind = dateKind(input.kind);
  if (kind === null) {
    throw new DataError("invalid", "that is not one of the seven kinds", {
      kind: input.kind,
    });
  }

  const band = windowById(input.windowId as WindowId);
  if (band === null) {
    throw new DataError("invalid", "that is not one of the nine windows", {
      windowId: input.windowId,
    });
  }

  if (!kind.windowFit.includes(band.id)) {
    throw new DataError(
      "invalid",
      `${kind.title} does not fit ${band.label}`,
      { kind: kind.slug, windowId: band.id, fits: [...kind.windowFit] },
    );
  }

  if (input.note !== undefined && input.note.length > MAX_NOTE_LENGTH) {
    throw new DataError("invalid", "that note is too long", {
      length: input.note.length,
      max: MAX_NOTE_LENGTH,
    });
  }

  const placed = placeWindow(input.sharedDay, band.id);
  if (placed === null) {
    // `windowById` already succeeded, so this is unreachable through the check
    // above. It stays because `placeWindow` is allowed to say no and swallowing
    // that would turn a real refusal into a date at the epoch.
    throw new DataError("invalid", "that window does not place on that day", {
      sharedDay: input.sharedDay,
      windowId: band.id,
    });
  }

  const now = deps.now();
  if (placed.closesAt.getTime() <= now.getTime()) {
    throw new DataError("invalid", "that window has already closed", {
      sharedDay: input.sharedDay,
      windowId: band.id,
      closesAt: placed.closesAt.toISOString(),
    });
  }

  const daysAhead =
    (placed.opensAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  if (daysAhead > MAX_DAYS_AHEAD) {
    throw new DataError("invalid", "that is too far ahead to plan", {
      sharedDay: input.sharedDay,
      maxDaysAhead: MAX_DAYS_AHEAD,
    });
  }

  const row: DatePlanRow = {
    id: deps.newId(),
    kind: kind.slug,
    status: "proposed",
    proposed_by: input.proposedBy,
    shared_day: input.sharedDay,
    window_id: band.id,
    starts_at: placed.opensAt.toISOString(),
    note: input.note ?? null,
    answered_by: null,
    answered_at: null,
    happened_at: null,
    created_at: now.toISOString(),
  };

  try {
    return { plan: toDatePlan(await deps.gateway.insertDatePlan(row)), created: true };
  } catch (thrown) {
    if (isDataError(thrown) && thrown.kind === "conflict") {
      const existing = await deps.gateway.findLiveDatePlanInSlot({
        kind: kind.slug,
        sharedDay: input.sharedDay,
        windowId: band.id,
      });
      if (existing !== null) {
        return { plan: toDatePlan(existing), created: false };
      }
      // The index refused it and nothing is there to have refused it for. That
      // is a real inconsistency, not a double tap, and it is reported as one.
      throw new DataError(
        "conflict",
        "that slot is taken and the plan holding it cannot be read",
        { kind: kind.slug, sharedDay: input.sharedDay, windowId: band.id },
        { cause: thrown },
      );
    }
    return withSchemaHint("proposeDate", thrown);
  }
}

/* ------------------------------------------------------------------ *
 * Answering
 * ------------------------------------------------------------------ */

export type DateAnswer = "agreed" | "declined";

export interface AnswerDateInput {
  answer: DateAnswer;
  /** The member answering. Must not be the one who proposed it. */
  answeredBy: Uuid;
}

export async function answerDatePlan(
  deps: DateDeps,
  planId: Uuid,
  input: AnswerDateInput,
): Promise<DatePlan> {
  const row = await readPlan(deps, planId, "answerDatePlan");

  if (row.status !== "proposed") {
    throw new DataError(
      "conflict",
      row.status === "declined"
        ? "that one already has an answer"
        : "that one is already agreed",
      { planId, status: row.status },
    );
  }

  if (row.proposed_by === input.answeredBy) {
    // See the file header: a rule about what an agreement is, not a check on
    // an identity this product does not prove.
    throw new DataError("conflict", "the other one answers this", {
      planId,
      proposedBy: row.proposed_by,
    });
  }

  const at = deps.now().toISOString();
  const patch: DatePlanPatch = {
    status: input.answer,
    answered_by: input.answeredBy,
    answered_at: at,
  };

  const updated = await deps.gateway.updateDatePlan(planId, patch);
  if (updated === null) {
    throw new DataError("not_found", "no such date", { planId });
  }
  return toDatePlan(updated);
}

/* ------------------------------------------------------------------ *
 * Marking that it happened
 * ------------------------------------------------------------------ */

/**
 * Mark an agreed date as having happened.
 *
 * Only from `agreed`, and only by hand. Nothing computes this from the clock:
 * a date whose hour has passed is not evidence that either of them was there,
 * and a job that decided otherwise would be exactly the kind of verdict this
 * schema refuses to let anything write.
 */
export async function markDateHappened(
  deps: DateDeps,
  planId: Uuid,
): Promise<DatePlan> {
  const row = await readPlan(deps, planId, "markDateHappened");

  if (row.status !== "agreed") {
    throw new DataError(
      "conflict",
      row.status === "happened"
        ? "that one is already marked"
        : "only an agreed date can be marked",
      { planId, status: row.status },
    );
  }

  const updated = await deps.gateway.updateDatePlan(planId, {
    status: "happened",
    happened_at: deps.now().toISOString(),
  });
  if (updated === null) {
    throw new DataError("not_found", "no such date", { planId });
  }
  return toDatePlan(updated);
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

export interface ListDatePlansInput {
  statuses?: readonly DatePlanStatus[];
  sharedDay?: IsoDate;
  startingAtOrAfter?: Date;
  limit?: number;
}

export async function listDatePlans(
  deps: DateDeps,
  input: ListDatePlansInput = {},
): Promise<DatePlan[]> {
  const query: DatePlanQuery = {
    limit: Math.min(input.limit ?? MAX_DATE_PLANS_PER_READ, MAX_DATE_PLANS_PER_READ),
    ...(input.statuses !== undefined ? { statuses: input.statuses } : {}),
    ...(input.sharedDay !== undefined ? { sharedDay: input.sharedDay } : {}),
    ...(input.startingAtOrAfter !== undefined
      ? { startingAtOrAfter: input.startingAtOrAfter.toISOString() }
      : {}),
  };

  try {
    const rows = await deps.gateway.listDatePlans(query);
    return rows.map(toDatePlan);
  } catch (thrown) {
    return withSchemaHint("listDatePlans", thrown);
  }
}

/** What is between them: everything unanswered or agreed, soonest first. */
export interface DatesBetweenThem {
  /** Asked, not yet answered. The thing the other one has to do something about. */
  proposed: DatePlan[];
  /** Said yes to. These are going to happen. */
  agreed: DatePlan[];
  /** Happened. Each one names the day whose photographs are its page. */
  happened: DatePlan[];
}

/**
 * The whole Dates screen in one read.
 *
 * Three lists rather than one, because the screen treats them as three
 * different objects and a single sorted array would make every consumer
 * re-derive the split. One query: the statuses are filtered in PostgREST and
 * partitioned here.
 */
export async function datesBetweenThem(
  deps: DateDeps,
  input: { limit?: number } = {},
): Promise<DatesBetweenThem> {
  const plans = await listDatePlans(deps, {
    statuses: ["proposed", "agreed", "happened"],
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  });

  return {
    proposed: plans.filter((p) => p.status === "proposed"),
    agreed: plans.filter((p) => p.status === "agreed"),
    // Most recent first: a page they have already made is looked back at, not
    // forward to, so the newest is the one worth putting nearest.
    happened: plans
      .filter((p) => p.status === "happened")
      .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1)),
  };
}

/**
 * The dates that left photographs on one shared day.
 *
 * The other half of the link the migration describes: `date_plans.shared_day`
 * read the other way round. A day with no date on it returns an empty array,
 * which is the ordinary case and not a failure.
 */
export async function datesOnDay(
  deps: DateDeps,
  sharedDay: IsoDate,
): Promise<DatePlan[]> {
  return await listDatePlans(deps, {
    sharedDay,
    statuses: ["happened"],
  });
}

/* ------------------------------------------------------------------ */

async function readPlan(
  deps: DateDeps,
  planId: Uuid,
  operation: string,
): Promise<DatePlanRow> {
  let row: DatePlanRow | null;
  try {
    row = await deps.gateway.findDatePlanById(planId);
  } catch (thrown) {
    return withSchemaHint(operation, thrown);
  }
  if (row === null) throw new DataError("not_found", "no such date", { planId });
  return row;
}
