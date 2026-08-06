import type { ActivityIndexEntry, DateKind } from "@/lib/types";

/**
 * Real entries from docs/10-activity-library/library.json shapes —
 * never invented — against the canonical `ActivityIndexEntry`.
 * The slip shows: title, one line (≤66 chars), and a metadata line.
 * No tier badge, no window code, no icon, no image.
 *
 * Interim display-copy fixture (2026-08-06, CMO): extended from the
 * original 5 entries to >=3 per window across all nine (33 total),
 * derived from `library.json` `name`/`one_liner` fields — never
 * invented. Every `title` <=34 chars, every `description` <=66
 * chars, per the contract above. See docs/08-agents_work/sessions/
 * 2026-08-06-cmo-dates-cardcopy.md for the per-entry derivation
 * trail, including the founder's ruling on the two `worth staying
 * up for` records initially held back. `windowFit` is copied
 * verbatim from each record's `window_fit` array — no window code
 * ever appears in `title` or `description` themselves.
 */

export const SUGGESTIONS: Record<string, ActivityIndexEntry> = {
  /* She's in bed, he's awake — world date, the app hands over and gets out of the way. */
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

  /* --- Extended 2026-08-06 (CMO) — coverage for all nine windows. ---
   * Priority was she's up early / he's fading, she's just off work /
   * worth staying up for / Saturday — the four that rendered the
   * thin-window state permanently on a 5-entry shelf. */

  /* She's in bed, he's awake. */
  "t7-overnight-fell-asleep-to-woke-up-to": {
    id: "t7-overnight-fell-asleep-to-woke-up-to",
    title: "What Eva leaves before she sleeps",
    description: "Eva sends it as she drifts off; Adam wakes to find it waiting.",
    durationMin: 10,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 4,
    windowFit: ["w1"],
    tier: "A",
    verificationTier: "verified",
  },
  /* Spans she's in bed / her commute / her lunch break / he's fading. */
  "t4-twenty-questions": {
    id: "t4-twenty-questions",
    title: "20 questions",
    description: "Eva picks a person, place, or thing; Adam gets 20 yes-or-no tries.",
    durationMin: 10,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 1,
    windowFit: ["w1", "w3", "w4", "w5"],
    tier: "A",
    verificationTier: "verified",
  },
  /* She's up early — spans her commute and lunch break too. */
  "t5-gottman-love-map-single-question": {
    id: "t5-gottman-love-map-single-question",
    title: "One small question about them",
    description: "A favorite memory, a worry, a hope — asked between other things.",
    durationMin: 10,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 2,
    windowFit: ["w2", "w3", "w4"],
    tier: "S",
    verificationTier: "verified",
  },
  /* She's up early — spans her lunch break, his Friday off, her Sunday off. */
  "ldr-words-correspondence": {
    id: "ldr-words-correspondence",
    title: "A running word game",
    description: "The board stays open; it pings when it is their turn.",
    durationMin: 5,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "unknown",
    screenFree: false,
    intimacyLevel: 1,
    windowFit: ["w4", "w2"],
    tier: "S",
    verificationTier: "verified",
  },
  /* She's up early — spans her lunch break too. */
  "t2-asymmetric-meal-his-dinner-her-lunch": {
    id: "t2-asymmetric-meal-his-dinner-her-lunch",
    title: "Eating together, different meals",
    description: "His dinner lands during her lunch — a short, no-pressure overlap.",
    durationMin: 30,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w4", "w2"],
    tier: "S",
    verificationTier: "verified",
  },
  /* She's up early — spans her lunch break, his Friday off, her Sunday off. */
  "t3-chess-daily-correspondence": {
    id: "t3-chess-daily-correspondence",
    title: "One chess game, days per move",
    description: "The seven-hour gap becomes the clock instead of the obstacle.",
    durationMin: 5,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "unknown",
    screenFree: false,
    intimacyLevel: 1,
    windowFit: ["w2", "w4", "w8", "w9"],
    tier: "S",
    verificationTier: "verified",
  },
  /* Her commute. */
  "t7-voice-note-audio-only-commute": {
    id: "t7-voice-note-audio-only-commute",
    title: "A voice note for her commute",
    description: "Something for her to listen to hands-free, headphones in, eyes up.",
    durationMin: 5,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 4,
    windowFit: ["w3"],
    tier: "A",
    verificationTier: "verified",
  },
  /* She's up early — spans her commute too. */
  "ldr-morning-audio-companion": {
    id: "ldr-morning-audio-companion",
    title: "On the line through her commute",
    description: "Speakerphone at home, headphones once she is outside.",
    durationMin: 25,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 2,
    windowFit: ["w2", "w3"],
    tier: "B",
    verificationTier: "plausible-unverified",
  },
  /* She's in bed / her commute. */
  "t1-audiobook-manual-sync-commute": {
    id: "t1-audiobook-manual-sync-commute",
    title: "The same audiobook chapter",
    description: "Both start it on a three-two-one count, then listen in step.",
    durationMin: 30,
    costTier: "cheap",
    costConditional: true,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 2,
    windowFit: ["w1", "w3"],
    tier: "A",
    verificationTier: "verified",
  },
  /* Her commute. */
  "t6-commute-voice-question": {
    id: "t6-commute-voice-question",
    title: "One question for the subway walk",
    description: "Eva answers, hands-free, one voice-note question from Adam.",
    durationMin: 10,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 2,
    windowFit: ["w3"],
    tier: "B",
    verificationTier: "plausible-unverified",
  },
  /* She's up early — spans her lunch break, his Friday off, her Sunday off. */
  "ldr-gamepigeon-imessage-games": {
    id: "ldr-gamepigeon-imessage-games",
    title: "A turn in the games thread",
    description: "Playing a turn looks exactly like sending a text.",
    durationMin: 5,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "unknown",
    screenFree: false,
    intimacyLevel: 1,
    windowFit: ["w2", "w4", "w8", "w9"],
    tier: "S",
    verificationTier: "verified",
  },
  /* She's up early — spans her commute and lunch break too. */
  "t5-imago-appreciation-micro": {
    id: "t5-imago-appreciation-micro",
    title: "Naming one good thing about them",
    description: "A compliment or a thank-you, said out loud, structured and short.",
    durationMin: 10,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 2,
    windowFit: ["w2", "w3", "w4"],
    tier: "S",
    verificationTier: "verified",
  },
  /* He's fading, she's just off work — spans his Friday off, her Sunday off. */
  "t2-diy-body-doubling-facetime": {
    id: "t2-diy-body-doubling-facetime",
    title: "Working quietly on the same call",
    description: "Camera on, no talking, each at a task until the check-in.",
    durationMin: 50,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w5", "w8", "w9"],
    tier: "S",
    verificationTier: "verified",
  },
  /* Her lunch break / he's fading, she's just off work. */
  "t5-gottman-stress-reducing-conversation": {
    id: "t5-gottman-stress-reducing-conversation",
    title: "Venting about the day, no fixing",
    description: "One vents about the day; the other just listens, no fixing.",
    durationMin: 25,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 3,
    windowFit: ["w4", "w5"],
    tier: "S",
    verificationTier: "verified",
  },
  /* He's fading, she's just off work — spans she's in bed and Saturday too. */
  "t1-apple-tv-app-nightly-episode": {
    id: "t1-apple-tv-app-nightly-episode",
    title: "One episode, watched in sync",
    description: "Same show, same night, exactly one episode before signing off.",
    durationMin: 30,
    costTier: "free",
    costConditional: true,
    costNote: "",
    shareplay: "yes",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w1", "w5", "w7"],
    tier: "A",
    verificationTier: "verified",
  },
  /* Worth staying up for — spans she's in bed, he's fading, Saturday too. */
  "ldr-shareplay-film-night": {
    id: "ldr-shareplay-film-night",
    title: "A full film, watched together",
    description: "A full evening, synced start to finish over the call.",
    durationMin: 60,
    costTier: "paid",
    costConditional: false,
    costNote: "",
    shareplay: "yes",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w1", "w5", "w6", "w7"],
    tier: "B",
    verificationTier: "verified",
  },
  /* Worth staying up for. Source name carried a banned window code
   * ("...the W6 Alarm-Worth-Setting Activity") — stripped per law. */
  "t1-espn-twitch-live-sports-w6": {
    id: "t1-espn-twitch-live-sports-w6",
    title: "Live sports, watched in sync",
    description: "Saved for what is worth losing sleep over.",
    durationMin: 150,
    costTier: "free",
    costConditional: true,
    costNote: "",
    shareplay: "yes",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w6"],
    tier: "B",
    verificationTier: "verified",
  },
  /* Worth staying up for / Saturday. */
  "t5-36-questions-full-protocol": {
    id: "t5-36-questions-full-protocol",
    title: "The 36 questions, start to finish",
    description: "The full closeness study, run in one sitting instead of pieces.",
    durationMin: 75,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 5,
    windowFit: ["w6", "w7"],
    tier: "B",
    verificationTier: "verified",
  },
  /* Worth staying up for / Saturday. */
  "t1-blind-rewatch-muted-reveal": {
    id: "t1-blind-rewatch-muted-reveal",
    title: "A film Adam has not seen yet",
    description: "Eva stays muted for the opening; then both react together.",
    durationMin: 120,
    costTier: "free",
    costConditional: true,
    costNote: "",
    shareplay: "yes",
    screenFree: false,
    intimacyLevel: 3,
    windowFit: ["w6", "w7"],
    tier: "B",
    verificationTier: "verified",
  },
  /* Saturday, their only shared day off. */
  "t5-gottman-state-of-the-union": {
    id: "t5-gottman-state-of-the-union",
    title: "The weekly check-in",
    description: "What is working, what is not, then one request each for the week.",
    durationMin: 45,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 3,
    windowFit: ["w7"],
    tier: "A",
    verificationTier: "verified",
  },
  /* Saturday, their only shared day off. */
  "t6-saturday-slow-call-adapted": {
    id: "t6-saturday-slow-call-adapted",
    title: "The slow Saturday call",
    description: "Same song, same drink, a long unhurried stretch of just talking.",
    durationMin: 90,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 3,
    windowFit: ["w7"],
    tier: "B",
    verificationTier: "verified",
  },
  /* Her lunch break / Saturday. */
  "t4-two-truths-and-a-lie": {
    id: "t4-two-truths-and-a-lie",
    title: "Two truths and a lie",
    description: "Three claims, one false — the other has to catch it.",
    durationMin: 10,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: true,
    intimacyLevel: 2,
    windowFit: ["w4", "w7"],
    tier: "A",
    verificationTier: "verified",
  },
  /* Saturday, their only shared day off. */
  "t2-cook-same-recipe-facetime": {
    id: "t2-cook-same-recipe-facetime",
    title: "Cooking the same recipe apart",
    description: "Same dish, two kitchens, timed to match over video.",
    durationMin: 60,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w7"],
    tier: "B",
    verificationTier: "plausible-unverified",
  },
  /* His Friday off / her Sunday off. */
  "t6-async-halves-shared-doc": {
    id: "t6-async-halves-shared-doc",
    title: "A shared page, written apart",
    description: "Each writes a half alone; they read both together after.",
    durationMin: 20,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 3,
    windowFit: ["w8", "w9"],
    tier: "A",
    verificationTier: "verified",
  },
  /* His Friday off / her Sunday off. */
  "t7-friday-sunday-slow-build": {
    id: "t7-friday-sunday-slow-build",
    title: "A thread that builds all day",
    description: "Small messages, spaced out, so the other opens one big thread.",
    durationMin: 240,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 4,
    windowFit: ["w8", "w9"],
    tier: "S",
    verificationTier: "verified",
  },
  /* His Friday off / her Sunday off. */
  "t2-ambient-day-long-facetime": {
    id: "t2-ambient-day-long-facetime",
    title: "A call left open all day",
    description: "No obligation to talk — just a line either of them can dip into.",
    durationMin: 240,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 2,
    windowFit: ["w8", "w9"],
    tier: "A",
    verificationTier: "verified",
  },

  /* Worth staying up for — held back in the first pass, then founder-
   * ruled in: the record's own subject is intimate by design, and a
   * card that gets coy about what the record says is the softening
   * that was wrong to do. Named plainly, not escalated past the
   * record. See docs/08-agents_work/sessions/
   * 2026-08-06-cmo-dates-cardcopy.md for the ruling and reasoning. */
  "t7-sexting-as-connection-ritual": {
    id: "t7-sexting-as-connection-ritual",
    title: "A standing time to sext",
    description: "Set on the calendar in advance, not left to chance timing.",
    durationMin: 20,
    costTier: "free",
    costConditional: false,
    costNote: "",
    shareplay: "no",
    screenFree: false,
    intimacyLevel: 5,
    windowFit: ["w1", "w5", "w6"],
    tier: "S",
    verificationTier: "verified",
  },
  /* Worth staying up for — same ruling as above. */
  "t7-app-controlled-toy-realtime-overlap": {
    id: "t7-app-controlled-toy-realtime-overlap",
    title: "An app-linked toy, live",
    description: "One moves; the other feels it, in real time.",
    durationMin: 30,
    costTier: "paid",
    costConditional: true,
    costNote: "",
    shareplay: "unknown",
    screenFree: false,
    intimacyLevel: 5,
    windowFit: ["w6", "w7"],
    tier: "B",
    verificationTier: "verified",
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
