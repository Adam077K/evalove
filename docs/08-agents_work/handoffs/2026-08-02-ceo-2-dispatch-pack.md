---
date: 2026-08-02
from: ceo (session ceo-2-1785631504)
to: Adam, and the agents dispatched from this pack
status: READY TO DISPATCH — design starts now, T2 still needs one signature
supersedes: nothing (extends 2026-08-02-HANDOFF-eva-and-adam.md)
---

# Dispatch Pack — Eva & Adam

Seven decisions taken (all in `.claude/memory/DECISIONS.md`). Design and scaffold
can start immediately; only the storage migration still waits on Adam.

---

## 1. What changed since the handoff

| Item | Was | Now |
|---|---|---|
| Design conflict | Unresolved, blocking | **Closed** — rev 5 split into *law* and *taste*; Fable owns taste |
| Arch §11 Q2 (tally on `purged_at`) | Open | **Confirmed as specced** |
| Arch §11 Q3 (daily prompt?) | Open, *pre-T2* | **No.** `v_shared_days` stays a view. T2 unchanged |
| Arch §11 Q4 (reveal-on-post) | Open | **Was never open** — PRD §5 + AC-10 already specify it |
| Arch §11 Q5 (day-count displayed?) | Open | **Colophon only, spelled in words** (design §9) |
| Design §14 Q1 (where open dates live) | Open | **A page in the book near today.** No record surface |
| Anchor/slip split | Contradictory | **Split adopted.** PRD §3A.4 superseded |
| Models | Unassigned | **Fable = design · Opus = engineering** |
| §0.7 migration sign-off | Blocked *and* unclean | **Clean — one signature, nothing else pending** |

**Nothing gates the design work.** Design rev 5 §12 already said the spike could run;
now the whole design track can.

---

## 2. THE FABLE BRIEF — copy-paste this

> **Model:** `fable` · **Agent type:** `design-lead` · **Color:** `pink` · **Name:** `design-eva-adam-interface`
> **Isolation:** worktree · **Risk tier:** Lite (design system + front-end craft; no API, no DB, no auth)

```
You are designing the interface and the user experience for "Eva & Adam" — a private
PWA for exactly two people, forever. Eva is in New York, Adam is in Israel, six or
seven hours apart depending on the month. Saturday is their only shared day off.

You have unusual latitude here. Read this whole brief before deciding anything.

## What the product is

A book. A page-turning photo book, one photo from each of them per day paired on a
spread, and three "dates" the app hosts. The thesis, locked:

    A private object that always knows what time it is in both cities — and because
    it knows, it never asks them to browse, decide, or explain themselves.

No growth, no monetization, no third user, ever.

## Read these first, in this order

1. docs/04-features/LDR-APP-PRD.md            — CPO. 60 acceptance criteria, founder decisions D1-D12
2. docs/04-features/LDR-APP-DESIGN-DIRECTION.md — Design-Lead rev 5. THE PRIOR DIRECTION. See below
3. docs/03-system-design/LDR-APP-ARCHITECTURE.md §7, §8, §10.0 — platform limits, page-turn budget, component contracts
4. .claude/memory/DECISIONS.md                 — 13 entries. Read all of them
5. docs/10-activity-library/library.json       — the 98 dates and the nine windows, in the couple's own words

Read the sources. Do not work from anyone's summary, including this brief.

## Your authority — read this twice

Rev 5 is a strong, coherent document written by a capable agent that **never saw its
own references.** Its §11 records that refero MCP and Playwright were unavailable, so
every capture spec in it — Apple Books' page curl, Paper by FiftyThree, Day One at
night, Family's mid-flight grab — was specified and never executed. It is argued from
recall. You have those tools. A stronger direction argued from evidence outranks it.

So rev 5 splits in two, and you are told which half is which.

### LAW — you may not re-argue these. They are founder decisions or security gates.

  1.  No counters. No countdown, no days-apart, no time-elapsed, no progress bars,
      no percentages, no "12 of 30". The entire arithmetic register is cut. (D2)
  2.  The day-count never breaks and never decrements. A missed day is simply not
      counted. (D3)
  3.  Total silence on a missed day. No marker, no greyed gap, no dimmed date.
      A visible hole is a rebuke with extra steps. (D3)
  4.  Therefore: no calendar grid anywhere in the product.
  5.  Eva's name comes first, everywhere — title, icon, spreads, lists, sentences.
      If a sentence scans better the other way, rewrite the sentence. (D5)
  6.  No Eden imagery. No leaves, vines, apples, serpents, gardens, "paradise", no
      first-man/first-woman framing, and the word Eden appears nowhere. (D5)
  7.  English only. `dir="ltr"` fixed. No RTL, no bilingual mode. (D7)
  8.  Third person, real names, never "you" or "your partner". (D5)
  9.  Turning pages is the primary navigation. This is a book, not a grid with a
      page-turn animation on it. (AC-20)
  10. Private items never appear in the ordinary flow — not in a spread, thumbnail,
      preview, share sheet, notification, riffle, or cache. Reaching them is always
      deliberate and re-authenticated. (AC-24 → AC-32, non-waivable security gate)
  11. `failed`, `abandoned`, `expired`, `incomplete`, `stalled`, `overdue` are banned
      in copy AND in code, plus every visual equivalent — grey states, dashed
      borders, strikethrough. CI greps for them.
  12. No "your turn!", no turn count, no deadline, no elapsed time on a date.
      The absence of pressure is the design.
  13. The subject of every notification is the other person. If the subject is
      "you", it does not ship.
  14. Every state is designed — empty, loading, error, asleep, half-pair,
      half-seeded. No placeholder, no lorem, no TODO, no "no results" screen. (AC-37)

### TASTE — yours. Rev 5's answers are a strong starting position, not a spec.

Re-pitch any of these if you have a better answer, and say why in one paragraph:

  · the palette (rev 5: warm paper #F6F1E9, two inks — rose-oxblood for Eva, deep
    marine for Adam; "dim the light, don't invert the book" for night)
  · the typefaces (rev 5: Fraunces + Literata, all-serif, no sans anywhere)
  · the cover's composition (rev 5: a 24-hour dial as the largest element, a computed
    sky behind the book showing the other person's actual daylight, one suggestion slip)
  · navigation (rev 5: three ribbon bookmarks, no tab bar, no floating + button)
  · the page-turn mechanism (rev 5: native `animation-timeline` scroll-driven, no JS)
  · photo corner mounts, the fore-edge as the streak, thumb-index tabs, the rear pocket
  · the half-pair treatment (rev 5: crisp empty corners = anticipation, not absence)

If you keep rev 5's answer, keep it because you tested it, not because it was there.
If you change the palette, re-run the contrast math — rev 5's `--ink-soft` sits at
5.31:1, right on the AA floor, and §8 forbids expressing state by lowering contrast
because there is no headroom. Whatever you ship must clear AA before QA runs.

## References

**The founder's folder — five images, look at all of them:**
`/Users/adamks/Downloads/Eva & Adam -app deisgn inspo`

Honest framing, because you should not be misled and you should not be steered:
four of the five are gradient consumer-app concepts (a pink/lilac events app, a
hot-pink AI-badge memories app, a purple Time Capsule app, a peach reading app).
One — the SORDJATI furniture site, huge restrained display type on white, editorial
— matches rev 5 exactly. The Time Capsule reference is visually furthest and
**conceptually nearest**: sealed things opened later is precisely the "left for you"
pattern this whole product is built on. Mine it for mechanics.

You cannot simply obey the four. Several of their patterns are LAW violations — a
progress bar is a counter (law 1), a calendar view is banned (law 4). But the founder
chose them, and "the founder's taste has moved" is a live reading you are allowed to
act on within the law list. Form your own view from the images themselves.

**Rev 5's reference table (§11) — capture specs included, never executed:**
Apple Books' page curl · Paper by FiftyThree · Day One dark theme · Family (family.co)
· Vaul and Sonner source (Emil Kowalski) · Literata and Fraunces specimens · a Japanese
photo album with corner mounts, a Leuchtturm1917, a Smythson Panama diary · The Old
Farmer's Almanac sun-time tables · and one negative reference — any JS flipbook demo,
on a real iPhone, so you know what wrong looks like.

**Tools you have that rev 5's author did not:**
`mcp__refero__*` (search real product screens and flows by style) and Playwright
(`mcp__playwright__*` — drive real sites, capture the motion). Use them. The
`refero-design` skill is NOT installed; the MCP works without it.

## Deliverables — the entire interface. Every surface, every state.

**You own all of the UI and all of the UX. Not a system plus samples — the whole
thing.** No API, no database, no auth logic, no service worker, no jobs. Those are
Opus, and they wire to what you build.

1. **A design system, as code.** Tailwind v4 CSS-first tokens. Colour, type scale,
   spacing, motion curves, radius discipline, the two-ink identity system or whatever
   replaces it. Light and dark both — night is half this product, Eva is in it with
   the lights off.

2. **Every screen in the product**, built as real React components against the types
   in `lib/types.ts`, with realistic fixture data:

   | Surface | Includes |
   |---|---|
   | Login + "who's this?" | first-run, wrong password, rate-limited |
   | The cover | the clock, the other person's sky, the suggestion slip, the anchor |
   | The book | title page · opening gathering · dated leaves · today · colophon |
   | The turn | the page-turn itself, and the riffle |
   | The daily spread | complete pair · **half-pair** · single plate when a day closes half-finished |
   | Dates | the slip · a date in progress · the finished artifact page · the paired question's held-open space |
   | Browse | the contents page and the shelves, in the couple's own language |
   | Seeding | the opening gathering, and the **half-seeded** state |
   | The outbox | persistent per-item batch upload state. Never a toast |
   | The pocket | entrance, unlock, the quiet grid |
   | PWA | install-first onboarding, offline indicator, "N of M saved" |

   And per AC-37, **every one of them has a designed empty, loading, error and asleep
   state.** No placeholder, no lorem, no "no results". That criterion is now yours
   end to end, and it is the largest single thing in this brief.

3. **The page-turn feel spike** — design §12, one throwaway static HTML file, three
   leaves, real camera-roll photographs. It answers one question you cannot answer
   from a number: *does the boundary resist like a binding, or rubber-band like a
   scroll view?* The decisive test: pull the last page as far as it goes, release,
   watch the return. **Paper does not overshoot.** Note the opposite failure too —
   `overscroll-behavior` can suppress the give entirely, and a dead stop reads as a
   bug. Adam runs this on a real iPhone; you build it and tell him exactly what to
   look for.

4. **A written direction doc** at `docs/04-features/LDR-APP-DESIGN-DIRECTION-v6.md`
   recording what you kept, what you changed, and why. Rev 5 stays on disk.

## The seam — what is yours and what is Opus's

```
YOURS                                   OPUS'S
components/**            all of it      app/api/**              route handlers
app/globals.css          tokens         lib/data/**             every query
screen composition       presentational lib/session/**          auth
fixtures/**              your test data lib/photo/** lib/outbox/** pipeline internals
                                        lib/shared-day/**       the day model
                                        supabase/**  scripts/**  sw.ts
```

**`lib/types.ts` is the contract.** It is created by T1 and append-only. Build every
component against those types with your own fixtures; Opus swaps fixtures for real
data and changes nothing else. If you need a type that doesn't exist, say so in your
return rather than inventing a parallel one.

This is why you are not blocked on anything: the database, the APIs and the auth can
all land after you, and none of them changes a line of what you write.

**One boundary that is not negotiable.** You design the pocket; Opus *enforces* it.
The rules that keep private content out of thumbnails, caches and previews are
structural — a separate table, a separate storage prefix, a service-worker path rule,
and no thumbnail derivative ever generated. Design the surface as if those hold, and
do not design anything that depends on breaking them (no vault item in a grid
preview, no peek, no count on the closed pocket).

## Skills — read these, in this order

Core, all eight. This is above the usual 3-5 cap for a lead, deliberately — your
scope is the entire interface, not one surface.

  1. .claude/skills/frontend-design/SKILL.md          — distinctive, non-templated visual identity
  2. ~/.claude/skills/ui-typography/SKILL.md          — this design is typography-led: oldstyle
                                                        figures, curly quotes, en vs em dashes, never `--`
  3. .claude/skills/emilkowal-animations/SKILL.md     — rev 5's `--ease-page` IS Kowalski's
                                                        cubic-bezier(0.32,0.72,0,1). Read the source
  4. ~/.claude/skills/12-principles-of-animation/SKILL.md — the page-turn must move like matter
  5. .claude/skills/design-taste-frontend/SKILL.md    — overrides default LLM visual bias; CSS
                                                        hardware acceleration
  6. .claude/skills/react-ui-patterns/SKILL.md        — loading, error and async states. AC-37 makes
                                                        four states on every screen your problem
  7. .claude/skills/tailwind-patterns/SKILL.md        — v4 CSS-first tokens, how the ink system ships
  8. .claude/skills/web-design-guidelines/SKILL.md    — catches the craft misses

Situational:
  9.  .claude/skills/wcag-audit-patterns/SKILL.md     — REQUIRED if you change the palette
  10. .claude/skills/radix-ui-design-system/SKILL.md  — the unlock dialog and any modal. shadcn is
                                                        Radix underneath and it is already installed
  11. .claude/skills/vercel-react-view-transitions/SKILL.md — if you revisit the turn mechanism
  12. .claude/skills/core-components/SKILL.md         — design-token and component-library patterns

Deliberately NOT required, and you should know why: `high-end-visual-design`,
`minimalist-ui`, `redesign-existing-projects`. Each teaches a specific look —
premium-agency defaults, bento grids, muted pastels. Rev 5 §16 rejects that exact
cluster by name ("warm cream + high-contrast serif + terracotta accent — the most
common generated-design cluster right now"). They are on disk if you want them; you
were not handed them because you are here to exercise judgement, not apply a preset.

## Return

Structured JSON: status, branch, worktree, files_changed, commits, summary,
decisions_made, blockers. Plus a session file at
docs/08-agents_work/sessions/2026-08-02-design-lead-eva-adam-interface.md.

Flag judgement calls back to CEO rather than burying them. Three agents did that on
this project and every one of them saved real work.
```

---

## 3. Skill matrix — every agent, verified against MANIFEST.json (154 skills)

Workers get 2–3, leads get 3–5, per CLAUDE.md. Every path below exists on disk.

| Agent | Model | Task | Skills |
|---|---|---|---|
| **design-lead** | **fable** | **the entire interface** — design system, every screen, every state, the spike | see brief above (8 core + 4 situational) |
| devops-engineer | opus | **T1** scaffold | `vercel-deployment` · `worktree-isolation-pattern` · `full-output-enforcement` |
| devops-engineer | opus | **T1b** CI + banned-vocab grep | `github-actions-templates` · `worktree-isolation-pattern` |
| database-engineer | opus | **T2** migrations *(gated)* | `postgresql` · `supabase-rls-conventions` · `database-design` |
| backend-engineer | opus | **T3** auth logic *(login screen is Fable's)* | `auth-implementation-patterns` · `nextjs-supabase-auth` · `worktree-isolation-pattern` |
| frontend-engineer | opus | **T4** photo pipeline internals — decode, EXIF strip, canvas, outbox *(the batch UI is Fable's)* | `react-patterns` · `sharp-edges` · `worktree-isolation-pattern` |
| backend-engineer | opus | **T5** photo API | `nextjs-app-router-patterns` · `api-design-principles` · `error-handling-patterns` |
| backend-engineer | opus | **T6** shared-day *(test-first)* | `testing-patterns` · `sharp-edges` · `worktree-isolation-pattern` |
| frontend-engineer | opus | **T7** library build step + `activity_state` API *(browse UI is Fable's)* | `nextjs-app-router-patterns` · `sharp-edges` |
| frontend-engineer | opus | **T8** manifest, Serwist, the `/v/*` path rule *(install UX is Fable's)* | `vercel-react-best-practices` · `nextjs-app-router-patterns` |
| security-engineer | opus | **T13** vault enforcement *(the pocket's look is Fable's)* | `security-audit` · `supabase-rls-conventions` · `web-security-testing` |
| backend-engineer | opus | **T14a** dates engine | `api-design-principles` · `error-handling-patterns` · `worktree-isolation-pattern` |
| frontend-engineer | opus | **T9 · T10 · T14b · T16** — **wiring.** Feed Fable's components real data | `nextjs-app-router-patterns` · `vercel-react-best-practices` · `react-patterns` |
| devops-engineer | opus | **T11** backup + liveness | `github-actions-templates` · `vercel-deployment` · `secrets-management` |
| test-engineer | opus | **T0** device probe · **T12** E2E | `e2e-testing-patterns` · `playwright-skill` · `testing-patterns` |
| qa-lead | opus | the gate | `qa-gate-protocol` · `code-review-excellence` · `production-code-audit` |
| code-reviewer | opus | every diff | `code-review-excellence` · `sharp-edges` |
| ceo (me) | opus | orchestration | `design-orchestration` · `writing-plans` · `dispatching-parallel-agents` |

**What the re-cut changed.** Architecture §10.0 assigned one owning *directory* per
task, which put UI and logic in the same hands — `app/(app)/book/**` to T9,
`app/(app)/vault/**` to T13 (a security engineer designing a grid), `/dates` UI to
T14b. That seam is now horizontal instead of vertical: **Fable owns every pixel,
Opus owns everything behind them.** T9, T10, T14b and T16 stop being build tasks and
become wiring tasks, which is why they collapse into one row.

Two manifest entries are traps and are used nowhere: `ui-visual-validator` (a generic
community stub — "Working on ui visual validator tasks") and `design-orchestration`
(a real meta-skill, but it routes *between* skills — mine, not a designer's).

---

## 4. Wave plan, revised

```
NOW, in parallel, nothing blocking:
  ├─ design-lead   fable   design system + cover + book + spread + §12 spike
  ├─ T1            opus    scaffold — Next 16, TS strict, Tailwind, lib/types.ts
  └─ T0            opus    device probe — 30 min, needs Adam's iPhone, no code

AFTER Adam signs §0.7:
     T2            opus    migrations                          [Irreversible]

THEN, per architecture §10.2:
  Wave 3  T1b · T3 · T8 · T7-API
  Wave 4  T5                                                   [critical path]
  Wave 5  T11 · T13 · T10 · T14a · T14b
  Wave 6  T9 · T15 · T16
  Wave 7  T12 → QA-Lead
```

T9 (the book) now depends on Fable's v6 direction rather than rev 5.
Critical path unchanged: T1 → T2 → T3 → T5 → T14a → T15 → T12.

---

## 5. What still needs Adam

1. **§0.7 — sign the storage migration.** Irreversible tier; CTO built the gate and
   the CEO cannot self-sign it. It is now clean: Q3 is closed, so `v_shared_days`
   stays a view and the schema in architecture §2.1 is what runs. Blocks T2 and
   everything downstream of it. Blocks nothing in the design track.
2. **T0 — 30 minutes on a real iPhone.** Four questions, each unblocking a category:
   does audio survive backgrounding in an installed PWA (gates "the book reads itself
   aloud", the only real answer to Eva's commute) · does `navigator.share({files})`
   work from inside an installed PWA · does `setAppBadge()` with no argument render as
   a dot · what MIME type does the picker actually hand over. An agent writes the
   probe; only Adam can run it.
3. **The §12 spike, later.** Fable builds the file; Adam pulls the last page and
   watches whether it overshoots.
4. **Never delivered:** the taste profile for the activity library. The re-rank hook
   exists in `build_library.py` — it is a one-flag re-run, not new research.
