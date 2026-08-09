import { beforeEach, describe, expect, it } from "vitest";

import { placeWindow } from "@/lib/date-windows";
import { DATE_KINDS } from "@/lib/dates/kinds";

import { DataError, isDataError } from "../errors";
import {
  MAX_DAYS_AHEAD,
  answerDatePlan,
  datesBetweenThem,
  datesOnDay,
  listDatePlans,
  markDateHappened,
  proposeDate,
  type DateDeps,
} from "../dates";
import { ADAM_ROW, EVA_ROW, datePlanRow, fakeGateway } from "./fake-gateway";

import type { DatePlanRow } from "../rows";

/**
 * A fixed clock, well before the window under test opens.
 *
 * 2026-08-14 is an ordinary day in both zones — no DST transition in either —
 * so every instant below is arithmetic anyone can check by hand, and the
 * transition behaviour is tested where it belongs, in `lib/date-windows`.
 */
const NOW = new Date("2026-08-14T10:00:00.000Z");
const DAY = "2026-08-14";

let ids = 0;

function deps(gateway = fakeGateway(), now: Date = NOW): DateDeps & {
  gateway: ReturnType<typeof fakeGateway>;
} {
  return {
    gateway,
    now: () => now,
    newId: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, "0")}`,
  };
}

beforeEach(() => {
  ids = 0;
});

describe("proposeDate", () => {
  it("derives the instant from the window rather than accepting one", async () => {
    const d = deps();
    const { plan, created } = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });

    // Computed independently here, from the module that owns the maths.
    const placed = placeWindow(DAY, "w6");
    expect(placed).not.toBeNull();
    expect(plan.startsAt).toBe(placed?.opensAt.toISOString());
    // And it really is the wall clock both of them will read: 19:00 in Tel
    // Aviv, 12:00 in New York.
    expect(plan.startsAt).toBe("2026-08-14T16:00:00.000Z");
    expect(created).toBe(true);
    expect(plan.status).toBe("proposed");
    expect(plan.proposedBy).toBe(EVA_ROW.id);
  });

  it("stores the day and the window as agreed, not only the instant", async () => {
    const d = deps();
    const { plan } = await proposeDate(d, {
      kind: "two-kitchens",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: ADAM_ROW.id,
    });
    expect(plan.sharedDay).toBe(DAY);
    expect(plan.windowId).toBe("w6");
  });

  it("carries a note when there is one, and no key when there is not", async () => {
    const d = deps();
    const withNote = await proposeDate(d, {
      kind: "two-kitchens",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
      note: "the one with the anchovies",
    });
    expect(withNote.plan.note).toBe("the one with the anchovies");

    const without = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });
    expect("note" in without.plan).toBe(false);
  });

  it("refuses a kind that is not one of the seven", async () => {
    await expect(
      proposeDate(deps(), {
        kind: "a-picnic",
        sharedDay: DAY,
        windowId: "w6",
        proposedBy: EVA_ROW.id,
      }),
    ).rejects.toMatchObject({ kind: "invalid" });
  });

  it("refuses a window that is not one of the nine", async () => {
    await expect(
      proposeDate(deps(), {
        kind: "an-hour-that-ends",
        sharedDay: DAY,
        windowId: "w42",
        proposedBy: EVA_ROW.id,
      }),
    ).rejects.toMatchObject({ kind: "invalid" });
  });

  it("refuses a window the kind is not written for", async () => {
    // `read-until-she-sleeps` fits w1 only — Eva going to bed, Adam just up.
    // w6 is Adam's evening, which is not that.
    const thrown = await proposeDate(deps(), {
      kind: "read-until-she-sleeps",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: ADAM_ROW.id,
    }).catch((e: unknown) => e);

    expect(isDataError(thrown)).toBe(true);
    expect((thrown as DataError).kind).toBe("invalid");
    expect((thrown as DataError).message).toContain("Reading aloud");
  });

  it("accepts every kind in its own declared windows", async () => {
    // The mirror of the test above: proves the fit check is a real filter and
    // not a blanket refusal that the previous test would also pass against.
    // Before the shared day opens at all (local midnight in Tel Aviv is
    // 2026-08-13T21:00Z), so every one of the nine bands is still ahead.
    for (const kind of DATE_KINDS) {
      for (const windowId of kind.windowFit) {
        const d = deps(fakeGateway(), new Date("2026-08-13T12:00:00.000Z"));
        const { plan } = await proposeDate(d, {
          kind: kind.slug,
          sharedDay: DAY,
          windowId,
          proposedBy: EVA_ROW.id,
        });
        expect(plan.kind).toBe(kind.slug);
      }
    }
  });

  it("refuses a window that has already closed", async () => {
    // w6 closes at 22:00 in Tel Aviv, which is 19:00Z.
    const late = deps(fakeGateway(), new Date("2026-08-14T20:00:00.000Z"));
    await expect(
      proposeDate(late, {
        kind: "an-hour-that-ends",
        sharedDay: DAY,
        windowId: "w6",
        proposedBy: EVA_ROW.id,
      }),
    ).rejects.toMatchObject({ kind: "invalid" });
  });

  it("allows a window that is open right now", async () => {
    // Same window, one hour in. A date can be proposed for the hour they are
    // already in — that is the most common way this gets used.
    const during = deps(fakeGateway(), new Date("2026-08-14T17:00:00.000Z"));
    const { plan } = await proposeDate(during, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });
    expect(plan.status).toBe("proposed");
  });

  it("refuses a day too far ahead to plan", async () => {
    await expect(
      proposeDate(deps(), {
        kind: "an-hour-that-ends",
        sharedDay: "2026-12-01",
        windowId: "w6",
        proposedBy: EVA_ROW.id,
      }),
    ).rejects.toMatchObject({ kind: "invalid" });
  });

  it("allows a day inside the planning horizon", async () => {
    const soon = deps();
    const { plan } = await proposeDate(soon, {
      kind: "an-hour-that-ends",
      sharedDay: "2026-09-01",
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });
    expect(plan.sharedDay).toBe("2026-09-01");
    expect(MAX_DAYS_AHEAD).toBeGreaterThan(17);
  });

  it("answers a double tap with the proposal that is already there", async () => {
    const d = deps();
    const first = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });
    const second = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.plan.id).toBe(first.plan.id);
    expect(d.gateway.datePlans).toHaveLength(1);
  });

  it("lets a declined proposal be asked again", async () => {
    const d = deps();
    const first = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });
    await answerDatePlan(d, first.plan.id, {
      answer: "declined",
      answeredBy: ADAM_ROW.id,
    });

    const again = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: ADAM_ROW.id,
    });
    expect(again.created).toBe(true);
    expect(again.plan.id).not.toBe(first.plan.id);
  });
});

describe("answerDatePlan", () => {
  async function proposed(d: ReturnType<typeof deps>): Promise<string> {
    const { plan } = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });
    return plan.id;
  }

  it("records who agreed and when", async () => {
    const d = deps();
    const id = await proposed(d);
    const plan = await answerDatePlan(d, id, {
      answer: "agreed",
      answeredBy: ADAM_ROW.id,
    });

    expect(plan.status).toBe("agreed");
    expect(plan.answeredBy).toBe(ADAM_ROW.id);
    expect(plan.answeredAt).toBe(NOW.toISOString());
    expect(plan.happenedAt).toBeUndefined();
  });

  it("records a decline the same way, and deletes nothing", async () => {
    const d = deps();
    const id = await proposed(d);
    const plan = await answerDatePlan(d, id, {
      answer: "declined",
      answeredBy: ADAM_ROW.id,
    });
    expect(plan.status).toBe("declined");
    expect(d.gateway.datePlans).toHaveLength(1);
  });

  it("refuses the proposer answering their own proposal", async () => {
    const d = deps();
    const id = await proposed(d);
    await expect(
      answerDatePlan(d, id, { answer: "agreed", answeredBy: EVA_ROW.id }),
    ).rejects.toMatchObject({ kind: "conflict" });
  });

  it("refuses a second answer", async () => {
    const d = deps();
    const id = await proposed(d);
    await answerDatePlan(d, id, { answer: "agreed", answeredBy: ADAM_ROW.id });
    await expect(
      answerDatePlan(d, id, { answer: "declined", answeredBy: ADAM_ROW.id }),
    ).rejects.toMatchObject({ kind: "conflict" });
  });

  it("says not_found for a date that is not there", async () => {
    await expect(
      answerDatePlan(deps(), "00000000-0000-4000-8000-999999999999", {
        answer: "agreed",
        answeredBy: ADAM_ROW.id,
      }),
    ).rejects.toMatchObject({ kind: "not_found" });
  });
});

describe("markDateHappened", () => {
  it("marks an agreed date, and only an agreed one", async () => {
    const d = deps();
    const { plan } = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });

    await expect(markDateHappened(d, plan.id)).rejects.toMatchObject({
      kind: "conflict",
    });

    await answerDatePlan(d, plan.id, {
      answer: "agreed",
      answeredBy: ADAM_ROW.id,
    });
    const marked = await markDateHappened(d, plan.id);

    expect(marked.status).toBe("happened");
    expect(marked.happenedAt).toBe(NOW.toISOString());
    // The link to the photographs it left behind is the day, unchanged.
    expect(marked.sharedDay).toBe(DAY);
  });

  it("refuses to mark the same date twice", async () => {
    const d = deps();
    const { plan } = await proposeDate(d, {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    });
    await answerDatePlan(d, plan.id, {
      answer: "agreed",
      answeredBy: ADAM_ROW.id,
    });
    await markDateHappened(d, plan.id);
    await expect(markDateHappened(d, plan.id)).rejects.toMatchObject({
      kind: "conflict",
    });
  });
});

describe("reading", () => {
  function seed(): ReturnType<typeof deps> {
    const d = deps();
    const rows: DatePlanRow[] = [
      datePlanRow({
        id: "a",
        kind: "same-film",
        proposed_by: EVA_ROW.id,
        shared_day: "2026-08-20",
        window_id: "w7",
        starts_at: "2026-08-20T19:00:00.000Z",
      }),
      datePlanRow({
        id: "b",
        kind: "two-kitchens",
        proposed_by: ADAM_ROW.id,
        shared_day: "2026-08-16",
        window_id: "w6",
        starts_at: "2026-08-16T16:00:00.000Z",
        status: "agreed",
        answered_by: EVA_ROW.id,
        answered_at: "2026-08-14T09:00:00.000Z",
      }),
      datePlanRow({
        id: "c",
        kind: "the-mirrored-errand",
        proposed_by: EVA_ROW.id,
        shared_day: "2026-08-09",
        window_id: "w4",
        starts_at: "2026-08-09T12:00:00.000Z",
        status: "happened",
        answered_by: ADAM_ROW.id,
        answered_at: "2026-08-08T09:00:00.000Z",
        happened_at: "2026-08-09T14:00:00.000Z",
      }),
      datePlanRow({
        id: "d",
        kind: "same-film",
        proposed_by: ADAM_ROW.id,
        shared_day: "2026-08-02",
        window_id: "w8",
        starts_at: "2026-08-02T21:00:00.000Z",
        status: "happened",
        answered_by: EVA_ROW.id,
        answered_at: "2026-08-01T09:00:00.000Z",
        happened_at: "2026-08-03T02:00:00.000Z",
      }),
      datePlanRow({
        id: "e",
        kind: "the-same-hour-walk",
        proposed_by: EVA_ROW.id,
        shared_day: "2026-08-11",
        window_id: "w5",
        starts_at: "2026-08-11T14:00:00.000Z",
        status: "declined",
        answered_by: ADAM_ROW.id,
        answered_at: "2026-08-10T09:00:00.000Z",
      }),
    ];
    d.gateway.datePlans.push(...rows);
    return d;
  }

  it("splits what is between them into three lists", async () => {
    const between = await datesBetweenThem(seed());
    expect(between.proposed.map((p) => p.id)).toEqual(["a"]);
    expect(between.agreed.map((p) => p.id)).toEqual(["b"]);
    // Newest first: a page already made is looked back at.
    expect(between.happened.map((p) => p.id)).toEqual(["c", "d"]);
  });

  it("leaves a declined date out of all three", async () => {
    const between = await datesBetweenThem(seed());
    const everything = [
      ...between.proposed,
      ...between.agreed,
      ...between.happened,
    ];
    expect(everything.map((p) => p.id)).not.toContain("e");
  });

  it("finds the dates that left photographs on one day", async () => {
    const found = await datesOnDay(seed(), "2026-08-09");
    expect(found.map((p) => p.id)).toEqual(["c"]);
    expect(await datesOnDay(seed(), "2026-08-11")).toEqual([]);
  });

  it("orders a plain listing soonest first", async () => {
    const all = await listDatePlans(seed(), {
      statuses: ["proposed", "agreed", "happened", "declined"],
    });
    expect(all.map((p) => p.id)).toEqual(["d", "c", "e", "b", "a"]);
  });
});

describe("when the table is not there yet", () => {
  /** What PostgREST says before the migration has been applied by hand. */
  function missingTableGateway(): ReturnType<typeof fakeGateway> {
    const g = fakeGateway();
    const undefinedTable = (): never => {
      throw new DataError(
        "upstream",
        'listDatePlans: relation "public.date_plans" does not exist',
        { code: "42P01" },
      );
    };
    g.listDatePlans = undefinedTable;
    g.insertDatePlan = undefinedTable;
    g.findDatePlanById = undefinedTable;
    return g;
  }

  it("says which migration has not been applied instead of quoting PostgREST", async () => {
    const thrown = await listDatePlans(deps(missingTableGateway())).catch(
      (e: unknown) => e,
    );
    expect(isDataError(thrown)).toBe(true);
    const error = thrown as DataError;
    expect(error.message).toBe("the dates table is not in this database yet");
    expect(String(error.detail.likelyCause)).toContain("20260810120000_date_plans.sql");
  });

  it("does the same on the write path", async () => {
    const thrown = await proposeDate(deps(missingTableGateway()), {
      kind: "an-hour-that-ends",
      sharedDay: DAY,
      windowId: "w6",
      proposedBy: EVA_ROW.id,
    }).catch((e: unknown) => e);
    expect((thrown as DataError).message).toBe(
      "the dates table is not in this database yet",
    );
  });

  it("leaves an unrelated database failure alone", async () => {
    // The hint is for one specific cause. A connection failure that got
    // rewritten as "apply the migration" would send whoever reads it in
    // exactly the wrong direction.
    const g = fakeGateway();
    g.listDatePlans = (): never => {
      throw new DataError("upstream", "listDatePlans: connection refused", {
        code: "08006",
      });
    };
    const thrown = await listDatePlans(deps(g)).catch((e: unknown) => e);
    expect((thrown as DataError).message).toBe("listDatePlans: connection refused");
  });
});
