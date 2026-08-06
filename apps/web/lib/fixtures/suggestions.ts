import type { ActivityIndexEntry, DateKind } from "@/lib/types";

/**
 * Real entries from docs/10-activity-library/library.json shapes —
 * never invented — against the canonical `ActivityIndexEntry`.
 * The slip shows: title, one line (≤66 chars), and a metadata line.
 * No tier badge, no window code, no icon, no image.
 */

export const SUGGESTIONS: Record<string, ActivityIndexEntry> = {
  /* W1, world date — the app hands over and gets out of the way. */
  "t2-read-aloud-bedtime-book": {
    id: "t2-read-aloud-bedtime-book",
    title: "Reading aloud until she sleeps",
    description: "Eva drifts off while Adam reads the shared novel over the call.",
    durationMin: 30,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 4,
    windowFit: ["w1"],
    tier: "A",
    verificationTier: "verified",
  },
  /* Hosted — the app opens something. */
  "t4-fortunately-unfortunately": {
    id: "t4-fortunately-unfortunately",
    title: "Fortunately, Unfortunately",
    description: "One story, two voices — a good turn, then a bad twist.",
    durationMin: 10,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w1", "w3"],
    tier: "A",
    verificationTier: "verified",
  },
  /* W4 — bounded, discreet. */
  "t6-lunch-five-minute-checkin": {
    id: "t6-lunch-five-minute-checkin",
    title: "The five-minute check-in",
    description: "One good thing, one hard thing, one thing being held.",
    durationMin: 5,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 3,
    windowFit: ["w4"],
    tier: "A",
    verificationTier: "verified",
  },
  /* Asleep register — a leave-behind. */
  "t7-lunch-break-discreet-anticipation": {
    id: "t7-lunch-break-discreet-anticipation",
    title: "One line at her lunch desk",
    description: "A single line, timed to land in the middle of Eva’s workday.",
    durationMin: 5,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 3,
    windowFit: ["w4"],
    tier: "S",
    verificationTier: "verified",
  },
  /* An unverified one, carrying its honest label. */
  "b1-mirrored-errand": {
    id: "b1-mirrored-errand",
    title: "The mirrored errand",
    description: "Both run the same small errand today and compare receipts.",
    durationMin: 20,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 1,
    windowFit: ["w8", "w9"],
    tier: "B",
    verificationTier: "plausible-unverified",
  },
};

/**
 * Which library entries the app HOSTS (opens a date session) rather
 * than hands over. Deliberately a UI-side map, not a field on the
 * canonical entry: PRD §3A.5 forbids surfacing the distinction as a
 * category — the only tell is the primary button's label, and this
 * map is what the label reads.
 */
export const HOSTED_DATE_KINDS: Record<string, DateKind> = {
  "t4-fortunately-unfortunately": "story",
};

export function primaryLabel(entryId: string): "Start" | "We’re doing this" {
  return entryId in HOSTED_DATE_KINDS ? "Start" : "We’re doing this";
}

/**
 * How a world date runs, in the book's voice — shown once on the
 * date's own leaf, never as UI chrome. Fixture-side copy seam.
 */
export const HOW_IT_WORKS: Record<string, string[]> = {
  "t2-read-aloud-bedtime-book": [
    "One shared novel, one reader tonight.",
    "Eva gets comfortable; lights down; audio only is fine.",
    "Adam reads until she stops answering.",
    "Mark the page. The book keeps both places.",
  ],
  "t6-lunch-five-minute-checkin": [
    "Five minutes, hard cap — the desk clock is the referee.",
    "Each of them: one good thing, one hard thing.",
    "No fixing anything. Just the telling.",
  ],
  "t7-lunch-break-discreet-anticipation": [
    "Eva is asleep — Adam writes one line now.",
    "It waits, and lands with her lunch.",
    "Short enough to read at a desk without explaining her face.",
  ],
  "b1-mirrored-errand": [
    "Agree one ordinary errand — bread, stamps, a lightbulb.",
    "Each does it in their own city, photographs the evidence.",
    "Compare tonight. The differences are the content.",
  ],
};

/** The shelves, in the couple's own language, with oldstyle counts. */
export const SHELVES: { slug: string; name: string; count: number }[] = [
  { slug: "evas-in-bed", name: "Eva’s in bed, Adam’s awake", count: 31 },
  { slug: "evas-commute", name: "Eva’s commute", count: 17 },
  { slug: "evas-lunch-break", name: "Eva’s lunch break", count: 36 },
  { slug: "just-off-work", name: "Eva’s just off work, Adam’s fading", count: 30 },
  { slug: "saturday", name: "Saturday — Eva and Adam both off", count: 40 },
  { slug: "zero-setup", name: "Zero setup, right now", count: 37 },
  { slug: "no-screen", name: "One of us can’t look at a screen", count: 25 },
  { slug: "something-real", name: "We need to talk about something real", count: 29 },
  { slug: "fifteen-minutes", name: "Fifteen minutes", count: 22 },
];
