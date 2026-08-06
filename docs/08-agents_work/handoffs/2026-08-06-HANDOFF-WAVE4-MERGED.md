---
date: 2026-08-06
from: ceo (session ceo-4)
to: the next session
status: CURRENT — supersedes 2026-08-06-HANDOFF-USE-THE-APP.md
state: Wave 4 merged to main. The Book is an object again. Two specs ready, one probe building.
---

# Handoff — Wave 4 is in, and the Book becomes something you make

## §0 · What changed today, in one line each

The founder said **"it's very, very bad"** and **"it looks like a three years old website
design."** Both are located and one is fixed.

- **The Book was deforming.** Its board height was fixed while its width was a `flex-1`
  remainder, so fore-edge growth was subtracted from the cover: `board = 406 − foreEdge`.
  **The Book got narrower as the archive thickened** — ratio 0.765 today, **0.554** at the
  ceiling. Now **280 × 364 Crown Quarto, invariant at every leaf count**, spine on the
  table at x=29. The audit found the symptom (spine off-screen at −42.8); **review found
  the cause.**
- **"Three years old website design" is Dates**, measured: **0 law-era markers against 15
  SaaS-era.** Waves 0–2 rebuilt Today and the Book and stopped. **Still true — not fixed.**

## §1 · Merged to main

`integration/wave4` and the documentation branch. **QA-Lead PASS at Full tier, twice, from
two independent gates.** 0 P1 · 1 P2 (pre-existing `lib/session` flake, absent from the
diff) · 3 P3. All five behavioural-law checks hold.

Echo stops faking an 1100 ms thinking delay before a canned reply · the dock is **three
places plus the pen** (Today · The Book · Dates) · `/echo` redirects · the Book's dead Echo
search door **removed rather than repointed** (a search control that does not search is a
prepared place) · Dates stops lowercasing Eva and Adam · an e2e `ROUTES` entry that
**passed while measuring the wrong page** is fixed.

**Verified state of main: typecheck clean · 34 files / 492 tests / 489 passed / 1 failed /
2 skipped.** The one failure is the documented `tools/export` `ERR_MODULE_NOT_FOUND`
(`tools/` has never had `pnpm install`).

## §2 · ⚠️ The trap that nearly shipped, again

Merging main showed **32 files / 486 tests** where the trunk showed 34 / 492. **Two test
files were silently not running.** All five new test files were present; `jsdom` was
declared in `package.json` by a branch and **only ever installed inside that branch's
worktree**. `pnpm install` on main fixed it and the counts matched exactly.

**This is the same failure the last handoff documented** — three font imports, same shape.
**After any merge, run `pnpm install` before trusting a test count.** A missing dependency
does not fail loudly; the files just do not execute.

Related, still open: a stale root `package-lock.json` drifting beside the maintained
`apps/web/pnpm-lock.yaml`. Pick one package manager and delete the loser.

## §3 · The founder's next direction — the Book becomes something you make

He asked for *"more than 1 image in the page"* and *"where is the edit book part?"* Those
are one question. **A page holds two photographs because a page IS a shared day**
(`Spread.tsx`: `evaPhoto && adamPhoto ? pair : single`); **no edit surface has ever
existed.**

**He chose hand-composition** over span-pages, over multiple-posts-a-day, and over
deferring it. Two specs are on main:

- `docs/04-features/specs/hand-composed-book-pages.md` (CPO) — composition is a **layer,
  never a replacement**; photographs, captions and authorship untouched; any page resets to
  the deterministic auto-layout; a photo placed on another day's page is **never moved**, so
  §6's carry-it-out-alone promise survives.
- `docs/04-features/specs/making-metaphor.md` (Design-Lead) — the interaction.

**Founder decisions:** either partner composes the **whole page** (a two-person page is one
shared object, not two glued halves) · change visibility is **exactly one Outfit line**,
*"arranged by [name] · [absolute date]"*, no second channel · export is **plain data**, no
rendered snapshots.

### The measurement that shaped it
A page's head sits **131–142 mm from the thumb pivot** against a **~100 mm** maximum. **The
top half of a page cannot be touched one-handed at all.** So **the book slides to the
hand**, never the hand to the book. What survives: *a thing comes up in your hand when you
press it, the book slides under it, the objects already on the page move aside because
something heavy came near, and letting go drops it crooked.* Four physical facts, no
controls.

> **Attention spent on reaching is attention not spent on the composition — that is the
> actual mechanism by which an interaction becomes a form, not the widgets.**
> Design-Lead recommends this be lifted into the law at §5 or §9, beside §9.6's *a
> measurement can be as unexamined as a report.* **Not yet done; needs a deliberate
> amendment.**

### Discovery, with nothing drawn
**Press and hold anything in the book — a photograph or bare paper — and it comes up.**
Zero pixels. Nothing is solicited; *the object was always loose.* And the *"arranged by"*
line is the teacher.

### The authorship seam, solved by material not policy
Nobody writes on the image, **not even its author** (consistent with `.photo{filter:none}`
— *nothing is ever applied to a photograph, ink included*). The chin belongs to its author.
The page takes either hand. **So Eva annotates Adam's photograph by writing a note on paper
and taping it to his print.**

### Two hard gates before any build
1. **WCAG 2.5.7** — long-press-drag alone **fails** it. The keyboard path ships in the
   **same wave** or QA-Lead must BLOCK.
2. **Composition is DERIVED, not stored.** `Spread.tsx` computes the whole arrangement from
   seeds at render time. A page needs exactly **one driver**: zero stored placements = auto,
   ≥1 = theirs; **the first lay-down materialises** the seeded layout permanently, and there
   is no way back — *you cannot un-arrange a page, only arrange it differently.* **CPO and
   CTO must settle the placement shape before a builder starts.**

## §4 · In flight

**`feat/lay-probe`** — a deliberately **throwaway** one-day probe off `integration/wave4`:
take → lift → lay only, three prints in the pile. No tape, stickers, writing, keyboard path
or persistence. **The question:** *press a photograph, lay it beside another, watch it land
crooked — does that read as making, within three tries?*

**It instruments the reach invariant** (region under the held object within **495 CSS px of
(355, 790)**) so a NO is interpretable: invariant held and it still feels wrong → **the
model is wrong**, for a day instead of a wave. Invariant violated → the implementation
drifted and the model was never tested.

**Two things most likely to break it, both flagged twice:** `-webkit-touch-callout: none`
and `user-select: none` on every page object, or iOS Safari's save-image callout eats the
gesture — **it will look perfect in desktop Chromium and broken on the phone.** And the
untouched-page gate: a page nobody has pressed must differ by **zero DOM nodes and zero
pixels.**

## §5 · Ready but NOT gated — do not merge without QA

**`feat/dates-cardcopy`** (2 commits) — 33 display-copy pairs, all nine windows, caps
honoured (33/34, 66/66), zero window-codes, `tsc` clean. **No QA gate has run on it.**

It exists because **four windows (w2, w5, w6, w7) rendered the thin-window empty state
permanently** — the fixture only covered five. w7 is Saturday, the flagship, with 40 real
library entries and nothing showing. *That is a hole in the fixture, not a bug in the empty
state, and part of why Dates feels bad.*

## §6 · Open for the founder

1. **The slop test.** Both governing documents assign it to him by name — *"the founder's.
   Two directions have already failed it."* **A design-critic returned PASS on it and that
   PASS was struck**, because no agent can run it. **It has not been run on this work.**
2. **Dates** — Design-Lead resolved it as **the window**: DECO, one card already lit on
   arrival, one control, no rail. *You do not browse a window — you look out of it.*
   ⚠️ **The CEO's law-era coverage metric is a trap on DECO surfaces** — chasing it would
   paper-ify Dates. Zero `Taped`/`Mounted`/`under-lamp` there.
3. **`/send`** still carries the two-tier framing Vision §2.1 cuts (*"deliberately lighter
   than the daily ritual"*). Folding it into the pen changes the core interaction.
4. **The auth-verification wall** — approached **three times in one day by three agents
   along three routes** (middleware bypass, token minting, `.env.local` symlink), all
   stopped. QA-Lead's read, which is correct and outranks its own verdict: *refusing each
   attempt is not a fix.* Workers need to verify UI and have **no legitimate path to a
   session.** Likely answer: a dev-only session fixture that never touches the live
   credential — **Irreversible tier, founder sign-off plus security-engineer.**
5. **Install `semgrep`** — it never ran on the Full-tier gate; the binary is absent. Manual
   review covered the categories, but **compensation is not equivalence**, and this project
   has already had to void two exemptions that began as reasonable accommodations.

## §7 · How to see it

Dev server binds all interfaces. **On a phone (the only viewport that matters):
`http://10.0.0.7:3000`.** Requires the machine's LAN address in `allowedDevOrigins` —
currently added to `next.config.ts` **uncommitted, local only, same standing as the
`middleware.ts` dev auth bypass. Neither may ever be committed.** Without it a phone loads a
page that **never hydrates**: no errors, 200s on every chunk, a dead screen you would
misread as a broken app.

## §8 · What worked, and it was not the audit

**The audit found symptoms. Review found causes** — and corrected the CEO four times,
including that the Book's defect was never a margin. **Three workers each found something
no brief contained**: a second collapsed margin in the pair state (visible only when both
have posted — the state nobody screenshots), a search button that silently went nowhere,
and an e2e route array that would have passed while measuring the wrong page.

**One worker refused a technically-available route past the auth gate** — it could have
minted a token against the real `SESSION_SECRET`, said so plainly, and escalated instead.
**That refusal became project law.**

The CEO was wrong **six times on measurement and twice on process** — all recorded in
`DECISIONS.md` rather than tidied away. The pattern: measurement caught the false alarms;
only a second reader with more domain knowledge caught a misattributed cause; and two were
caught only by **looking at the artefact instead of the number.**

> **A test that did not run is indistinguishable from a test that found a problem.**

**Brief agents to argue back.** Every one that did improved the outcome.
