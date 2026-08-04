---
role: design-critic
task: today-the-pair
round: 8
date: 2026-08-03
branch: feat/today-the-pair
commit: 9acbb61
verdict: pass
qa_verdict: PASS
tier: full
renders: none — prose-only round, no code changed since b2bde25
---

# Today, the pair — round 8

**No renders were produced and none were needed.** `git show 9acbb61 --stat` is two
files, comments only; `git diff b2bde25 9acbb61 -- '*.tsx'` contains no JSX, no
class strings, no logic. The surface at `9acbb61` is byte-identical in behaviour
to the surface I measured at `b2bde25`, so the round-7 geometry stands and
re-capturing it would add nothing. Every number cited below is a round-7
measurement, re-checked against the code that produced it.

## Verdict: pass

The round-7 P1 is closed. All four sentences were replaced, the three-word fix
at `page.tsx:18` was applied, and — the part that mattered — the sweep was
complete rather than lucky. I re-derived it independently: I grepped both files
for `hairline`, `rule`, `three`, every `y=`, every `x=` and every literal pixel
and rem value, then read each hit against the code and against my round-7 table.
Nothing false about the hairline survives in either file.

## What I verified, claim by claim

### The four corrections

| line | claim now | checked against | true |
|---|---|---|---|
| `TodayPair.tsx:4` | "Three states, one server component." | three states enumerated at `:6`, `:11`, `:19`; no `"use client"` in either file | yes |
| `TodayPair.tsx:19-22` | "The hairline belongs to the photograph area, so there is none here either." | r7 neither-posted: `hairlines: []`, element absent from the DOM day and night | yes |
| `TodayPair.tsx:84-87` | "hasAny is false and both the photograph area and its hairline are absent" | `showPhotoArea={hasAny}` gates `:162` (photo area) **and** `:190` (hairline) — one boolean, both gates | yes |
| `TodayPair.tsx:107` | "the pair is only 30px" | r7 measured 30px | yes |
| `page.tsx:18` | "leads at y=0 when photographs exist" | r7: photographs reach `y=0` with the 59px inset emulated; no-photograph day puts the pair at `y=24` | yes |

The 30px correction and the hairline gate corroborate each other, which is worth
stating because it is the only cross-check available without re-rendering: the
hairline is an empty `<div>` whose sole contribution to layout is its own 1px
top border. Removing it in r7 removed exactly 1px. 31 → 30 is the arithmetic the
code actually performs.

### `TodayPair.tsx:13-14` — the sentence you flagged

> "One hairline (border-t on a zero-height element) at the base of the photo area
> stops the bare column reading as a failed image load."

The implementation at `:190-192` is `<div className="border-t border-line" aria-hidden="true" />`
— no height utility, no padding, no children, parent is a plain block `div` with
no flex or grid stretch in the block direction. `border-t` sets `border-top-width: 1px`;
`border-line` resolves through `--color-line: var(--line)` (`globals.css:319`) and
sets colour only. Content-box height is 0; the 1px is border. **"border-t on a
zero-height element" describes this implementation exactly, not an earlier one.**

Your concern was that I measured the element with real geometry. I measured its
x-extent and its y — `x 0→195.5` and `x 197.5→393`, both at `y=260.7`, against a
photograph box of `h=260.7`. A zero-height element with a 1px top border has
exactly that: a real width, a real y, and no vertical extent of its own. The
measurement and the description agree.

### The sentences the worker did not touch

Every remaining factual claim in both files, read against the code:

- `:6-9` both-posted — `gap-0.5` = 2px (r7 measured a 2px gutter), `aspect-[3/4]`,
  `object-cover`, `edge-eva`/`edge-adam` on the meta line, caption in `type-quote`
  plus `Stamp`. All present at `:116`, `:163`, `:174`, `:211`, `:243-245`.
- `:24-33` hard rules — ink gated on `hasPhoto` (`:211`, and r7 confirmed no marks
  in the neither state); no `"use client"`; no `stagger-child` on `<TodayPair />`
  in `page.tsx` while both siblings carry it, so "the pair does not animate in"
  holds; Eva first in the DOM at `:120`.
- `:194-198` — `postedAtLocal(photo)` when posted; `LiveLocalTime` initialises
  from `useState(() => new Date())` with `suppressHydrationWarning`, so it is
  server-rendered with a real value and never a skeleton. "No useEffect at or
  above the pair" survives: the only `useEffect` is in a leaf below it.
- `:200-207` — `mx-5` = 20px; r7 measured text at `x=20.0` with no photo (same
  left edge as the window sentence and the doorway) and the mark at `x=20.0` with
  text at `x=30.0` when posted, which is the comment's `22 + pl-2` arithmetic.
- `:183-189` — the gate comment added in r7. Accurate: the gate is the same
  boolean as the photo area above it.
- `page.tsx:19, 27-28, 50, 63` — the two section hairlines. `mt-8 border-t pt-4`
  and `mt-10 border-t pt-[1.125rem]` match "2rem gap + hairline + 1rem padding"
  and "2.5rem gap + hairline + 1.125rem padding"; r7 measured both at `x 20→373`,
  `y=121` and `y=205.2`.
- `page.tsx:30-32, 46` — both remaining `y=0` claims are qualified and true. The
  third one at `:46` was found by the worker's own sweep, not by either of us.
- `page.tsx:23` "No SealedCard, no TonightCard" — neither is imported here. The
  files remain dead elsewhere; carried, not counted.

No occurrence of `31` remains in either file.

## P1

None.

## P2 — not blocking, for whatever touches this file next

1. **`TodayPair.tsx:36` names a route that does not exist.** "TodayPair — reads
   from FIXTURE_TODAY. Used on /home." The only importer is
   `app/(app)/today/page.tsx:3`; `app/page.tsx` redirects `/` → `/today`; there
   is no `/home` in the route tree. This predates round 7 and is a wayfinding
   pointer rather than a behaviour claim — a reader who follows it greps and
   finds `/today` in one step. Fix is one word: `Used on /today.` The prose at
   `:2` ("the opening object on home") is fine as written — `home` is the
   directory's own name for the opening surface.
2. **`TodayPair.tsx:13` counts one hairline where the DOM has two.** The gate is
   per column, so the one-posted state renders the element under both — r7:
   `x 0→195.5` and `x 197.5→393`. The sentence's subject is the bare column, and
   the file's own vocabulary at `:186-188` treats the pair as "a rule running
   bezel to bezel with a 2px notch at the gutter", i.e. one rule in two pieces.
   True under that convention; noted because it is the loosest surviving sentence
   and I would rather you know I read it than assume I skipped it.
3. **`page.tsx:27`** labels the first gap "caption → window sentence". On a
   no-photograph day there is no caption and the gap runs from the meta lines.
   The measurement (2rem + hairline + 1rem) is correct in both states; only the
   name of the preceding element is state-specific.
4. **`:37-38` and `:75`** call the review surface "the /today review surface"; it
   is `/review/today-pair`. Descriptive rather than a path, and the route
   contains both words. "and tests" at `:75` is true —
   `e2e/dock-clearance.spec.ts:32` visits `/today`, which renders
   `TodayPairContent` through `TodayPair`.

## Carried, not re-argued

The window sentence (B12), dead `SealedCard.tsx` / `TonightCard.tsx`, the
doorway's link styled as a non-interactive label, stale `Dock.tsx:29`. Out of
scope per the brief and not driving the verdict.

## Method notes

- **Nothing was edited in the reviewed worktree.** `git status` at close: source
  tree clean at `9acbb61`; the only untracked path is `apps/web/node_modules`
  (pre-existing). This session file is the only addition, and it is committed.
- **No dev server was started and no browser was launched this round.** Stated
  rather than hidden: the pass rests on round-7 measurements plus code reading,
  which is sound only because the diff since `b2bde25` contains no executable
  change. I confirmed that myself before deciding not to render.
