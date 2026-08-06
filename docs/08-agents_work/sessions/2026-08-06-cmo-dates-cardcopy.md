---
date: 2026-08-06
role: cmo
task: dates-cardcopy
status: COMPLETE
qa_verdict: PASS — QA-Lead gated this branch after the fact (Lite tier, 0 P1, all findings P3). See docs/08-agents_work/sessions/2026-08-06-qa-lead-dates-cardcopy.md. This line originally read "N/A — no QA-Lead spawned this session", true when written, false once the gate ran.
fixture_file: apps/web/lib/fixtures/suggestions.ts
worktree: /Users/adamks/VibeCoding/evalove/.worktrees/dates-cardcopy
branch: feat/dates-cardcopy
---

# Dates card display copy — interim fixture

## Brief

Design-Lead's `2026-08-06-design-lead-dates-rebuild.md` (§6) named this CMO work: the
`library.json` `name`/`one_liner` fields are research copy, not interface copy (median 40.5 /
184.5 chars, max 75 / 346) — rendering them on a card reproduces the truncation defect the
current build already has. The existing 5-entry fixture in `apps/web/lib/fixtures/suggestions.ts`
already carries the display-copy contract (`title` ≤34 chars, `description` ≤66 chars) but only
covers windows w1, w3, w4, w8, w9 — leaving w2, w5, w6, w7 rendering the thin-window empty state
permanently, including w7 (Saturday, the flagship, 40 real entries) and w5 (live at measurement
time).

## What I did

Read `USER-INSIGHTS.md` first (gate check below), then `library.json` (98 activities, window_fit
arrays, name/one_liner/duration_min/cost/apple_shareplay/screen_free/intimacy_level/tier/
verification_tier per record) and the existing 5-entry `SUGGESTIONS` fixture to match its exact
shape (`ActivityIndexEntry`: id, title, description, durationMin, costTier, costConditional,
costNote, shareplay, screenFree, intimacyLevel, windowFit, tier, verificationTier).

Selected 26 additional records — prioritizing w2/w5/w6/w7 first per the brief — and authored a
`title`/`description` pair for each, derived from that record's `name` and `one_liner`. Every
`windowFit` array is copied verbatim from the record's own `window_fit`, so a single entry often
counts toward several windows (e.g. `t2-diy-body-doubling-facetime` covers w5, w8, w9 at once).

Total: 31 entries (5 existing + 26 new) in this first pass — see "Founder's ruling" below for two
more added after review, bringing the final total to 33. Coverage, verified by parsing the
committed file, first pass:

| Window | Count | Window | Count | Window | Count |
|---|---|---|---|---|---|
| w1 (she's in bed, he's awake) | 7 | w4 (her lunch break) | 11 | w7 (Saturday) | 8 |
| w2 (she's up early) | 7 | w5 (he's fading, she's just off work) | 5 | w8 (his Friday off) | 7 |
| w3 (her commute) | 8 | w6 (worth staying up for) | 4 | w9 (her Sunday off) | 7 |

All nine at ≥4, comfortably above the ≥3 floor. w2/w5/w6/w7 — the four that rendered the
thin-window empty state permanently — went from 0 to 7/5/4/8 respectively.

Longest `title`: 33 chars (cap 34). Longest `description`: 66 chars, at the cap exactly (two
entries land there — `t4-twenty-questions` and `t7-voice-note-audio-only-commute`). No entry
exceeds either cap.

## Law compliance

- **No window codes in UI strings.** Grepped every authored `title`/`description` for `w1`–`w9` /
  `W1`–`W9` — none leak through. One source record's own `name` did carry a code —
  `t1-espn-twitch-live-sports-w6`, literally *"...the W6 Alarm-Worth-Setting Activity"* — stripped;
  card copy reads "Live sports, watched in sync" / "Saved for what is worth losing sleep over."
  (id keys retain the library's own slug, which is not rendered.)
- **Eva's name first.** Grepped for any string containing both names — three hits. Caught and
  fixed one violation before finalizing: `t6-commute-voice-question`'s description originally read
  "Adam leaves it as a voice note; Eva answers..." (Adam first, following the source's "he
  calls... she answers" framing) — rewritten to "Eva answers, hands-free, one voice-note question
  from Adam."
- **No counters/streaks/seen language.** Skipped `ldr-duolingo-shared-streak` even though it fits
  w2/w4/w8/w9 well, specifically because its content centers a Duolingo streak mechanic and I did
  not want to risk that reading as our own product implying scorekeeping. Plenty of other
  candidates existed per window so nothing was lost by the exclusion.
- **No emoji, no exclamation marks, sentence case throughout** — checked by eye across all 26.
- **No AI clichés** — none of elevate/seamless/unleash/next-gen/game-changer/delve/tapestry/"in
  the world of" appear.
- **Voice** — held to the founder-loved calibration line's register: concrete, unhurried, slightly
  wry, never selling. E.g. "A call left open all day" / "No obligation to talk — just a line
  either of them can dip into" (t2-ambient-day-long-facetime, from the source one_liner's "zero
  obligation to talk — a low-attention presence line either can dip into").

## A scope call, flagged rather than made silently

w6 ("worth staying up for") holds only 10 records total, two of which are explicitly
intimate/sexual (`t7-sexting-as-connection-ritual`, `t7-app-controlled-toy-realtime-overlap`). I
chose not to author card copy for either in this interim, general-purpose dev fixture — not
because the brief forbade it (it didn't; the product's own scope includes intimate content per
USER-INSIGHTS.md) but because a tasteful ≤66-char rendering felt more like euphemism than honest
derivation, and w6 reached its coverage target (4) without them. This is a judgment call, not a
policy — CPO/founder should weigh in before the real 98-entry library is wired if those two are
meant to surface as date proposals.

## Founder's ruling — resolved, not re-open for the library pass

I raised the exclusion above rather than deciding it silently; the founder read it and ruled:
**include them, written plainly.** Card copy for both now exists in `SUGGESTIONS` (see below);
total fixture is 33 entries.

**Both sides of the reasoning, for whoever wires the real 98-entry library next:**

- **My side, at the time:** the failure mode I was guarding against was *fabrication by
  euphemism* — compressing an explicit record into 66 characters by writing around what it
  actually says ("something private", "a little something") produces a card whose claim the
  source record doesn't quite support. That's the same "derive, never invent" rule that shaped
  every other pair in this fixture, applied to the direction of softening rather than escalation.
- **The founder's side, and the one that stands:** w6 is the both-alert window *by design* —
  intimacy is not incidental content that happened to land there, it is what the window is for.
  A card that gets coy about what its own source record says is exactly the softening I was right
  to name as a risk — but the honest fix runs *through* the content, not around it. Naming the
  record's own subject plainly (the record's own name is literally "Scheduled sexting...") is not
  escalation; declining to name it and reaching for a vaguer synonym would have been the
  fabrication. He made the call having seen the real cost stated plainly first: the card is
  unprompted and either of them may open Dates with family in the room, and accepted that.

**The settled rule going forward:** plain and derived beats vague-but-safe *and* beats
crude-but-invented. Compress, don't launder. If a record's own words are explicit, the card's
words may be too, scaled to 34/66 characters, never past what the record itself supports.

**The two entries, added to `SUGGESTIONS`:**

| id | title (chars) | description (chars) |
|---|---|---|
| `t7-sexting-as-connection-ritual` | "A standing time to sext" (23) | "Set on the calendar in advance, not left to chance timing." (58) |
| `t7-app-controlled-toy-realtime-overlap` | "An app-linked toy, live" (23) | "One moves; the other feels it, in real time." (44) |

Both derived directly from their `library.json` `name`/`one_liner` (scheduled-not-spontaneous
sexting ritual; app-controlled toy with real-time cross-device control). Neither invents detail
beyond the record — the first names the practice the record names, without describing content
the record doesn't specify; the second states the mechanism the record states (movement on one
side, sensation on the other, live) without assigning a direction to either partner, matching this
fixture's existing convention of "one / the other" for symmetric or either-direction activities
(e.g. `t4-two-truths-and-a-lie`, `ldr-words-correspondence`). Both stay well under cap (23/58 and
23/44 against 34/66) and both pass every other standing rule: no window code, no emoji, no
counters, no exclamation marks, sentence case, Eva-before-Adam is not applicable to either (no
name is used in either pair, consistent with the fixture's established symmetric-activity
pattern).

**Updated coverage** (33 entries total; w1/w5/w6/w7 gained one record each from the two above,
`t7-app-controlled-toy-realtime-overlap` also lifts w7):

| Window | Count | Window | Count | Window | Count |
|---|---|---|---|---|---|
| w1 | 8 | w4 | 11 | w7 | 9 |
| w2 | 7 | w5 | 6 | w8 | 7 |
| w3 | 8 | w6 | 6 | w9 | 7 |

Longest `title` still 33/34, longest `description` still 66/66 — neither of the two new entries
set a new max.

## USER-INSIGHTS.md gate

Read first, as required. **Not stale** — Research Log's two entries are both 2026-08-02, within
the 60-day window as of today (2026-08-06). Used directly: "Use these words. Never W1–W9 in any
UI" (window-code ban, honored above), "Eva before Adam everywhere" (honored, one violation caught
and fixed), the nine windows' own language (used in this file's own headings, never inside the
authored card strings themselves, per the design spec's removal of the window rail).

## What I did not touch

`docs/10-activity-library/library.json`, `DatesExplorer.tsx`, `HostedDates.tsx` — fixture data
only, per the brief's scope fence. The thin-window sentence in `DatesExplorer.tsx:122-123` still
carries the founder-locked line with the interpolation bug the design spec (§4) flags for a
frontend worker to fix — out of scope here. Did not author all 98 pairs — this is the interim
that unblocks the rebuild, not the follow-on full pass.
