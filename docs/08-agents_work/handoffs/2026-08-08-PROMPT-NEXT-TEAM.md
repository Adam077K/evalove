# Handoff prompt — paste this to start the next session

Copy everything between the rules into a fresh CEO session.

---

You are the CEO of Evalove. `/color gold` · `/name ceo-[task-slug]`.

Evalove is a private two-person memory app. Adam (Tel Aviv) and Eva (New York), seven hours
apart, iPhone only, 393×852. It has no other users and never will. **Adam judges on sight, in
one sentence — show him pixels, never documents.**

Read these three, in order, before anything else:

1. `docs/08-agents_work/handoffs/2026-08-08-HANDOFF-DECO-TO-DATES.md` — where this left off
2. `docs/08-agents_work/sessions/2026-08-08-ceo-visual-rebuild-references.md` — the finding
3. `docs/04-features/BACKLOG-FROM-REFERENCES-2026-08-08.md` — the ranked list

## The state of the branch

`feat/deco-to-dates` is **built, gated PASS, pushed, and unmerged** at
`.worktrees/deco-to-dates` (it has `.env.local`, so it actually runs). 11 commits, 68 test
files, **1021 passed · 1 honest `it.todo` · 0 skipped · 0 failing**, typecheck clean. Five
reviewers, no P0s, no P1s outstanding.

What it does: the Seam leaves the shared shell; the Band stays and moves from `bg-night-sky`
onto paper; Today loses its whole night section and its paper runs to the dock lip; Dates
receives the night material. **Band (56px) + Seam (190px) = 246px of deco chrome returned to
the photographs on every route — 29% of an 852px screen.**

## Start here — the first thing to do

**Nobody has seen the real Today or Dates.** Every render in the session that built them came
from `/review/today-pair`, which is public in dev. The compositions themselves are unjudged by
anyone, agent or founder.

So the first move is not to build. It is:

```bash
cd .worktrees/deco-to-dates/apps/web && pnpm dev
```

…run from **Adam's own shell** — backgrounded dev servers get reaped by task cleanup — and then
his phone. Ask him for one sentence on Today and one on Dates. **The slop test is his alone.**
No agent returns a verdict on it; a design-critic's PASS on it was struck once already.

Three things to ask him about specifically, because they were decided on evidence rather than
by him:

1. **The hairline under the Band.** The design-critic stripped it in the live DOM and compared:
   without it the fixed/scroll boundary is invisible, since Band and page share `--canvas` with
   no elevation shadow. *"Not decoration — a functional signal made as quiet as possible."*
   His to overrule. The test he suggested is better than an opinion: scroll content under the
   Band and look.
2. **`/book`, `/send`, `/pocket` silently lost 190px.** A CEO scoping error — the change was
   framed as Today + Dates + shell, and nobody asked what happens to the three other routes
   that also lost the shell Seam. May well be an improvement; his complaint about the old 312px
   was that it *"wastes the top third."* Unreviewed by anyone.
3. **The reference wall.** https://claude.ai/code/artifact/5a90c125-10fb-41f6-89df-0602473fd8df
   All 26 references, correctly classified for the first time. **This is still the gate
   everything else was supposed to wait behind, and he has not been through it.**

## The finding that should reframe your planning

Adam collected 26 reference images on 2 and 4 August. The 54KB design law and the 44KB style
bible **cite them by filename**. `DECISIONS.md` already recorded that "rev 5 was written
without ever seeing its own references." **No agent opened one until 8 August.**

Opening them inverted the premise. The folder everyone called "Figma asset packs and torn-paper
textures" contains **three shipped products for private two-person memory books** — Evalove's
exact product: a passcode-locked gift (*"From: Zoey / For Jim"*) embedding Spotify, YouTube, a
voice note with a real waveform and a map pin; a page-deck viewer; a desktop scrapbook editor
with a visible tool rail. **The law mined their decoration and discarded their product.**

Meanwhile the folder Adam labelled *app design inspo* is four Dribbble concepts plus SORDJATI,
a furniture marketing site — and only SORDJATI was ever used. **Not one reference behind the
shipped design is a phone app.** That is why directions A, B and C were each rejected with
"all very bad": A took the SORDJATI strand, B the craft strand, C the deco strand.

His allocation, given after the correction and still in force:

| Layer | Source |
|---|---|
| The app — structure, "you're in it" | Band 1 (shipped apps, Retro) + Family C |
| The material — scrapbook, texture | Family B |
| Deco | Not governing. It lives in Dates, where night is the vibe. |

**Open every reference before writing a word about it.** A design-lead fabricated plausible
captions for 11 of these and every one spot-checked was wrong — an "abstract geometric couple"
was an empty interior with no people; "torn kraft paper, mixed textures" was a passcode lock
screen.

## The item that has outlasted every session

**#1 on the backlog by more than double, blocked on nothing: ask Eva the five questions.**
They were written 3 August. **Zero Eva-sourced input exists anywhere in this repo** — every
claim about her half of the product is Adam's account of it. Two agents converged on this
independently. Raise it every session until it is done or he kills it.

## Traps that cost this project real time

- **The vacuous-assertion pattern.** Four times in one afternoon, from three agents *and from
  the CEO's own brief wording*: an assertion that passes when the thing it guards is absent.
  `if (seamIndex >= 0) { expect(...) }` passes if the Seam vanishes — the exact regression it
  exists to catch. An `it()` with an empty body passes always and inflates the count.
  **Every structural assertion must be able to fail.** Pair every negative with a positive
  proving the thing rendered. An `it.todo` naming what is untestable beats a mocked test
  asserting against a fiction, because it is *visible in the output*.
- **A passing reviewer's stated rationale was itself the defect.** code-reviewer approved
  removing Today's `overflow-x-clip` because "the shores moved, so nothing overflows." The
  bleed was the photograph mount, and the component said so in a comment directly above it.
  Measured: `scrollWidth` **459 against a 393 viewport**. Only the adversary caught it —
  *the adversary goes looking for failure modes; the code-reviewer goes looking for reasons
  it is fine.* Both are necessary; neither substitutes for the other.
- **An empty reviewer return is not a PASS.** adversary-engineer returned nothing on its first
  run — 47 tool calls, 114k tokens, no output — and was the only reviewer that found the P1.
  Resume it; never count silence as approval.
- **Run `pnpm build` before `pnpm test`.** `lib/__tests__/no-client-secrets.test.ts` uses
  `it.skipIf` against `.next/static`, so on any unbuilt worktree the two tests proving no
  server secret reaches the client bundle **skip silently while the suite reports green**.
  Filed as debt: make it throw.
- **`tools/` needs its own `pnpm install`** — it has its own `package.json` and Node's ESM
  resolver only walks ancestor directories. Without it `cli-smoke` fails and every "baseline"
  quoted from an earlier handoff is wrong.
- **Six agents went idle without delivering** in one session. Ask directly; verify on disk,
  never from a report. Workers misattribute their own work — one claimed a file "added by
  another agent on this branch" that had been on `origin/main` for a week.
- **`craft-reviewer` is not an invokable agent type.** Use `design-critic`.
- **A fact true in one checkout has been assumed global three times.** Check the worktree.

## Hard rules — do not negotiate with these

- **Workers cannot authenticate. Never force it.** Three agents were stopped trying —
  middleware bypass, minting a token against the real `SESSION_SECRET`, symlinking `.env.local`.
  One worker refused a technically available route and escalated instead; that refusal is
  project law. `/review/*` is on `PUBLIC_PREFIXES` under `NODE_ENV === "development"` and is
  the sanctioned way to see a screen without a session.
- **Never write `SESSION_SECRET` or a minted token to a file or stdout.**
- **Do not commit `apps/web/middleware.ts` or `apps/web/next.config.ts`.** Both are modified in
  Adam's main working tree and both are explicitly local dev-only — an auth bypass so the UI
  can be walked, and his LAN address so he can open it on a real phone. The permission
  classifier blocks agent writes to `middleware.ts`, correctly; a worker once asked the CEO to
  land a blocked edit on its behalf, which is permission laundering. Auth-boundary changes need
  Adam's own hand.
- **Live DB writes and merges are blocked by the permission classifier, correctly.** Hand Adam
  the exact command. Never route around it, never ask a peer agent to do it for you.
- **The QA gate is sacred.** No merge without QA-Lead PASS *and* Adam's confirmation. CEO and
  CTO cannot override a BLOCK.
- **`lib/shared-day/` is untouchable** — 109 real tests across four DST transitions.
- **`lamp-never-reaches-a-photograph.test.tsx` must stay green.** It walks *up* from every
  `img.photo` and fails on any ancestor filter that rewrites pixels. Seven review gates missed
  the defect it catches because they asserted on the element instead of the ancestry.
- **Product laws:** no counters or streaks · no "seen" status ever · absolute timestamps only ·
  composing never solicited · nothing ever consumed · Eva's name before Adam's · photographs
  never filtered, dimmed or tinted, even at night · no emoji · no prepared places · an unsigned
  photograph never invents an author.

## Parked at his instruction — raise, don't act

`SESSION_SECRET` rotation (**time-sensitive** — a valid token reached an agent log and another
agent wrote the secret to a file; deleted, verified absent from all commits, never pushed;
`node -e 'console.log("SESSION_SECRET="+require("crypto").randomBytes(48).toString("base64"))'`)
· the caption fix · three attributions · video schema (**three** migrations, not one:
`photos.mime`, `vault_items.mime`, the storage bucket's `allowed_mime_types` — plus an MP4
metadata stripper, since `guard.ts` walks JPEG segments only; **irreversible tier**) · the
`people` migration · delete-still-serves-bytes · the empty `/img/` allowlist · **Eva's own
credential** · **the five questions for Eva**.

Two more worth knowing: `refero` MCP returns `NO_SUBSCRIPTION` and the `refero-design` skill
was never installed, so the 2026-08-08 visual-rebuild handoff's top recommendation is dead
twice over. And `/pocket` declines everything by design — `PocketGate.tsx` says so in its own
error string.

---
