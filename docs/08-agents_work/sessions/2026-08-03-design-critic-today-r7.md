---
role: design-critic
task: today-the-pair
round: 7
date: 2026-08-03
branch: feat/today-the-pair
commit: b2bde25
verdict: rework
qa_verdict: FAIL
tier: full
renders: docs/08-agents_work/renders/2026-08-03-two-places/2*-r7-*.png
---

# Today, the pair — round 7

Rendered from the branch at `b2bde25`, 393×852 at dsf 3, day and night,
hydration settled. Session minted against the worktree's own `SESSION_SECRET`;
every capture returned `status 200` at `/today`, never the login page. Both dev
servers were started fresh from disk state `b2bde25` for this review — the
round-6 server was killed first so nothing stale could be measured.

The worker's renders `87`–`92` were not used as evidence. Every number below is
a computed-style or geometry read taken on the live surface.

## Verdict: rework

**The surface is right, and the design call was right.** The collapsed pair is
better without the rule, not worse — see "The call" below. Round 6's P1 is
closed, the photograph states are untouched, and round 6's earlier closures all
held.

One item blocks, and it is the class of defect this project keeps producing:
**the file's own description of the neither-posted state still says the hairline
is there.** It says so twice — once in the docstring that specifies the three
states, and once three lines above the `const hasAny` that now removes it — plus
a stated pixel measurement that is off by exactly the pixel this commit deleted.
The commit is titled "fix two stale comments"; it corrected the two adjacent to
the edit and left three sentences elsewhere in the same file that the edit
falsified.

## The call — judged on the render, not the reasoning

Asked to say whether the collapsed pair reads worse without the rule. It does
not. It reads better, and the reason is visible rather than argued:

With the rule gone, a no-photograph day is two clock lines on bare paper, and
the first rule on the screen is the window sentence's — inset `x=20→373`, the
same left edge as the two clock lines and as the doorway rule below it. Three
elements, one left edge. At round 6 the same screen had three rules on two
different left edges 63px apart, the topmost broken by an unexplained 2px notch.

The rule's stated job is to stop a bare column reading as a failed image load.
On this surface there is no image area to fail, and a bezel-to-bezel rule with a
gutter notch was itself the thing shaped like an absence that round 5 required
this state not to show. Removing it is the answer that satisfies both criteria
at once; the two-short-rules option I described would have satisfied the grid
and kept the notch.

The one thing lost is that nothing now marks the pair as an object. At 30px tall
with nothing posted, that is the correct amount of ceremony. `202-r7-EMULATED-inset59-nophoto-day.png`,
`202-r7-EMULATED-inset59-nophoto-night.png`, `205-r7-nophoto-topcrop-day.png`,
`205-r7-nophoto-topcrop-night.png`, `203-r7-nophoto-fullpage-day.png`.

## What was confirmed

### 1. No-photograph day — the rule is gone, and nothing replaced it

`hairlines: []`. The element does not exist in the DOM, day or night.

Every painted horizontal rule inside `<main>`, with the 59px inset emulated:

| rule | x → right | y |
|---|---|---|
| window sentence | `20 → 373` | `121` |
| doorway | `20 → 373` | `205.2` |

That is the complete list. **Nothing at `y=59`**, nothing at the bezel, no notch
at `x=195.5–197.5`. Both clock lines run `y 69 → 89` — 10px clear of the band,
`x=20` and `x=217.5`. Unemulated the same screen puts the pair at `y=24` with
the same two rules at `y=86` and `y=170.2`.

At 320 the state is unchanged and `scrollWidth == innerWidth`
(`204-r7-width320-nophoto-day.png`).

### 2. The photograph states are untouched

| state | hairlines | photographs | grid |
|---|---|---|---|
| one posted (`/today`) | `x 0→195.5`, `x 197.5→393`, both `y=260.7` | `x=197.5 w=195.5 h=260.7` | `x=0 w=393`, `mt −24px` |
| both posted (`/review`) | `x 0→195.5`, `x 197.5→393` | `x=0 w=195.5` · `x=197.5 w=195.5` | `x=0 w=393`, `mt −24px` |

Each hairline's extent equals its own column's photograph box exactly. Day and
night, and with the inset emulated (`mt −59px`, photographs still reach `y=0`).
`211-r7-oneposted-hairline-day.png`, `211-r7-oneposted-hairline-night.png`,
`212-r7-EMULATED-inset59-oneposted-day.png`, `222-r7-review-bothposted-day.png`.

### 3. Round 6's closed P1s stayed closed

| state | Eva mark | Eva glyph | Adam mark | Adam glyph | grid `margin-top` | `-mt-` class |
|---|---|---|---|---|---|---|
| one posted | — | **20.0** | **217.5** | 227.5 | `−24px` | yes |
| both posted | **20.0** | 30.0 | **217.5** | 227.5 | `−24px` | yes |
| neither | — | **20.0** | — | **217.5** | **`0px`** | **no** |

Full bleed survives in both photograph states: grid `x=0 w=393`, gutter 2px.
Re-checked and still clean: zero card-shaped elements in `<main>` in any state
(opaque background, ≥2 borders, radius, shadow, background-image, outline), no
horizontal scroll at 320 or 393, meta line single-line at 320.
`220-r7-review-allstates-day.png`, `221-r7-review-neither-day.png`,
`221-r7-review-neither-night.png`.

## P1

### 1. The file still documents a hairline it no longer renders

`components/home/TodayPair.tsx` — three sentences the change falsified, none of
them touched by the commit that claims to have swept stale comments.

**`TodayPair.tsx:19-21`** — the docstring that specifies the three states:

```
 * Neither posted: the photograph-shaped space does not exist, because no
 *                 photograph does. Both sides collapse equally to their
 *                 meta line under a hairline. No empty box anywhere.
```

Measured in that state: `hairlines: []`. This is the block a reader consults
before touching the component, and it instructs them to restore the rule.

**`TodayPair.tsx:83-85`** — the doc comment on the boolean that removes it,
three lines above the declaration:

```
  /* The photograph-shaped space exists only when at least one side has
     posted. When neither has, both sides collapse to their meta line
     under a hairline and nothing shaped like an absence appears. */
  const hasAny = evaPhoto !== undefined || adamPhoto !== undefined;
```

`hasAny` now gates two things, and this sentence describes the state as still
having the second one.

**`TodayPair.tsx:105`** — "On a no-photograph day the pair is only 31px — two
clock lines". Measured: **30px**. Off by exactly the 1px border this commit
removed. A number in a comment is a claim like any other.

**`TodayPair.tsx:4`** — "Three states, three rules, one server component." Two
states carry rules; one carries none. In a file where the r7 comment block uses
"rule" to mean the hairline ("a rule running bezel to bezel"), this reads as a
count of hairlines and is wrong either way.

**Why it blocks.** Four of the last five defects on this brief were sentences
asserting behaviour the code did not have. This commit's own message is a list
of comment corrections; it fixed the two comments it was standing next to and
left the specification block 168 lines above, describing the exact state it
changed. The surface is correct — which means the only thing left that can
mislead is the prose, and it does.

**Fix** — four sentences, no code:

```
:4    Three states, one server component.
:20-21  photograph does. Both sides collapse equally to a bare meta line.
        The hairline belongs to the photograph area, so there is none here
        either. No empty box anywhere.
:84-85  posted. When neither has, hasAny is false and both the photograph
        area and its hairline are absent; both sides collapse to a bare
        meta line and nothing shaped like an absence appears.
:105  exist). On a no-photograph day the pair is only 30px — two
```

## P2

1. **Round 6's P2-1 is answered and vindicated.** The rule did land flush at
   `y=59` against the status bar, and the question was whether it should exist
   at all when `hasAny` is false. The answer taken — remove it — is measurably
   the right one: nothing now sits in the band's shadow, and the first rule on
   the screen is 62px below it.
2. **`today/page.tsx:18`** — "The pair leads at y=0. No header, no masthead, no
   navigation above it." True only when a photograph exists; measured `y=24` on
   a no-photograph day. Lines 30-32 now qualify it correctly, so a reader who
   gets that far is told the truth. Worth one clause at line 18 while the file
   is open; not blocking on its own.
3. Carried from rounds 5-6, unchanged and not counted: dead `SealedCard.tsx` /
   `TonightCard.tsx`; the doorway's link styled as a non-interactive label;
   stale `Dock.tsx:29`.

## Confirmed, not counted — the window sentence (B12)

Still prints "Eva's lunch break" in `type-title` directly under a clock reading
"Eva · 9:44 am". Confirmed out of scope for this round per the brief and not
driving the verdict. `203-r7-nophoto-fullpage-day.png`.

## Method notes

- **Nothing was edited in the reviewed worktree.** `git status` on
  `.worktrees/today-pair` at close: source tree clean at `b2bde25`; untracked
  are `apps/web/node_modules` (pre-existing) and the 22 `*-r7-*.png` renders
  this review produced, which this session commits.
- **Servers.** The reviewed worktree was served fresh on `:3320` (the round-6
  server on `:3312` was killed first, so no stale compile could be measured).
- **The no-photograph state was produced in a copy outside the reviewed
  worktree**, at `.worktrees/critic-r7-nophoto/web`, served on `:3321`: the
  branch's `apps/web` copied verbatim, `FIXTURE_TODAY` set to `2026-08-04`
  (absent from `SHARED_DAYS`). `lib/fixtures/clock.ts` in the reviewed worktree
  reads `2026-08-02` at `b2bde25` and was never touched. After capture the copy
  was moved out of `.worktrees/` into the session scratchpad, so nothing of it
  remains beside the reviewed branch.
- **Emulated, not captured — stated rather than hidden.**
  `202-r7-EMULATED-inset59-nophoto-day.png`,
  `202-r7-EMULATED-inset59-nophoto-night.png` and
  `212-r7-EMULATED-inset59-oneposted-day.png` inject the *resolved* value of
  `max(1.5rem, env(safe-area-inset-top))` — `main` padding-top 59px, and −59px
  on the grid only where the gated class is present — because headless Chromium
  reports the inset as 0. The substitution is deterministic and the covered band
  is drawn into the frame. Every other render is a plain viewport capture.
