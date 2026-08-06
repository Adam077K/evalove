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

## §4 · BUILT, PUSHED, WAITING ON THE FOUNDER'S THUMB — `feat/lay-probe` @ `c372bdd`

**Complete and on origin. Unmerged, deliberately, and throwaway by design.** Route:
`/review/lay-probe`. Take → lift → lay only, three prints. No tape, stickers, writing,
keyboard path or persistence. **The question:** *press a photograph, lay it beside another,
watch it land crooked — does that read as making, within three tries?*

**It instruments the reach invariant** — distance from the pivot (355, 790) to the
**farthest corner** of the held object, read literally as *"the region under the held
object"* rather than centre-distance, which would have quietly passed violating gestures.
One `console.debug` line per gesture. **That is what makes a NO interpretable:**

- **invariant held and it still feels wrong → the model is wrong.** Falsified for a day
  instead of a wave, and **deleting this branch is then the successful outcome.**
- **invariant violated → the implementation drifted** and the model was never tested.

**Deviation the worker flagged rather than hid:** the spec's *"it lifts (scale 1→1.05)"*
reads as an eased tween; it built an **instant swap**, because a tween on the same node
that also does 1:1 finger-tracking would stomp the tracked position back to origin if a
drag began before it finished. **If it reads as abrupt on device, change that — not the
model.** It also noted the REACH gate's own arithmetic carries ~19 px slack at the
mathematical extreme: pre-existing in the spec's numbers, not introduced here, and a corner
no hand would reach for.

**Verified live at 393×852:** hydrated · three prints · every `img.photo` computes
`filter: none` · callout guards present on all six relevant nodes.

⚠️ **Trap for whoever verifies this next:** checking `-webkit-touch-callout` via
`getComputedStyle` returns **false in Chromium, which does not implement the property.**
The CEO hit exactly this and briefly believed the guard was missing — it was set in six
places all along. **Grep the source; do not trust computed style for that one.**

**Older note, still true:** without the guard, a ≥250 ms press in iOS Safari raises the
native save-image callout and the lift never fires — perfect in desktop Chromium, broken on
the phone. And the untouched-page gate: a page nobody has pressed must differ by **zero DOM
nodes and zero
pixels.**

## §5 · Ready but NOT gated — do not merge without QA

**`feat/dates-cardcopy`** (2 commits) — 33 display-copy pairs, all nine windows, caps
honoured (33/34, 66/66), zero window-codes, `tsc` clean. ✅ **QA-Lead PASS at Lite tier,
0 P1, every finding P3. Cleared to merge; awaiting founder confirmation only.**

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
6. **The skill index is a silent instrument.** `CLAUDE.md` orders every agent to discover
   skills by *"filter `skills` array by `tags` matching task domain"* — but **only 16 of 154
   manifest entries carry any tags at all.** The other 138 are unreachable by the documented
   method, and the filter returns **empty**, which reads exactly like *"no relevant skill
   exists."* Same shape as the `jsdom` and font-import traps: **a test that did not run is
   indistinguishable from a test that found nothing.** Until it is regenerated, match on
   `name` + `description`, not `tags`.
   Two smaller defects in the same file: four security skills sit at
   `.claude/skills/security/aws-*/SKILL.md`, so the documented
   `.claude/skills/[skill-name]/SKILL.md` **404s for them** — use the manifest's `path`
   field, which is correct for all 154. And seven entries are self-nested unpack artifacts
   (`vercel-*/vercel-*/SKILL.md`, `deploy-to-vercel`, `emilkowal-animations`), which is why
   the manifest counts 154 against `CLAUDE.md`'s 147 — **147 is the true skill count.**

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

---

## §9 · Exact state at handoff — everything is on origin

Written last, after context compaction was announced, so **no work is recoverable only
from a transcript.** Every branch below is pushed.

| Branch | On origin | Gate | Do what |
|---|---|---|---|
| `main` | ✅ `0e51e8e` is the **last code commit**; anything after it is documentation | PASS ×2 | nothing — Wave 4 is merged and verified here |
| `feat/lay-probe` | ✅ `c372bdd` | none — throwaway | **founder judges it on a phone.** Delete on a NO; that is success |
| `feat/dates-cardcopy` | ✅ | **none** | **QA gate before merge.** 33 card pairs, `tsc` clean |
| `integration/wave4` | ✅ | PASS ×2 | already merged to main; kept for provenance |
| `ceo-4-1785631505` | ✅ | docs only | already merged to main; kept for provenance |

**`main` verified after merge:** typecheck clean · **34 files / 492 tests / 489 passed / 1
failed / 2 skipped** — the one failure is the documented `tools/export`
`ERR_MODULE_NOT_FOUND`. **Run `pnpm install` in `apps/web` before trusting any test count**
(see §2).

### Two uncommitted local files that must never be committed

Both live only in the main repo working tree and are the reason the app is reachable at
all:

1. `apps/web/middleware.ts` — the `NODE_ENV`-gated **dev auth bypass** (18 lines added).
2. `apps/web/next.config.ts` — `"10.0.0.7"` added to `allowedDevOrigins` so a **phone** can
   load the app. Without it the phone gets a page that **never hydrates**: no errors, 200s
   on every chunk, a dead screen easily misread as a broken app. **Replace with whatever
   `ipconfig getifaddr en0` returns on the machine of the day.**

**Both were confirmed absent from the push.** Verify again after any future merge.

### The dev server

Serves from the **main repo**, port 3000, bound to all interfaces →
`http://<LAN-IP>:3000` on a phone. It was left on **`main`**. To show the probe:
`git checkout --detach feat/lay-probe`, then `git checkout main` after. The uncommitted
files above survive branch switches; check they are still modified afterwards.

### Five things only the founder can close

1. **The slop test** — his by name in both governing documents. **A design-critic returned
   PASS on it and that PASS was struck.** Not run on this work.
2. **The lay probe** — does it read as making, within three tries?
3. **Dates** — resolved as *the window* (DECO, one card, no rail); spec and 33 card pairs
   ready.
4. **`/send`** — still two-tier; folding it into the pen changes the core interaction.
5. **The auth-verification wall** and **installing semgrep** — both structural, §6.

---

## §10 · Wave 5 — the founder's feel list. Specced, gated, blocked on one human write.

He used the app and named seven things. **Five were measured and confirmed; none were
taken from his wording.** Nothing shipped — the whole wave is parked behind an 18-line
edit only a human can make.

### What is true, measured
- **The page turn is a scroll-snap carousel** (`BookObject.tsx:206`) with a decorative
  `perspective`. ⚠️ **It is NOT broken** — it was built, is live, and does follow the thumb
  (QA-verified 2026-08-06). The keyframes cap `rotateY` at **±24°** with no back face, so it
  can never read as paper folding. **He is reopening a documented "none of them mine to
  reopen" ruling** (`globals.css:962-966`, scroll-driven/no-JS). Try CSS-only first; if you
  fall back to JS, say so loudly.
- **The tab-switch jump is structural.** `(app)/layout.tsx:38` pads every route; Today and
  Book each cancel it and re-apply *different* top insets (1.75 vs 2.25rem); Dates and Send
  don't cancel at all. Zero `AnimatePresence` at any route level.
- **`DualClocks.tsx` was built and has been dead in the tree** since the foundation review.
  He asked for "the clocks we used to have" not knowing they still exist.
- **The probe's lag is not where anyone guessed.** The drag path is already
  compositor-only. Real causes: a **250 ms hold with no feedback for its first 120 ms**, and
  an **un-eased pop** to `scale(1.05) rotate(-3.5°)` at commit. Both reproduce on mouse.
- **27 of 44 assets have never rendered** — the dev bench `notFound()`s in production, so
  bench-only references don't count. **Zero stickers have ever appeared on a page**,
  including Eva's sunflower.

### Two founder decisions
- **§0 is overridden.** It becomes *nothing above the item may be **about** the item.* Every
  route gets one band: **DECO, `--night-sky`, Seam rotated 180° (not mirrored), 56px + safe
  area, identical contents everywhere, never a skeleton.** He first chose a taped paper band
  from three sketches, then **reversed himself on Design-Lead's argument**: paper is what
  they *made*; the clocks are the distance *between* them. Refused outright: a search bar
  (Wave 4 deleted one as a prepared place) and a hamburger (opens onto nothing).
- **The ornament rule:** *a material earns its place by doing a job, or by being placed by a
  hand. "The page looked empty" is never a job.* Fasteners may be app-placed; ornaments never.
  So pressed flowers wait for hand-composition — but **floral washi ships now**, because a
  flower printed on a fastener is one nobody had to fake placing.
  ⚠️ **Widening the tape pick list re-rolls every existing item's tape** (`seededPick` uses
  `floor(seed × length)`). Free on fixtures. **Destructive after the first real photograph.**

### ⚠️ The trap that bit three times in one day
**A fact true in one checkout, assumed global.** Same species each time:
1. `jsdom` declared by one branch, installed only in that worktree — two test files silently
   didn't run and the suite still read green.
2. `middleware.ts` read in the main repo, where the dev-door patch exists **in the working
   tree only** — produced a brief telling three workers there was no auth wall. There is.
3. `DECISIONS.md` written by an agent into a checkout **five commits stale** — committing it
   would have deleted four of that day's entries.
**Before writing to any shared file, confirm the checkout is current. Before trusting any
test count, `pnpm install`.**

### State
| Branch | Gate | Status |
|---|---|---|
| `feat/dates-cardcopy` | ✅ **PASS** (Lite, 0 P1) | **cleared — needs founder merge confirmation only** |
| `feat/review-door-dev-only` | — | **BLOCKED on a human write.** Red test committed (`22cba34`), 23/25 passing, the 2 reds are the proof it exercises the feature |
| shell + DECO band | not built | full tier · specced · blocked behind the review door |
| real page turn | not built | full tier · specced · blocked |
| probe lag | not built | lite · specced · blocked |
| floral washi | not built | **unblocked — awaiting founder go/no-go** |

**Why everything is blocked:** workers cannot open what they build. `/review/*` is gated, so
three visual tasks can't be honestly verified. The founder signed off on making `/review/`
public outside production; **the classifier blocks every agent write to `middleware.ts`,
correctly** — a worker asked the CEO to land it and that was refused as permission
laundering. It needs the founder's own hand.

**Still his alone, still unrun: the slop test.** Nothing from this wave has been in front of
his eyes.

---

## §11 · Wave 5 is BUILT — `integration/wave5` @ `d973812`, pushed

**41 files / 544 tests / 541 passed / 1 failed (documented `tools/export`) / 2 skipped ·
typecheck clean · 33 files, +1886 / −602 · zero merge conflicts across four branches.**

| In the wave | What |
|---|---|
| shared shell | one edge-to-edge frame; both hand-rolled escape hatches deleted; `Column` opt-in for Dates/Send |
| DECO band | `--night-sky`, Seam **rotated 180° (not mirrored)**, `--band-height: calc(56px + safe-area)`, identical every route, **never a skeleton** |
| page turn | **real spine hinge**, leaves stacked, true back face, Prev/Next for WCAG 2.5.7, reduced-motion honoured |
| dates debt | wrong regression test corrected (w9→w7), relative-time law breach removed |
| cleanup | five dead v7 files deleted — **also cleared 3 of 7 pre-existing lint errors** |

**Every worker returned `visual_verification: PENDING` with a specific `needs_eyes` list. Not
one claimed to have seen a screen.** That is the discipline that was absent when seven PASS
verdicts landed on an app the founder called unusable.

### ⚠️ The security finding that changes the line you were told to paste
The review-door guard was going to be `NODE_ENV !== "production"`. **It fails open.**
`next/dist/bin/next` line 17 is `process.env.NODE_ENV = process.env.NODE_ENV || defaultEnv` —
Next only *defaults* it. `NODE_ENV=test next build` inlines `"test"`, the condition is true,
and `/review/` **ships in the production bundle**, with no warning. Also open on `undefined`,
`""`, `"staging"`, `"Production"`.

**The correct line is `process.env.NODE_ENV === "development"`.** Verified to still cover
`next dev` and `playwright.config.ts:50`, which pins development explicitly.
**Audit verdict: APPROVE_WITH_CONDITIONS, no P1** — worst case exposes three fixture pages
with `picsum.photos` images, zero cookies, zero DB; the one fallback path calls
`requireSession()` itself.

### ⚠️ The finding worth acting on before the security one
`middleware.ts` transitively imports `lib/env.ts`, which **throws at module evaluation**, and
**30 of 44 worktrees have no `.env.local` — including the branch that proposed the change.**
The door may open onto a 500 rather than a harness. *Do not let the seventh "passes QA, fails
use" be a security change.* **Merge condition: load `/review/book-states` in a bare worktree
with no cookie and report what happens.**

### Pre-existing, live in production, nobody's ticket yet
**Percent-encoded slashes survive `nextUrl.pathname`.** `/img/..%2f..%2ftoday` and the same
shape under `/_next/` and `/api/img/` are public **in production on `origin/main` today**.
Unrelated to this wave. Needs its own decision.

### Branches
`integration/wave5` (pushed, code-complete) · `feat/review-door` (hardened: fail-open
`NODE_ENV` cases, `ALWAYS_PUBLIC` assertions, `review/layout.tsx` second gate, harness shape
test; **one red until the line lands, which is the suite working**) ·
`feat/lay-probe-responsiveness` (separate base) · `feat/floral-washi` (awaiting plate download).
**Do NOT merge `feat/review-door-dev-only`** — 11 commits stale, would revert 795 lines. The
test was cherry-picked onto `feat/review-door` instead.

### The two things only the founder can do
1. **The one line**, in `.worktrees/review-door-2/apps/web/middleware.ts`:
   `...(process.env.NODE_ENV === "development" ? ["/review/"] : []),`
2. **Download the washi plates** (URLs in the session log) — CDN egress is blocked from every
   agent session; confirmed independently from two.

**Then: the visual pass against five `needs_eyes` lists → QA gate → the founder's slop test.
Nothing in this wave has been seen by a human.**
