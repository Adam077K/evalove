# Session Log: frontend-engineer — three v6 interface defects

**Date:** 2026-08-02
**Worker:** frontend-engineer (`/color pink`, `/name frontend-v6-defects`)
**Task:** Three defects found on CEO review of the first real v6 screenshot — dock overlap, "Ask Adam", "Adam left a note for Eva"
**Task type:** BUG_FIX (surgical; no redesign, no globals.css tokens touched)
**Branch:** `feat/v6-defects` (from `ceo-2-1785631504` @ 04c538d)
**Status:** Complete
**QA verdict:** Pending QA-Lead. Self-verified: `tsc --noEmit` clean under strict, 109/109 unit tests green, Playwright clear on all seven routes at two viewports. ESLint could not run — see Blockers.
**Tier:** lite (isolated UI, no API/DB/auth, ~200 LOC)

---

## What Was Done

Three commits, one per defect.

### 1 · `9635378` — the dock reserved nothing, so cards scrolled under it

The dock is `fixed`, so it takes no room in the flow. The column reserved a flat
`pb-36` for it — a number that cleared the dock on a desktop and stopped clearing
it on a phone, because the dock grows by `env(safe-area-inset-bottom)` over the
iOS home indicator and the padding did not.

The reserve is now the dock's actual footprint plus air:
`calc(8rem + max(1rem, env(safe-area-inset-bottom)))` — 4rem of pill, 4rem of air,
and the same bottom offset the dock floats at. On a desktop this evaluates to
144px, identical to `pb-36`, so nothing moved in the seven approved screenshots.

The Echo composer's sticky offset got the same treatment. It was `bottom-24`
(96px), which is 2px *under* the dock once a 34px home indicator is in play.

`DOCK_FOOTPRINT` in `Dock.tsx` documents the geometry both call sites depend on.
All vertical measures use `dvh`; there is no `vh` anywhere in `apps/web`.

### 2 · `d950b34` — "Ask Adam" renamed to Echo

Hard line 1 of `docs/04-features/AI-PARTNER-SPEC.md` is that the feature must
never be mistakable for the real person. A button reading "Ask Adam" says you are
asking Adam.

Renamed `/partner` → `/echo`, `PartnerChat` → `EchoChat`, `PartnerTile` →
`EchoTile`. Every string was rewritten against one test: **does this describe what
he DID say, or what he WOULD say?** The name does some of that work by itself —
an echo returns what was actually said, which is the spec's rule (quote the
record, never predict the person) folded into a word.

Two changes beyond the literal ask, both required by it:

- The chat header lost the partner's **initial**. A monogram in a chat header is
  an avatar, and an avatar is exactly the impersonation this surface may not make.
  It keeps his gradient — the colour is a citation, not a voice — and takes the
  echo glyph the dock tab now carries.
- The **dock tab** was labelled with the partner's display name. A tab reading
  "Adam" claims that tapping it reaches Adam. It reads "Echo".

The holding reply no longer says Echo is "still learning Adam's whole story".
Learning a person is Framing B, which the spec rejects outright; it now says the
record isn't wired up yet and that it would rather hold the question than invent
an answer.

### 3 · `2c9cdc2` — Eva before Adam

The rule attached to the founder decision is that a sentence which scans better
the other way gets **rewritten, not shuffled**. "Eva has a note from Adam" would
have been the shuffle.

The sealed card now carries one name per line — headline is the recipient and
what is waiting, caption is the sender and the seal:

```
Eva has a note waiting
sealed by Adam · 8:12 am his time
```

All three facts the card promised to carry (who, roughly when, what kind) survive,
the recipient's name leads, and no sentence queues one name behind the other. It
holds when the viewer flips: on Adam's phone it reads "Adam has a note waiting /
sealed by Eva", and neither name was demoted to make that work.

Today's status swapped its clauses, not its names, and now tracks the two slots
left-to-right on the card beneath it:
`"Adam has posted · a place is ready for Eva"` → `"A place is ready for Eva · Adam has posted"`.

The grep over the rest of `apps/web` found three more, all rewritten rather than
reordered: the sealed note's body, and two activity strings in `suggestions.ts`.
Fixture comments annotating the same states came with them.

Two Adam-first comments are deliberately left alone because their order is
chronological and reversing it would make them false: `"Adam first, Eva 12h
later"` in the golden tests, and `"the last turn is Adam's, so Eva writes next"`
in the dates fixture.

## Files Changed

```
apps/web/app/(app)/layout.tsx
apps/web/app/(app)/home/page.tsx
apps/web/app/(app)/partner/page.tsx      -> apps/web/app/(app)/echo/page.tsx
apps/web/components/partner/PartnerChat.tsx -> apps/web/components/echo/EchoChat.tsx
apps/web/components/home/PartnerTile.tsx -> apps/web/components/home/EchoTile.tsx
apps/web/components/home/SealedCard.tsx
apps/web/components/chrome/Dock.tsx
apps/web/lib/fixtures/suggestions.ts
apps/web/lib/fixtures/left.ts
apps/web/lib/fixtures/book.ts
apps/web/lib/fixtures/photos.ts
```

## Verification

`npx next dev -p 4318`, headless Chromium, 390×844 and 1280×900. Each of the seven
routes loaded, scrolled to `document.body.scrollHeight`, then every text-bearing
leaf inside `<main>` rectangle-tested against the dock pill.

| route | mobile gap | desktop gap | overlaps |
|---|---|---|---|
| /home | 78px | 78px | 0 |
| /book | 119px | 187px | 0 |
| /today | 76px | 76px | 0 |
| /dates | 295px | 295px | 0 |
| /send | 190px | 255px | 0 |
| /echo | 197px | 369px | 0 |
| /pocket | 262px | 297px | 0 |

`tsc --noEmit` clean under strict. `vitest run` 109/109.

## Found, Not Fixed

**A fourth defect — `TonightCard` can shimmer forever.**
`components/home/TonightCard.tsx` gates on `windowId === null`, but `null` means
two different things: "the effect hasn't run yet" and "`currentWindow()` found no
window for the current clock" (`lib/shared-day/windows.ts:134` returns
`found?.id ?? null`, and the nine windows do not tile the full 24 hours). When the
real clock falls in a gap, the card sits in its loading skeleton permanently.

Reproduced at 2026-08-02 ~15:20 Israel time: the card was still a shimmering
placeholder after 500ms, 1500ms and 4000ms. The CEO's original screenshot, taken
about 45 minutes earlier, shows the same card fully rendered — so this is
clock-dependent, not a capture artifact, and it is a **loading state standing in
for an empty state**. The component already has a real empty state
(`"The shelf is empty"`) for the `!pick` branch; the no-window case needs its own.

Not fixed — outside the three-defect scope, and it is a product-copy decision
(what does the card say when no window fits?) rather than a mechanical fix.

## Blockers

**ESLint cannot run in this checkout** — pre-existing, not introduced here.
`npx eslint .` dies during config resolution, before reading a single source file:

```
TypeError: Converting circular structure to JSON
  configs -> flat -> plugins -> react (closes the circle)
  at @eslint/eslintrc/lib/shared/config-validator.js:308
```

The `FlatCompat` bridge in `eslint.config.mjs` is trying to `JSON.stringify` the
`eslint-config-next` plugin graph. It is a dependency/config problem, not a code
problem, and fixing it means touching lint configuration — an architectural call
that is not this worker's to make. `tsc --noEmit` and `vitest` were used as the
gate instead. Recommend routing to devops-engineer.

## Decisions Made

| Key | Decision | Reason |
|---|---|---|
| `echo_names_one_per_sentence` | Where both names would appear in one sentence, split them across two lines instead of ordering them | The Eva-first rule inverts under viewer flip if the sentence is directional. One name per line satisfies it in both directions without demoting either. |
| `echo_header_no_monogram` | Chat header keeps the partner's gradient, drops the partner's initial | A monogram in a chat header is an avatar; the gradient is a citation. |
| `dock_tab_label_echo` | Dock tab reads "Echo", not the partner's display name | A tab reading "Adam" claims tapping it reaches Adam. |
| `dock_footprint_single_source` | Footprint documented in `Dock.tsx`, literal `calc()` at both call sites | Tailwind's JIT only sees literal arbitrary values; a shared TS constant would not be scanned. Avoids touching `globals.css`, which the brief forbade. |
