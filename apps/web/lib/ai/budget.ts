/**
 * How much of the margin there is in a day.
 *
 * This is the only part of the design that is not made of words, and it is
 * therefore the part doing the real work.
 *
 * F2 (idealisation drift) and F3 (substitution) both reduce to one property:
 * availability. A simulated presence is more available than a person seven
 * hours away, and no amount of careful prompting changes that — you cannot
 * instruct software into being asleep. The honest mitigation is a cap, stated
 * plainly, that the margin runs out of.
 *
 * The cap is per person per shared day, not per session and not per hour. Per
 * shared day is the unit the rest of this product already thinks in, and it
 * means a bad night has an end: the margin runs out, and the next thing that
 * happens is either sleep or the other person.
 *
 * A second, softer ceiling caps input tokens per request. Grounding is
 * truncated to fit, oldest first, so a long history costs the same as a short
 * one and the newest material — the part a question is most likely about — is
 * the part that survives.
 */

import { MARGIN_MAX_INPUT_TOKENS } from "./model";

import type { IsoDate, MemberSlug } from "@/lib/types";
import type { Grounding, MarginAllowance } from "./types";

/**
 * Exchanges per person per shared day.
 *
 * Twelve is an opening value, chosen to be generous enough that an ordinary
 * evening never touches it and small enough that a three-hour conversation
 * with software is not a thing this app supports. §9 of the spec asks the
 * founder to ratify it after observation.
 */
export const TURNS_PER_SHARED_DAY = 12;

/* ------------------------------------------------------------------ *
 * The ledger
 * ------------------------------------------------------------------ */

/**
 * Where the count of today's exchanges lives.
 *
 * An interface rather than a concrete store because the right home for this
 * is a Postgres row, and that is a migration on a table this feature does not
 * own yet. The interface is the seam: the in-memory implementation below is
 * complete and correct for a single process, and a Supabase-backed one drops
 * in without touching anything else.
 */
export interface SpendLedger {
  /** Exchanges this person has spent on this shared day. */
  used(viewer: MemberSlug, sharedDay: IsoDate): number;
  /** Record one exchange. Returns the new total. */
  spend(viewer: MemberSlug, sharedDay: IsoDate): number;
}

/**
 * A ledger held in process memory.
 *
 * Honest about what it is: counts reset when the process restarts and are not
 * shared between serverless instances, so the effective cap on a multi-instance
 * deployment is higher than the stated one. For two people on one small
 * deployment that is an acceptable approximation, and it is a real
 * implementation rather than a placeholder — it enforces the cap it can see.
 * Swap in a persistent implementation before the cap is relied on as a
 * guarantee rather than as a brake.
 *
 * Entries for past days are dropped on write rather than on a timer, so
 * nothing schedules and nothing grows.
 */
export class InMemorySpendLedger implements SpendLedger {
  private readonly counts = new Map<string, number>();
  private day: IsoDate | null = null;

  private static key(viewer: MemberSlug, sharedDay: IsoDate): string {
    return `${sharedDay}:${viewer}`;
  }

  private rollTo(sharedDay: IsoDate): void {
    if (this.day === sharedDay) return;
    this.counts.clear();
    this.day = sharedDay;
  }

  used(viewer: MemberSlug, sharedDay: IsoDate): number {
    if (this.day !== sharedDay) return 0;
    return this.counts.get(InMemorySpendLedger.key(viewer, sharedDay)) ?? 0;
  }

  spend(viewer: MemberSlug, sharedDay: IsoDate): number {
    this.rollTo(sharedDay);
    const key = InMemorySpendLedger.key(viewer, sharedDay);
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }
}

export function allowanceOf(
  ledger: SpendLedger,
  viewer: MemberSlug,
  sharedDay: IsoDate,
  limit: number = TURNS_PER_SHARED_DAY,
): MarginAllowance {
  const used = ledger.used(viewer, sharedDay);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    sharedDay,
  };
}

/* ------------------------------------------------------------------ *
 * Input ceiling
 * ------------------------------------------------------------------ */

/**
 * Characters per token, for the pre-flight estimate.
 *
 * Four is the usual English approximation and it is used here only to decide
 * how much grounding to drop before assembly. It is deliberately not used for
 * billing — the API reports real counts and those are what `cost.ts` prices.
 * Rounding up rather than down means the estimate errs toward sending less.
 */
const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Drop grounding until the estimate fits, oldest first.
 *
 * Two properties matter here and neither is obvious.
 *
 * Clock grounding — presence, both dates, the window — is never dropped. It is
 * a handful of tokens and HL-3 depends on it: a request that fits its budget
 * by discarding the fact that Adam is asleep has bought nothing worth having.
 *
 * Everything else is dropped from the front, which is the oldest, because a
 * question is most often about what just happened. The result keeps its
 * original order.
 */
export function fitGrounding(
  grounding: readonly Grounding[],
  budgetTokens: number = MARGIN_MAX_INPUT_TOKENS,
): readonly Grounding[] {
  const isClock = (g: Grounding): boolean =>
    g.kind === "presence" || g.kind === "dual-dates" || g.kind === "window";

  const sizeOf = (g: Grounding): number =>
    estimateTokens(`${g.provenance} ${g.text}`);

  const kept = [...grounding];
  const total = (): number => kept.reduce((sum, g) => sum + sizeOf(g), 0);

  while (total() > budgetTokens) {
    const index = kept.findIndex((g) => !isClock(g));
    // Only clock grounding left and it still does not fit: send it anyway.
    // It is a few dozen tokens, and dropping it would break HL-3 in order to
    // respect a soft ceiling. The ceiling loses that argument.
    if (index === -1) break;
    kept.splice(index, 1);
  }

  return kept;
}
