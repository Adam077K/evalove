import type { DateSession } from "@/lib/types";

/**
 * The three Phase 1 dates, one shape: alternating turns of short
 * text · no timer · resumable indefinitely · ends with a page.
 */

/** The story, mid-flight. It is Eva's turn; Adam is asleep. */
export const STORY_OPEN: DateSession = {
  id: "story-ferry",
  kind: "story",
  title: "Fortunately, Unfortunately",
  startedBy: "adam",
  startedOnDay: "2026-08-01",
  status: "open",
  yourTurn: true,
  waitingOn: null,
  turns: [
    { id: "t1", seq: 1, author: "adam", atLocal: "5:12 am",
      body: "Fortunately, the ferry was still at the dock." },
    { id: "t2", seq: 2, author: "eva", atLocal: "10:58 pm",
      body: "Unfortunately, so was everyone else in Brooklyn." },
    { id: "t3", seq: 3, author: "adam", atLocal: "6:40 am",
      body: "Fortunately, Eva has never once been early to anything." },
  ],
};

/** The story, finished — the artifact that becomes a page. */
export const STORY_FINISHED: DateSession = {
  ...STORY_OPEN,
  id: "story-ferry-done",
  status: "finished",
  yourTurn: false,
  turns: [
    ...STORY_OPEN.turns,
    { id: "t4", seq: 4, author: "eva", atLocal: "11:30 pm",
      body: "Unfortunately, neither has the ferry." },
    { id: "t5", seq: 5, author: "adam", atLocal: "7:02 am",
      body: "Fortunately, the two of them had the dock, the morning, and nowhere better to be." },
  ],
};

/** Twenty questions — Eva holds the secret, Adam is spending questions. */
export const TWENTY_QUESTIONS_OPEN: DateSession = {
  id: "tq-secret",
  kind: "twenty-questions",
  title: "Twenty questions",
  startedBy: "eva",
  startedOnDay: "2026-08-01",
  status: "open",
  yourTurn: false,
  waitingOn: {
    member: "adam",
    presence: { state: "asleep", localTime: "3:40 am", localDate: "2026-08-02" },
  },
  secret: "the stairwell cat",
  questionsSpent: 7,
  turns: [
    { id: "q1", seq: 1, author: "adam", turnKind: "question", atLocal: "5:20 am", body: "Is it alive?" },
    { id: "a1", seq: 2, author: "eva", turnKind: "answer", atLocal: "11:02 pm", body: "Yes." },
    { id: "q2", seq: 3, author: "adam", turnKind: "question", atLocal: "6:15 am", body: "Is it a person we both know?" },
    { id: "a2", seq: 4, author: "eva", turnKind: "answer", atLocal: "1:20 pm", body: "No." },
    { id: "q3", seq: 5, author: "adam", turnKind: "question", atLocal: "8:44 pm", body: "Is it in your city?" },
    { id: "a3", seq: 6, author: "eva", turnKind: "answer", atLocal: "2:01 pm", body: "No…" },
    { id: "q4", seq: 7, author: "adam", turnKind: "question", atLocal: "9:15 pm", body: "Is it in MY city?" },
  ],
};

/** The paired question — Eva has answered; Adam's side holds its space. */
export const PAIRED_OPEN: DateSession = {
  id: "pq-window",
  kind: "paired-question",
  title: "The paired question",
  prompt: "What did you see out a window today that the other one would have photographed?",
  startedBy: "eva",
  startedOnDay: "2026-08-02",
  status: "open",
  yourTurn: false,
  waitingOn: {
    member: "adam",
    presence: { state: "asleep", localTime: "3:40 am", localDate: "2026-08-02" },
  },
  turns: [
    { id: "p1", seq: 1, author: "eva", turnKind: "answer", atLocal: "10:12 pm",
      body: "A man on the fire escape across the street, watering one tomato plant with a wine glass. Ceremonially." },
  ],
};

/** Both answers in — the reveal state. */
export const PAIRED_REVEALED: DateSession = {
  ...PAIRED_OPEN,
  id: "pq-window-both",
  status: "finished",
  waitingOn: null,
  turns: [
    ...PAIRED_OPEN.turns,
    { id: "p2", seq: 2, author: "adam", turnKind: "answer", atLocal: "6:31 am",
      body: "Two pigeons having what was clearly a divorce on the neighbour’s satellite dish." },
  ],
};

export const DATES = {
  "story-ferry": STORY_OPEN,
  "story-ferry-done": STORY_FINISHED,
  "tq-secret": TWENTY_QUESTIONS_OPEN,
  "pq-window": PAIRED_OPEN,
  "pq-window-both": PAIRED_REVEALED,
} as const;
