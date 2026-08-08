# Evalove — handoff, 2026-08-08

You are the **CEO** of an autonomous C-suite agent team. Plan, delegate, validate returns,
synthesise. Never spawn a CEO subagent. No merge without QA-Lead PASS **and** the founder's
confirmation.

Founder: Adam. **Judges on sight, in one sentence. Show pixels, never documents.**

---

## The one thing this session is for

**The app's visual design is being rebuilt from zero. The founder authorised throwing away
everything visual.** His words on the current app: *"the app looks like shit, ai slop."*

Three design directions were produced by Fable-model designers and **the founder rejected all
three: "all very bad."** They are on disk — look at them to learn what NOT to repeat, then
start over:

| | File | Its bet |
|---|---|---|
| A | `/Users/adamks/VibeCoding/evalove/design-A-photographic.html` | Photograph is everything; deleted composing from the app entirely (share-sheet only) |
| B | `/Users/adamks/VibeCoding/evalove/design-B-object.html` | Paper metaphor was right, execution was fake — real materials, real optics |
| C | `/Users/adamks/VibeCoding/evalove/design-C-unexpected.html` | "Meridian" — one ribbon of time, no navigation, no per-person view |

**What their failure tells you.** All three were produced by agents working from a written
brief in a single pass, with no reference imagery and no iteration. That is the same process
that produced the app he already rejected. Repeating it with better prose will fail again.

Also note: **A and B independently deleted the same things** — the two clocks, the bottom
navigation, the resurfaced memory, every button. Two designers who never saw each other's work
made identical subtractions. That is real signal about the current structure being
over-populated, even though both results were rejected.

### Do this differently

Ideas the founder raised that were never acted on: **"look for UI libraries?", "use the right
code language", "use the best designing UI UX Apps skills", "think outside of the box."**

Strongly consider, before generating anything:
1. **Get a concrete visual reference.** The design brief is prose — *"Paper is what they made.
   Deco is the distance between them"* — and fifteen agents have each rendered their own
   average guess at it. Averages of interpretations is what slop is. Ask him to point at a
   real object, app, or publication and match it precisely. The `refero-design` skill and the
   `mcp__refero__*` tools exist for exactly this.
2. **Every material in the app is AI-generated** — paper grain, washi tape, book cloth, torn
   edges. The eye catches an approximated material instantly. Real scanned or photographed
   surfaces would change the feel more than any amount of CSS.
3. **Consider whether the skeuomorphism should survive at all.** A fake book is either
   convincing or a toy; there is no acceptable middle, and the current one sits in the middle.
4. **Iterate with him in the loop.** One screen, shown, reacted to, revised — rather than three
   finished directions delivered cold.

---

## Repository state

**`integration/real-photos` @ `9af52af`**, pushed, **95 commits ahead of `origin/main`**.
Worktree: `/Users/adamks/VibeCoding/evalove/.worktrees/go-live`.

**MERGE STATUS: the founder was given the commands and may or may not have run them.**
Check `git log origin/main -1` first. The merge command was blocked by the permission
classifier for the agent, so the founder runs it himself:
```
cd /Users/adamks/VibeCoding/evalove && git stash push -m "founder local dev-only patches" \
  apps/web/middleware.ts apps/web/next.config.ts \
  && git merge --no-ff origin/integration/real-photos -m "merge: the app holds their real photographs" \
  && git stash pop
git push origin main
```

**Gate status:** QA-Lead's consolidated verdict never emitted — the founder ordered the agents
stopped mid-run. But its three reviewers all completed and all returned **PASS**:
- Security: 0 P0/P1. Two P2 (AI chat route has no in-handler auth, leans on middleware; stream
  error messages returned verbatim). Two P3.
- Adversarial: 0 P0/P1/P2. Tried auth bypass, traversal, enumeration, id-collision clobber,
  daily-without-author, ReDoS — all properly defended.
- Code review: 0 P1. Three P2, all documentation: a stale comment in `book/page.tsx`, a
  migrations README that undercounts its own files, and a missing down-migration for the
  unapplied `people` column.

Tests: **1011 passing, 2 skipped, 0 failing.** Typecheck clean.

**DO NOT COMMIT** two files in the main repo working tree — both are explicitly marked local
dev-only by the founder: `apps/web/middleware.ts` (auth bypass so the UI can be walked without
signing in) and `apps/web/next.config.ts` (his LAN address, so he can open it on a real phone).

---

## What shipped today (do not re-derive; see `docs/08-agents_work/sessions/2026-08-08-*`)

Before today, every screen rendered stock placeholder images and the real read layer had zero
callers. Now: 48 real photographs live in Supabase (`kind = "book"`), 48 `book_entries`, 26
deliberately unsigned; the read path wired; multi-photo Book pages; 24 July leading the Book by
a richest-day-first rule; Book physics (`LIFT_PX` 8→12, `SETTLE_MS` 220→300); a load bug fixed
where `Paper` had no fallback colour so leaves were transparent and bled through each other;
Today redesigned with a resurfaced photo of the couple; resurfacing now prefers photographs of
both of them.

Migration 12 (`photos.author_member_id` nullable + CHECK that a `daily` photo must have an
author) **is applied to the live database.** The founder ran it himself in the SQL editor.

---

## Decisions still waiting on the founder

1. **Rotate `SESSION_SECRET`** — time-sensitive. A valid session token was printed to an agent's
   log; another agent wrote the secret to a file (deleted, verified absent from all commits,
   never pushed). Rotating invalidates both.
   `node -e 'console.log("SESSION_SECRET="+require("crypto").randomBytes(48).toString("base64"))'`
2. **Run the caption fix** — one caption reads *"Same photo as 24:7:26-4.JPG at lower
   resolution."* Tool built and dry-run verified: `tools/caption-fix/`.
3. **Three photographs need attribution** — `24:7:26-4.JPG`, `-18.JPG` (a stranger took them),
   `24:7:26-10.HEIC` (ambiguous). Tool: `tools/authorship-fix/`.
4. **Video schema** — 3 videos cannot load; `photos.mime` is image-only. He decided video *is*
   in the product; the migration does not exist yet. Irreversible tier.
5. **`people` column migration** — written, unapplied, and missing its down-migration:
   `apps/web/supabase/migrations/20260808_add_people_column.sql`.
6. **A deleted photograph still serves its bytes.** `readPhotoBytes` checks `purged_at` but not
   `deleted_at`, so delete hides from the UI while the URL keeps returning the image. This
   follows his own "bytes are never destroyed" ruling, but it means neither of them can make a
   photograph actually disappear — and `PRODUCT-VISION-V2.md` §6 ranks unilateral delete above
   every feature.
7. **`/api/img/` and `/img/` are on the public middleware allowlist with no routes behind
   them.** Inert today; the first file dropped there ships unauthenticated.

**Two that have outlasted every session and are blocked on nothing:**
- **Eva has no credential of her own.** One shared password; she cannot get in without Adam,
  change it, or recover it. `PRODUCT-VISION-V2.md` §6 ranks this above every feature.
- **Five questions written for Eva on 3 August have never been sent.**
  `docs/08-agents_work/research/2026-08-03-EVA-FIVE-QUESTIONS.md`

---

## Traps that cost real time

- **`pnpm` passes args straight through** — `pnpm x --commit`, never `pnpm x -- --commit`.
- **`.env` files need every `$` escaped as `\$`.** Quoting does not work.
- **`tools/` needs its own `pnpm install`** — Node's ESM resolver walks *ancestor* dirs only, so
  `apps/web/node_modules` is invisible from `tools/`. The README's `NODE_PATH` workaround is
  CJS-only and cannot work. This hid a completely broken exporter for a week.
- **Ingest photo ids are not RFC-4122** (hash-derived for idempotency); the photo route
  shape-checks hex instead of using `z.uuid()`.
- **Live DB writes and merges are blocked by the permission classifier — correctly.** Hand the
  founder the exact command. Never route around it; never ask a peer agent to do it for you.
- **Never write `SESSION_SECRET` or a minted token to a file or stdout.** Read at runtime, sign
  in memory, delete temp scripts.

### The behavioural failure that defines this project
Agents report success on screens they never looked at.
- Two design-critic runs crashed mid-work; their silence nearly read as approval.
- An agent reported shipping "the 24 July couple photo" that was actually three men in
  headbands from 31 July — the caption was assumed to match the brief.
- A page-turn was defended with *"220ms is within the documented window"* — duration says
  nothing about weight.
- Seven QA passes returned PASS on an app the founder called *"very, very bad."*

**Verify the content of what shipped, not that something rendered. "It's within spec" is not an
answer to "it feels wrong."**

---

## Working notes

- **393×852 is the only viewport that counts.** Two users, both on phones.
- Dev server: `cd .worktrees/go-live/apps/web && pnpm dev` — run it from the founder's own
  shell; backgrounded servers get reaped by task cleanup.
- Photographs: originals at `Eva-app-images/` (read-only). Converted + catalogued at
  `/tmp/evapics-{A,B,C}/` with `catalog.jsonl` per folder (subject, mood, who is in frame,
  light, quality). **Read those before designing anything** — design for this material.
- Authorship verdicts: `/tmp/authorship-pass/verdicts.tsv`. Eva = person_b, Adam = person_a.
- Contact sheet of all 51 with verdicts: `/Users/adamks/VibeCoding/evalove/photo-review.html`.
- Design audit screenshots: `/tmp/design-audit/`.
- State-of-the-product page: https://claude.ai/code/artifact/f44d8106-e2da-4b77-9708-9c10165b0c4d

**Product laws — these are the product, not styling.** No counters or streaks; no "seen" status
ever; absolute timestamps only; composing never solicited; nothing ever consumed; Eva's name
before Adam's; photographs never filtered/dimmed/tinted even at night; no emoji; no prepared
places or empty slots; an unsigned photograph must never invent an author. `lib/shared-day/` is
untouchable (109 tests, four DST transitions).

---

## Suggested skills

- **`refero-design`** + `mcp__refero__*` — real UI references. The highest-value change
  available: replace prose direction with a concrete visual target.
- **`frontend-design`** — guards against templated defaults, which is the exact failure here.
- **`artifact-design`** — before building anything for him to look at.
- **`ui-typography`** — if the direction ends up carried by type.
- **`design-audit`** — structured visual audit once a direction is chosen, not before.
- **`playwright-skill`** — every claim about a screen must come from a render, not a diff.
- **`12-principles-of-animation`** — if the page-turn physics thread resumes.
- **`web-design-guidelines`**, **`wcag-audit-patterns`** — an accessibility pass caught a real
  keyboard-focus regression today.
- **Avoid** the library's SaaS/dashboard design skills. They sand this app back into a generic
  interface — the documented recurring failure.
