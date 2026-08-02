import type { ActivityIndexEntry } from "@/lib/types";

/**
 * Real entries from docs/10-activity-library/library.json — never
 * invented. The slip shows: title, one line (≤66 chars), and a
 * metadata line. No tier badge, no window code, no icon, no image.
 */

export const SUGGESTIONS: Record<string, ActivityIndexEntry> = {
  /* W1, world date — the app hands over and gets out of the way. */
  "t2-read-aloud-bedtime-book": {
    id: "t2-read-aloud-bedtime-book",
    name: "Reading aloud until she sleeps",
    oneLiner: "Adam reads the shared novel over the call while Eva drifts.",
    howItWorks: [
      "One shared novel, one reader tonight.",
      "Eva gets comfortable; lights down; audio only is fine.",
      "Adam reads until she stops answering.",
      "Mark the page. The book keeps both places.",
    ],
    durationMin: 30, windowFit: ["w1"], screenFree: true,
    cost: "free", tier: "A", verificationTier: "verified", hosted: false,
  },
  /* Hosted — the app opens something. */
  "t4-fortunately-unfortunately": {
    id: "t4-fortunately-unfortunately",
    name: "Fortunately, Unfortunately",
    oneLiner: "One story, two voices — a good turn, then a bad twist.",
    howItWorks: [
      "Eva or Adam opens with a sentence beginning “Fortunately…”.",
      "The other answers with one beginning “Unfortunately…”.",
      "One sentence per turn. A turn can wait all day.",
      "When the story lands, it becomes a page in the book.",
    ],
    durationMin: 10, windowFit: ["w1", "w3"], screenFree: true,
    cost: "free", tier: "A", verificationTier: "verified", hosted: true,
  },
  /* W4 — bounded, discreet. */
  "t6-lunch-five-minute-checkin": {
    id: "t6-lunch-five-minute-checkin",
    name: "The five-minute check-in",
    oneLiner: "One good thing, one hard thing, one thing you’re holding.",
    howItWorks: [
      "Five minutes, hard cap — the desk clock is the referee.",
      "Each of them: one good thing, one hard thing.",
      "No fixing anything. Just the telling.",
    ],
    durationMin: 5, windowFit: ["w4"], screenFree: true,
    cost: "free", tier: "A", verificationTier: "verified", hosted: false,
  },
  /* Asleep register — a leave-behind. */
  "t7-lunch-break-discreet-anticipation": {
    id: "t7-lunch-break-discreet-anticipation",
    name: "One line at her lunch desk",
    oneLiner: "A single line, timed to land in the middle of her workday.",
    howItWorks: [
      "Write one line now, while she sleeps.",
      "It waits, and lands with her lunch.",
      "Short enough to read at a desk without explaining her face.",
    ],
    durationMin: 5, windowFit: ["w4"], screenFree: false,
    cost: "free", tier: "S", verificationTier: "verified", hosted: false,
  },
  /* An unverified one, carrying its honest label. */
  "unverified-example": {
    id: "unverified-example",
    name: "The mirrored errand",
    oneLiner: "Both run the same small errand today and compare receipts.",
    howItWorks: [
      "Agree one ordinary errand — bread, stamps, a lightbulb.",
      "Each does it in their own city, photographs the evidence.",
      "Compare tonight. The differences are the content.",
    ],
    durationMin: 20, windowFit: ["w8", "w9"], screenFree: true,
    cost: "free", tier: "B", verificationTier: "plausible-unverified", hosted: false,
  },
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
