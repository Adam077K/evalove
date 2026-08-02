# Session Log: Design-Lead — LDR app visual direction + naming

**Date:** 2026-08-02
**Lead:** design-lead
**Task:** Visual direction, name shortlist, book-interaction spec, and surface architecture for the two-person LDR PWA
**Task type:** NEW_PAGE (direction only — planning invocation, no build, no subagents)
**Status:** Complete
**QA verdict:** N/A — no code written, nothing to merge. Contrast pairs pre-checked against WCAG AA in the spec so QA-Lead has a baseline.

---

## What Was Done

- Read `docs/10-activity-library/ACTIVITY-LIBRARY.md` (9 windows, 15 shelves) and confirmed the geography from the window data rather than assuming it: **he is in Israel, she is in NYC** (W1 has her in bed at NYC 22:00 while he is fresh at IL 05:00; W3 puts her on a NYC 07:00–10:00 commute).
- Loaded 4 skills: `ui-typography`, `frontend-design`, `high-end-visual-design`, `emilkowal-animations`.
- Produced `docs/04-features/LDR-APP-DESIGN-DIRECTION.md` — 9 sections, buildable by a frontend engineer without a second briefing round.
- Computed WCAG contrast ratios by hand for all 8 text/background pairs across both modes rather than eyeballing them. All clear AA; four clear AAA.

## Files Changed

| File | Change |
|------|--------|
| `docs/04-features/LDR-APP-DESIGN-DIRECTION.md` | Created — thesis, 10 names, colour/type/texture/motion system, book-interaction spec, empty state, nav, surfaces, 10 references, 7 perf risks, 7 open questions |
| `docs/08-agents_work/sessions/2026-08-02-design-lead-ldr-app.md` | Created — this file |

## Decisions Made

- **Thesis: well-made notebook, not scrapbook.** Resolves the cute/professional tension via a single rule — *the interface never expresses emotion; only the content does.* Warmth comes only from materials, physics, and their own language.
- **Tactility is spent on behaviour, not texture.** Bad skeuomorphism simulates materials photographically. This design simulates physics and goes near-zero on simulated material. One noise layer, honest fore-edge lines, no leather/stitching/deckle/tape.
- **Two inks, one per person.** `--ink-him #2C4B6E` (marine) / `--ink-her #8E4A63` (rose-oxblood). Every handwritten thing is set in the writer's colour. Replaces avatars, name labels, and chat bubbles. This is the system's signature.
- **All-serif, no sans anywhere.** Fraunces (display, `WONK 1` above 20px) + Literata (reading; commissioned for Google Play Books). This is the deliberate aesthetic risk. Guarded against the broadsheet failure mode by layout, not by type.
- **Dark mode dims the light rather than inverting the book.** Page stays a warm charcoal page, room goes near-black, photos stay bright with an optional `brightness(0.82)` Dim default-on at night. W1 is the biggest window they have and she is in it with the lights off — dark mode is half the product.
- **Rigid CSS 3D leaf, not WebGL mesh curl.** A leaf that follows the thumb 1:1 at 60fps and is grabbable mid-flight reads as more physical than a curl that drops frames. Apple demoted the iBooks curl from default; took the same deal.
- **The first 8px of drag lifts the corner instead of rotating.** Cheapest, highest-yield detail in the whole interaction.
- **No `+` button.** Photos are added by turning to today's page, which always exists and is always the last leaf. Two frames, pre-labelled with their real names — that is the entire onboarding.
- **The fore-edge thickness is the only progress indicator.** No counters, no streaks. The book physically gets fatter. Best available anti-gamification move and it is free.
- **No tab bar. Ribbons are the nav** — his and hers, each marking where that person last was. Presence delivered as an object property rather than a green dot. Nearly free to build; no competitor does it.
- **The cover is the overlap clock**, drawn using the app's own two modes as its two colours (lit arc = `--paper`, dark arc = `--surround`). Needs no legend.
- **The activity browser is a contents page with dot leaders.** The only layout that presents the library's long human sentences as navigation without shredding them into chips. Tiers expressed as position, not badges. Exactly one control (`Now` / `All`).
- **Rejected** in writing so it does not get re-proposed: tab bar, FAB, photo grid, streaks, activity cards, deckle/washi/tape, pure-black dark mode, and the cream + high-contrast-serif + terracotta cluster.

## Blockers / Open Questions

- **refero MCP unavailable to this agent.** It is configured globally (`~/.claude.json`) but `mcp__refero__*` and Playwright were not exposed to this invocation — my tool set is Read/Write/Edit/Bash/Task. Substituted 10 real, named references from direct knowledge; 4 are marked **[capture]** so whoever briefs the engineer screenshots them first. This is a gap, not a fatal one, but the engineer should see Apple Books' turn and Family's motion as *video*, not prose.
- **P5 — no haptics in an iOS PWA.** The Vibration API is unavailable on iOS Safari, installed or not. Page-turn haptics were going to be a real part of the tactility and cannot be recovered in-PWA. Substituted an optional quiet paper sound. If haptics are judged essential, that is a native-wrapper decision for CTO.
- **P1 — the page turn at 60fps on iOS Safari with real photographs** is the one risk that could kill the product. Measure it before anything is built on top of it.
- **Their two real names are required** before the empty state can be built. `Partner A` breaks the title page and both photo frames.
- **Hebrew is unresolved.** Neither chosen face covers it. If any content is Hebrew, add Frank Ruhl Libre — and RTL flips the page-turn direction, which is a design fork rather than a CSS switch. Cheapest to answer now.
- **Daily exchange: one photo each or one shared?** Assumed one each (two frames). Changes today's page layout.
- **Name is the founder's call.** Meanwhile / Erev / Quire — time, moment, or object. Erev carries a specific risk: it is his language, and if she has no relationship to Hebrew it becomes his app rather than theirs.

---

## Revision 2 — founder decisions incorporated (same day)

Six updates arrived mid-flight. Doc rewritten in place rather than appended to, because two of them contradicted revision 1 and an addendum would have left an engineer building the wrong front door.

**What changed:**

- **§2.3 added — names in the interface.** Voice is now name-based (`{{HER_NAME}}` / `{{HIS_NAME}}`), never pronouns. The real constraint is typographic: a 3-letter and a 9-letter name must both sit well. Hard rule — **never ellipsize a person's name**; constrain the container, never the string. Names always render in that person's ink, which lets a sentence containing both be parsed at a glance. Happy accident: the contents page's dot leaders absorb variable name length for free, which is exactly what leaders were invented for.
- **§5 restructured — the cover is now the front door**, per CPO's locked thesis. The suggestion sits **on** the cover (the clock's conclusion under the clock, zero taps), rendered as a **tipped-in slip** rather than a card — real bookbinding, and it makes "something else" physically sensible since a slip is *replaced*. Two deliberately unequal buttons; the primary is filled with the ink of whoever is holding the phone. After three "something else" taps it offers one quiet line linking to browse — it never dumps them into a list, which would be the app giving up and asking them to decide.
- **§5.1 — the sky replaces the deleted counter.** The cover's surround is the *other person's sky right now*, computed from solar altitude (pure function, ~2 KB, offline). She opens it at 11 p.m. in New York and the light behind the book is his morning. Present tense, zero arithmetic. Capped to ~0.25 luminance in Night mode so his 9 a.m. is not fired at her at 2 a.m., and no text ever sits on it.
- **§5.3 — the tucked photograph.** Unseen = lifted 2px and rotated 0.6°, as though tucked by hand. Seen = pressed flat. **The unread indicator is that it has not been pressed flat yet.** No dot, no badge, no count.
- **§6 added — the asleep state.** Mostly free: the dial's dark arc and the night sky already say it. What changes is that the slip switches register to asynchronous activities — and the tenderness is that **asleep is the state the library is best at** (*"something she leaves as she falls asleep, that he wakes up to"*). Never a disabled control; remove it instead.
- **§7 — the streak is the fore-edge.** Days both showed up have a page; days they did not simply have none. Accumulates, never decreases, no target, cannot be lost — every requirement met by a component that already existed, zero new UI. **Missed days must be invisible, not empty**: any calendar grid renders a miss as a hole, and a hole is a rebuke by geometry.
- **§9 added — the offset is computed, never illustrated.** Derived from IANA zones only; no fixed-offset asset anywhere; recompute on `visibilitychange` and a 60s tick.

**Conflicts with revision 1, and how they resolved:**

| Conflict | Resolution |
|---|---|
| Rev-1 §9 rejected "streaks, counters"; founder decided otherwise | Not a real conflict once the streak *is* the fore-edge. Raised the concern once (a visible number becomes the point), then built it. |
| Rev-1 made the contents page the activity front door | Demoted one level, reached by the neutral ribbon. The design survives intact. |
| Rev-1 subtitle said "seven hours apart" | Corrected. Also strengthens the rev-1 rejection of the name *Seven / +7* — it would be wrong for a month a year. |
| Rev-1 tokens were `--ink-him` / `--ink-her` | Renamed `--ink-a` / `--ink-b`; the data model carries `partner.name / ink / city / tz`, which is also what §9's computed offset needs. |

**Two things I decided rather than asked, both flagged in the doc as reversible:**

1. **Shelf-name pronouns → names.** "Name-voice" and "shelf names stay in their own language" looked like a collision. I read them as agreeing — using their real names is *more* their own language — so the phrasing is preserved verbatim and only the pronoun is substituted (`{{HER_NAME}}'s in bed, {{HIS_NAME}}'s awake`). Collective phrasings like "One of us can't look at a screen" stay untouched. Template strings, so one line to revert.
2. **Where a literal streak number may live: the colophon at the back, not the title page.** The title page says `Begun 2 August 2026`, and a count next to a start date invites subtraction — *ninety days in, forty-one counted* — which manufactures exactly the elapsed-time arithmetic that was cut. Front and back keeps them far apart. Spelled in words, not digits: digits read as a metric, words read as prose.

**New accessibility finding.** The obvious way to render "asleep" — drop that person's ink to 70% opacity — takes `--ink-a` from 7.99:1 to **3.77:1 and fails AA**. Computed, not assumed. There is no headroom in this palette for opacity-as-state, so asleep is carried by the ribbon and the ring, both non-text. Recorded in the doc so nobody rediscovers it in a QA cycle.

**New perf risk:** P8, the sky recomputing too often. Pure function, so cheap — but compute on load / `visibilitychange` / 60s tick only, and transition the gradient in CSS rather than recomputing it.

---

---

## Revision 3 — name locked, all questions answered, two new surfaces (same day)

Three messages landed in sequence: the name and the answers, a correction on name order, and the camera-roll decision. Doc rewritten again as one source of truth. It is now the engineering brief, gated on §12.

**Name: Eva & Adam** — founder rejected all three candidates for their own names, and chose a **title-page treatment over a brand**, which is §0's thesis taken further than I took it. Set in Fraunces `wght 400`, never optically tightened (a wordmark kerns names together; a title page lets them stand apart), Eva in rose-oxblood, Adam in marine, **italic ampersand** — that one detail is most of the difference between title page and logo. Icon is `E & A` in three variants (light / dark / iOS tinted mask).

**Eva's name first, everywhere** — carried through as a system rule, not a string: verso leaf, New York clock first, her ribbon uppermost, every list. Where a sentence scans better the other way, the sentence gets rewritten. Exactly one existing shelf name needed it: `He's fading, she's just off work` → `Eva's just off work, Adam's fading`.

**Eden resonance** spent on exactly one element — the book's own third ribbon in muted garden green `#5E6B4F`. Everything else banned in writing (leaves, vines, apples, serpents, the word itself) with a paragraph explaining it was noticed and deliberately spent, so a future contributor doesn't "discover" the pun and add a leaf.

**New surfaces designed:**
- **§6 the daily spread** — the pair as a first-class artifact. The detail that carries it: **the local time in each person's own city under their photo** (`11:48 pm` under Eva's, `6:20 am` under Adam's). It shows the seven hours rather than stating them, on every spread forever, for one line of type. The gutter between the two photographs *is* the time difference.
- **§6.2 the half-pair** — empty photo corners, alone, crisp. Four mounted corners with nothing in them are a *reservation*, not an absence. The one detail that decides it: corners drawn at full opacity, never faded. Faded reads as spent; crisp reads as ready. It is the first thing an engineer will soften.
- **§6.3 day close** — an unpaired photo re-lays out as a **single plate**, corners removed. Otherwise a permanent half-empty spread becomes exactly the "greyed gap" CPO forbade. Corners-waiting is a live state only.
- **§7 seeding as the opening gathering** — seeded photos become the book's front matter, before the dated spreads, in each person's own picking order. **The fore-edge thickening is the progress indicator** (third time that component has paid for itself). No bars, no percentages, no file names.
- **§10 private items as the rear pocket** — bound into the inside back board, not a page, so a page turn can never reach it. Contents browse as a loose stack, deliberately a different gesture from the page turn so muscle memory can't land there. Re-locks on `visibilitychange`, not a timer.

**Corrections I made to briefed rationale, both checked rather than accepted:**

1. **The claim that Eva's photo chronologically precedes Adam's is backwards.** Adam's named day begins seven hours *before* Eva's — his midnight is her 17:00 the previous evening — so the 31-hour shared day opens on his side and closes on hers. The decision stands untouched (order is identity, not chronology), but the consequence is real and worth having: **his side fills first most days, so the empty half-pair is usually the LEFT leaf — the first page you read.** The half-pair state must be built and reviewed on the left. Left as prose in §2.3 so nobody builds ordering logic on the wrong version.
2. **The pocket outline cannot use `--paper-edge`.** It is an interactive control, so it needs 3:1 — `--paper-edge` on paper is ~1.15:1 and fails. Specified `--ink-soft` (5.31:1).

**Two anti-shame rules for the pocket**, since "not a panic button" needed a mechanism: **the pocket is always drawn**, contents or not — a control that appears only when there's something to hide is exactly what makes it feel shameful. And no panic affordances at all (shake-to-hide, decoys, quick-exit); they signal *you are doing something wrong*. Instant re-lock on blur does the same job silently.

**New perf risk P9 — seeding a large batch.** Dozens of full-resolution camera-roll photographs decoded and uploaded at once will thermally throttle the phone and can OOM the tab. Process serially, downscale before upload, never hold more than a few decoded images. The fore-edge animation buys real time here, but it must never block the main thread.

**P5 (no iOS PWA haptics) is now resolved at company level** — CBO's decision in DECISIONS.md is PWA-only unless a stated trigger fires (Safari ships the Vibration API, or a month of real use produces a repeated complaint). The paper-sound substitute stands.

**Delivered on request:** capture specs for the four video references plus a **negative reference** (any JS flipbook library on a real iPhone — ten seconds of wrong is worth a page of prose), and the §12 gating spike with build, device, thresholds, and what each outcome means.

**Closed:** name, order, ink assignment, English-only/RTL, one-photo-each-as-a-pair, photo source. **Six remain**, one of which now gates work: the oldest iPhone either of them owns.

---

## Revision 4 — dates reframe, platform constraints, spike re-derived (same day)

Triggered by the CEO answering the blocking device question. Read **PRD §3A** directly rather than taking the summary, which was the right call — it changes considerably more than was flagged.

**The vocabulary change nobody mentioned.** PRD §3A retires *activity*, *game*, and *minigame* — everything the app offers is a **date**. That is systemic: it lands on the slip, the browse surface, the section names in this doc, component names, and the codebase. Swept and recorded in the rejected list so it does not creep back.

**Two things in §3A that were design work, not product work:**
- **§5A added — a date the app hosts.** Three Phase 1 dates share one interaction shape, so one visual treatment covers all three. A date in progress is **a page being written**, not a chat: turns set as prose in each person's ink, no bubbles, no names, no timestamps in the flow. Whose turn it is, is an empty paragraph with a caret in your ink; if it is not your turn there is no field and no "waiting for Adam" — the page simply ends. The paired question holds **blank measure of the page open** beneath your answer rather than blurring or redacting theirs, for the same reason crisp empty corners work.
- **§6.4 added — the date page.** Every finished date writes a leaf, so the book holds text. One leaf, not a spread; heading in Fraunces with space rather than a rule; turns as prose with an indent on the second voice; running-head date matching the daily spreads, which is what binds the two kinds of leaf into one book. Plain paper, no ruled baselines.

**The button has two labels, not one.** PRD §3A.5: `Start` when the app hosts, `We're doing this` when it hands over. Size the pill for the longer label so it never resizes between slips.

**§9 needed a correction I would have missed.** Date pages thicken the fore-edge but must never feed the day-count (AC-50). I had written "the thickness of the book *is* the count," which is now false. Reframed: the fore-edge is the **accumulated record of everything they did**; the day-count is a separate, stricter thing computed from photo pairs alone. They do not conflict because the fore-edge was never a counter — it is evidence, and a finished date is evidence.

**Platform constraints (§12A added).** No Web Share Target and no manifest `shortcuts` on Safari, so *"I just took this, send it to our book"* does not exist and every photo requires opening the app. That makes one-tap-to-picker a hard requirement, and it forced a redesign of §5.3: **the anchor is now today's page itself, cropped by the viewport** — a live crop of a real page, not a widget about one, with a four-state table for what one tap does. Solves the requirement without the `+` button §3.4 rightly forbids, and it subsumes the old "last thing they left" slot.

Also recorded: a backgrounded iOS PWA is **off, not asleep**. Nothing here depended on background execution, but I wrote down the distinction someone will conflate — scheduled local notifications are impossible; Web Push works because the server does the waking. So "no pushes during their night" stays a policy we enforce, not a limitation we inherit.

**One divergence from the PRD, flagged for CPO rather than taken silently.** §3A.4 proposes the anchor and date turns share one slot, two producers. I split them — **slip is what to do, anchor is today** — because the Share Target gap means the anchor's one-tap-to-picker cannot be time-shared, and because the PRD's own "an open date outranks a new suggestion" is a statement about the slip. Fallback priority order written down in case CPO prefers one slot.

**Spike re-derived on the iPhone 14 floor (§12).** Native-resolution photographs are now the *expected* pass; kept the two-size arm anyway; explicitly did **not** relax the minute-3 warm measurement — a 14 in a case in an Israeli summer is not a bench-tested 14.

**Fourth spike arm added: `animation-timeline`** (scroll-driven animations, iOS 26.0). Assessed rather than accepted. It targets exactly what P1 fears — momentum, snapping and interruptibility from the platform, off the main thread — but two specifics have to be judged on-device: boundary behaviour **rubber-bands by construction**, which directly conflicts with §3.2.7's "the binding resists, not a scroll view"; and velocity-aware snap becomes untunable `scroll-snap` (probably an upgrade, since it is the same heuristic as every native carousel). The 8px corner lift survives as keyframes.

**And it produced a new blocking question worth more than the arm itself:** *which iOS version are they on?* If both are on 26+, the native path can be the **foundation** and the JS implementation dropped entirely — a large simplification of the riskiest thing in the build, instead of maintaining two implementations of the signature interaction. Two users, both Apple, both likely auto-updating, so it is very plausible. Same shape of cheap question as the device model, bigger consequence.

**Open questions down to three**, only one of which gates work.

---

## Revision 5 — native turn adopted, spike re-scoped to feel (same day)

Both are on **iOS 26**, so the scroll-driven turn is the foundation and there is no JavaScript turn implementation. `@supports` kept as a guard; nothing built behind the `else`.

**§3.2 rewritten to the new technique.** Scroll progress drives `rotateY` through keyframes; the 8px corner lift becomes keyframes at `0–2%`; both shadow layers ride the same timeline; snap is native. **Added `scroll-snap-stop: always` and it is not optional** — without it a hard fling can skip a snap point and turn two leaves, which in this product means **silently skipping a day**. That is a data-visibility bug wearing an animation costume, and it would have been very easy to miss.

**§2.5 reduced-motion needed rethinking, not copying.** With a scroll-driven turn you cannot simply "not animate." The scroller stays — gesture and scroll position must not change — and the leaf's keyframes swap from `rotateY` to an opacity cross-fade **on the same timeline**. Turning still tracks the thumb, it just stops rotating in 3D.

**P1 substantially retired.** It was a performance risk; what remains is a *feel* risk. §12 re-scoped accordingly: a feel spike with a performance floor, floor retained because it is cheap to measure while you are there and still capable of failing. Minute-3 warm check kept — thermal behaviour of a native compositor path is still worth knowing.

**The answer the CEO actually needed: how to judge rubber-band versus binding.** The difference is not resistance versus none — both give. It is *what kind of giving*: a scroll view translates the whole surface, yields asymptotically forever, and **springs back past rest**; a binding rotates one leaf at a hinge, approaches a hard stop, and **falls back and stops**.

**The decisive test is the return, not the pull: pull the last page as far as it goes, release, and watch for overshoot. Paper does not overshoot.** Visible at 60fps in a screen recording, callable without a trained eye. Two corroborating checks: does anything move except the leaf, and can you pull it arbitrarily far.

Also flagged the opposite failure, which is the likelier trap: `overscroll-behavior: contain` may suppress the give *entirely*, leaving a dead stop with no lift — **a dead stop reads as a bug, not as a binding.** If overscroll is suppressed, the 25° damped lift must be added back.

**And why this boundary earns custom code here when it would not in most books:** there are only two boundaries, but **the last leaf is today's page and the anchor takes them straight there**, so they hit the trailing boundary daily. High-traffic in this product specifically.

**Snap question given a failure mode to look for:** over-eagerness. A light brush from ~10% must not commit a turn, and the same deliberate half-turn must not do different things on different attempts. Inconsistency is worse than either choice.

**Anchor/slip split adopted** by CEO on the platform-constraint reasoning. Open questions down to two, and **nothing gates the spike** — it can run now.

---

## Lesson worth carrying forward

The brief pinned "warm off-white," which is one axis of the most common generated-design cluster right now (cream + high-contrast serif + terracotta). The right response was not to fight the brief but to spend the remaining freedom deliberately: the differentiation went into the two-ink system, the all-serif commitment, the computed sky, and the physics — not into inventing a background colour the founder did not ask for. Where a brief pins an axis, follow it exactly and spend the free axes harder.

Revisions 2 and 3 added a second one, and it held both times. Nearly every new founder requirement turned out to be satisfiable by a component that already existed — the streak is the fore-edge, asleep is the dial's dark arc, the deleted counter's replacement is the sky the clock was already computing, seeding progress is the fore-edge again, the not-yet-seeded state is a ribbon still at the title page, and the half-pair is photo corners that were already in the system. Before designing a new element for a new requirement, check whether an existing one already means it. Every time it does, the object gets more coherent instead of more crowded — and the requirements that arrive later stop feeling like additions.

Revision 4 added a third, and it is the one I would carry furthest: **read the upstream spec, not the summary of it.** The hand-off said "the book holds text — design a text-bearing leaf." Reading PRD §3A directly turned up four things the summary did not carry: the whole *activity → date* vocabulary retirement, a second button label, a forbidden-words list that includes code identifiers, and an AC that quietly falsified a sentence in my own §9. None were withheld; they simply do not survive summarisation, because a summary keeps what the sender needed and drops what the receiver needed. The cost of reading it was five minutes.

---

_Session by: design-lead | Date: 2026-08-02_
