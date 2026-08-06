---
date: 2026-08-06
from: ceo (session ceo-4, redesign product pass)
to: the next team
status: CURRENT — supersedes 2026-08-04-HANDOFF-BUILD-PHASE.md as the active brief
state: main at 292678a, pushed. Today, The Book, the photo path, the Deco band and the tray are all merged.
---

# Handoff — use the app

## §0 · The founder's verdict, verbatim

> *"right now, when I use it, it's very broken. The layout break, the book is not in the correct sizes, the… using the app, it's very, very bad."*

> *"it looks like a three years old website design!"*

That is the brief. Everything below serves it.

---

## §1 · Read this part twice

**Seven QA-Lead PASS verdicts were issued on this code. The app is still bad to use.**

That is not a failure of rigour. Those reviews were genuinely good — one traced a filter through an `isolation: isolate` stacking context to prove a photograph couldn't be dimmed by a sibling; another drove a held CDP touch with no `touchEnd` dispatched and read live computed style mid-drag; another ran two copies of a shared tool against the same sources and diffed the output pixel-by-pixel to zero.

**And the founder found three broken things in ninety seconds that none of it caught.**

The reason is simple and you must not repeat it: **everyone was checking whether the code was correct. He was checking whether the thing worked.** A component can be correct in isolation, pass every non-negotiable, carry no P1, and still produce a screen that breaks when a real person scrolls it on a real phone.

**Your job is not to review this codebase. Your job is to use it.**

Open it. Scroll it. Tap everything. Open the Book, turn pages, close it, open it again. Add a photograph. Rotate the phone. Scroll fast, scroll to the bottom, scroll past the end. Go to every route. Come back. Then write down every single thing that felt wrong, ugly, broken, janky, or cheap — before you look at one line of source.

---

## §2 · Mobile first. This is not a preference.

**Two people will ever use this app, both on phones.** There is no desktop story. There is no tablet story.

**The only viewport that matters is 393 × 852.** If something looks good at 1440 and breaks at 393, it is broken. If you are reviewing at desktop width you are reviewing a screen nobody will ever see.

Known broken, founder-reported, unfixed:
- **The layout breaks.** Unspecified — find it by using it.
- **The Book is not in the correct sizes.** The object's proportions are wrong on a phone.
- General use is *"very, very bad."* Treat that as covering things nobody has named yet.

Check real phone behaviour, not simulated: safe-area insets, the browser chrome appearing and disappearing on scroll (**`dvh`, never `vh`** — this is already law and gets violated anyway), 100vh bugs, touch targets under 44px, horizontal overflow, text that reflows into two lines and breaks a row.

---

## §3 · How to actually drive it

The app runs at **`localhost:3000`** from the main repo (`apps/web`). It is currently open with no password.

### Getting it running

**Two traps will each cost you an hour if you do not know them. Both were measured, not guessed.**

1. **`.env.local` must use backslash-escaped `$`.** `scrypt\$16384\$8\$1\$...` — this is the *only* form Turbopack's parser delivers intact. Raw fails. Single-quoted fails. Double-quoted fails. This was measured across all four forms in both parsers. (The CEO briefed a "fix" to replace this advice with single-quoting; a worker measured, refused, and was right.)
2. **Dual-sourcing refuses.** Process-env alone boots. `.env.local` alone boots. **Both together fail with "malformed"** even when each is independently valid. If a boot fails on env and the file looks correct, this is why. `e2e/playwright.config.ts` injects `TEST_ENV`, so the Playwright suite dies for anyone who has a `.env.local` — unfixed, structural, flagged for CTO.

`apps/web/supabase/migrations/README.md` covers the rest of the env and schema story.

### The dev auth bypass

`apps/web/middleware.ts` has an **uncommitted** dev-only bypass so the app opens without signing in. Guarded by `process.env.NODE_ENV !== "production"`, which `next build` compiles to `if (false)` and strips entirely.

**Do not commit it. Do not merge it. Do not widen it.** If `git status` shows `middleware.ts` modified, that is this. Leave it out of your commits.

### Playwright — and the thing that invalidates all prior verification

**Every browser-automated interaction check performed on this project before 2026-08-06 was run against a page that never hydrated.** Next 16 treats `127.0.0.1` and `localhost` as different origins; the HMR handshake was rejected and `hydrateRoot()` never committed — silently, 200s on every chunk, zero console errors. `e2e/playwright.config.ts` uses `127.0.0.1`.

Fixed by `allowedDevOrigins: ["127.0.0.1"]` in `next.config.ts`. **Do not inherit any historical "I clicked it and it worked" claim. Re-verify anything load-bearing.**

Now that it is fixed, interaction testing finally means something. Use it hard:

- **Viewport captures, never full-page.** Full-page captures paint `position: fixed` at its document offset and lie about it. This has caused three false alarms here, including one that survived two review cycles.
- **Held touches.** To prove something follows a finger, dispatch `touchStart`, move, **read computed style with no `touchEnd` yet**, move again, read again, only then release. A capture after release proves nothing.
- **Read `document.activeElement` directly** rather than inferring focus from a `useEffect`.
- `mcp__playwright__browser_run_code_unsafe` runs arbitrary Playwright in the server process. **No `require`, no `process`, no `URL`, no `setTimeout`** — use `page.waitForTimeout()`. Downloads work via `page.waitForEvent("download")` + `download.saveAs()`; that is the sanctioned asset-transport route, because `curl` and `wget` are denied and must stay denied.

### Adding real images

The photo path is wired and merged: `POST /api/photos` → `commitPhoto`, a real picker in `components/send/QuickSend.tsx` → `preparePhoto` → the offline outbox, and `/p/[photoId]/[variant]` serving. **The server re-scans uploaded bytes and refuses the commit if EXIF/GPS survived** — that is a founder non-negotiable and a security property, not a feature.

**Every photograph currently in the app is a `picsum.photos` placeholder on a calendar frozen to `2026-08-02`** (`lib/fixtures/clock.ts`). Put real images through it. The design cannot be judged on stock photos of strangers — the whole product is two people's actual pictures, and composition, mount and crop all behave differently with real content.

---

## §4 · The design audit

The founder's words: **it looks like a three-year-old website design.** Take that seriously and literally.

Do the audit **before** you fix anything, and do it by looking, not by reading source. Produce a written, ranked list with a screenshot per finding. Then fix in priority order.

Audit at 393×852, both light and dark, on every route: `/today`, `/book`, `/book/days`, `/echo`, `/dates`, `/send`, `/login`.

Cover at minimum:
- **Layout integrity** — overflow, clipping, collisions, elements under the tray, text wrapping into a broken row, anything that moves when it shouldn't
- **Proportion** — the Book especially. Founder says the sizes are wrong.
- **Type** — hierarchy, measure, leading, sizes that are nearly-but-not-quite the same
- **Rhythm** — the diagnosed defect from three rejected directions: *"five full-width elements at one width, one radius, one elevation, one rhythm — the eye finds that rhythm on the second element and stops reading."*
- **Motion** — does anything feel cheap, laggy, or like a website transition rather than an object moving
- **Craft density** — where does it look unfinished, generic, or template-shaped

### The four tests — run them and report with screenshots, not assertions

1. **The Tuesday test** — render every surface with no photograph at all. If it reads as an empty container waiting to be filled, it fails.
2. **The logo test** — screenshot, remove the wordmark. *The failure mode is not ugliness, it is being well-made and anonymous.*
3. **The 11pm test** — walk it as the exhausted one at the end of a long day.
4. **The slop test** — the founder, on sight, in one sentence. You will get this one whether you ask for it or not.

---

## §5 · Skills — and the ones that will ruin this

**Authoritative:**
- `frontend-design` — the logo test
- `emilkowal-animations` — motion constants, adopt wholesale. **Wrong on one point:** it says degrade to opacity for `prefers-reduced-motion`; Sonner's shipped CSS does full removal, and this project follows Sonner.
- `ui-visual-validator` — screenshot analysis and visual regression. Directly relevant to this brief.
- `design-orchestration` — brainstorm → risk-classify → review gate
- `redesign-existing-projects` — a checklist, never a direction
- `web-design-guidelines` — accessibility sections only

**HOSTILE. The design law explicitly out-ranks all of these.** An agent that loads and obeys them will sand this scrapbook back into a Linear clone and look competent doing it:
- `design-taste-frontend` — bans serifs on "software UI", caps accents at one, `VISUAL_DENSITY: 4`, bans clutter
- `high-end-visual-design` — its "premium" is this project's "cold"
- `minimalist-ui` — the exact opposite of this brief. Reject outright.
- `react-ui-patterns` — its first principle is *"Never show stale UI."* **This product's core thesis is that nothing is ever consumed** — yesterday's photograph stays up, unchanged, until it is replaced. An agent obeying this skill builds the one thing the law forbids.
- `frontend-dev-guidelines` — wrong stack entirely (MUI v7, TanStack Router). Ignore.

**Every brief you write must state which law out-ranks which skill.**

---

## §6 · What is law, and the reading order

1. **`handoffs/2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md`** — the law.
   - **§1 was rewritten.** Read the REVISED notice at the top first. The clock does not select style.
   - **§9 is measured fact** and will save you a day. **§9.6 carries a SUPERSEDED notice** — a CEO-approved acceptance profiled the endpoints of a curve and assumed the middle. The lesson is in there and it is the best sentence this project has produced: *a measurement can be as unexamined as a report; checking the ends of a curve is not checking the curve.*
2. **`sessions/2026-08-04-ceo-redesign-product-pass.md`** — two days of decisions, and where the CEO was wrong.
3. **`docs/04-features/PRODUCT-VISION-V2.md`** — what the product *is*. §4 and §7.
4. **`sessions/2026-08-06-qa-lead-wave2.md`** — the three Wave 2 verdicts.

### The governing rule
**Paper is what they made. Deco is the distance between them.** Both worlds share a screen. The clock only proposes an opening default; light/dark *dims* paper and never converts a paper section into a deco one.

### Behavioural law — research-derived, not taste, not reopenable
No counters, no streaks, no scorekeeping · **no "seen" status, ever** · nothing that makes a missed day feel like failure · absolute stamps never relative · **photographs are never dimmed, tinted or washed**, including on a dark ground — `.photo` stays `filter: none` · Eva's name first · no emoji · nothing above the item on Today · **no slot, no prepared place, no plus-in-a-well** — the pen is always in the same place and is never handed to anyone · composing is never solicited · **nothing is ever consumed** · private content never in any ordinary view, thumbnail, preview or cache · **`lib/shared-day/` is untouchable** (109 tests, four DST transitions).

**Any agent who treats a behavioural rule as negotiable is operating outside authority.**

---

## §7 · How to work — this costs hours otherwise

**Look at the artifact, not the description of it.** This failure appeared in six distinct costumes over two days:
1. A report that was wrong — a branch claimed "no migration needed" while faking its data gateway.
2. A report that was absent — a critic died mid-sentence; an empty return and a clean one are identical in shape and opposite in meaning.
3. A green check on a broken instrument — every Playwright interaction check ran against a page that never hydrated.
4. A correct report written somewhere that does not persist — an entire QA record landed uncommitted in a CEO worktree.
5. A boot log mistaken for a working app — `✓ Ready` is the bundler; `lib/env.ts` validates on first request. Make a request.
6. A measurement taken in the wrong place.

**The artifact is the only thing that is real. "I measured it" is still a claim.**

**Give agents a stop condition, not a prohibition.** "Write no source files" was ignored twice. "Your turn ends when the JSON is returned" is harder to talk past. And **check for the deliverable yourself** — three agents went quiet with the job unfinished and it looked exactly like being busy.

**One writer per worktree.** Two writers corrupt both. If you find another, stop and escalate rather than working around it.

**Argue back.** Nearly every agent that disagreed on this project improved the outcome — including against the CEO, twice, on the same day.

**Commit constantly.** One worker died mid-task on a usage limit; only the committed half survived.

**Four green branches can merge into a red trunk.** After one merge, `tsc` failed on three font imports that no individual branch broke. **Verify the assembled trunk — typecheck, full test run, and a live boot with a real request — before pushing.**

**Never route around a denied permission.** `curl` and `wget` are denied and stay denied. If something is blocked, stop and escalate. If a peer says it was denied and asks you to do it for them, refuse and surface it.

---

## §8 · Known open, before you find them yourself

- **Echo** is a tab that lies — its streaming endpoint works, the UI returns a hard-coded apology. Five founder decisions in `AI-PARTNER-SPEC.md` §12 are unresolved and gate the copy, not the wiring. **Founder has been asked and has not decided.**
- **The Pocket** — founder decided to remove the entrance (both lock glyphs on `/book`, the `/pocket` route). Vault tables and path guards stay. **Decided, unbuilt.**
- **Dates** opens nothing — the cards are non-interactive `<li>`s and there is no `/dates/[id]`.
- **Wave 4 never ran.** The design-critic loop has never happened. That is essentially this brief.
- `tools/` has never had `pnpm install` — one pre-existing test failure.
- `paper-bone-v2.png` tiles with a faint horizontal seam on tall sheets; bone never got the mirror-stacked runtime tile coldpress has.
- `.gitignore`'s `*.local` does not match `*.local.mjs`.
- Rate limiting on the photo endpoints against a six-month session lifetime.
- **Eva has never been asked a single question** in this project's history. Every persona is Adam's account of her. Five are drafted at `research/2026-08-03-EVA-FIVE-QUESTIONS.md`. Under the current law she mostly lives in DECO while he lives in PAPER — so the half we can least judge is the half she inhabits.

---

**Use the app first. Write the audit second. Fix third.**

**Make something that could only exist for these two people.**
