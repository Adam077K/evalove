---
role: design-critic
task: today-the-pair
date: 2026-08-03
branch: feat/today-the-pair
verdict: rework
qa_verdict: FAIL
tier: full
renders: docs/08-agents_work/renders/2026-08-03-two-places/50-critic-*.png … 61-critic-*.png
---

# Today, the pair — implemented design review

Rendered from the running branch at `localhost:3312` (dev server serving
`.worktrees/today-pair/apps/web`), 393×852, viewport captures only, day and night,
hydration allowed to settle. Committed renders `40`–`46` were re-verified against the
live route and **match** — that failure mode did not repeat.

## Verdict: rework

The pair itself is right, and the empty side is the best thing in the branch. Everything
below the hairline is a different product: two `.card` slabs and a black tile that the
brief explicitly forbade, evenly spaced at 20px, on a surface whose spec asked for three
unequal registers. Three P1s are in shipped code paths, one of them a 404 reachable from
the dock.

## What lands

1. **The empty side.** Bare paper, one hairline, one meta line, no ink. It does not
   out-shout the photograph in either mode, and at night the hairline drops to 11%
   opacity so it gets *quieter*, not louder. `54-critic-empty-side-night.png`.
2. **The collapse.** Neither-posted removes the photograph-shaped space entirely — both
   columns go to 29px, two children each, no box anywhere.
   `55/56-critic-state-none-*.png`.
3. **First paint.** At 90ms and with JS disabled the pair is at the top with real text
   and zero skeletons. `53-critic-firstpaint-90ms.png`. The highest-weight test passes.
4. **No entrance on the pair** (`animationName: none`, opacity 1); sections below rise in
   at 0 / 50 / 100 / 150 / 200ms.

## P1

| # | Where | What |
|---|---|---|
| 1 | `components/chrome/Dock.tsx:57`, `components/auth/LoginForm.tsx:33` | House icon and default post-login target still `/home`, which is deleted → **404**. `61-critic-dock-house-icon-404.png` |
| 2 | `lib/shared-day/windows.ts` vs `docs/10-activity-library/library.json` | Every window's clock range is shifted; w7/w8/w9 are day-of-week windows given clock ranges. At 11pm NY the sentence reads *"Eva's day is free, Adam's at work"*. `59/60-critic-*COMPOSITED*.png` |
| 3 | `app/(app)/today/page.tsx:93,97` | `SealedCard` + `TonightCard` are `.card` — two of the three largest objects on the surface. Spec: "No card on this surface." |
| 4 | `components/home/SealedCard.tsx` | Copy reads "Eva has a note **waiting**". Spec bans "waiting". |
| 5 | `components/home/TodayPair.tsx:100` | No `-mx-5 md:-mx-8`. Pair measures x=20 w=353 inside a 393 viewport — not full bleed. |

## P2

- Even 20px rhythm across all six sections (spec: 0.875 / 2 / 2.5rem).
- `main` keeps `pt-[max(1.5rem,env(safe-area-inset-top))]`; the surface was to opt out.
- `TonightCard` restates the window sentence as its eyebrow, ~200px below it.
- No dock tab is ever active on `/today`.
- `46/47-rejected-*.png` named in the design brief are not on this branch.

## Note on a passing check that answered the wrong question

The build session records *"No card class in the diff outside dock ✓"*. True of the diff,
false of the surface — both cards predate the diff and were kept. The rule was about the
surface.

## Renders

`50`–`61` prefixed `critic-`, in `renders/2026-08-03-two-places/`. Two are marked
`COMPOSITED`: the server-clocked window sentence cannot be moved from the browser, so the
string the real `WINDOWS` table returns for that instant was substituted. The client-side
`TonightCard`, which re-derives the window independently, printed the same w9 string
unprompted — the substitution is what the app produces at 23:05 New York.
