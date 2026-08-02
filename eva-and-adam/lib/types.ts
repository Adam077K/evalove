/**
 * lib/types.ts — LOCAL DECLARATION for the interface workstream.
 *
 * The canonical file is created by T1 (architecture §10.0) and is
 * append-only. Every name below is on §10.0's list; the *shapes* are
 * this workstream's assumption, declared so the merge reconciles
 * consciously rather than accidentally. If T1's shapes differ, T1's
 * win — the components read only the fields listed here, so the diff
 * is the complete reconciliation surface.
 *
 * Two names are additions, flagged in the design return rather than
 * invented silently: `WindowId` and `PartnerPresence` (arch §3.10
 * describes the concept; the interface needs the type).
 */

/* ————— people ————— */

export type Identity = "eva" | "adam";

export interface Member {
  id: Identity;
  name: "Eva" | "Adam";
  city: "New York" | "Tel Aviv";
  tz: "America/New_York" | "Asia/Jerusalem";
}

export interface Session {
  authenticated: boolean;
  identity: Identity | null;
}

/* ————— the clock ————— */

export type WindowId =
  | "w1" | "w2" | "w3" | "w4" | "w5" | "w6" | "w7" | "w8" | "w9";

/** §3.10 — one function, three surfaces. */
export interface PartnerPresence {
  state: "awake" | "asleep";
  /** That person's own local time, formatted for their city. */
  localTime: string;
  localDate: string; // YYYY-MM-DD, their own local date
}

/* ————— photographs and the book ————— */

export type PhotoKind = "daily" | "book";

export interface Photo {
  id: string;
  kind: PhotoKind;
  author: Identity;
  /** The poster's own local date when they posted — the shared-day rule. */
  sharedDay: string; // YYYY-MM-DD
  postedAtLocal: string; // "11:48 pm" — that person's own city
  caption?: string;
  width: number;
  height: number;
  /** /p/{id}/display.jpg in production; a fixture URL in preview. */
  displayUrl: string;
}

export interface VaultItem {
  id: string;
  addedBy: Identity;
  addedAtLocal: string;
  width: number;
  height: number;
  displayUrl: string;
}

/** photo XOR date — the DB constraint, mirrored in the type. */
export type BookEntry =
  | {
      id: string;
      position: number;
      kind: "plate"; // a seeded photo, or a day that closed half-finished
      photo: Photo;
      sharedDay?: string;
    }
  | {
      id: string;
      position: number;
      kind: "spread"; // a completed daily pair
      sharedDay: string;
      eva: Photo;
      adam: Photo;
    }
  | {
      id: string;
      position: number;
      kind: "date-page"; // a finished (or still-open) date
      dateSession: DateSession;
      sharedDay: string;
    };

export interface SharedDay {
  day: string; // YYYY-MM-DD
  eva: Photo | null;
  adam: Photo | null;
  complete: boolean;
  /** Still open until 23:59:59 America/New_York on D has passed. */
  stillOpen: boolean;
}

export interface DaysTogether {
  count: number;
  /** Spelled out — digits read as a metric, words read as prose. */
  words: string;
}

/* ————— dates (D10/D11) ————— */

export type DateKind = "story" | "twenty-questions" | "paired-question";

/** open → finished | faded. Nothing else exists, in code or on screen. */
export type DateStatus = "open" | "finished" | "faded";

export type TurnKind = "sentence" | "question" | "answer" | "guess" | "reveal";

export interface DateTurn {
  id: string;
  seq: number;
  author: Identity;
  body: string;
  turnKind?: TurnKind;
  atLocal: string; // author's own local time
}

export interface DateSession {
  id: string;
  kind: DateKind;
  title: string;
  startedBy: Identity;
  startedOnDay: string;
  status: DateStatus;
  turns: DateTurn[];
  /** Whose turn — derived server-side; the interface never counts. */
  yourTurn: boolean;
  waitingOn: { member: Identity; presence: PartnerPresence } | null;
  /** Twenty questions only, and only ever for the secret holder. */
  secret?: string;
  /** Twenty questions: the game's own resource, not a deadline. */
  questionsSpent?: number;
  /** Paired question: the prompt both are answering. */
  prompt?: string;
}

/* ————— the library ————— */

export interface ActivityIndexEntry {
  id: string;
  name: string;
  oneLiner: string;
  howItWorks: string[];
  durationMin: number;
  windowFit: WindowId[];
  screenFree: boolean;
  cost: string; // normalised at ingest; original text preserved
  tier: "S" | "A" | "B";
  verificationTier: "verified" | "plausible-unverified";
  /** Internal only. Never surfaces as a badge — only the button's label. */
  hosted: boolean;
}

export interface ActivityState {
  activityId: string;
  status?: "done" | "snoozed";
  rating?: "up" | "down";
  note?: string;
}

/* ————— the outbox ————— */

/**
 * Persistent per-item state, never a toast. No banned vocabulary:
 * an item that can't go right now is "waiting" or "try-again",
 * never anything that reads as a verdict.
 */
export type OutboxItemStatus =
  | "queued"
  | "sending"
  | "retrying"
  | "waiting-for-network"
  | "sent"
  | "try-again";

export interface OutboxItem {
  clientUuid: string;
  kind: PhotoKind;
  status: OutboxItemStatus;
  attempt?: number;
  thumbnailUrl?: string;
  caption?: string;
}
