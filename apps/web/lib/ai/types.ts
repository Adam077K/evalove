/**
 * The margin's contract.
 *
 * This file is what the design track builds against and what the route
 * validates into. Like `lib/types.ts` it is append-only: add members and types
 * freely, do not rename or remove one without a co-ordinated change on both
 * tracks.
 *
 * Two things in here are product rules wearing the clothes of types.
 *
 *   `speaker` is a literal with one value. It exists so that no surface can
 *   render a margin turn in a form used for content either partner authored —
 *   HL-1 of the spec. A boolean would have been smaller; a boolean would also
 *   have had a false case, and there is no false case.
 *
 *   `MarginStreamEvent` carries `usage` as its own terminal variant rather
 *   than folding it into the text. Cost is not a detail of the answer; it is
 *   an obligation on every call, and giving it a place in the type means a
 *   consumer cannot finish a stream without having been handed it.
 */

import type { IsoDate, MemberSlug } from "@/lib/types";
import type { PresenceGuess } from "@/lib/shared-day";

/* ------------------------------------------------------------------ *
 * Grounding — what the margin is allowed to know
 * ------------------------------------------------------------------ */

/**
 * The kinds of record that may become prompt text.
 *
 * A closed union. There is no `vault` member and there never will be; see
 * `vault-firewall.ts` and HL-4. Adding a member here is a privacy decision
 * about this couple's content and belongs in the spec before it belongs in
 * this file.
 */
export type GroundingKind =
  | "presence"
  | "dual-dates"
  | "window"
  | "photo-caption"
  | "book-entry"
  | "date-turn"
  | "shared-day"
  | "activity";

interface GroundingBase {
  kind: GroundingKind;
  /**
   * Where this came from, in words a person could check — "Adam's caption,
   * 2026-06-14". Rendered into the prompt beside the content, because the one
   * thing the margin must be able to do is say when something was written, and
   * the one thing it must never do is claim something that has no date.
   */
  provenance: string;
}

/** Something one of them wrote, with the day they wrote it on. */
export interface WrittenGrounding extends GroundingBase {
  kind: "photo-caption" | "book-entry" | "date-turn";
  author: MemberSlug;
  sharedDay: IsoDate;
  text: string;
}

/** A fact about the clock. Never anyone's content. */
export interface ClockGrounding extends GroundingBase {
  kind: "presence" | "dual-dates" | "window";
  text: string;
}

/** A fact about a shared day's completion. No counts, no streaks (D2/D3). */
export interface SharedDayGrounding extends GroundingBase {
  kind: "shared-day";
  sharedDay: IsoDate;
  text: string;
}

/** A record from the researched activity library. Public content, not theirs. */
export interface ActivityGrounding extends GroundingBase {
  kind: "activity";
  activityId: string;
  text: string;
  /**
   * `plausible-unverified` entries are never presented as equivalent to
   * verified ones — the library's own honesty rule, carried through to here.
   */
  verified: boolean;
}

export type Grounding =
  | WrittenGrounding
  | ClockGrounding
  | SharedDayGrounding
  | ActivityGrounding;

/* ------------------------------------------------------------------ *
 * Request
 * ------------------------------------------------------------------ */

/**
 * Who is asking, and what the clock says about the other one.
 *
 * `partnerPresence` is not optional. HL-3 — never speak while its subject is
 * asleep in a way that implies they are awake — cannot be enforced by a model
 * that was not told what time it is where the other one lives, so the type
 * refuses to let a caller forget.
 */
export interface MarginSituation {
  /** Whoever is holding the phone. */
  viewer: MemberSlug;
  /** The other one. Always the complement of `viewer`; never the same person. */
  partner: MemberSlug;
  /** `HH:mm` where the partner is. Empty when the guess is `unknown`. */
  partnerLocalTime: string;
  /** `YYYY-MM-DD` where the partner is. Empty when the guess is `unknown`. */
  partnerLocalDate: IsoDate;
  /** The presence guess. A guess, always — nothing reports being awake. */
  partnerPresence: PresenceGuess;
  /** The viewer's own calendar date, for the shared-day the turn belongs to. */
  viewerLocalDate: IsoDate;
  /** Human label for the current window. Never a `w1`…`w9` code (AC-9). */
  windowLabel: string | null;
  /** True when the two of them are on different calendar dates right now. */
  datesDiffer: boolean;
}

export interface MarginRequest {
  situation: MarginSituation;
  /** What the person typed. Never rewritten, never expanded, never inferred. */
  message: string;
  /** Everything the margin is permitted to know for this turn. */
  grounding: readonly Grounding[];
}

/* ------------------------------------------------------------------ *
 * Response
 * ------------------------------------------------------------------ */

/**
 * Why the margin stopped.
 *
 * `refused` is the model declining under our rules and is a normal outcome
 * with its own copy. `declined-by-safety` is the API's own classifier
 * declining, which is a different event and is surfaced separately so that one
 * cannot be mistaken for the other in a log.
 */
export type MarginStop =
  | "finished"
  | "length"
  | "refused"
  | "declined-by-safety";

export interface MarginUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Computed from `PRICING`, in dollars. */
  costUsd: number;
  latencyMs: number;
}

/**
 * One event on the wire.
 *
 * `speaker` rides on every text event rather than being stated once at the
 * start, so that a consumer which joins mid-stream, or renders event by event,
 * cannot lose it. HL-1 is worth the repeated field.
 */
export type MarginStreamEvent =
  | { type: "text"; speaker: "margin"; text: string }
  | { type: "stop"; speaker: "margin"; stop: MarginStop }
  | { type: "usage"; usage: MarginUsage }
  | { type: "error"; speaker: "margin"; message: string; retryable: boolean };

/** The whole turn, for callers that do not want to stream. */
export interface MarginTurn {
  speaker: "margin";
  text: string;
  stop: MarginStop;
  usage: MarginUsage;
}

/* ------------------------------------------------------------------ *
 * Budget
 * ------------------------------------------------------------------ */

/**
 * What is left of today.
 *
 * Surfaced to the UI as a fact about the margin, not as a punishment — §9 of
 * the spec. The margin is a thing with limits, and saying so plainly is the
 * honest framing and also the anti-substitution mechanism.
 */
export interface MarginAllowance {
  /** Exchanges already spent by this person on this shared day. */
  used: number;
  /** The cap. */
  limit: number;
  /** `limit - used`, floored at zero. */
  remaining: number;
  /** The shared day the count is against. */
  sharedDay: IsoDate;
}
