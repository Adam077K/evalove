---
date: 2026-08-06
role: cmo
task: dates-cardcopy
status: COMPLETE
qa_verdict: N/A — no QA-Lead spawned this session; fixture data only, gates work for a code worker
fixture_file: apps/web/lib/fixtures/suggestions.ts
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

Total: 31 entries (5 existing + 26 new). Coverage, verified by parsing the committed file:

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
