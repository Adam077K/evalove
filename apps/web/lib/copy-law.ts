/**
 * The relative-time guard — one pattern, reused by every test that checks
 * a piece of copy against Rule 1: absolute timestamps only, never relative.
 *
 * Three shipped breaches survived every QA gate because each one lived in
 * a diff nobody re-checked against this rule, and the guard test that
 * existed before this file was narrower than the law: it caught digit-led
 * "3 days ago" but not "a year ago", and it never looked for "today" or a
 * bare "this {part of day}" at all.
 *
 *   lib/resurface.ts   "A year ago today"   → now the photograph's own date
 *   components/send/QuickSend.tsx
 *                       "Sent today" / "Nothing yet today"
 *                                           → "today" deleted, not replaced
 *   lib/stamp.ts        "left this morning" (and the afternoon/evening/
 *                        early-morning family) → "left in the morning"
 *
 * A second sweep (2026-08-07) found the widened law still had gaps big
 * enough for two more breaches to ship through it:
 *
 *   components/home/SealedCard.tsx
 *                       "drew a heart in the foam this morning"
 *                                           → the deictic dropped outright
 *   lib/stamp.ts        dstNote: "Six hours this week, not seven."
 *                                           → "Six hours between them,
 *                                              not seven."
 *
 * — caught because this pattern didn't know "this" + week/weekend/month/
 * year was the same shape as "this" + morning/afternoon/evening/night. That
 * sweep widened the pattern to also cover: spelled-out and vague-quantity
 * numerals before "ago" ("two days ago", "a couple of days ago"), a bare
 * elapsed unit with no numeral at all ("moments ago", "days ago"),
 * "last night/week/month/year", forward-relative phrasing ("tomorrow",
 * "in three days"), and the idioms "the other day", "a while back"/"a
 * while ago", and bare "earlier".
 *
 * WHAT THIS DELIBERATELY DOES NOT FLAG (word-boundary, not substring,
 * matching — a previous sweep nearly mangled a word that merely contains
 * "ago", e.g. "Chicago"):
 *
 *   - Bare "now" ("Zero setup, right now"; "Adam writes one line now") —
 *     only "just now" is a relative claim; "now" alone names a category
 *     of moment, the way "tonight" does below.
 *   - "tonight" ("One shared novel, one reader tonight.") — an activity
 *     template's own instruction, not a timestamp on a specific record.
 *   - "this hour" (lib/resurface.ts: "Left at this hour, in June") — this
 *     pattern only bans "this" directly before morning/afternoon/evening/
 *     night/week/weekend/month/year; "this hour" names a clock-hour
 *     bucket that resurface.ts already states honestly (it never claims
 *     which day).
 *
 * KNOWN LIMITATION — do not repurpose this as a repo-wide lint without
 * reading this first. Matching is case-insensitive, so it also flags the
 * app's own proper-noun screen name "Today" (the dock label, the page
 * title "Today — Eva & Adam", `aria-label="Today"`), and bare "earlier"
 * will also flag a non-timestamp use like "an earlier draft". Those are
 * false positives this pattern cannot tell apart from the string alone —
 * it is intentionally scoped to specific known copy under test, not every
 * string in the app; see `lib/__tests__/copy-law-tree.test.ts` for the
 * allowlist that scopes it up to a repo-wide sweep.
 */
export const RELATIVE_TIME_PATTERN =
  /\b(?:(?:(?:a|an|\d+|a\s+couple(?:\s+of)?|a\s+few|one|two|three|four|five|six|seven|eight|nine|ten)\s+)?(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?|moments?)\s*ago|in\s+(?:a|an|\d+|a\s+couple(?:\s+of)?|a\s+few|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)|yesterday|tomorrow|just now|recently|today|earlier|the\s+other\s+day|a\s+while\s+(?:back|ago)|this\s+(?:morning|afternoon|evening|night|weekend|week|month|year)|last\s+(?:night|weekend|week|month|year))\b/i;
