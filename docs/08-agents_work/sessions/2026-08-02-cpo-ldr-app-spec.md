---
date: 2026-08-02
role: cpo
task: ldr-app-spec
status: COMPLETE
qa_verdict: N/A — planning invocation, no code, no merge
tier: n/a
---

# Session: CPO — LDR App PRD

**Task:** Full product spec for a private PWA for one couple (IL ↔ NYC). Three pillars + "lots more cute little things" + phased roadmap. Planning only; no subagents available.

## What was done
- Read the full research substrate: `library.json` (98 activities, 31-field schema, 5 cross-thread artifacts), `coverage-matrix.md`, `WINDOW-CONTRAINDICATIONS.md`, `APP-COMPATIBILITY.md`, shelf list in `ACTIVITY-LIBRARY.md`, DECISIONS.md.
- Wrote `docs/04-features/LDR-APP-PRD.md` — thesis, 3 pillars with user stories, 35 cute-thing candidates with adapted-RICE shortlist and explicit cuts, 3-phase roadmap, 25 acceptance criteria, 11 non-goals, CTO notes, 5 open questions.
- Populated `.claude/memory/USER-INSIGHTS.md` (was empty; CPO is an authorized writer) with the founder's verbatim phrases so CMO/Design-Lead/CTO inherit the same grounding.

## Decisions made
- **The 31-hour shared day.** A shared day D opens 00:00 `Asia/Jerusalem` and closes 23:59 `America/New_York` on the same named date; streak evaluates at NY midnight only. Solves the split-day problem T6 found unsolved across all 10 audited apps. Schema-level — settle before building pillar 3.
- **Zero-tap single card, not a browser.** Hard filters (window fit, contraindications, screen-free in W3, duration ≤ remaining, asleep-aware, owned-cost) then rank then shuffle top 3. Shelves browse demoted to second level, named in the couple's language per the locked nav decision.
- **`Left for you` is architecture, not a feature.** Promoted into Phase 1 above its RICE rank because 5 later features are instances of it.
- **Cut:** live co-browsing of the book, shared song of the week, sealed letters, a W6 screen, print/export before Phase 3, any relationship score or gamification.

## Findings worth carrying
- **The gap is not always 7 hours.** Computed from tzdata: 6h from 2026-03-08→03-27 and 2026-10-25→11-01 (~26 days/yr). Every window boundary shifts an hour. A hardcoded offset is wrong for a month a year.
- **Two `library.json` ingest hazards:** `cost` is free text (31 distinct strings) and needs a normalized enum; `apple_shareplay` is tri-state with 16 `"unknown"` and must not be coerced to boolean.

## Blockers / open questions
5 founder questions, all build-changing: next-visit date · names-vs-second-person voice · streak forgiveness model · where the existing photos live · whether the app holds genuinely private content (changes storage + QA risk tier).

## Revision 2 — founder decisions applied (same day)

Four answers came back; PRD updated and a locked §0 added so none of them get re-opened.

- **D1 private content = yes.** Risk tier raised to Full (storage schema Irreversible). Added AC-24→AC-32: private door with re-auth, EXIF/GPS stripping, encryption at rest, signed short-lived URLs, real deletion verified by replaying a pre-deletion URL, no media to third parties, no media in notification previews. Also derived a requirement the founder didn't ask for but D1 forces: **private items are structurally separate from the page-turn**, because the product's own window model says she may be in public (W4) or on a train (W3) while turning pages.
- **D2 countdown cut, whole counter register banned.** Agreed and argued for it in §7 — the countdown was Phase 1's only tonally out-of-place element; RICE scored it 126 because RICE can't see tone. **Promoted C8 (goodnight → good morning) to the home anchor** — same warmth, sourced from something that happened rather than something hoped for, and its empty state becomes an invitation to be generous. **Promoted C5 (next time you're both free) to Phase 1** for the informational slot; near-free on the existing window engine. Did *not* promote C2 their sky to anchor: weather is texture, not a gesture.
- **D3 count never breaks.** Grace days deleted. Added three binding copy rules (no loss/risk/debt framing, unit is "days you were both here" not consecutive days, silence on a missed day) and AC-14/AC-16 to enforce them. Told CTO this removes state, not adds it — no break job, no decay timer.
- **D4 real names.** `{{HER_NAME}}` / `{{HIS_NAME}}` tokens throughout, AC-38 audits for stragglers.

**Honest read on Phase 1 coherence:** it holds, and it's more coherent than before. But the cut moved weight onto the cold start — every remaining home-screen element except the clocks and the suggestion card depends on someone having *done* something, so first-launch now leans on the photo import landing. That promotes open question 4 (where the existing photos live) from nice-to-know to answer-before-CTO-scopes-the-book.

## Revision 3 — name, pair mechanic, English-only (same day)

- **D5 the product is "Eva & Adam."** Eva in New York, Adam in Israel. Placeholders retired for literal strings; Eva-before-Adam ordering applied throughout including the nine window labels, which are now specced verbatim in §2. Noted the copy consequence CEO didn't ask about but that saves real work: third person means **one canonical string per surface, no per-viewer variants** — a second-person product would have needed two of every string plus a notion of who's reading. Added a hard non-goal against Eden/garden theming.
- **D6 one photo each as a pair.** Specced the **half-pair as the normal state**, not an edge case, with separate requirements for what it must convey to the one who posted vs. the one who hasn't, plus two hard rules: no elapsed-time counter on the missing half (D2 forbids it and it'd be the most pressuring number in the product), no notification to a sleeping partner.
- **D7 English only.** Non-goal + AC-39.

## Reconciliation with CTO's architecture — I withdrew my model

**Adopted CTO's Couple-Day anchored at 08:00 UTC and withdrew my 31-hour shared day.** CTO's is better and I said so in the PRD rather than quietly swapping it: my boundary landed at IL 07:00 / NYC midnight, which is **the middle of W1** — their largest window at 31 activities — and my consecutive 31-hour intervals **overlapped by 7 hours** (the prose rule resolved it; the interval framing was sloppy). CTO derived the anchor by projecting all nine windows onto Israeli local hours and finding the only dead stretch wide enough to absorb DST. What survives from my version is the *requirement* (shared, honest, never cut by a device midnight), not the arithmetic.

**Confirmed for CEO: pair completion is order-independent** — each photo is stamped from its own timestamp and completion is a set test over (couple_day, member). No first-poster, no sequence, no race. Property of the model, so it can't regress quietly.

**Two divergences flagged, neither blocking, neither touching the anchor:**
1. **Architecture §3.4 contradicts D3.** It defines a *consecutive* streak with grace credits, a `pauses` table, and "two incomplete days in a row ends the streak." D3 is an unbreakable count. The correction *simplifies* the build: `count(*)` over complete days instead of a run-scan, `streak_grace_per_week` and the grace mechanism deleted, and the `pauses` table unnecessary for this purpose (during a visit days simply aren't complete, so nothing needs pausing).
2. **The ±2 h seam affordance misses Adam's most natural posting hour.** Boundary is IL 10:00/11:00, so the toggle covers ~IL 08:00–13:00 — but his day starts at IL 05:00 and W1 runs 05:00–09:00. A daily photo of his own morning taken IL 05:00–08:00 files to the previous couple-day with no toggle offered. Architecture §3.2's "no shared activity is mislabelled" is right for *shared sessions*; D6 makes the daily photo a *solo artifact about one person's day*, a case the derivation predated. Recommended offering the toggle on every `kind='daily'` post rather than seam-gating it. CTO's call.

ACs now 42.

## Revision 4 — DST reconciliation verdict + seeding (same day)

**DST verdict — the adopted 08:00Z model survives; mine would not have.** CEO asked specifically about transition days, which I had not verified numerically. Computed from tzdata 2026–2028 to the minute:
- Exactly three offset regimes occur (`IL+2/NY−5`, `IL+2/NY−4`, `IL+3/NY−4`); `IL+3/NY−5` never happens.
- 08:00Z lands at IL 10:00–11:00 / NYC 03:00–04:00 in every regime **including on transition days** — dead zone throughout.
- Nearest transition instant to a boundary is the US spring-forward at **07:00Z, one hour before**. Israel's land at 00:00Z and 23:00Z. **None ever coincides.**
- Structural reason: `couple_day` is pure UTC arithmetic, so a local-time transition is invisible to stamping. Every couple-day is exactly 24 h of real time — no day skipped, duplicated, lengthened or shortened.
- **My withdrawn model was DST-sensitive by construction** — local-midnight bounds meant 32 h on NY's fall-back, 30 h on spring-forward, and Israel's transitions moved its opening instant. That's the decisive argument I should have had before the first draft.
- Second-order note passed to CTO: the boundary drifts an hour, so a fixed ±2 h seam covers IL 08:00–13:00 in summer but 08:00–12:00 in winter — further argument for an always-available day toggle over a tuned window.

**Seeding (D8).** Photos are on two iPhone camera rolls; no import exists to build. Specced first-run seeding as a Phase 1 screen. The requirement I'd defend hardest: **one person's half must already be a book worth turning** — Eva seeds, Adam seeds hours or days later, and for that whole stretch the book has one contributor and that is the first thing either of them ever sees. Adam's arrival is additive, not completing. This also de-risks the cold start further: the book stops being empty the moment *either* seeds, not when both have. Banned: completion percentages, progress meters, two-of-two checklists, "setup incomplete," elapsed-time-since-Eva-seeded. Seeding is never onboarding.

**D9 recorded** — private path separate at the data layer, not a filtered boolean column.

ACs now 44. No open questions remain.

## Revision 5 — hosted dates (D10/D11), the scope expansion

**A. Which dates.** Three, chosen as **one interaction shape** rather than three favourites — alternating short-text turns, no timer, resumable, ends with a page — so the second and third cost a fraction of the first: **the story** (Fortunately/Unfortunately, best artifact in the library, most improved by hosting) · **twenty questions** (asymmetric roles, genuinely needs a neutral holder for the secret and count, widest window coverage at four) · **the paired question** (Love Map + Newlywed reveal; nearly free because it's the daily photo pair with text instead of an image). Rose/Bud/Thorn ships as a prompt variant of the third, not a fourth build.

The filter that cut hardest, and the one that isn't obvious: **is a single turn worth waiting seven hours for?** Turn-based ≠ async-friendly. Ghost's turn is one letter; its pleasure is the rally. That test cut Ghost, Minister's Cat, Picnic, Just a Minute, and Contact — all fine live, none worth hosting. Also cut: T3's third-party async games (rebuilding correspondence chess would be the worst use of Phase 1) and, via a negative test, **the T5 protocols** — 36 Questions, Imago, Hold Me Tight, Dreams Within Conflict are contraindicated *by truncation*, so hosting them async would convert their core mechanic into their documented failure mode.

**B. Does it break Phase 1? Yes — said so plainly rather than absorbing it.** But the framing matters: **dates redefine Pillar 1 rather than extending it**, so deferring to Phase 1.5 is the *most* expensive option — we'd build Pillar 1 twice. Recommended taking the scope now and re-cut to pay: moved out C2 their sky, C5 next-time-both-free, and the shelves browse; absorbed C23 (a finished date session *is* the log) and C27+C28 (that's date #3). Net: Phase 1 still grows, CTO must size it, and I gave an explicit order of sacrifice — cut dates before cutting the subsystem, because three thin dates is the failure the founder named.

**C. The date session.** States `open` → `finished` | `faded` — and the banned words (`failed`, `abandoned`, `expired`) are banned in the codebase too, since names leak into strings. Fade at 30 days, derivable with no scheduled job. No deadline, timer, or turn reminder, ever. The rule that stops open dates becoming a task list: **an open date awaiting your turn outranks a new suggestion** — invisible, better than a concurrency cap. Every finished date writes a removable page. **Dates never feed the day-count.** And a pending turn is the richest possible occupant of the "what Eva left" anchor — so dates and C7's left-for-you share one inbox concept, making the home screen more coherent, not less.

**D. No visible distinction, for a stronger reason than avoiding a taxonomy: there is no distinction to hide.** Everything is a date; where it happens is an implementation fact. One exception that isn't a taxonomy — the button doesn't lie: "Start" vs "We're doing this."

ACs now 53.

## Revision 6 — CEO ruling: local-date model reinstated

CTO and I swapped models simultaneously — I withdrew mine for its 08:00Z anchor while it reversed for mine. Messages crossed. **CEO ruled for the local-date model; recorded in the PRD as the deciding rationale, not a third opinion.**

**Re-verified independently before reinstating** (didn't take CTO's validation on trust): across all of 2026, shared-day length is **31h × 339 days, 30h × 26 days, never any other value**; **zero ordering violations**; **zero containment violations** — every person's full local date sits inside its own shared day, which is what makes "neither can ever be late" true rather than aspirational.

**The real correction to my own spec:** the 7h overlap I flagged was a *framing* error, not a defect. I described the model as an interval and then worried consecutive intervals overlap. It isn't an interval model — **assignment is a function of who posted and their own local date**, and each person has exactly one local date at any instant. Nothing is ever assigned by asking which interval contains a timestamp. Restating it as an assignment rule makes the objection disappear rather than excusing it. The 30/31h span is a derived property.

**Folded in from CTO:** no scheduled job — completion is a pure function of rows + `now()`; my "evaluated at NYC midnight" wording invited a cron and has been rewritten. Noted that this is now **the third mechanism in the product that looks like it needs a scheduled job and doesn't** (the count, the date fade, and completion). Device-reported IANA zone preferred over home zone, so **visits are handled for free** — which is why deleting `pauses` costs nothing.

**Retracted my own seam flag** — CEO had endorsed it to CTO before the ruling landed, so it needed pulling before someone built against it. The flaw was specific to the 08:00Z anchor and **dissolves with the model that had it**. What survives is better: the seam moves to each person's own local midnight, a boundary humans already feel, and it also covers the one hazard of preferring the device zone (stale zone / mid-flight).

**Answered CTO's private-surface question: a real surface, smallest complete version, Phase 1.** A flag with no UI isn't a shippable half — it's dead code plus a write-only hole the couple will nonetheless put things in. And D9's data-layer separation happens either way, so the surface is the cheap part. Scope: mark on upload, mark/unmark after, re-authenticated entrance, plain grid, delete from inside. **Deliberately not a second page-turning book** — the book metaphor is for what they show each other. No offline support needed, since AC-36 already forbids private items in the cache.

ACs now 58.

## Revision 7 — day model closed (D12), dates cut approved

**CEO's third and final ruling closes the day model.** The PRD already carried the reinstated local-date model from revision 6; this revision adds what makes it stay closed.

- **The deciding test, named and permanent:** *can a photo ever land on a shared day that is already complete?* Per-person stamping: never. 08:00Z anchor: every morning of Adam's life unless he remembers a toggle at 5am — and a correctness property that depends on someone remembering a toggle is not a correctness property. Asserted directly as AC-13d.
- **My reasoning error recorded, because the lesson generalises.** I withdrew a sound model arguing it was "DST-sensitive by construction — 32h on fall-back." I **conflated span-length variance with stamping fragility**, and was wrong on the numbers too (my own verification found only 31h/30h, never 32). The span is a display artifact; the rule never references it. The property that actually matters is that each person has exactly one local date at any instant — true on fall-back when 01:00–02:00 occurs twice, true on spring-forward when 02:00–03:00 doesn't exist. **Lesson: verify the property the rule depends on, not the most measurable adjacent quantity.** I measured span because span was easy, then let its variance argue against a rule that never mentioned it.
- **08:00Z recorded as a rejected alternative** with CTO's full derivation and its genuine strengths intact, so nobody re-derives it. It lost on one thing, stated plainly.
- **Toggle demoted** from correctness mechanism to affordance — "post a photo of yesterday." AC-13c now requires that with the toggle disabled, every stamping AC still passes.
- **Test 1 elevated to a standing criterion:** *is a single turn worth waiting seven hours for?* Applies to anything ever proposed for hosting, any phase, anyone.
- **T5 protocols escalated from note to hard non-goal**, with the contraindication quoted directly, written at length precisely because it will look like an obvious win to someone in six months.

Dates cut, order of sacrifice, session states + banned words, and the suggestion-precedence rule all approved as specced.

ACs now 60.

## Files changed
| File | Change |
|---|---|
| `docs/04-features/LDR-APP-PRD.md` | Created, then revised for D1–D4, D5–D7 + architecture reconciliation, D8–D9 + DST verdict, D10–D11 hosted dates, D12 day model closed |
| `.claude/memory/USER-INSIGHTS.md` | Populated from empty |

_Session by: cpo | 2026-08-02_
