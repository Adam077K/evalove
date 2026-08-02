import type {
  DateKind,
  DateSession,
  DateTurn,
  IsoDateTime,
  Member,
  Uuid,
} from "@/lib/types";
import { ADAM, EVA, memberById } from "./members";

/**
 * The three Phase 1 dates, one shape: alternating turns of short
 * text · no timer · resumable indefinitely · ends with a page.
 * Canonical `DateSession` + `DateTurn`; display titles and prompts
 * ride in `config` (a per-kind narrowing, per the contract).
 */

let t = 0;
const turnId = () => `7d41c0de-1b22-4e3a-9c55-${String(++t).padStart(12, "0")}`;

function mkTurns(
  dateId: Uuid,
  rows: ReadonlyArray<
    [author: Member, createdAt: IsoDateTime, body: string, kind?: DateTurn["turnKind"]]
  >,
): DateTurn[] {
  return rows.map(([author, createdAt, body, kind], i) => ({
    id: turnId(),
    dateId,
    memberId: author.id,
    seq: i + 1,
    turnKind: kind ?? "turn",
    body,
    createdAt,
  }));
}

/** Fallback titles per kind, used when `config.title` is absent. */
export const DATE_KIND_TITLES: Record<DateKind, string> = {
  story: "A story, one line each",
  twenty_questions: "Twenty questions",
  paired_question: "The paired question",
};

export function dateTitle(s: DateSession): string {
  const t = (s.config as { title?: string }).title;
  return t ?? DATE_KIND_TITLES[s.kind];
}

export function datePrompt(s: DateSession): string | undefined {
  return (s.config as { prompt?: string }).prompt;
}

/* ------------------------------------------------------------------ *
 * The story, mid-flight. The last turn is Adam's, so Eva writes next.
 * ------------------------------------------------------------------ */

const STORY_OPEN_ID = "5f01a9aa-3c11-4d2e-8b6f-000000000001";

export const STORY_OPEN: DateSession = {
  id: STORY_OPEN_ID,
  kind: "story",
  status: "open",
  startedBy: ADAM.id,
  config: { title: "Fortunately, Unfortunately" },
  createdAt: "2026-07-30T02:12:00Z",
};

export const STORY_OPEN_TURNS: DateTurn[] = mkTurns(STORY_OPEN_ID, [
  [ADAM, "2026-07-30T02:12:00Z", "Fortunately, the ferry was still at the dock."], // 5:12 am IL
  [EVA, "2026-07-31T02:58:00Z", "Unfortunately, so was everyone else in Brooklyn."], // 10:58 pm NY
  [ADAM, "2026-07-31T03:40:00Z", "Fortunately, Eva has never once been early to anything."], // 6:40 am IL
]);

/* ------------------------------------------------------------------ *
 * The story, finished — the artifact that becomes a page.
 * ------------------------------------------------------------------ */

const STORY_DONE_ID = "5f01a9aa-3c11-4d2e-8b6f-000000000002";

export const STORY_FINISHED: DateSession = {
  id: STORY_DONE_ID,
  kind: "story",
  status: "finished",
  startedBy: ADAM.id,
  config: { title: "Fortunately, Unfortunately" },
  createdAt: "2026-07-30T02:12:00Z",
  finishedAt: "2026-08-01T04:02:00Z",
};

export const STORY_FINISHED_TURNS: DateTurn[] = mkTurns(STORY_DONE_ID, [
  [ADAM, "2026-07-30T02:12:00Z", "Fortunately, the ferry was still at the dock."],
  [EVA, "2026-07-31T02:58:00Z", "Unfortunately, so was everyone else in Brooklyn."],
  [ADAM, "2026-07-31T03:40:00Z", "Fortunately, Eva has never once been early to anything."],
  [EVA, "2026-08-01T03:30:00Z", "Unfortunately, neither has the ferry."], // 11:30 pm NY
  [
    ADAM,
    "2026-08-01T04:02:00Z",
    "Fortunately, the two of them had the dock, the morning, and nowhere better to be.",
  ], // 7:02 am IL
]);

/* ------------------------------------------------------------------ *
 * Twenty questions — Eva holds the secret; Adam spends questions.
 * Questions and answers are both ordinary turns; a guess is a guess.
 * ------------------------------------------------------------------ */

const TQ_ID = "5f01a9aa-3c11-4d2e-8b6f-000000000003";

export const TWENTY_QUESTIONS_OPEN: DateSession = {
  id: TQ_ID,
  kind: "twenty_questions",
  status: "open",
  startedBy: EVA.id,
  secret: "the stairwell cat",
  secretHolderId: EVA.id,
  config: {},
  createdAt: "2026-08-01T02:20:00Z",
};

export const TWENTY_QUESTIONS_TURNS: DateTurn[] = mkTurns(TQ_ID, [
  [ADAM, "2026-08-01T02:20:00Z", "Is it alive?"],
  [EVA, "2026-08-01T03:02:00Z", "Yes."],
  [ADAM, "2026-08-01T03:15:00Z", "Is it a person we both know?"],
  [EVA, "2026-08-01T17:20:00Z", "No."],
  [ADAM, "2026-08-01T17:44:00Z", "Is it in your city?"],
  [EVA, "2026-08-01T18:01:00Z", "No…"],
  [ADAM, "2026-08-01T18:15:00Z", "Is it in MY city?"],
]);

/* ------------------------------------------------------------------ *
 * The paired question — Eva has answered; Adam's side holds its space.
 * ------------------------------------------------------------------ */

const PQ_ID = "5f01a9aa-3c11-4d2e-8b6f-000000000004";
const PQ_DONE_ID = "5f01a9aa-3c11-4d2e-8b6f-000000000005";

const PQ_PROMPT =
  "What did you see out a window today that the other one would have photographed?";

export const PAIRED_OPEN: DateSession = {
  id: PQ_ID,
  kind: "paired_question",
  status: "open",
  startedBy: EVA.id,
  config: { prompt: PQ_PROMPT },
  createdAt: "2026-08-02T02:12:00Z",
};

export const PAIRED_OPEN_TURNS: DateTurn[] = mkTurns(PQ_ID, [
  [
    EVA,
    "2026-08-02T02:12:00Z", // 10:12 pm NY
    "A man on the fire escape across the street, watering one tomato plant with a wine glass. Ceremonially.",
  ],
]);

export const PAIRED_REVEALED: DateSession = {
  id: PQ_DONE_ID,
  kind: "paired_question",
  status: "finished",
  startedBy: EVA.id,
  config: { prompt: PQ_PROMPT },
  createdAt: "2026-08-02T02:12:00Z",
  finishedAt: "2026-08-02T03:31:00Z",
};

export const PAIRED_REVEALED_TURNS: DateTurn[] = mkTurns(PQ_DONE_ID, [
  [
    EVA,
    "2026-08-02T02:12:00Z",
    "A man on the fire escape across the street, watering one tomato plant with a wine glass. Ceremonially.",
  ],
  [
    ADAM,
    "2026-08-02T03:31:00Z", // 6:31 am IL
    "Two pigeons having what was clearly a divorce on the neighbour’s satellite dish.",
  ],
]);

/* ------------------------------------------------------------------ */

export const DATE_SESSIONS: Record<Uuid, DateSession> = {
  [STORY_OPEN.id]: STORY_OPEN,
  [STORY_FINISHED.id]: STORY_FINISHED,
  [TWENTY_QUESTIONS_OPEN.id]: TWENTY_QUESTIONS_OPEN,
  [PAIRED_OPEN.id]: PAIRED_OPEN,
  [PAIRED_REVEALED.id]: PAIRED_REVEALED,
};

export const DATE_TURNS: Record<Uuid, DateTurn[]> = {
  [STORY_OPEN.id]: STORY_OPEN_TURNS,
  [STORY_FINISHED.id]: STORY_FINISHED_TURNS,
  [TWENTY_QUESTIONS_OPEN.id]: TWENTY_QUESTIONS_TURNS,
  [PAIRED_OPEN.id]: PAIRED_OPEN_TURNS,
  [PAIRED_REVEALED.id]: PAIRED_REVEALED_TURNS,
};

/**
 * Whose turn is it? Derived, never stored. For the paired question,
 * it is whoever has not answered yet; otherwise the counterpart of
 * whoever wrote last. No deadline, no elapsed time — the answer is
 * a member, never a countdown.
 */
export function nextWriter(s: DateSession, turns: DateTurn[]): Member | null {
  if (s.status !== "open") return null;
  if (s.kind === "paired_question") {
    const answered = new Set(turns.map((x) => x.memberId));
    if (!answered.has(EVA.id)) return EVA;
    if (!answered.has(ADAM.id)) return ADAM;
    return null;
  }
  const last = turns[turns.length - 1];
  if (!last) return memberById(s.startedBy);
  return last.memberId === EVA.id ? ADAM : EVA;
}
