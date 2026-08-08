# Evalove — handoff, 2026-08-08 (evening)

Supersedes nothing. Read alongside `2026-08-08-HANDOFF-VISUAL-REBUILD.md`, whose top
recommendation is dead: **`refero` MCP returns `NO_SUBSCRIPTION` and the `refero-design` skill
was never installed.** Do not plan around either.

Founder: Adam. **Judges on sight, in one sentence. Show pixels, never documents.**

---

## The finding that reframes the rebuild

Adam collected **26 reference images** on 2 and 4 August, in three folders under `~/Downloads/`.
The 54KB design law and the 44KB style bible **cite them by filename**. `DECISIONS.md` already
recorded that "rev 5 was written without ever seeing its own references." **No agent opened one
until 8 August.**

Opening them inverted the premise. The folder everyone called "Figma asset packs and torn-paper
textures" contains **three shipped products for private two-person memory books** — Evalove's
exact product: a locked gift with a passcode (*"From: Zoey / For Jim"*) embedding Spotify,
YouTube, a voice note with a real waveform and a map pin; a page-deck viewer with four circular
controls; and a desktop scrapbook editor with a visible tool rail. **The law mined their
decoration and discarded their product design.**

Meanwhile the folder Adam actually labelled *app design inspo* is four Dribbble concepts plus
SORDJATI, a furniture marketing site — and only SORDJATI was ever used. **Not one reference
behind the shipped design is a phone app.** That is why A, B and C were each rejected: A took the
SORDJATI strand, B the craft strand, C the deco strand.

**Open every reference before writing a word about it.** A design-lead fabricated plausible
captions for 11 of these on this exact task and every one spot-checked was wrong.

---

## Delivered

- **Reference wall** — https://claude.ai/code/artifact/5a90c125-10fb-41f6-89df-0602473fd8df
  All 26 correctly classified, 5 verified shipped-app screens, 9 "before" captures.
  **Adam has not been through it. This is still the gate.**
- **Ranked backlog** — `docs/04-features/BACKLOG-FROM-REFERENCES-2026-08-08.md`.
  Top item by more than double: **ask Eva the five questions** written 3 August.
- **`feat/deco-to-dates`** — built, gated, **unmerged**, at
  `/Users/adamks/VibeCoding/evalove/.worktrees/deco-to-dates` (has `.env.local`, runs).

## The branch

Deco quarantined to Dates. The Seam leaves the shell; the Band stays and moves onto paper. Today
loses its night section, paper runs to the dock lip. **Band (56px) + Seam (190px) = 246px of
chrome returned to the photographs on every route — 29% of an 852px screen.**

**68 files, 1021 passed, 1 honest `it.todo`, 0 skipped.** Five reviewers, **no P0s, no P1s
outstanding.** QA-Lead PASS pending one uncommitted one-word test-description fix.

---

## What only Adam can do

1. **Look at the real Today and Dates.** `cd .worktrees/deco-to-dates/apps/web && pnpm dev`, then
   his phone. **Nobody has seen either** — every render this session came from
   `/review/today-pair` (public in dev, no session needed). The Dates night section is unjudged.
2. **Check `/book`, `/send`, `/pocket`.** They silently lost 190px when the Seam left the shell.
   **CEO scoping error** — the change was framed as Today + Dates + shell. May be an improvement;
   his complaint about the old 312px was that it *"wastes the top third."* Unreviewed.
3. **The hairline.** Design-critic's test, better than an opinion: *scroll content under the Band
   and see whether the layering reads without it.* Band and page share `--canvas` with no
   elevation, so the 1px line is the only signal the fixed layer is separate.
4. **The reference wall.** Still the gate everything else was supposed to wait behind.

---

## Traps this session paid for

- **The vacuous-assertion pattern appeared four times in one afternoon**, from three agents and
  from the CEO's own brief wording: an assertion that passes when the thing it guards is absent.
  `if (seamIndex >= 0)` passes if the Seam vanishes. An `it()` with an empty body passes always
  and inflates the count. **Every structural assertion must be able to fail.**
- **A passing reviewer's stated rationale was itself the defect.** code-reviewer approved removing
  Today's `overflow-x-clip` because "the shores moved, so nothing overflows." The bleed was the
  photograph mount. Measured: `scrollWidth` **459 against a 393 viewport, 66px of horizontal
  scroll.** Only the adversary found it. *The adversary went looking for failure modes; the
  code-reviewer went looking for reasons it was fine.*
- **An empty reviewer return is not a PASS.** adversary-engineer returned nothing on its first
  run — 47 tool calls, no output — and was the only reviewer that found the P1.
- **Six agents went idle without delivering.** Ask directly; verify on disk, never from a report.
- **`no-client-secrets.test.ts` uses `it.skipIf` on `.next/static`.** On any unbuilt worktree the
  two tests proving no server secret reaches the client bundle **skip silently while the suite
  reports green.** Run `pnpm build` before `pnpm test`. Filed as debt: make it throw.
- **`tools/` needs its own `pnpm install`** — without it `cli-smoke` fails and the "1011 passing,
  2 skipped" baseline in the previous handoff is wrong. True baseline is **1013**.
- **`craft-reviewer` is not an invokable agent type.** Use `design-critic`.
- **Workers cannot authenticate. Never force it.** `/review/*` is on `PUBLIC_PREFIXES` under
  `NODE_ENV === "development"` and is the sanctioned way to see a screen without a session.

## Still parked, at his instruction

`SESSION_SECRET` rotation (time-sensitive — a valid token reached an agent log) · caption fix ·
three attributions · video schema (**three** migrations, not one: `photos.mime`,
`vault_items.mime`, the storage bucket) · the `people` migration · delete-still-serves-bytes ·
the empty `/img/` allowlist · **Eva's own credential** · **the five questions for Eva**.
