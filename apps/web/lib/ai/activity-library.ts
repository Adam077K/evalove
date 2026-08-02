/**
 * Reading `docs/10-activity-library/library.json`.
 *
 * 98 researched records with 179 sources. It is the only content in this
 * product that is not Eva and Adam's own, which makes it the only content the
 * margin can talk about freely — and the one thing it can offer that is not a
 * quote from their history.
 *
 * Two data-quality issues are documented in the PRD (§11) and both are handled
 * here at ingest rather than at every read site:
 *
 *   `cost` is free text beyond `"free"` — 31 distinct strings like
 *   "paid (~$11.99/month Strava subscription)". Normalised to the three-value
 *   `ActivityCostTier` from `lib/types.ts`, with the original string kept so
 *   nothing is lost and the UI can still be honest about what it depends on.
 *
 *   `apple_shareplay` is tri-state: `true`, `false`, or the string
 *   `"unknown"`, with 16 unknowns. Coercing that to a boolean turns "we did
 *   not find out" into "no", which is the kind of quiet lie this library's
 *   `verification_tier` convention exists to prevent. It stays tri-state.
 *
 * `WINDOW-CONTRAINDICATIONS.md` is an enforcement rule, not advice. The seven
 * rulings are carried in the file's own `cross_thread_artifacts` and applied
 * as a filter here, so that a therapeutic protocol whose design depends on
 * finishing what you start is never mentioned in a window that guarantees a
 * hard stop mid-way. That is a real harm this couple could experience, and the
 * research says truncating one is worse than never starting.
 */

import { z } from "zod";

import type {
  ActivityCostTier,
  ActivityIndexEntry,
  ActivitySharePlay,
  IntimacyLevel,
  VerificationTier,
} from "@/lib/types";
import type { WindowId } from "@/lib/shared-day";

/* ------------------------------------------------------------------ *
 * Schema
 * ------------------------------------------------------------------ */

const rawActivity = z.object({
  id: z.string(),
  name: z.string(),
  one_liner: z.string(),
  duration_min: z.number(),
  cost: z.string(),
  apple_shareplay: z.union([z.boolean(), z.literal("unknown")]),
  screen_free: z.boolean(),
  intimacy_level: z.number().int().min(1).max(5),
  window_fit: z.array(z.string()),
  tier: z.string(),
  verification_tier: z.enum(["verified", "plausible-unverified"]),
});

const rawContraindication = z.object({
  protocol: z.string(),
  windows_to_avoid: z.array(z.string()),
  reason: z.string(),
});

const rawLibrary = z.object({
  generated: z.string(),
  activities: z.array(rawActivity),
  cross_thread_artifacts: z.object({
    window_contraindications: z.array(rawContraindication),
  }),
});

/* ------------------------------------------------------------------ *
 * Normalisation
 * ------------------------------------------------------------------ */

/**
 * Free-text cost to the filterable tier.
 *
 * `free` is exact — the library writes the bare word for genuinely free
 * things. Everything else is read for a currency amount: a string that names
 * a price is `paid`, one that qualifies without naming a price is `cheap`.
 * `costConditional` records that the string carried a condition at all, which
 * is what "free with a subscription you already have" needs in order to be
 * shown honestly.
 */
export function normaliseCost(raw: string): {
  tier: ActivityCostTier;
  conditional: boolean;
  note: string;
} {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const conditional = /\bif\b|\bunless\b|\brequires\b|\balready\b|\(/.test(
    lower,
  );

  if (lower === "free") return { tier: "free", conditional: false, note: text };
  if (lower.startsWith("free")) {
    return { tier: "free", conditional, note: text };
  }
  if (/\$\s?\d/.test(text)) return { tier: "paid", conditional, note: text };
  if (lower.includes("paid")) return { tier: "paid", conditional, note: text };

  return { tier: "cheap", conditional, note: text };
}

function normaliseSharePlay(raw: boolean | "unknown"): ActivitySharePlay {
  if (raw === "unknown") return "unknown";
  return raw ? "yes" : "no";
}

/** A parsed library: the records, plus the rulings that constrain them. */
export interface ActivityLibrary {
  /** The `generated` stamp from the file. Used as `libraryVersion`. */
  version: string;
  entries: readonly ActivityIndexEntry[];
  /** Activity id -> the windows it must never be offered in. */
  contraindications: ReadonlyMap<string, readonly string[]>;
}

/**
 * The leading token of a `protocol` string is the activity id.
 *
 * The field reads `"t5-36-questions-full-protocol (36 Questions, full run)"`.
 * Splitting on the first space is enough and is stable across all seven
 * rulings; matching on the human name would break the first time somebody
 * fixes a typo in it.
 */
function activityIdOf(protocol: string): string {
  return protocol.trim().split(/\s+/)[0] ?? protocol.trim();
}

/**
 * A window token from the rulings.
 *
 * One of the seven reads `"w6 (unless deliberately chosen)"`. The
 * parenthetical is a note to a human; the enforcement takes the id. Reading
 * only the leading token means the ruling still bites in w6 — which is the
 * conservative direction, and the right one for a protocol whose documented
 * risk is flooding a partner with no time to re-regulate.
 */
function windowIdOf(token: string): string {
  return token.trim().split(/\s+/)[0] ?? token.trim();
}

export function parseActivityLibrary(source: unknown): ActivityLibrary {
  const parsed = rawLibrary.parse(source);

  const entries: ActivityIndexEntry[] = parsed.activities.map((a) => {
    const cost = normaliseCost(a.cost);
    return {
      id: a.id,
      title: a.name,
      description: a.one_liner,
      durationMin: a.duration_min,
      costTier: cost.tier,
      costConditional: cost.conditional,
      costNote: cost.note,
      shareplay: normaliseSharePlay(a.apple_shareplay),
      screenFree: a.screen_free,
      intimacyLevel: a.intimacy_level as IntimacyLevel,
      windowFit: a.window_fit,
      tier: a.tier,
      verificationTier: a.verification_tier as VerificationTier,
    };
  });

  const contraindications = new Map<string, readonly string[]>();
  for (const ruling of parsed.cross_thread_artifacts.window_contraindications) {
    const id = activityIdOf(ruling.protocol);
    const windows = ruling.windows_to_avoid.map(windowIdOf);
    contraindications.set(id, [
      ...(contraindications.get(id) ?? []),
      ...windows,
    ]);
  }

  return { version: parsed.generated, entries, contraindications };
}

/* ------------------------------------------------------------------ *
 * Selection
 * ------------------------------------------------------------------ */

export interface ActivityQuery {
  /** Only entries that fit this window. `null` means no window filter. */
  window: WindowId | null;
  /** Minutes available. Entries longer than this are dropped. */
  maxDurationMin?: number;
  /** How many to return. Small — this is grounding, not a browse surface. */
  limit?: number;
}

/**
 * Entries the margin may mention right now.
 *
 * Contraindicated entries are removed first and unconditionally: the filter
 * runs before every other consideration so that no ranking, widening, or
 * fallback can reintroduce one. Verified entries are ordered ahead of
 * `plausible-unverified` ones, which is the library's own honesty rule —
 * unverified material is never presented as equivalent, and the flag travels
 * with the record so the prompt can say so.
 */
export function selectActivities(
  library: ActivityLibrary,
  query: ActivityQuery,
): readonly ActivityIndexEntry[] {
  const { window, maxDurationMin, limit = 3 } = query;

  const permitted = library.entries.filter((entry) => {
    const avoid = library.contraindications.get(entry.id) ?? [];
    if (window !== null && avoid.includes(window)) return false;
    if (window !== null && !entry.windowFit.includes(window)) return false;
    if (maxDurationMin !== undefined && entry.durationMin > maxDurationMin) {
      return false;
    }
    return true;
  });

  return [...permitted]
    .sort((a, b) => {
      const aVerified = a.verificationTier === "verified" ? 0 : 1;
      const bVerified = b.verificationTier === "verified" ? 0 : 1;
      if (aVerified !== bVerified) return aVerified - bVerified;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}
