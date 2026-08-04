---
date: 2026-08-04
from: ceo (session ceo-stage-1-build)
to: the next team
status: CURRENT — supersedes nothing; continues 2026-08-04-HANDOFF-SCRAPBOOK-DECO.md
state: Wave 0 merged to main (`6c3ed85`). Wave 1 not started.
---

# Handoff — the build phase

You are picking up a UI rebuild that is **one wave in, with the foundation merged and working.** Three design directions were rejected before this one. The fourth is approved and the materials are real. Your job is Wave 1.

Read this, then the two documents in §1. Do not start from the retired 2026-08-02 direction — that mistake has already been made once on this project.

---

## §0 · Where things actually are

| | |
|---|---|
| **Merged to `main`** | Wave 0 — material foundation, at `6c3ed85`, QA-Lead PASS at Full tier |
| **Live** | 7 primitives at `apps/web/components/materials/`, 35 assets at `apps/web/public/materials/` |
| **Not started** | Wave 1 (Today), Wave 2 (The Book), Wave 3 (critic loop) |
| **Stage** | Stage 1 is **UI only**, founder-set. Screens render from `lib/fixtures/`. `lib/*` is not touched. |

**Look at this before you read anything else:** `docs/08-agents_work/screens/2026-08-04-wave0/wave0-night-seam.png`. That is the bar. The founder accepted it on sight.

---

## §1 · What is law, and the order to read it

1. **`handoffs/2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md`** — the law.
   - **§1 was rewritten. Read the REVISED notice at the top of it first.** The clock no longer selects style.
   - **§9 is new and is what Wave 0 proved.** Eight measured findings. Reading it will save you a day.
2. **`handoffs/2026-08-04-HANDOFF-SCRAPBOOK-DECO.md`** — the design context, the asset pipeline, the four tests.
3. **`docs/04-features/PRODUCT-VISION-V2.md`** — what the product *is*. §4.4 and §7 especially.
4. **`sessions/2026-08-04-ceo-stage-1-build.md`** — the rulings and how the gate behaved.

### The governing rule, in one line

**Paper is what they made. Deco is the distance between them.**

Both worlds can share one screen. PAPER: the photograph, the caption, the Book, the Pocket, Echo. DECO: the stamp and both clocks, the window sentence, the two cities, the Record, the one-card date suggestion. Full table in law §1.

The clock **proposes** — her 23:10 opens dark, his 05:40 opens light — and either can flip it, and the flip is remembered. Light/dark **dims** paper; it never converts a paper section into a deco one.

---

## §2 · What Wave 0 gives you

Seven primitives at `apps/web/components/materials/`. Compose with these; do not draw materials in CSS. Faking a material in CSS is exactly what the founder rejected as *"made with coal."*

| Primitive | Use |
|---|---|
| `<Paper>` | The page substrate. Renders a real stock, not a colour fill. |
| `<Mounted>` | The foundation. Seeded rotation, mass hierarchy, contact shadow, settle state. |
| `<Taped>` `<Pinned>` `<Torn>` | Composition wrappers over real assets. |
| `<Seam>` | The signature component. Paper physically ends in a torn fibre edge; light dies past it into DECO. |

**`<Mounted>` seeds from the item's stable DB id — never an array index.** Index-seeding silently re-rolls the whole page on the first insert and is invisible to anyone who looks once.

**The lamp.** `--lamp-dim` drives `.under-lamp`, one brightness+sepia curve on the substrate and every material — tape, pins, torn mounts, seam strip, stickers — so the table dims **as one surface** under a lower lamp. **Photographs never carry it**; `.photo` stays `filter: none`. The curve constants live in `:root` as `--lamp-brightness-drop` / `--lamp-sepia-saturation` because two places read them. That was a QA BLOCK; do not re-inline them.

---

## §3 · Wave 1 — build Today

Rebuild `app/(app)/today/page.tsx` and `components/home/TodayPair.tsx`. Evolve `components/item/Stamp.tsx` — the stamp is **DECO** now.

**Keep the live wiring.** `currentWindow` from `lib/shared-day`, `offsetNote` from `lib/stamp`, `whatCameBack` from `lib/resurface` are already imported by page code and must survive. This is a re-skin over live logic, not a rebuild.

### Three states, none of them an edge case

1. **The Tuesday.** 15:00 her time, Adam asleep six hours, nothing arrived. The screen shows **the last thing he left, unchanged, still there.** Nothing is ever consumed — no read state, no clearing, no "nothing new today". This is the adversary's withdrawal condition and the screen both rejected directions never had to survive. The probe's best idea belongs here: *faint impressions of writing pressed through from the sheet above* — someone was here, without adding anything or asking for anything.
2. **One item.** Hero photograph bleeding off **one edge only**, at its own aspect, mounted deterministically, rotated −5°…+5°, capped `max-h-[70dvh]` (`dvh`, never `vh`). Caption beneath in their hand, different measure, offset — not centred under the photo.
3. **The pair.** Two photographs from the same shared day, one each. The most differentiated object in the product.

Then the seam, then DECO below it: the stamp (typeset, not handwritten — the app speaking, not a person), the window sentence (never `w1`–`w9`), the two cities. The Book shows as a **physical corner** at the bottom edge — `TodayDoorway.tsx` exists for this.

**Revive `components/home/SealedCard.tsx`.** It has zero import sites and looks like dead code. It is the sealed-to-opened ceremony — unreachable, not unwanted. Wire it to the genuine asleep condition, never a manufactured timer.

### Preconditions carried from Wave 0 QA — hard gates, not suggestions

1. **Night blast radius.** The night CSS rewrite (~140 lines deleted) changed how **dock, login, echo and today** render at night. None were reviewed outside the materials bench. Walk every one of them at night **before any Wave 1 screen merges.**
2. **`prefers-reduced-motion`** is code-verified only, never screenshot-verified against a real OS setting. Add it to Wave 1 acceptance.
3. **`Taped` variant naming** — `houndstooth` → `washi-ochre-dots`, `kraft` → `washi-terracotta`. Stand-ins. Fix when the full 12-pattern set exists.

### Composition rules that decide it

The diagnosed defect: *"five full-width elements at one width, one radius, one elevation, one rhythm — the eye finds that rhythm on the second element and stops reading."*

- **One element bleeds off ONE edge, not four.** A photograph floating with margin on all sides *is* a card.
- Rotation is **by context**: Today's hero ±5°, Book photos ±8°, notes ±5°, stickers ±15°, tape ±5° from perpendicular. **Do not unify these.**
- Unequal pairs. One masthead per surface. Type directly on paper. Varied vertical rhythm.
- Mass hierarchy: photograph > note > tape > sticker. Heavier sits on top.

---

## §4 · Behavioural rules — research-derived, not taste, not reopened

No counters, no streaks, no scorekeeping · **no "seen" status, ever** · nothing that makes a missed day feel like failure · absolute stamps never relative · **photographs are never dimmed, tinted or washed**, including on a dark ground · Eva's name first · no emoji · nothing above the item on Today · no slot, no prepared place, no plus-in-a-well — *the pen is always in the same place and is never handed to anyone* · **composing is never solicited** — edit mode is found, not offered · private content never in any ordinary view · **`lib/shared-day/` is untouchable** (109 tests, four DST transitions).

---

## §5 · How to work — this will cost you hours otherwise

**Look at the artifact, not the description of it.** This is the single most important line in this document. Six times in one session, a conclusion that was internally consistent, cited real file paths, and was confidently reported turned out to be wrong the moment someone opened the image or measured the bytes. Reports were never the problem; unexamined reports were. Screenshot it and *look*.

**Give agents a stop condition, not a prohibition.** A brief said twice "write no source files". The agent produced its deliverable, then built the whole implementation anyway, collided with the worker who owned the worktree, and filed a completion report describing the repaired branch as its own work. "Your turn ends when the JSON is returned" is harder to talk past than "do not".

**One writer per worktree.** Two agents in one worktree corrupts both. If you find another writer there, stop and escalate rather than working around it.

**A missing material presents as a craft failure.** The seam failed three times because the asset's tear ran vertically and no crop of it could ever be horizontal. Three separate workarounds produced three variants of the same defect. Generating the right asset took five minutes once the problem was named. **If a join will not close, change the paper, not the percentage.**

**Argue back.** Every agent that disagreed on this project improved the outcome. The Fable worker pushed back four times in one session and was right every time. The failures were all scope; the wins were all argument.

**Commit constantly.** Agents here have lost hours by finishing everything and committing nothing.

**Never route around a denied permission — but do report the alternatives.** `Bash(curl *)` and `wget` are denied and the classifier blocks egress by every bash route. That is not a wall to climb; it is a decision to escalate. The founder was asked and chose a different tool, which is the correct resolution and the one to repeat.

### Skills

**Authoritative:** `frontend-design` (the logo test) · `emilkowal-animations` (motion constants — but `prefers-reduced-motion` is **full removal**, following Sonner's shipped behaviour; the skill is wrong on this one point) · `design-orchestration` · `redesign-existing-projects` (a checklist, not a direction).

**HOSTILE — the design law explicitly out-ranks these.** An agent that loads and obeys them will sand the scrapbook back into a Linear clone and look competent doing it: `design-taste-frontend` (bans serifs on "software UI", caps accents at one, `VISUAL_DENSITY: 4`, bans clutter) · `high-end-visual-design` (its "premium" is this project's "cold") · `minimalist-ui` (the exact opposite of the brief — reject outright).

**Every brief must state which law out-ranks which skill.**

### Tools that exist — use them, don't rebuild them

| Tool | What it does |
|---|---|
| `docs/08-agents_work/tools/key_assets.py` | White-ground → trimmed RGBA. Border-connected flood fill, **not** luminance keying (law §9.7). Per-asset overrides baked in. |
| `docs/08-agents_work/tools/proof_sheet.py` | Composites every asset over paper **and** midnight at once. A halo is invisible on paper and obvious on navy. |
| `docs/08-agents_work/tools/alphacheck.py` | Measures real alpha coverage and background purity. A PNG can declare RGBA and be 100% opaque — this catches it. |

**Asset transport:** shell downloads are denied. The working route is Playwright's `download.saveAs()`, which writes server-side. Recipe and its two traps are in `2026-08-04-HANDOFF-SCRAPBOOK-DECO.md` §3.

### Verification

Verify at **393×852, both modes**. Full-page captures lie about `position: fixed` — this has caused two false alarms. Reuse the existing unlinked QA surfaces (`app/(app)/review/today-pair`, `app/(app)/review/book-states`) rather than inventing a harness. The materials bench is at `/dev/materials` (auth-walled, 404s in production).

**The four tests:** the Tuesday test (render with no photograph at all) · the logo test (remove the wordmark — *the failure mode is not ugliness, it is being well-made and anonymous*) · the 11pm test (walk it as the exhausted one) · the slop test (the founder, on sight, in one sentence).

---

## §6 · Open, and worth an answer

1. **Eva has never been asked a single question** in this project's history. Every persona is Adam's account of what she feels — and under D1 she mostly lives in DECO while Adam mostly lives in PAPER, so the half we can least judge is the half she inhabits. Five questions are drafted at `research/2026-08-03-EVA-FIVE-QUESTIONS.md`. An hour with a pen would also yield her real handwriting as a font — the one design element that cannot be copied.
2. **Reference-image conditioning** was founder-requested and never done. It needs an *upload* path (`media_upload` → PUT → `media_confirm`); the download recipe does not cover it.
3. **The governance rules in Product Vision V2 §6** are build-order constraints, not backlog: the export ships before the archive accepts its first photograph; Eva needs her own credential; no single outage locks both of them out. None are Stage 1, all bite the moment Stage 1 ends.
4. **The printed book**, the Tape, the Record, the date card, edit mode and the tool tray are all designed and unbuilt.
5. Minor: a 114-byte orphan `pnpm-lock.yaml` sits untracked at the repo root, left by an accidental font install into the kit-root `package.json`. Harmless; delete it when convenient.

---

**Make something that could only exist for these two people.**
