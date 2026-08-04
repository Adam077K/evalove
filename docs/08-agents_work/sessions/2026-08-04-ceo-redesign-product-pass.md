---
date: 2026-08-04
role: ceo
task: redesign-product-pass
status: OPEN — Wave 2 in flight; Waves 3 and 4 queued
tier: full (four branches merged, incl. API + DB write path)
qa_verdict: PASS ×3 (today-scrapbook-deco, photo-path after one BLOCK cycle, toolchain)
merged: f5b6b21 → 0743775 on main, pushed
supersedes: nothing; continues 2026-08-04-ceo-stage-1-build.md
---

# CEO — the redesign, product pass

Founder asked to plan a redesign starting at the product rather than the paint — *"not just the UI, the things that we have in the app, the user journeys, what they have and how they use it."* The audit that followed reordered the work.

## The finding that reordered everything

**The app could not do the thing it exists to do.** There was no way to upload a photograph — no picker, no route, no screen. Every image was a `picsum.photos` placeholder on a calendar frozen to 2026-08-02. `/send`, `/echo` and `/pocket` were `setTimeout` theatre, each with an honest comment in its own source saying so. Meanwhile ~5,200 lines of tested machinery sat unreachable: the EXIF-stripping photo pipeline, the offline outbox, the entire AI margin.

The tell: `lib/outbox/transport.ts:148` posted to `POST /api/photos` — **an endpoint that did not exist.** The queue had been built against a contract nobody mounted.

Day zero of the documented user journey — *he leaves the coffee at 05:40* — was impossible in the shipped build. Everything downstream of it was fiction.

## Founder decisions

1. **Wire the photo path.** Deliberately breaks the "Stage 1 is UI only" rule, so screens get judged against real photographs.
2. **Keep four tabs.** Overrides Product Vision V2 §2.1. Derived consequence, not optional: a tab that opens nothing is worse than no tab, so Dates/Echo/Pocket must stop being theatre (Wave 3).
3. **New features deferred** — Begun, What the other one was doing, Tucked in, The index stay in ideation.
4. **Eva is not being asked.** Every Eva-side claim is an assumption, not a finding.
5. **Merge all four branches**, knowing toolchain's second opinion was still in flight. It returned PASS.
6. **Olive** for the Book cover — further from `--night-burgundy`, so the Book reads as its own object rather than an extension of the Deco palette.

## Merged

| Branch | Verdict |
|---|---|
| `feat/today-scrapbook-deco` | PASS, Full — three states, the seam, the Deco band, `SealedCard` revived |
| `feat/photo-path` | BLOCK → fixed → PASS, Full |
| `fix/toolchain` | PASS, Lite |
| `docs/migration-headers` | trivial |

## Rulings issued

- **A stop condition beats a prohibition**, and an orchestrator checking for the deliverable beats both. Three agents went quiet with the job unfinished today.
- **BLOCK remedies must be proportionate to the defect** — I argued this and lost, correctly. See below.
- **The two standing environment exemptions are void.** No future gate may cite the `sw.ts` build blocker or dev-hydration failure as accepted noise.

## Where I was wrong

**On the database.** My worker and I independently concluded the 11-migration schema had never been applied, stopped work, and raised an Irreversible-tier signature request. We trusted eleven `NEVER APPLIED` headers and `DECISIONS.md:164` over `REIMAGINE-BRIEF.md`, which said the database was live. The founder settled it in one line from his dashboard: the tables exist. **The one document we dismissed was the one that was right.**

The stop was still correct — being wrong in the other direction meant applying migrations to a live database — but the conclusion was wrong, and the tie-break should have been the world, not a weighing of documents.

**On the EXIF remedy.** I argued QA-Lead's BLOCK remedy was oversized and that renaming the column would do. QA-Lead's rebuttal: *"a column that honestly says 'unverified' flowing into an export pipeline that doesn't know to treat 'unverified' as 'don't ship' is the same leak with better paperwork."* It then found a third option neither of us had — reuse the existing, already-tested `findMetadataEvidence` server-side at commit time. Cheaper than both proposals and it actually closes the gap. I was optimising for branch velocity and mistook labelling the harm for removing it.

## The finding that reaches backwards

Next 16 treats `127.0.0.1` and `localhost` as different origins. The HMR handshake is rejected, `hydrateRoot()` never commits — silently, 200s on every chunk, no console error. **`e2e/playwright.config.ts`'s baseURL is `127.0.0.1`.**

Every browser-automated interaction check ever run on this project was performed against a page that never hydrated. Not one of those claims was ever true. Re-verify anything load-bearing; do not inherit it.

## Process notes

**The lesson took four forms in one day, and the through-line is that the artifact is the only thing that is real:**

1. *Don't trust the report* — a branch reported "no migration needed" while faking the DataGateway.
2. *Don't trust the absence of a report* — a design-critic died mid-sentence; an empty critic return and a clean one are identical in shape and opposite in meaning.
3. *Don't trust a green check whose instrument was broken* — see above.
4. *Don't trust that a correct report was written somewhere that persists* — QA-Lead wrote the entire quality record for four merged branches into a CEO worktree, uncommitted and untracked. Recovered at `0743775`. It had also appended to a pre-merge `DECISIONS.md`, so copying the file wholesale would have silently reverted another agent's entry.

**Four green branches can merge into a red trunk.** Post-merge `tsc` failed on three font imports — Wave 1 declared them in `package.json` but only installed them in its own worktree. Neither branch was broken alone. A per-branch gate cannot see this class of defect.

**Agents that argued back were right nearly every time.** The `wave1b` worker refused to write into a contested worktree and refused to build against a database it had evidence didn't exist — wrong on the conclusion, right to stop. QA-Lead held its BLOCK against the CEO and produced a better fix than either party proposed. The `fix-migration-headers` worker returned the dull, correct answer (the count was simply wrong) instead of constructing a story around a gap.

**Tooling gap found:** `technical-writer` has no Bash tool. Briefing it with a git worktree protocol wasted a round trip. My error, not its.

## Open

- Wave 2 (Book, olive) in flight · Wave 3 (four tabs) and Wave 4 (critic loop) queued
- **Not assessed:** design dimension on Today. The critic died; the seam-haze and doorway-clipping questions are live and belong to Wave 4.
- `tools/` has never had `pnpm install` run in it — one pre-existing test failure, trivial, separate package
- Rate limiting on the photo endpoints against a six-month session lifetime — filed as tech debt
- Eva has still never been asked a question
