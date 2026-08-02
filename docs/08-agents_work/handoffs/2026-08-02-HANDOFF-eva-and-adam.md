---
date: 2026-08-02
from: ceo (session ceo-ldr-activity-library / ceo-1-1785631504)
to: next CEO session
status: PLANNING COMPLETE — nothing built, one signature outstanding, one conflict unresolved
---

# HANDOFF — Eva & Adam

## Start here

You are the CEO. Read `.claude/agents/ceo.md`, `CLAUDE.md`, `.claude/memory/DECISIONS.md`, then this file. Set `/color gold` and `/name ceo-eva-adam-build`.

**Do not re-plan.** Planning is finished and the documents are good. Your job is (1) resolve the design conflict below, (2) get the schema signed, (3) spawn Wave 1.

---

## What this is

A private PWA for one couple. **Eva in New York, Adam in Israel**, 6–7 hours apart (7 most of the year; **6 for ~26 days** when the two countries change clocks on different dates). Adam works Sun–Thu, Eva Mon–Fri, so **Saturday is their only shared day off**.

It is a **book**: a page-turning photo book, a daily photo pair, and three hosted **dates**. Two users, forever. No growth, no monetization.

**Thesis:** *a private object that always knows what time it is in both cities — and because it knows, never asks them to browse, decide, or explain themselves.*

---

## The documents (all current, all on disk)

| Path | What |
|---|---|
| `docs/10-activity-library/` | 98 sourced dates + coverage matrix, contraindications, app compatibility, privacy notes, round-2 commissions, 179 sources |
| `docs/04-features/LDR-APP-PRD.md` | CPO. 60 ACs, phased roadmap, §3A dates, D1–D12 locked decisions |
| `docs/03-system-design/LDR-APP-ARCHITECTURE.md` | CTO v5. 19 tasks, 8 waves, schema, day model, vault, photo pipeline |
| `docs/04-features/LDR-APP-DESIGN-DIRECTION.md` | Design-Lead rev 5. **Engineering brief.** §11 capture specs, §12 spike |
| `docs/04-features/LDR-APP-COST-MODEL.md` | CBO v2. $0/month, verified prices |
| `docs/04-features/ideation/` | 3 creative lenses — dates, tenderness, platform capability |
| `.claude/memory/DECISIONS.md` | 8 entries. Read all of them before proposing anything |

**Read source documents directly. Do not trust summaries — including this one.** Design-Lead caught four things my summary lost, one of which falsified a sentence in its own doc.

---

## 🔴 UNRESOLVED — the design conflict. Handle this first.

The founder supplied an inspiration folder at:
`/Users/adamks/Downloads/Eva & Adam -app deisgn inspo` (5 `.webp` files)

**I looked at all five. Four contradict the locked design direction.**

| File | What it is | Verdict |
|---|---|---|
| `24199150…` | Events app — pink/lilac gradient, rounded cards, floating pill tab bar | ✗ contradicts |
| `6b2ad671…` | Family memories app — hot pink gradient, AI sparkle badges, pink CTAs | ✗ contradicts |
| `8d075fd5…` | **SORDJATI furniture site** — huge restrained display type, white ground, warm materials, editorial layout | ✓ **aligned** |
| `9e22d054…` | Lunara reading app — peach/cream, orange accent, serif headings, rounded cards | ~ book-themed, consumer register |
| `original-62c7…` | **Time Capsule app** — purple, white cards, calendar, voice waveform, emoji headings | ✗ visually · ✓ **conceptually** |

Design-Lead's locked direction (rev 5) is *"a well-made notebook, not a scrapbook — the interface never expresses emotion, only the content does."* Warm, tactile, two inks, paper, no ornament. **Four of five references are the opposite of that.**

The Time Capsule reference is worth separating out: **visually furthest, conceptually nearest.** Sealed things opened later *is* the "left for you" pattern the whole product is built around. Mine it for mechanics, not for looks.

**Do not silently pick a side.** Two readings, and only the founder can say which:
- **A.** Their taste has moved → rev 5 reopens, Design-Lead re-pitches against these references.
- **B.** It's a loose "things I liked" collection → rev 5 stands, references are mined for specific ideas.

My read, for what it's worth: the founder chose "warm and tactile — lean into the book" deliberately when offered three poles, and every subsequent decision (no counters, no gamification, silence on a missed day, the fore-edge instead of a streak number) is consistent with that and *inconsistent* with the four gradient references. But taste is theirs, not mine. **Ask.**

**This is what the founder-requested board meeting on design and style should open with.** It has not been convened yet — it was deliberately held until one coherent proposal existed, which now it does.

---

## Also outstanding

**§0.7 migration sign-off — the only thing blocking Wave 1.** The storage schema is Irreversible-tier; CTO built a founder sign-off gate. I presented the schema in plain language and the founder has not yet said "signed."

**The page-turn spike (§12) needs a human with an iPhone.** An agent can build the one static HTML file; **only Adam can run it and report.** The decisive test, callable by eye:
> Pull the last page as far as it goes, release, and watch the return. **Paper does not overshoot.**
The likelier failure is the opposite one — `overscroll-behavior` suppressing the give entirely, leaving a dead stop, which reads as a bug. If that happens the 25° damped corner lift goes back in.

**Never delivered by the founder:** the taste profile for the activity library. The re-rank hook is built; it is a one-flag re-run, not a re-research.

---

## Locked decisions — do not re-litigate

**Product:** Name is **"Eva & Adam" — her name first, everywhere**, including icon initials (E & A). English only, no RTL. One photo each per day, paired on a spread. Activities are hosted in-app and called **dates** — *activity*, *game*, *minigame* are retired product-wide, enforced by CI grep. Three Phase 1 dates: the story, twenty questions, the paired question.

**Tone — these are load-bearing, not preferences:**
- **No counters of any kind.** No countdown, no days-apart, no time-elapsed, no progress bars. The whole arithmetic register is cut.
- **The streak never breaks.** Counts days both were there; a missed day isn't counted. No flame, no decay, no "keep it up". **Total silence on a missed day** — a visible gap is a rebuke with extra steps. There is therefore **no calendar anywhere in the product.**
- **`failed`, `abandoned`, `expired` are banned from the codebase**, not just the UI. A date that stops is `faded`.
- **Notification rule:** *the subject of every notification is the other person. If the subject is "you," it doesn't ship.*

**Technical:** PWA, no app store. Shared password + **separate vault passphrase**. Frankfurt `eu-central-1` (irreversible, EU jurisdiction). Cloudflare R2 **Standard class** mirror (not Infrequent Access — retrieval fees would void the free-restore property). Platform encryption at rest, not E2E. iPhone 14+, **iOS 26 both** — native `animation-timeline` page turn, **no JS implementation**. ~300 photo backlog → $0/month for ~38 months.

**The day model (D12, closed after three rounds):** dailies stamp by **the poster's own local date**. Decided by one test — *can a photo ever land on a day that is already complete?* Never under this rule; every morning of Adam's life under the rejected 08:00Z anchor. CTO measured the two models diverging on **44.1% of Adam's posts and 15.2% of Eva's, every day**, silently and with no error. Enforced by AC-13d. **A concrete counterexample with timestamps reopens this. Nothing else does.**

---

## Standing rules that earned their place

- **Three mechanisms look like they need a scheduled job and none do** — the day count, the date fade, pair completion. All pure functions of rows + `now()`. If an implementation grows a background worker for any, something was misread. (A backgrounded iOS PWA is *off, not asleep* — client-side scheduled work doesn't exist here.)
- **"Is a single turn worth waiting seven hours for?"** — standing criterion for anything proposed for hosting. Turn-based ≠ async-friendly.
- **The T5 protocols are never hosted async** — 36 Questions, Imago, Hold Me Tight, Dreams Within Conflict are contraindicated *by truncation*. Hosting them converts their mechanic into their documented failure mode. Enforced as `hostable: false` at build time.
- **Don't rebuild mature third-party apps.** Correspondence chess exists and is excellent. Link, never rebuild.
- **Verify the property the rule depends on, not the most measurable adjacent quantity.** (CPO withdrew a correct model because it measured span variance instead of the stamping rule.)
- **Surface judgment calls, don't bury them.** Three agents did this — CBO on spawning a helper, T7 on an exhausted search budget, Design-Lead on a chronology error I'd stated twice. Every one of them saved real work.

---

## Known limitations — state them, don't rediscover them

- **Neither password identifies who is acting.** Attribution is self-declared; the audit trail says "someone with the passphrase," not "Eva." Phase 2 real accounts is the structural fix.
- **No haptics.** iOS Safari has no Vibration API, installed or not. A quiet paper sound substitutes.
- **No Web Share Target on Safari.** Eva cannot share a photo from Photos into the app. **One tap from launch to the picker is therefore a hard requirement.**
- **HDR gain maps are lost** in the canvas re-encode. Photos read slightly flatter than in Photos.app. Accepted.
- **No first-person community sources in the research.** reddit.com was tool-level blocked for the entire session — confirmed independently by four threads. Everything is sourced to documentation, rulebooks, and papers. 9 of 98 entries are `plausible-unverified` and segregated; never rank them alongside verified ones.
- **Prompt injection was attempted twice** in fetched vendor pages — fake `system-reminder` blocks with MCP instructions. Both detected, ignored, reported. Expect more; agents flagged rather than followed them.

---

## Wave plan (CTO v5) — spawn from this after sign-off

```
Wave 0  founder    §0.7 migration sign-off        ← ONLY BLOCKER
Wave 1  (2)  T1 · T0                              ← T0 = 30min device test, no code
Wave 2  (4)  T2 · T4 · T6 · T7-UI
Wave 3  (4)  T1b · T3 · T8 · T7-API
Wave 4  (1)  T5
Wave 5  (5)  T11 · T13 · T10 · T14a · T14b
Wave 6  (3)  T9 · T15 · T16
Wave 7  (1)  T12  →  QA-Lead
```
Critical path **T1→T2→T3→T5→T14a→T15→T12**. T13 (vault) is off it. Overall tier **Full**; T2 and T5 **Irreversible**; AC-24→AC-32 **non-waivable** — QA-Lead BLOCKs on any failure regardless of tier, and **the CEO cannot override**.

**T0 is in Wave 1 deliberately** — it answers whether audio survives backgrounding in an installed PWA, which gates a whole category. 30 minutes on a real device.

---

## Suggested first message to the founder

> Picking up Eva & Adam. Planning is complete and nothing has been built.
>
> One thing needs you before anything else: **your inspiration folder mostly contradicts the design direction the team locked.** Four of the five references are gradient consumer-app concepts; the design brief is a warm, restrained, tactile book. One reference (the furniture site) matches it exactly.
>
> Do you want the design direction reopened against these references, or do they stand as a loose collection to mine for ideas?
>
> After that: the storage schema needs your sign-off — it's irreversible once the migration runs — and then Wave 1 starts.
