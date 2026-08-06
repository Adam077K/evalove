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
 *     night; "this hour" names a clock-hour bucket that resurface.ts
 *     already states honestly (it never claims which day).
 *
 * KNOWN LIMITATION — do not repurpose this as a repo-wide lint without
 * reading this first. Matching is case-insensitive, so it also flags the
 * app's own proper-noun screen name "Today" (the dock label, the page
 * title "Today — Eva & Adam", `aria-label="Today"`). Those are a room's
 * name, not a claim about when something happened, and this pattern
 * cannot tell the two apart from the string alone. It is intentionally
 * scoped to specific known copy under test, not every string in the app.
 */
export const RELATIVE_TIME_PATTERN =
  /\b(?:(?:a|an|\d+)\s*(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s*ago|yesterday|just now|recently|today|this\s+(?:morning|afternoon|evening|night))\b/i;
