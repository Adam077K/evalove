# The LDR App — Product Requirements
*Owner: CPO · Date: 2026-08-02 · Status: READY FOR CTO — all founder questions answered*
*The product is **Eva & Adam**. Eva is in New York; Adam is in Israel.*
*Copy is third person and uses their real names. Eva before Adam, everywhere.*

---

## 0. Founder decisions — locked 2026-08-02

Do not re-open these. Escalate to CEO if a build constraint appears to conflict.

| # | Decision | Consequence |
|---|---|---|
| **D1** | **The app holds genuinely private content** — intimate photos and voice notes. | Storage is encrypted at rest, media served only via short-lived signed URLs, EXIF stripped on upload, a real deletion path. QA risk tier rises to **Full** (Irreversible for the storage migration). See §9 AC-24→AC-32 and §11. |
| **D2** | **No countdown, and no counter that points at a date.** No days-until-we're-together, no days-apart, no days-since-we-met, no time-elapsed anything. | The entire arithmetic-of-separation register is out — not just the one feature. A counter with no end in sight lands as pressure, not comfort. Now a non-goal (§10). The *accumulating* register survives via the shared-day count (D3), which points at what they've built, not at what they're waiting for. |
| **D3** | **The count never breaks. It only counts up.** Days both showed up are counted; a missed day simply isn't. No reset, no grace-day accounting, no decay, no rebuke. | "Streak" is now the wrong word — it's a count. Design-Lead names it. Grace days (C31) are deleted, not deferred. Copy rules in §5. |
| **D4** | **Real names, not second person.** | Superseded in detail by D5. |
| **D5** | **The product is "Eva & Adam"** — a title page, not a brand. Eva is in New York; Adam is in Israel. | Placeholders retired; write real strings. **Ordering rule: Eva before Adam, everywhere, no exceptions — if a sentence scans better the other way, rewrite the sentence.** See the copy consequence below, which removes a whole class of work. **No Eden or garden theming, at all** — they are two people named Eva and Adam, and the founder chose their names, not a myth. Anyone reaching for a rib, an apple, a serpent, or a garden is off-spec. |
| **D6** | **One photo each, shown as a pair on a spread.** | The **half-pair** — one posted, one not — is a first-class state, visible for hours every day. Specced in §5. It must read as anticipation, never absence. |
| **D7** | **English only.** | No Hebrew content, no RTL, no bilingual mode, no locale switcher, no translation layer. Not deferred — out. §10. |

### The copy consequence of D5, worth stating on its own

Third person for both of them means **one canonical string, no per-viewer variants**: *"Eva's in bed, Adam's awake."* The same sentence is correct whoever is holding the phone. A second-person product would have needed two versions of every string plus a notion of who is reading — that work now doesn't exist. It also happens to fit the object: a book narrates; it doesn't say "you."

| **D8** | **Photos live on two iPhone camera rolls.** No shared album, no export, nothing to integrate with. | **No import.** Native iOS multi-select; Eva and Adam each seed their own half by hand. Seeding is a Phase 1 *screen* with designed states, not a background job — and the **one-half-seeded** state is first-class (§4, AC-42→AC-44). |
| **D9** | **The private path is separate at the data layer**, not a boolean column every query must remember to filter. | CEO's constraint on D1. A `WHERE NOT private` that someone forgets once is exactly the bug the requirement exists to prevent. |
| **D10** | **The app hosts the activities — you tap and play.** It stops pointing and starts hosting. | Pillar 1 is redefined, not extended. §3A. Real scope; §8 re-cut to pay for it. Cut and order of sacrifice approved by CEO 2026-08-02. |
| **D12** | **Dailies stamp by the poster's own local date.** CEO's third and final ruling; the 08:00Z anchor is a recorded rejected alternative. | Closed. Re-opens only on a concrete case, with timestamps, where per-person stamping lands a photo on a completed day. The deciding test and the full rationale are in §5. |
| **D11** | **They are called "dates."** Never games, never minigames, never activities. | Governing metaphor, not a label: an occasion with a beginning and an end · **unscored by definition**, which retires gamification at the metaphor level · can unfold across a day, which makes async intentional rather than compensatory · leaves something behind in the book. |

**Nothing is outstanding.** Every question that changes the build has an answer.

---

## 1. Product thesis

Two people are awake at the same time for a few hours a day, on different dates, with one shared day off a week. Every app they could use assumes a shared evening and a shared calendar day, and each one quietly breaks in the same place. **This is a private object the two of them own that always knows what time it is in both cities — and because it knows, it never asks them to browse, decide, or explain themselves.** It does exactly three things: it answers *what should we do right now* with one suggestion that fits the actual hour and the actual energy of both people; it collects a picture of each of their ordinary days so they see each other's real life, not the highlights; and it binds all of it into a book with pages that turn, which fills up on its own and gets better the longer they keep it. The gap is not a problem the product works around. The gap is the delivery mechanism: one of them is always awake to leave something the other will find.

**And it is entirely present-tense.** It never counts down to a reunion and never counts up the days apart — it says what is true right now in both cities, and it accumulates what the two of them have actually done. Nothing in it points at a date neither of them controls.

---

## 2. The clock — the fact the whole product rests on

Everything downstream depends on getting this right, so it is stated once here, precisely.

| | Israel | New York |
|---|---|---|
| IANA zone | `Asia/Jerusalem` | `America/New_York` |
| Work week | Sun–Thu | Mon–Fri |
| Shared day off | Saturday only | Saturday only |

**The gap is 7 hours for ~339 days a year and 6 hours for ~26.** Israel and the US change clocks on different dates. Verified against tzdata:

| Period | Gap |
|---|---|
| 2026-01-01 → 2026-03-08 | 7h |
| **2026-03-08 → 2026-03-27** | **6h** |
| 2026-03-27 → 2026-10-25 | 7h |
| **2026-10-25 → 2026-11-01** | **6h** |
| 2026-11-01 → 2027-03-14 | 7h |

During those two stretches **every window boundary in the library shifts by an hour.** A hardcoded 7-hour offset is wrong for about a month a year, and it is wrong in exactly the weeks when a wrong answer is most confusing ("why is it saying Eva's asleep?"). All window computation derives from the two IANA zones at the current instant. Never from a stored offset. *(This is a WHAT requirement, not a HOW instruction — CTO owns the implementation.)*

**The nine windows** come from `docs/10-activity-library/library.json` → `windows[]`; eight are confirmed against real behaviour, w2 is opportunistic. The `w1`…`w9` codes are internal identifiers and must never appear in the UI. These are the product strings, with D5's ordering applied — **use them verbatim**:

| id | Product string | Character |
|---|---|---|
| w1 | **Eva's in bed, Adam's awake** | Their biggest window, 31 activities. Eva's sleepy and lying down; Adam's fresh. |
| w2 | **Eva's up early** | Opportunistic, mostly weekends. Never plan around it. |
| w3 | **Eva's commute** | Hands busy, headphones in, no screen. |
| w4 | **Eva's lunch break** | Hard stop, may be in public. Second-densest window at 36. |
| w5 | **Eva's just off work, Adam's fading** | Eva's energised, Adam's spent. Adam should be the passive one. |
| w6 | **Worth staying up for** | Their own phrase — keep it exactly. Costs Adam a night's sleep; event-grade only. |
| w7 | **Saturday — Eva and Adam both off** | The only symmetric window. Carries 20 of the 24 both-alert activities. |
| w8 | **Eva's at work, Adam's day is free** | Ambient, low-commitment, resumable. |
| w9 | **Eva's day is free, Adam's at work** | The mirror of w8. |

---

## 3. Pillar 1 — Dates: the browser that is not a browser, and the app that hosts them

### The problem, in the founder's words
> *"They open this mid-call; browsing a list is a failure state."*

98 activities is a research asset and a product liability. Scrolling a list on a video call is the moment the app becomes homework. The library already carries everything needed to avoid that: `window_fit`, `energy_symmetry`, `duration_min`, `screen_free`, `tools_needed`, `intimacy_level`, `tier`, `verification_tier`, and a contraindication table that says which windows are actively *wrong* for which conversation.

### The mechanic: one card, zero taps

The app opens on **a single suggestion**, already correct for this minute. Not a list, not a filter bar, not a category grid. The card carries: the window in their own words ("Eva's in bed, Adam's awake"), the activity name, its one-liner, the `how_it_works` steps in a form one of them can read aloud on the call, the duration, and what you need. Two actions: **we're doing this** and **something else**. One quiet third: **not this one** (snoozes it for a month).

Selection rules (WHAT the engine must respect — CTO owns the how):

**Hard filters, in order.** Current window ∈ `window_fit` · window not in that activity's contraindication list · if W3 then `screen_free: true` · `duration_min` ≤ time remaining in the window · if the other partner is asleep, only asynchronous / leave-behind items · nothing with a `cost` the couple hasn't marked as owned.

**Ranking.** Tier S > A > B, then `score`, then: boost `novelty_curve: ritual` items they have already done together, penalize anything done in the last 14 days, then shuffle within the top 3 so the same card doesn't greet them every Tuesday.

**Honesty rule (locked decision, 2026-08-02).** The 9 `plausible-unverified` entries are never presented as equivalent to the 89 verified ones. They may appear in the primary slot, but only carrying their label — "no track record, try it and tell me" — and never more than about one in ten.

**Tier warning.** Tier is a *fits-your-week* score, not a *you'll like this* score; the taste profile was never collected. The card must not imply "best." Phase 2 collects taste passively and re-ranks (§7).

**Graceful degradation.** If filters empty, widen in a fixed order: relax duration → relax tier floor → relax window → last resort, offer an asynchronous leave-behind instead of a live activity. There is no dead end and there is never a "no results" screen.

**Browsing still exists, demoted.** A second-level view of the shelves, named in their own language exactly as the library names them — *Zero setup, right now* · *One of us can't look at a screen* · *We need to talk about something real* · *Fifteen minutes* · *Three hours*, plus the nine window shelves. Never "W4." (Locked: DECISIONS.md 2026-08-02, "the site's primary navigation should be the shelves, phrased in the couple's own language, not window codes.")

---

## 3A. Dates (D10) — the app stops pointing and starts hosting

### The reframe, and why it does more work than a rename

Everything the app offers is a **date**. Not an activity, not a game, never a minigame. Four properties follow, and each one closes a decision that would otherwise have to be re-argued:

- **A date is an occasion, not a diversion.** It has a beginning and an end, and it is remembered.
- **You don't score a date.** This retires gamification at the level of the metaphor rather than as a rule someone has to remember at 2am. There is no score to add because scoring a date is a category error.
- **A date can unfold across a day.** This is the unlock. An async turn-based thing sounds like a stalled game; it reads perfectly as *a date that lasted all day*. Adam takes his turn at 5am, Eva answers at 11pm. The research already found async is the best structural fit for this couple — the reframe makes it feel intentional rather than compensatory.
- **A date leaves something behind.** A finished date can write a page into the book.

**Some dates the app hosts; some it hands over and gets out of the way.** Cooking the same recipe in two kitchens is a date. Twenty questions is a date. That one lives in the app and one lives in the world is a fact about where the date happens, not a property they have to learn. See §3A.5 on why the card doesn't teach the difference.

### 3A.1 The filter — which dates the app hosts

All three tests must pass. They are ordered by how much they cut.

**Test 1 — Is a single turn worth waiting seven hours for? (PERMANENT RULE)**
Turn-based is not the same as async-friendly, and conflating the two is the mistake this product is most likely to make. Ghost's turn is *one letter*; waiting seven hours for a letter is agony, and the game's whole pleasure is the rally. Fortunately/Unfortunately's turn is a sentence that changes the story — worth waking up to. This test cuts hardest and it is the one that isn't obvious.

> **Established as a standing criterion by CEO, 2026-08-02.** Apply it to anything ever proposed for hosting, in any phase, by anyone. A date whose individual turn isn't worth a seven-hour wait does not get hosted — it gets handed over to be played live, which is where it will be good.

**Test 2 — Does hosting add something a text thread doesn't have?**
There must be shared state someone has to hold: a secret, a question count, a story so far, a hidden answer. If iMessage already does it fine, hosting is reimplementation, not building.

**Test 3 — Does it leave a page?**
A finished date should produce an artifact worth keeping. If the residue is nothing, it was a diversion, not a date.

**And a negative test — is it synchronous by design?**
The T5 protocols (36 Questions full run, full Imago, Hold Me Tight, Dreams Within Conflict) are **contraindicated when truncated** — `WINDOW-CONTRAINDICATIONS.md` is explicit that stopping mid-protocol leaves the more exposed partner with no landing, and that this is worse than never starting. **Hosting them as async dates would convert their core mechanic into their documented failure mode.** They are never hosted async. Guiding them *live* is a legitimate future build and a completely different one.

### 3A.2 The Phase 1 three — chosen as one shape, not as three favourites

The ruthless cut isn't "the three best dates." It's **three dates that share one interaction shape**, so the second and third cost a fraction of the first:

> **The shape:** alternating turns of short text · no timer · resumable indefinitely · ends with a page.

| # | Date | Library id | Why it's in |
|---|---|---|---|
| 1 | **The story** — Fortunately / Unfortunately | `t4-fortunately-unfortunately` | Alternating sentences build one continuous story. **Best artifact in the library — the finished story *is* the page.** Most improved by hosting: in a text thread the story is buried; in the app it's a growing object you read from the top. Tagged `best_when_one_is_sleepy`, windows w1/w3 — async-native. |
| 2 | **Twenty questions** | `t4-twenty-questions` | Asymmetric roles — one holds a secret, one spends questions — which is the library's dominant shape (60 of 98). Genuinely needs a neutral holder: the secret and the count can't sit in either head without spoiling it. Artifact: the question trail, which is funny to reread. Four windows (w1/w3/w4/w5), the widest of any candidate. |
| 3 | **The paired question** | `t5-gottman-love-map-single-question` (tier S) + the reveal mechanic from `t4-newlywed-prediction-quiz` | Both answer; neither sees until both are in. **Nearly free** — structurally the daily photo pair with text instead of an image, so it reuses the couple-day completion logic already being built. Absorbs C27+C28 from Phase 2. |

**A variant, not a fourth build:** Rose/Bud/Thorn (`ldr-bedtime-rose-bud-thorn`) is the paired question with a fixed three-part prompt. It ships as a prompt set, not as new machinery.

### 3A.3 Cut, with reasons

- **Ghost · The Minister's Cat · I'm Going on a Picnic · Just a Minute · Contact** — fail Test 1. Their pleasure is the rally; a seven-hour turn kills them. They're excellent live on a call, which is exactly where the library already puts them. Hand them over, don't host them.
- **Would You Rather** — passes async, fails Tests 2 and 3. No shared state to hold, no page worth keeping. A text thread does it fine.
- **Two Truths and a Lie** — `needs_both_high`, only w4/w7. A real candidate, but strictly dominated by the paired question, which delivers the same reveal pleasure across more windows.
- **T3's async games — Chess.com, Words With Friends, GamePigeon, Duolingo Friend Streak** — agreed emphatically, and worth stating strongly: **rebuilding correspondence chess would be the single worst use of Phase 1.** These are mature products that already solved turn-based play across timezones, and they'd beat anything we built. The app points at them. That is a date too.
- **T5 full protocols** — the negative test above.
- **Story Cubes · Botticelli · Never Have I Ever** — good dates, wrong phase. Both Botticelli and Never Have I Ever are shape-compatible, which is precisely the argument for building the shape first: they become cheap additions later rather than new subsystems.

### 3A.4 What "we're doing this" means now (CEO question C)

The button no longer logs a choice — it starts something. The object:

**A date session holds:** which date · who started it · the couple-day it began on · whose turn it is · the turns so far · a state.

**States: `open` → `finished` | `faded`.** There is no `failed`, no `abandoned`, no `expired` — **and those words must not exist in the codebase either**, because a name is a design decision that leaks into strings eventually.

- **`open`** — someone's turn. Always resumable. **No deadline, no timer, no reminder, no "your turn!" ping. Ever.** That is the pressure register D2 and D3 removed, and it must not come back through a notification.
- **`finished`** — they agreed it's done, or it hit its natural end (twenty questions spent, story ended). **Writes a page into the book.**
- **`faded`** — no turn for **30 days**. Long enough that it never catches a date that's merely slow. A faded date quietly leaves the anchor slot and lives in the record. It is never deleted, never marked failed, never mentioned, and resuming it says nothing like "welcome back."

**Pause and resume aren't features — they're the default.** There is no pause button because there is no running clock. A date is just a thing with an open turn.

**The one that matters most: unfinished dates must never accumulate into a task list.** With a seven-hour gap, several will be open at once. The rule: **an open date awaiting your turn outranks a new suggestion.** The suggestion engine already exists; it simply prefers the date you already started. That's better than a cap on concurrent dates because it's invisible — you never hit a limit, you're just offered the thing you're already in. If more than one awaits you, the anchor holds the most recent and the rest sit quietly in the record.

**Artifact rule.** Every finished date writes a page. The page is removable like any other page — no new decision surface, and consistent with "the book fills itself."

**Dates do not feed the count.** The day-count (D3) counts daily photo pairs and nothing else. Adding dates to it would create a second daily obligation and dilute the single number the product has.

**Dates and the anchor reinforce each other.** A pending turn is the richest possible thing to sit in the "what Eva left" slot — the most concrete version of *she was here five hours ago, thinking of you*. So C7's left-for-you and date turns **share one concept: something is waiting for you.** Two producers, one slot. Dates make the home screen more coherent, not less.

### 3A.5 Does the card distinguish hosted from world? (CEO question D)

**No — and for a stronger reason than "don't make them learn a taxonomy": there is no distinction to hide.** Under D10 everything is a date. Where it happens is an implementation fact. So: no badge, no category, no filter, no "playable" label, no separate section, no second tab.

**One exception, and it isn't a taxonomy — it's the button not lying.** The action label says what will happen: **"Start"** when the app is about to open something, **"We're doing this"** when it's about to hand over the steps and get out of the way. Nobody should tap and be surprised by what happens next. That's an affordance, not a category the couple has to learn.

The internal flag exists in data because the engine needs it. It never surfaces as a taxonomy.

---

### User stories
- **When we're on a call and neither of us can think of anything**, I want to open the book and be told one thing to do, so that we're doing it in ten seconds instead of scrolling for five minutes.
- **When Adam takes his turn at 5am and Eva answers at 11pm**, I want that to feel like a date that lasted all day rather than a game nobody's finishing, so that the gap is the shape of it instead of the problem with it.
- **When a date has been sitting open for weeks**, I want it to go quiet on its own without ever telling me I failed at it, so that starting one costs nothing.
- **When it's my lunch break and I have 35 minutes and I'm at my desk in an open office**, I want to be offered only things that finish before I have to go and won't embarrass me, so that I don't have to explain my constraints to an app.
- **When I'm on the subway with my hands full**, I want something that works with my eyes closed and my phone in my pocket, so that the commute is time with him instead of time away.
- **When Eva's just off work and Adam's fading**, I want the suggestion to already know which of us is the passive one tonight, so that we're not offered something that needs us both alert.
- **When we want to talk about something real**, I want the book to stop me if this is the wrong window for it, so that we don't open something a hard stop will cut in half.

---

## 4. Pillar 2 — The photo book

### User stories
- **When we've been apart for months**, I want to turn pages of us, so that the relationship has a physical object and not just a camera roll.
- **When I add a picture**, I want it to land in the right place without me organising anything, so that keeping the book costs nothing.
- **When a page is wrong**, I want to replace or move it in two taps, so that the book stays ours rather than becoming a chore.
- **When I open the book on a bad day**, I want to see where the other one last was in it, so that I know they were here too.

### Requirements
- Pages turn. The book is an object with weight, not a grid with a modal. *(Design-Lead owns the feel entirely — this spec asserts only that turning is the primary navigation and that a grid view is secondary, not the reverse.)*
- Add, reorder, replace, remove. Multi-select add.
- **The book fills itself.** Every completed daily-picture pair (§5) becomes a spread automatically. The couple never has to curate for the book to grow.
- **It is not empty on day one.** Bulk import of their existing photos is Phase 1 scope, not a nice-to-have — an empty book is not lovable, and the whole product promise is an object that has accumulated. *(Open question 4 determines the import path.)*
- Every page knows who added it and when — in both cities' time.
- Works on a phone held in one hand and on a desktop next to a video call. Both are primary.

### Private pages — a direct consequence of D1

D1 puts intimate photos and voice notes inside a product whose primary navigation is *turning pages*, and whose own window model says one of them may be **at a desk or somewhere public** (W4) and **on a crowded train** (W3). Those two facts collide, and the collision is not hypothetical: it is a page-turn away, at lunch, in an open office.

So private items are structurally separate, not merely tagged:

- Anything marked private lives in its own part of the book and **never appears in the ordinary page-turn flow** — not in the daily spread, not in an auto-bound page, not in a resurfaced memory, not in a thumbnail, not in a share sheet, not in a notification preview.
- Reaching it is always deliberate and always re-authenticated (device biometric or password re-entry), never a swipe away from the main book.
- Nothing auto-files itself as private and nothing auto-files a private item into the public book. Marking is explicit in both directions.
- The default for every upload is *not private*. A product that asks "is this intimate?" on every ordinary photo of a sandwich is a product they stop using.

This is a Phase 1 safety property, not a Phase 2 feature. Shipping D1 without it means shipping a known failure mode. **CEO has made this binding and added an implementation constraint: a separate access path at the data layer, not a boolean column every query has to remember to filter.** A `WHERE NOT private` that someone forgets once is precisely the bug the requirement exists to prevent.

#### Is there a private *surface* in Phase 1, or is it a flag with no UI? (CTO's question)

**A real surface, and it ships in Phase 1 — but the smallest complete version of one.** The reasoning, so the size is arguable rather than asserted:

**A flag with no UI isn't a shippable half, it's dead code plus a hole.** If nothing can be marked private, the flag is never set and the separation is untested scaffolding. If something can be marked but not viewed, we have built a write-only oubliette — worse than not shipping it, because the couple will put things in there. There is no coherent Phase 1 that has the flag and not the surface.

**And the expensive part happens either way.** D9 requires the separate access path at the data layer regardless, because retrofitting a privacy boundary onto existing rows is precisely the migration nobody wants to run. Once that exists, the surface is small.

**The smallest complete version — this is the Phase 1 scope, and I'd defend cutting anything past it:**

| In | Out of Phase 1 |
|---|---|
| Mark private on upload, and mark/unmark afterwards | Search, albums, tags, captions |
| A deliberate entrance requiring re-authentication (never a swipe from the book) | Any second page-turning book — see below |
| A plain, quiet grid of what's in there | Sorting, filtering, bulk operations |
| Delete from inside it, satisfying AC-30 | Sharing, export, printing |

**Deliberately not a book.** The page-turn metaphor is for the thing they show each other; it should not extend behind the private door. A plain grid is both cheaper and *more correct* — you don't browse this the way you browse a photo album, you go in for something specific. Design-Lead owns how it looks; the spec's requirement is that it is quiet and unlike the book, not that it's ugly.

**It also doesn't need to work offline** — AC-36 already forbids private items in the offline cache — which removes a whole category of work from the estimate.

### Seeding the book — a Phase 1 screen, not a prerequisite

The photos are on their two iPhone camera rolls. No shared album, no export, nothing to integrate with. **So there is no import: the path is a native iOS multi-select, and Eva and Adam each fill their own half by hand on first run.** That makes seeding a real screen with real states, not a background job that quietly happens before launch — and it must be specced as one, because "the book is full on day one" is now a thing two people *did*, not a thing that was true.

**The requirement that matters most: one person's half is already a book worth turning.** Eva will seed hers and Adam will seed his seven hours later, or the next day, or the day after. For that entire stretch the book contains exactly one person's photos — and that is the first thing either of them ever sees. So the book must be lovely, turnable, and complete-feeling with one contributor. Adam's arrival is **additive, not completing**. If the book only becomes good when both halves are in, the product's first impression is a broken one, and it's broken for whoever was keen enough to go first.

This is a real de-risking of the cold start, not just a nicer state: **the book stops being empty the moment either of them seeds, not when both have.**

The asymmetric seeding state, specced:

| Who's looking | What it must convey |
|---|---|
| The one who seeded | *Your half is in and it's already a book.* Not a progress bar at 50%, not "waiting for Adam to complete setup." |
| The one who hasn't | *Eva's already put hers in — here's what's waiting.* An invitation into something warm that exists, never a setup task assigned to them. |

Binding rules, consistent with D2 and D3: **no completion percentage, no progress meter, no two-of-two checklist, no elapsed-time-since-Eva-seeded, and no notification to a sleeping partner.** Seeding is never "onboarding" and the book is never in a "setup incomplete" state — it is simply a book with one person's photos in it so far, which is a fine thing for a book to be.

Seeding is also not a one-time gate: they can add another batch at any point, and the same multi-select is how the book grows forever. There is no separate "onboarding" mode to exit.

---

## 5. Pillar 3 — The daily picture, and the day-count nobody built correctly

### The problem
> Founder: *"see what we do, but you feel connected."*

Not a highlight reel. A picture of the ordinary day: the walk to the office, the thing on the desk, the sky. The research supports this directly — Stafford & Merolla (2007) found long-distance couples idealize each other more, and that idealization is what predicts trouble at reunion. **Mundane beats curated, and that's a design constraint, not a vibe.**

### The mechanic (D6)
**One photo each, shown as a pair on a spread.** Eva's day and Adam's day, the same named day from two sides, side by side as one thing. That spread is what lands in the book. Neither can see the other's until they've posted their own — *or* until the other's day has ended, so a quiet day never holds anyone hostage.

### The half-pair is not an edge case — it is the normal state (D6)

One posted, the other hasn't. With a 6–7 hour gap this is the visible state for **hours of every single day**, not an occasional in-between. Design it as the main event, because for a large fraction of the time it is the screen.

The rule: **it reads as anticipation, never as absence.** Eva's photo sits on its half of the spread; Adam's half is not an empty slot, a dashed outline, a grey box, or a "waiting for Adam…" apology. It holds what is true and warm — where the other one is in their day right now, and that their half is still coming. The half-pair state has two distinct readings depending on who is looking, and both must be designed:

| Who's looking | What it must convey |
|---|---|
| The one who posted | *It's landed and it's waiting for him.* Not "he hasn't reciprocated." |
| The one who hasn't | *Hers is here, and it opens when yours does.* An invitation, never a debt. Nothing that reads as a prompt they're behind on. |

Two hard rules: no elapsed-time counter on the missing half (D2 forbids it, and it would be the single most pressuring number in the product), and no notification to the partner who hasn't posted while they are asleep.

Design-Lead owns how this looks. The spec's requirement is only that the incomplete spread is a designed, warm, first-class state — not a completed spread with a hole in it.

### The split day — the differentiated part

T6's audit of ten couple apps found **not one publishes how its "today" behaves across timezones.** Eight are entirely undocumented; the only two that provably survive a split day (Gottman Card Decks, Cupla) survive by having no daily mechanic at all. For 7 hours a day these two are on different dates. Every naive implementation breaks in one of three ways:

| Naive model | How it breaks for them |
|---|---|
| Reset at UTC midnight | 03:00 Israel / 20:00 NYC — dead centre of W6, Eva's prime evening. Adam's flips while he sleeps. |
| Reset at each device's local midnight | Two different "todays." "Did we both post today?" has two answers, so the shared unit — which *is* the product — doesn't exist. |
| Anchor to one partner's timezone | The other is permanently second-class in their own app. |

**The model this product uses: the shared day, assigned by each person's own local date. CEO ruling, 2026-08-02, binding.**

> **A shared day `D` is a named calendar date. A photo belongs to `D` if its author's own local date was `D` when they posted it.**
> `D` is complete when it holds a daily photo from Eva *and* one from Adam.

*Naming: this document says "shared day"; the schema calls the same unit `couple_day`. Same thing — CTO's name is the better one and there is no need for two.*

#### The deciding test — permanent, and the only one that disqualifies

> **Can a photo ever land on a shared day that is already complete?**
>
> If yes, the model is disqualified. No amount of arithmetic elegance compensates, because that *is* the "being late" failure — and "neither of you can ever be late" is the product's central promise, the whole reason we are not shipping what the ten audited apps ship.

Under per-person local-date stamping: **no, never.** Under the 08:00Z anchor: **yes, every morning of Adam's life**, unless he remembers to hit a toggle at 5am. A correctness property that depends on a person remembering a toggle is not a correctness property.

**This test is closed and binding (CEO, third and final ruling, 2026-08-02).** It re-opens only on a concrete case — with timestamps — where per-person stamping lands a photo on a completed day. Nothing else re-opens it.

#### My reasoning error, recorded because the lesson generalises

I withdrew this model twice, the second time arguing it was "DST-sensitive by construction — 32 hours on New York's fall-back, 30 on spring-forward." **I conflated span-length variance with stamping fragility, and I was also simply wrong on the numbers** — my own verification found only 31h and 30h, never 32.

The span is a **display artifact**. The stamping rule is "each person's photo carries their own local date," and the property that makes it DST-proof is that **each person has exactly one local date at any instant, always**. On New York's fall-back, 01:00–02:00 happens twice — same date both times. On spring-forward, 02:00–03:00 doesn't exist — the date is still unambiguous. There is no instant in any regime where a local date is undefined or doubled. Nothing about the rule can break, whatever the span happens to measure.

The generalisable lesson: **verify the property the rule actually depends on, not the most measurable adjacent quantity.** I measured span because span was easy to compute, then let a variance in it argue against a rule that never referenced it.

#### Rejected alternative — the couple-day anchored at 08:00 UTC

Recorded so it's legible why it lost; both CTO and I did real work on it and it should not have to be re-derived by whoever reads this next.

**The proposal.** A couple-day `D` is the interval `[D 08:00Z, D+1 08:00Z)`; every photo carries the couple-day containing its timestamp.

**Its genuine strengths, which are not in dispute:**
- **Derived, not chosen by taste.** CTO projected all nine research windows onto Israeli local hours, found the three free stretches, and tested every candidate UTC hour against all three offset regimes that actually occur. 08:00Z is the only hour sitting strictly inside the dead zone with ≥1h margin in every regime.
- **DST-immune by construction.** The stamping expression is pure UTC arithmetic, so a local-time transition is invisible to it. Every couple-day is exactly 24h of real time — none skipped, duplicated, lengthened, or shortened. I verified this independently and it holds.
- **A clean partition** — non-overlapping, exhaustive, exactly one label per instant.
- **No shared window is split by the boundary**, and at every rollover both partners are on the same local calendar date.

**Why it was disqualified.** It labels Adam's local 00:00–10:00 as the previous day. That range is **W1 — his single most important window**, the hours he is awake and Eva isn't. So Adam wakes at 05:00 on Saturday, photographs his morning, and it files under Friday — and **if Friday is already complete, it lands silently on a closed day.** It fails the deciding test above, every morning, and the only mitigation was a toggle he'd have to remember at 5am.

A mislabelled shared *session* is cosmetic. A photo landing on a day that is already finished is not.

**A note on how this got decided, because the record matters.** CTO and I swapped models simultaneously — I withdrew mine in favour of its 08:00 UTC anchor while it reversed in favour of mine. Our messages crossed. **CEO ruled for the local-date model, and CEO's rationale is the deciding one, not a third opinion.** The two arguments that settled it:

- **My stated objections to my own model were wrong.** CTO validated it against the 2026 tz database and I have re-verified independently: shared-day length is **exactly 31h on 339 days and 30h on 26 days, never anything else**; **well-ordered on every day of 2026**, including all four DST transitions; and **every person's full local date sits entirely inside its own shared day** — zero containment violations. Neither of them can ever be late by definition.
- **The seven-hour overlap I flagged was a framing error, not a defect.** I described the model as an interval and then worried that consecutive intervals overlap. They do — 7h in a normal week, 6h in the shoulder weeks. But **the model is not an interval model.** Assignment is a function of *who posted and what their own local date was*, and each person has exactly one local date at any instant. There is no ambiguity to resolve because nothing is ever assigned by asking which interval contains a timestamp. The 30/31-hour span is a derived property, not the definition. Stating it as an interval was my mistake; stating it as an assignment rule makes the objection disappear rather than excusing it.
- **The 08:00Z anchor's flaw was the harder one.** It labels Adam's local 00:00–10:00 as the previous day, so a photo posted at IL Saturday 08:00 files under Friday — and **if Friday was already complete, it lands silently on a closed day.** A mislabelled shared *session* is cosmetic. A photo landing on a day that is already finished is the exact "you were late" failure this whole model exists to make impossible.

**Accepted caveat, priced and not engineered around:** at NYC Sunday 22:00 Eva is on Sunday while Adam is already on Monday, so two photos from a single conversation can carry different labels. Verified: same instant, `Eva 2026-07-05` / `Adam 2026-07-06`. **This affects the label only, never the tally, and the tally cannot break.** It is also the thing the dual-date display makes honest rather than confusing — the product already says "Eva's still in Sunday" out loud, so the split is a fact about them rather than a glitch.

**No scheduled job — CTO's simplification, adopted, and it improves my spec.** I wrote that the day "finalizes and the count is evaluated when New York passes midnight." That wording invites a cron. It shouldn't. **Completion is a pure function of the stored rows plus `now()`:** complete when both rows exist for `D`; still open until 23:59:59 `America/New_York` on `D` has passed; incomplete forever after that if only one row exists. Nothing runs, nothing mutates, and there is no possible drift between what a job computed and what the data says. Same principle as the count itself (D3) and the date fade (§3A.4) — **three separate mechanisms in this product that all look like they need a scheduled job and none of which do.**

**Visits are handled for free.** Timezone resolution prefers the device-reported IANA zone over the home zone, so when Eva is physically in Israel her local date is Adam's local date, the gap collapses, and the shared day becomes an ordinary 24 hours. Nothing special-cases a visit. This is why deleting the `pauses` table costs nothing — the model was never counting on separation.

**The day toggle is demoted — it is an affordance, never a correctness mechanism.** Under the anchored model it was load-bearing: without it, Adam's mornings filed wrong. Under this model nothing depends on it, because stamping is already correct by construction. What it is now: **a way to post a photo of *yesterday*** — you took a picture last night and are only getting round to it now. Anchored at each person's own local midnight, the boundary humans already feel ("it's 00:30 but this is still Tuesday night to me"). It also covers the one hazard that preferring the device-reported zone introduces: a photo posted mid-flight or on a device with a stale timezone.

**If any correctness argument ever rests on the toggle again, the model underneath it is wrong.**

### DST verdict — the adopted model holds on every day of 2026

I re-verified the reinstated model independently rather than accepting CTO's validation on trust. Every shared day in 2026, computed from tzdata:

| Check | Result |
|---|---|
| Shared-day length | **31h on 339 days, 30h on 26 days. Never any other value.** The 30h days are exactly the two shoulder stretches where the gap is 6h (§2). |
| Ordering | **No violations.** Every day opens before it closes, and both open and close advance monotonically day over day — including across all four DST transitions. |
| Containment | **No violations.** Every person's full local date sits entirely inside its own shared day, all 365 days. This is the property that makes "neither is ever late by definition" true rather than aspirational. |
| Overlap between consecutive days | 7h normally, 6h in the shoulder weeks — **and irrelevant**, because assignment is by the author's own local date, never by interval containment. |

DST cannot perturb this, for a different reason than the anchored model: there is no fixed instant to protect. A DST transition changes when a local midnight happens, and the model simply asks each person what their own local date is. On the days when a local day is 23 or 25 hours long, the shared day absorbs it and remains well-ordered. The verification above covers every such day in 2026.

**Order-independence, which CEO asked me to confirm: yes, guaranteed.** Each photo is stamped independently from its own timestamp, and completion is a set test — does couple-day `D` contain a daily photo from Eva *and* one from Adam. There is no first-poster, no sequence, no race. Eva can post twelve hours before Adam or twelve hours after; the pair lands on the same named day either way. This is a property of the model, not of the implementation, so it can't regress quietly.

**And the split is shown, not hidden.** When Eva is still in Monday and Adam has crossed into Tuesday, the app says so — *"Eva's still in Monday"* — affectionately, as a fact about them. Hiding the gap is what every other app does, and hiding it is what breaks. This is what CTO's dual date chip (architecture §3.5) is for; it's a shared requirement, and neither of us should build a second version of it.

### The count that only counts up (D3)

**It counts shared days both of them were in. It never breaks.** A missed day is simply not counted — no reset, no decay, no grace-day ledger, no "you lost your streak." The number goes up or it stays where it is, and that is the entire mechanic.

This is deliberately the inverse of the Duolingo pattern. A streak that can be lost converts a gesture into a liability: by day 200 the dominant emotion is fear of breaking it, and the app has quietly become something you owe. This one can only ever report good news.

Three copy rules, binding on Design-Lead and on anyone writing strings:

1. **Nothing framed as loss, risk, or debt.** No "don't break it," no "keep it alive," no flame that goes out, no colour that drains, no "you're about to lose…". No countdown to a deadline.
2. **The unit is *days you were both here*, not consecutive days.** "Streak" is the wrong word for what this now is; Design-Lead names it. Whatever it's called, it must not imply consecutiveness, because implying consecutiveness re-introduces the fear the mechanic was built to remove.
3. **Silence on a missed day.** If a day doesn't complete, the app says nothing about it — no notification, no marker, no greyed-out gap in the book. The day just isn't one of the counted ones. A visible hole is a rebuke with extra steps.

The number is the product's only accumulating quantity, and with D2 removing every counter that points at a date, it is the sole survivor of the arithmetic register — which is correct, because it counts something the two of them made rather than something they're waiting for.

### User stories
- **When something ordinary happens in my day**, I want to send one picture of it, so that the other one sees my actual life and not a curated version of it.
- **When Adam wakes seven hours after Eva's day ended**, he wants her picture already waiting, so that the first thing in his morning is her evening.
- **When I've kept this up for 200 days**, I want the count to be true, so that the number means something.
- **When one of us misses a day**, I want nothing bad to happen and nothing to be said about it, so that the book never becomes something I owe.
- **When I'm somewhere public and I turn a page**, I want to be certain nothing intimate can appear, so that the book is safe to open anywhere.

---

## 6. The cute things — 35 candidates

Grounded in the research, not in generic couple-app features. One line each. Scored in §7.

**The clock is the character**
- **C1 · Two clocks, always** — both cities in the header, with the window in their own words, and "Eva's still in Monday" when the dates disagree.
- **C2 · Their sky** — what it looks like out of the other one's window right now: weather, and where the sun is.
- **C3 · The overlap bar** — a thin band showing how much of this window is left. "You have 40 minutes of both being awake."
- **C4 · Asleep-aware interface** — when one of them is asleep, that half of the app goes quiet and only offers asynchronous things. Nothing live is ever suggested to a sleeping partner, and nothing ever pings one.
- **C5 · Next time you're both free** — "you'll both be awake again in 4 hours." Present-tense and self-resolving; survives D2 because it points at a window, not at a date neither of them controls. *(Design-Lead: no ticking clock, no urgency treatment.)*
- ~~**C6 · Days until we're in the same city**~~ — **CUT by D2.** Scored 126, second-highest in this document. Removed, and deliberately not backfilled: see §7 and §10.

**Asymmetry as the design** *(60 of 98 activities are `works_asymmetric` — this is the library's dominant shape)*
- **C7 · Left for you** — the primitive: any note, photo, voice memo, or activity pick can be marked *deliver when they wake*. Everything below is built on it.
- **C8 · Goodnight → good morning** — she leaves something in her last minutes awake; it's the first thing on his phone at 5am. The 7-hour gap used as a delivery mechanism. **Promoted to the home screen's anchor slot** in place of the cut countdown — see §7.
- **C9 · The commute tape** — a voice-memo queue that plays hands-free with the screen off, one tap from a locked phone. W3's only real answer.
- **C10 · A slow build across the asymmetric day off** — on his Friday and her Sunday, the free partner drops a small building thread across the working partner's day.
- **C11 · Sealed until** — write something to be opened on a chosen future date.
- **C12 · Awake? ping** — one tap. If they're asleep it queues silently and lands with their morning.

**The book, alive**
- **C13 · The book binds the dailies** — completed pairs become spreads automatically; the book grows without curation.
- **C14 · Margin notes** — write on a page the way you write in the margin of a book you own.
- **C15 · Two ribbons** — each has a bookmark; you can see where the other one last was.
- **C16 · One year ago today** — the book surfaces the same date last year.
- **C17 · Both in the book at once** — when they're both turning pages during a call, they see each other's turns.
- **C18 · Print it** — export a year as a real printed book.
- **C19 · Straight from the call** — a fast path from a screenshot taken during a call into today's picture.

**The week, held**
- **C20 · The Saturday plan** — one shared plan for the only symmetric day, built during the week. The research is blunt: 20 of the 24 both-alert activities land on Saturday and there is no weekday substitute.
- **C21 · Worth staying up for** — a shortlist for W6 that acknowledges what it costs him, and a quiet record of how many times he did it.
- **C22 · Lunch timer with a soft landing** — a hard-stop timer that warns at T-5 and closes the thing gracefully instead of guillotining it.
- **C23 · What we actually did** — a log of activities they really did, dated. Feeds anti-repeat, and becomes memory.
- **C24 · Ours** — anything done three times gets promoted to a named ritual with its own slot in the week.
- **C25 · Quiet ratings** — a private thumb after each activity. This is how the taste profile the research deferred gets collected, without a survey.
- **C26 · The contraindication guardrail** — the book declines to start a heavy conversation in a window that will cut it in half, and offers Saturday instead.

**The question**
- **C27 · One question a day** — drawn from the 29 deep-talk entries, split-day aware.
- **C28 · Reveal when you've both answered** — your answer stays hidden until theirs arrives. Works because the 31-hour day makes "both answered today" a coherent statement.
- **C29 · The guessing version** — each answers about themselves, then guesses the other's answer.

**Texture**
- **C30 · The same song this week** — one shared track, changed weekly.
- **C36 · Kept separately** — private items live behind their own re-authenticated door and never surface in the ordinary page-turn. Phase 1, forced by D1.
- **C37 · Gone means gone** — deleting something removes it from the book, from storage, from cache, and from any signed URL that was already handed out. Phase 1, forced by D1.
- ~~**C31 · Grace days**~~ — **deleted by D3.** A count that never breaks has nothing to forgive; a grace-day ledger would re-introduce the very accounting the decision removes.
- **C32 · Weather-matched greeting** — the app's first line changes with the hour and the sky where *they* are, not where you are.
- **C33 · Anniversary of nothing** — it marks the small ones: 100 shared days, the day the book hit 100 pages.
- **C34 · The library, offline** — everything readable with no connection, because her subway has none.
- **C35 · Hold to hear** — press and hold a photo to hear the voice memo attached to it.

---

## 7. Prioritization

**RICE, adapted for a two-person product.** Reach is not users — there are two, forever. Reach = **expected uses per week across both of them**. Impact = emotional weight (0.25 minimal / 0.5 low / 1 medium / 2 high / 3 massive). Confidence = my certainty this lands for *these two*. Effort = engineering weeks — **all effort figures are `(est. — CTO to confirm)`; I do not estimate implementation.** Reach and Impact are `(assumed)` unless noted: there is no usage data for a product that doesn't exist, and USER-INSIGHTS.md is empty (see §11). The one `(fact)` input everywhere is `library.json` — the counts of asymmetric activities, the Saturday concentration, and the contraindication table are all countable.

### Shortlist

| # | Feature | Reach/wk | Impact | Conf | Effort | RICE | Phase |
|---|---|---|---|---|---|---|---|
| C1 | Two clocks + window in their words | 25 | 2 | 95% | 0.3 | **158** | 1 |
| ~~C6~~ | ~~Days until we're in the same city~~ | 14 | 2 | 90% | 0.2 | ~~126~~ | **CUT (D2)** |
| C4 | Asleep-aware interface | 25 | 2 | 85% | 0.4 | **106** | 1 |
| C2 | Their sky | 25 | 1 | 90% | 0.3 | **75** | 1 |
| C8 | Goodnight → good morning | 7 | 3 | 85% | 0.3 | **60** | 1 — **home anchor** |
| §5 | **The split-day count** | 14 | 3 | 80% | 0.8 | **53** | 1 |
| C3 | The overlap bar | 25 | 1.5 | 70% | 0.5 | **53** | 2 |
| C5 | Next time you're both free | 25 | 1 | 70% | 0.4 | **44** | 1 (promoted — near-free on the window engine) |
| C27+C28 | Question of the day + reveal | 14 | 2 | 80% | 0.8 | **28** | 2 |
| C7 | Left for you (the primitive) | 10 | 3 | 85% | 1.0 | **26** | 1 |
| C25 | Quiet ratings → taste profile | 7 | 2 | 70% | 0.5 | **20** | 2 |
| C12 | Awake? ping that queues | 7 | 2 | 70% | 0.5 | **20** | 2 |
| C23 | What we actually did | 7 | 1.5 | 90% | 0.5 | **19** | 1 (minimal) |
| C22 | Lunch timer, soft landing | 5 | 1 | 80% | 0.3 | **13** | 2 |
| ~~C31~~ | ~~Grace days~~ | — | — | — | — | — | **DELETED (D3)** |
| C36 | Kept separately (private door) | — | — | — | 0.6 | *not scored* | 1 — forced by D1 |
| C37 | Gone means gone (real deletion) | — | — | — | 0.5 | *not scored* | 1 — forced by D1 |
| C26 | Contraindication guardrail | 1 | 3 | 90% | 0.3 | **9** | 1 (free — it's a filter) |
| C14 | Margin notes | 3 | 2 | 70% | 0.5 | **8** | 2 |
| C20 | The Saturday plan | 2 | 3 | 80% | 0.6 | **8** | 2 |
| C9 | The commute tape | 5 | 2 | 60% | 0.8 | **8** | 2 |
| C24 | Ours (ritual promotion) | 3 | 2.5 | 60% | 0.6 | **8** | 3 |
| C15 | Two ribbons | 3 | 1 | 70% | 0.3 | **7** | 2 |
| C10 | Slow build on the asymmetric day off | 2 | 2 | 70% | 0.4 | **7** | 2 |
| C16 | One year ago today | 7 | 2 | 80% | 0.4 | **28**\* | 3 |

\* C16 scores high but is worth nothing until there is a year of pages (or an import with real dates). Deferred on readiness, not on score. This is the one place I am overriding the arithmetic.

### The countdown, and what replaced it

D2 removed the second-highest-scoring feature in this document, and forbade backfilling it with any other counter. That is the right call and it improves the product, for a reason worth writing down: **the countdown was the only tonally out-of-place thing in Phase 1.** Everything else here is present-tense — what time is it there, what should we do right now, what did your day look like. A countdown is the one element that says *this is a thing to be endured until it ends*, which is a different product with a different feeling. It scored 126 because RICE rewards cheap and frequent, and a number that changes daily is both. RICE cannot see tone.

Two things move into the space it occupied, and neither is arithmetic:

**The anchor slot goes to C8, goodnight → good morning — "what Eva left."** This is the promotion I'd defend hardest. The countdown's emotional payload was *they are coming*; C8's is *she was here five hours ago, thinking of you*, which is the same warmth sourced from something that actually happened instead of something hoped for. It is asymmetry-native, which the research says is this couple's dominant shape (60 of 98 activities). And its empty state is strictly better than a countdown's ever was: when nothing is waiting, the slot flips to an invitation to leave something for the other one to wake up to — turning the emptiest moment in the product into a prompt to be generous, where the countdown's empty state was a placeholder apologising for itself.

**The informational slot goes to C5, next time you're both free.** It occupies the same visual real estate and answers a question they genuinely have several times a day, but it points at a window a few hours out rather than a date neither of them controls — and it resolves itself, over and over, instead of grinding down. It moves to Phase 1 because it is nearly free: the window engine already computes it.

**Not chosen: C2, their sky.** It was the other candidate and it stays exactly where it is, in the header beside their clock. Weather is texture, not a gesture — nobody did anything to make it happen. An anchor slot should hold evidence that the other person showed up.

### Where I am overriding RICE, and why

**Promoted: the split-day count (53, fifth).** RICE rewards frequency, and frequency flatters cheap ornament. The count is the one thing in this document that does not exist anywhere else on the market — T6 checked ten apps and found not one that documents it. It is also the thing the founder can *feel* is correct, every single day, in a way a competitor's user cannot. It ships in Phase 1.

**Promoted: C7 Left for you (26, tenth).** It scores tenth as a feature and is first as an *architecture*. C8, C10, C11, C12 and half the daily picture are all instances of it. Building it once in Phase 1 makes five later features nearly free; not building it makes each of them a bespoke thing. Rank it as a foundation.

**Demoted: C20 The Saturday plan (8).** Once a week, so RICE buries it. The research says Saturday carries 20 of 24 both-alert activities with no substitute — it is the single point of failure in their whole week. It stays in Phase 2 only because Phase 1 already has more than enough, not because it's minor.

### What I'd cut, and why

- **C17 Both in the book at once** — real-time presence sync is the single most expensive thing in this document, for a moment that happens during a call in which they are already looking at each other. The call *is* the co-presence channel. Cut.
- **C30 The same song this week** — Spotify's catalog differs 15–40% between regions (T1), so the shared-song ritual has a real chance of failing on a random Tuesday, and SharePlay already does music properly. Low yield, real friction. Cut.
- **C11 Sealed until** — genuinely lovely, used maybe twice a year. C7 delivers most of the same feeling for a third of the cost. Cut, revisit if C7 gets heavy use.
- **C21 Worth staying up for**, as a *screen* — W6 has 10 activities and is rare by design. A whole surface for it is over-building. Keep the idea as one line on the activity card ("this one costs him a night") and drop the screen.
- **C29 The guessing version** — a variant of C27/C28, not a feature. Fold in later or never.
- **C18 Print it** — an output of a full book, not a feature of an empty one. Phase 3 at the earliest.
- **C33 Anniversary of nothing** — charming until it fires for the fourth time in a month and becomes noise. Needs a *very* high bar; if it ships, no more than one per quarter.
- **C19 Straight from the call** — this is just "add a photo." It's the daily picture's upload path, not a feature. Fold in.

### Not on the list on purpose

No points, levels, badges, or rewards beyond the one shared count. No relationship health score, no mood tracking, no analytics about them. The moment the product starts scoring the relationship, using it becomes performing, and the idealization research (§5) says performance is the actual failure mode for couples at distance. See §10.

---

## 8. Roadmap

### Does D10 break Phase 1? (CEO question B) — yes, and here's the re-cut

**Honest answer: it breaks Phase 1 as previously scoped, and I'm not absorbing it quietly.** But the shape of the problem isn't what it looks like.

**Dates are not additive to Pillar 1 — they redefine it.** A card that points at rules and a card that starts a thing are different products with different data models behind them. If Phase 1 ships pointing cards and Phase 2 replaces them with hosted dates, **we build Pillar 1 twice and throw the first one away.** So "defer dates to Phase 1.5" is the most expensive option on the table, not the cheapest. That's the argument for taking the scope now.

**Recommendation: dates in Phase 1, cut to the three that share one shape, and re-cut Phase 1 to pay for it.**

**Moving out of Phase 1:**

| Moved | Why it's the right thing to lose |
|---|---|
| **C2 their sky** → Phase 2 | Pure texture. Nothing depends on it, and it was always the most cuttable thing on the list. |
| **C5 next time you're both free** → Phase 2 | I promoted it two revisions ago to fill the countdown's slot. The anchor now carries that weight better than C5 would have, and dates make the anchor richer still. |
| **The shelves browse (second level)** → Phase 2 | With the card *starting* things, browsing matters less than when the card only pointed. Ship the one-card engine; add the shelves when there's a reason to wander. |

**Absorbed rather than moved — Phase 2 gets smaller too:**

- **C23 did-it log** — a finished date session *is* the log. Gone as separate work.
- **C27 + C28 question of the day with reveal** — that is Phase 1 date #3. Absorbed and pulled forward.
- **C25 quiet ratings** — now has an obvious home (the end of a date) but stays in Phase 2.

**Net, stated plainly: Phase 1 grows.** Three cuts and three absorptions do not fully pay for a new subsystem. A date session with turn state, async sync, resume, and artifact writing is the largest single item in Phase 1 after the book itself. **CTO must size it; I won't.** Expect Phase 1 to take meaningfully longer, and that is the correct trade — the alternative is shipping a Pillar 1 we have already decided is the wrong one.

**What must not happen:** dates arriving as a bolted-on fourth pillar with the Phase 1 bar unchanged. If CTO's sizing says it can't all fit, **my order of sacrifice is: cut date #2 (twenty questions) first, then date #1 (the story), leaving the paired question** — which is nearly free, since it reuses the daily-pair completion logic — as the proof the shape works. **Never cut the subsystem to keep three thin dates.** Three thin dates is precisely the failure the founder warned against.

### Phase 1 — "The book that knows what time it is"

All three pillars whole — with Pillar 1 now meaning *hosted dates*, not a pointing card — plus the cheap things that make it feel alive, plus the privacy work D1 makes mandatory.

| In Phase 1 | |
|---|---|
| Shell | PWA installable from Safari and Chrome to the home screen; mobile-first, genuinely good on desktop; shared-password gate + local "who am I?" picker for attribution |
| The clock | Window engine from IANA zones; two-clock header (C1); asleep-aware states (C4) |
| Pillar 1 — the suggestion | One-card suggestion with zero taps; "something else"; "not this one"; hard filters incl. contraindications (C26) and verification-tier honesty; an open date awaiting your turn outranks a new suggestion |
| Pillar 1 — hosted dates (D10) | The date-session subsystem (turn state, async resume, fade at 30 days, artifact writing) + **three dates sharing one shape**: the story · twenty questions · the paired question. Rose/Bud/Thorn ships as a prompt variant of the third |
| Pillar 2 | Page-turning book; add / reorder / replace / remove; auto-binding of daily pairs (C13); **first-run seeding as a designed screen** — native iOS multi-select from the camera roll, no import integration, with the asymmetric one-half-seeded state as a first-class state (§4) |
| Pillar 3 | Daily picture, one each; blind until you post or their day ends; paired spreads; the 31-hour shared day; the count that only counts up (D3) |
| Asymmetry | The *left for you* primitive (C7) with one ritual built on it: goodnight → good morning (C8), which is the home screen's anchor |
| Privacy (D1) | Encrypted at rest; short-lived signed URLs; EXIF/GPS stripped on upload; real deletion (C37); no media in notification previews; **a real private surface — smallest complete version: mark on upload + mark/unmark after + re-authenticated entrance + plain grid + delete from inside (§4). Not a second book, no offline support needed** |

**What makes Phase 1 finished rather than started** — this is the bar, and it is not negotiable:

1. **It answers correctly with zero taps.** Open it at any hour of any day, including inside the 6-hour-gap weeks, and the window it names is right and the suggestion fits.
2. **The daily exchange is a complete round trip.** Post → they see it → the pair becomes a spread in the book. No step is a stub.
3. **The book is not empty on day one — and getting it there is a shipped screen.** The seeding flow works end to end from the iOS picker, and the book is turnable and lovely with only one person's photos in it. This condition is *not* satisfied by a book that merely could hold photos.
4. **The count is correct, and they can tell.** It never breaks because of the gap, it never breaks at all, and a missed day passes without comment.
5. **It is installed on both home screens** and opens without a browser chrome, offline-tolerant for reading.
6. **Every state is designed** — before any photo exists, before the count has a number, when one is asleep, when nothing fits the window, when nothing was left overnight. There is no screen that says "no results" and no placeholder anywhere.
7. **The book is safe to open in public.** Nothing private can reach the ordinary page-turn, and deleting something actually deletes it.
8. **A date can be started, left for a day, picked up from the other side of the world, finished, and end up as a page.** All three Phase 1 dates do this end to end. A date that only works if both are online is not done.
9. **They use it on a call without explaining it to each other.**

If any of those nine is missing, Phase 1 is not done regardless of what shipped.

### Phase 2 — "It learns the week"
**Moved in from Phase 1 by the D10 re-cut:** C2 their sky · C5 next-time-both-free · the shelves browse.
**Absorbed, no longer separate work:** C23 did-it log (a finished date session is the log) · C27+C28 question of the day (it's Phase 1 date #3).
**More dates, cheap now that the shape exists:** Botticelli · Never Have I Ever · Two Truths and a Lie.
Plus: C3 overlap bar · C25 quiet ratings feeding a taste re-rank of `library.json` (the hook already exists in `build_library.py`) · C20 Saturday plan · C22 lunch timer · C9 commute tape · C10 asymmetric-day-off mode · C12 awake? ping · C14 margin notes · C15 two ribbons · C34 offline library.

**Phase 2 is done when** the suggestion engine is demonstrably better than it was in Phase 1 because of what it learned from them, and when W3 and W4 — the two windows a generic app can't serve at all — each have a first-class experience.

### Phase 3 — "It has history"
C16 one year ago today · C24 ritual promotion · C18 print/export a year · C35 hold to hear · C11 sealed until (only if C7 earned it) · C33 anniversary of nothing (high bar) · round-2 library expansion once research fills W3 and the W6×games gap.

---

## 9. Acceptance criteria — Phase 1

Testable. QA-Lead verifies each against the built product, not against the plan.

**Risk tier: Full**, per D1 — the product stores intimate media. The storage schema and any migration touching it are **Irreversible** tier and need founder sign-off. AC-27→AC-32 are the security gate and none of them is waivable to hit a date.

**The clock**
- [ ] **AC-1** Given the system time is set to any instant, when the app loads, then the header shows the current local time in both cities derived from `Asia/Jerusalem` and `America/New_York`, and the named window matches the window table — asserted for at least: a July date (7h gap), 2026-03-15 (6h gap), 2026-10-28 (6h gap), and a January date (7h gap).
- [ ] **AC-2** Given the current instant falls in W4, when the app loads, then the suggestion shown has `duration_min` ≤ the minutes remaining in W4 and never exceeds the hard stop.
- [ ] **AC-3** Given one partner's local time is inside their sleep hours, when the other opens the app, then no live/simultaneous activity is offered, only asynchronous ones, and no notification is delivered to the sleeping partner's device.

**The suggestion**
- [ ] **AC-4** Given the app is opened cold, when the first screen renders, then exactly one activity is shown and zero taps were required to get a window-correct suggestion.
- [ ] **AC-5** Given the current window is W3, when any suggestion is shown, then `screen_free` is `true` for it.
- [ ] **AC-6** Given the current window appears in an activity's contraindication list in `WINDOW-CONTRAINDICATIONS.md`, when suggestions are generated for that window, then that activity never appears — for all 7 rulings.
- [ ] **AC-7** Given "something else" is tapped repeatedly, when 10 suggestions have been shown, then no activity has repeated within that session and at most one carried `verification_tier: plausible-unverified`, and that one displayed its no-track-record label.
- [ ] **AC-8** Given every activity in the current window has been snoozed or excluded, when the app tries to suggest, then it widens filters in the specified order and always renders something — never a "no results" state.
- [ ] **AC-9** Given any surface in the product, when text is rendered, then no window code (`w1`…`w9`) appears anywhere in the UI, and the nine window strings match §2 verbatim. *(Shelf naming moves to Phase 2 with the shelves browse.)*

**Dates (D10/D11)**
- [ ] **AC-45** Given the full string inventory and code identifiers, when audited, then the user-facing word is "date" everywhere — no "game," "minigame," "activity," or "challenge" in any string — and no score, point, level, badge, win, lose, or leaderboard concept exists in any date.
- [ ] **AC-46** Given Adam takes a turn at IL 05:00 and Eva takes hers at NYC 23:00 the same couple-day, when the date is inspected, then both turns are recorded in order, the date is still `open` or `finished` as appropriate, and at no point was either partner shown a timer, deadline, or turn reminder.
- [ ] **AC-47** Given a date is `open` and it is Eva's turn, when Eva opens the app, then that date outranks a new suggestion in the one-card slot; and when it is nobody's-turn-yet or Adam's turn, then Eva is offered a new suggestion instead.
- [ ] **AC-48** Given a date with no turn for 30 days, when it is evaluated, then its state becomes `faded`, it leaves the anchor slot, it remains fully resumable from the record, and no string anywhere — UI, notification, or code identifier — uses "failed," "abandoned," "expired," or equivalent.
- [ ] **AC-49** Given a date reaches its natural end (twenty questions spent, story ended, or both agreed), when it finishes, then a page is written into the book automatically, attributed to both, removable like any other page.
- [ ] **AC-50** Given any number of finished dates, when the day-count is computed, then it is unchanged — dates never contribute to it.
- [ ] **AC-51** Given all three Phase 1 dates, when each is played end to end entirely asynchronously with no moment of both partners online, then each completes successfully and produces its page.
- [ ] **AC-52** Given a hosted date and a world date in the suggestion slot, when each card renders, then neither carries a badge, category, label, or section distinguishing them — and the action button reads "Start" for the hosted one and "We're doing this" for the world one.
- [ ] **AC-53** Given any T5 protocol contraindicated by truncation (36 Questions full run, full Imago, Hold Me Tight, Dreams Within Conflict), when the date catalogue is inspected, then none is available as a hosted async date.

**The daily picture and the count**
- [ ] **AC-10** Given neither has posted for shared day D, when partner A opens the day, then partner B's picture is not visible; when A posts, then B's picture becomes visible immediately.
- [ ] **AC-11** Given A has posted for D and B has not, when B's local date D ends without a post, then A can see their own post and the day is marked incomplete — A is never blocked by B's silence.
- [ ] **AC-12** Given a picture is posted at 23:30 New York time on date D and another at 08:00 Israel time on the same date D, when the day finalizes, then both are filed under shared day D and the pair is complete — despite being 22 hours apart in real time.
- [ ] **AC-13** Given shared day D, when completion is queried at any instant, then the answer is computed from the stored rows plus `now()` alone — D is complete when both rows exist, still open until 23:59:59 `America/New_York` on D has passed, and incomplete thereafter if only one row exists. **No scheduled job, cron, or background worker participates in determining completion or the count.**
- [ ] **AC-13a** Given every calendar day of a full year including all four DST transitions, when each shared day's bounds are computed, then length is 31h or 30h and never any other value, open precedes close, both advance monotonically, and each person's full local date falls entirely inside its own shared day — **zero containment violations, meaning neither can ever be late by definition.**
- [ ] **AC-13b** Given Eva's device reports `Asia/Jerusalem` because she is visiting, when she posts, then her local date equals Adam's, the shared day is an ordinary 24 hours, and nothing special-cases the visit.
- [ ] **AC-13c** Given a photo posted near the author's own local midnight, when it is posted, then a "this belongs to the other day" toggle is offered — anchored to that person's own midnight, not to any UTC instant — and **with the toggle disabled entirely, every stamping AC above still passes**, proving it is an affordance and not a correctness mechanism.
- [ ] **AC-13d** Given any sequence of posts across any dates including DST transitions, when the full history is replayed, then **no photo is ever assigned to a shared day that was already complete** — the deciding test, asserted directly.
- [ ] **AC-14** Given a count of N and a day that finalizes with only one picture posted, when the day finalizes, then the count remains exactly N, is never reduced, and the app displays no marker, notification, gap, or copy referring to the missed day anywhere in the product.
- [ ] **AC-15** Given Eva and Adam are on different calendar dates, when either opens the app, then the interface states this in plain language ("Eva's still in Monday") rather than showing one date, and it never renders a bare weekday without the dual-date context.
- [ ] **AC-16** Given a full audit of every string attached to the count, when reviewed, then none expresses loss, risk, debt, obligation, urgency, or consecutiveness — no "don't break," "keep it up," "you lost," countdown, extinguishing flame, or draining state.
- [ ] **AC-17** Given a shared day completes with both pictures, when the book is opened, then a spread exists for that day with both pictures, correctly attributed, without any manual step.

**Left for you (the home anchor)**
- [ ] **AC-18** Given Eva leaves something while Adam is asleep, when Adam opens the app after waking, then it is the first thing on the home screen, and it was not delivered as a notification while he slept. Symmetrically for Adam leaving something while Eva sleeps.
- [ ] **AC-19** Given nothing is waiting, when the home screen renders, then the anchor slot shows the invitation to leave something for the other one — never an empty container, a placeholder, or a hidden element.

**The book**
- [ ] **AC-20** Given the book is open, when a page is turned, then turning is the primary navigation gesture on both touch and desktop, and page state persists across reload.
- [ ] **AC-21** Given a book of at least 200 pages, when turning through it, then it stays responsive — CTO sets the numeric budget.
- [ ] **AC-22** Given the seeding flow has been completed by at least one of them, when the book is opened, then it is non-empty, in date order, with correct dates and attribution. **Explicit dependency: this AC is only satisfiable via a working seeding flow (AC-42→AC-44). Nothing populates the book automatically — photos do not appear from anywhere.**
- [ ] **AC-23** Given any page, when its author is checked, then it is attributed to whoever the "who am I?" picker said, and both cities' times are recoverable for it.

**Privacy and safety (D1) — the security gate**
- [ ] **AC-24** Given an item marked private, when the ordinary book is turned end to end, when a daily spread renders, when a memory resurfaces, when a thumbnail or share sheet or notification preview is generated, then that item appears in none of them.
- [ ] **AC-25** Given an item marked private, when it is opened, then re-authentication (device biometric or password re-entry) is required, and it is never reachable by a swipe from the main book.
- [ ] **AC-26** Given any upload, when stored, then its default state is not-private and marking is an explicit user action in both directions — nothing is auto-classified.
- [ ] **AC-26a** Given Phase 1 is complete, when the private surface is exercised, then all four of these work end to end: marking on upload, marking/unmarking afterwards, a re-authenticated entrance that is not reachable by a swipe from the book, and deletion from inside it — and the surface is a plain grid, not a second page-turning book.
- [ ] **AC-27** Given a photo containing GPS EXIF data, when uploaded, then the stored and served asset contains no EXIF location, camera, or timestamp metadata.
- [ ] **AC-28** Given any stored media, when a request is made without a valid session, then no media is served; media is reachable only via short-lived signed URLs and never from a publicly guessable path.
- [ ] **AC-29** Given media at rest, when storage is inspected directly, then it is encrypted at rest.
- [ ] **AC-30** Given an item is deleted, when deletion completes, then it is gone from the book, from object storage, from any cache or CDN, and any signed URL issued for it before deletion no longer resolves — verified by replaying a previously working URL and getting a failure.
- [ ] **AC-31** Given any third-party service in the stack (analytics, error reporting, logging), when traffic is inspected, then no media content, media URL, or item caption is transmitted to it.
- [ ] **AC-32** Given a partner is asleep, when any event occurs that would normally notify, then no notification is delivered to their device, and no notification anywhere in the product renders media content in its preview.

**Shell**
- [ ] **AC-33** Given Safari on iOS and Chrome on Android/desktop, when "add to home screen" is used, then it installs with a name and icon and launches standalone with no browser chrome.
- [ ] **AC-34** Given the correct shared password, when submitted, then access is granted and the session persists without re-entry for at least 30 days; given a wrong password, access is refused.
- [ ] **AC-35** Given a first-ever launch, when the "who am I?" picker is answered, then the choice persists on that device and is changeable later without touching the password.
- [ ] **AC-36** Given no network, when the app is opened, then the book and the current suggestion are readable from cache — and no private item is present in that cache.
- [ ] **AC-37** Given every screen in Phase 1, when audited, then each has a designed empty, loading, error, and asleep state, and no placeholder text, no lorem, no TODO, and no unstyled default appears anywhere.
- [ ] **AC-38** Given the full string inventory, when audited, then every reference to either partner uses "Eva" or "Adam" in third person; no second-person construction ("you," "your partner") and no placeholder token stands in for a name; and in every string naming both, Eva appears before Adam.
- [ ] **AC-39** Given the full string inventory and asset list, when audited, then nothing is in Hebrew, no RTL layout path exists, and there is no locale switcher or translation layer (D7).
- [ ] **AC-40** Given a shared day where exactly one of them has posted, when either opens the daily exchange, then a designed half-pair state renders with the posted photo present and the other half warm and forward-looking — no empty slot, no dashed placeholder, no elapsed-time counter, and no copy implying anyone is late or owes anything.
- [ ] **AC-41** Given photos posted in either order across a couple-day, when the day is inspected, then the pair is filed on the same couple-day regardless of who posted first and regardless of how many hours separated them.
- [ ] **AC-42** Given a first run on an iPhone, when the native photo picker multi-select is used to seed a batch, then every selected photo becomes a book page with the correct original date and the correct author, EXIF stripped per AC-27, and the flow completes without a per-photo interaction.
- [ ] **AC-43** Given only one of them has seeded, when either opens the book, then it is turnable and reads as a book rather than a half-finished setup — and specifically: no completion percentage, no progress meter, no two-of-two checklist, no "setup incomplete" state, no elapsed time since the other seeded, and no notification sent to a sleeping partner.
- [ ] **AC-44** Given seeding has been done once, when either wants to add more photos later, then the same multi-select is available from the book with no separate onboarding mode to re-enter or exit.

---

## 10. Non-goals — what this will never be

Written to be quoted back at anyone (including me) who proposes otherwise.

- **Never a product for other couples.** No signup, no onboarding funnel, no multi-tenancy, no pricing, no landing page, no analytics on "users." Two people, forever. If a feature only makes sense with a third user, it's out.
- **Never a scoreboard for the relationship.** No health score, no mood tracking, no compatibility percentage, no charts about them. One count, and it can only go up.
- **Never counts the distance (D2).** No countdown to a reunion, no days-apart, no days-since-we-met, no time-elapsed anything, no "it's been X since you last…". The whole arithmetic-of-separation register is out, not just the one feature that was cut — a number with no end in sight reads as pressure, not comfort. The single permitted quantity is the count of days they both showed up, which measures what they built rather than what they're waiting for.
- **Never gamified — and now it's structural, not a rule (D11).** You don't score a date. No points, levels, badges, coins, rewards, win/lose states, or leaderboards, because scoring a date is a category error rather than a policy someone has to remember.
- **Never rebuilds what already works.** Correspondence chess, Words With Friends, GamePigeon, Duolingo streaks — mature products that already solved turn-based play across timezones and would beat anything we built. The app points at them. Pointing at a good thing is a date too.
- **Never hosts a therapeutic protocol as an asynchronous date.** Not "prefer not to" — never. The **36 Questions full run**, **full Imago Dialogue**, **Hold Me Tight (EFT)**, and **Dreams Within Conflict** are contraindicated *by truncation*: `docs/10-activity-library/WINDOW-CONTRAINDICATIONS.md` states that "the escalating-disclosure design depends on finishing what you start — stopping mid-Set-III leaves the more vulnerable partner exposed with no landing," and that starting a vulnerable conversation which a hard stop then truncates "is worse than not starting." An asynchronous date is a seven-hour gap inserted between every turn — **hosting these would make truncation the mechanic rather than the risk, converting their design into their documented failure mode.** They may one day be *guided live*, which is a different build with a different interaction. This is written at length because it will look like an obvious win to someone in six months, and it is the opposite of one.
- **Never nags about an open date.** No turn reminders, no "your move," no badge counts, no elapsed-turn timers. A date that goes quiet fades; it never accuses.
- **Never social.** No sharing outward, no public links, no export-to-Instagram, no third person seeing anything.
- **Never a messaging app.** iMessage works. The book does not compete with it and does not become a chat.
- **Never a calling app.** FaceTime works. The book sits *beside* the call.
- **Never an AI companion.** Nothing generates affection, writes their messages, or produces prompts a human didn't write. The library is 98 researched activities with 179 sources; that is the content, and it's finite on purpose.
- **Never in an app store.** PWA, home screen, done.
- **Never multilingual (D7).** English only. No Hebrew content, no RTL layout, no bilingual mode, no locale switcher, no i18n scaffolding "for later." Out, not deferred.
- **Never themed on Eden (D5).** They are two people named Eva and Adam. No garden, no apple, no serpent, no rib, no fig leaf, no "paradise," no first-couple framing — in copy, art direction, naming, or code identifiers. The founder chose their names, not a myth.
- **Never wakes anyone.** No notification is ever delivered to a partner whose local time is inside their sleep hours. This is a hard rule, not a setting.
- **Never a content management system.** In Phase 1 the library is a data file, not user-editable content.
- **Never a habit tracker in disguise.** If a feature would make a missed day feel like failure, it's wrong. The count's job is to notice, not to enforce.
- **Never leaks the private half.** Nothing marked private ever appears in an ordinary page-turn, a preview, a thumbnail, a cache, a notification, or a third-party service. This is the one non-goal that is also a security requirement (§9, AC-24→AC-32).

---

## 11. Notes for CTO

Not implementation instruction — flags for planning.

- **`docs/10-activity-library/library.json` is the content source.** 98 records, stable schema (31 fields), plus `windows[]`, `categories[]`, and `cross_thread_artifacts{}` (contraindications, split-day audit, SharePlay map, privacy findings). Read it; don't restate it.
- **Two data-quality issues to handle at ingest:** `cost` is free text beyond `"free"` (31 distinct strings, e.g. `"paid (~$11.99/month Strava subscription)"`) and needs normalizing to a filterable enum; `apple_shareplay` is tri-state (`true` / `false` / `"unknown"`, 16 unknowns) and must not be coerced to boolean.
- **Timezone correctness is the highest-risk area in the build** and the thing most likely to be silently wrong. §2 and AC-1/AC-12/AC-13 are the specification. This is not a place for a helper that subtracts 7.
- **`WINDOW-CONTRAINDICATIONS.md` is an enforcement rule, per the research — not advice.** In Phase 1 it can be a pure filter (near-zero cost); the interrupt UX is Phase 2.
- **D1 is now settled: the product holds intimate media.** Risk tier **Full**; the storage schema and any migration touching it are **Irreversible** and need founder sign-off. AC-24→AC-32 are the gate. Related documented finding (`PRIVACY-NOTES.md`): standard iCloud Backup is not end-to-end encrypted and Advanced Data Protection is opt-in and per-Apple-ID — worth telling the founder as an operational note about their phones, separately from what the app itself does.
- **D3 removed a mechanic, which removes state.** No streak-break job, no grace ledger, no decay timer, no "at risk" state — a monotonic count over completed shared days. If the implementation needs a scheduled job to *break* something, the spec has been misread.
- **The taste re-rank hook already exists** in `build_library.py` (`TASTE_PROFILE` + `apply_taste()`), which is what C25 feeds in Phase 2. Don't build a parallel ranking system.
- **Sequencing flag:** the shared-day model is a schema decision that everything else depends on. It should be settled before the daily picture and the count are built, not during. Same for the private/not-private field — retrofitting a privacy boundary onto existing rows is exactly the migration nobody wants to run.
- **Copy is literal.** "Eva" and "Adam", third person, no placeholder tokens, no per-viewer string variants, no i18n scaffolding (D7). One canonical string per surface.
- **D10 is the largest single item in Phase 1 after the book, and it redefines Pillar 1 rather than extending it.** Please size it explicitly and tell CEO the number — §8 documents what I traded out to pay for it, but the trade may not be enough and I'd rather that surface as a number than as a slip. The three Phase 1 dates were chosen to **share one interaction shape** (alternating short-text turns, no timer, resumable, ends with a page) precisely so the subsystem is built once; if the implementation ends up with three bespoke date UIs, the selection rationale has been lost.
- **The date-session state names are a product decision, not a schema convenience.** `open` / `finished` / `faded` only. `failed`, `abandoned`, `expired`, `stale`, `timeout` must not appear as enum values, column names, or comments — names leak into strings eventually, and this one would leak into the exact feeling the product is built to avoid.
- **Date #3 (the paired question) should reuse the couple-day completion logic**, not a parallel implementation. It is the daily photo pair with text instead of an image: complete when couple-day `D` holds a contribution from Eva and one from Adam. If it grows its own completion rule, two things that must agree will drift.
- **The 30-day fade needs no scheduled job.** Like the count (D3), it's derivable — a date is faded if its last turn is older than 30 days. Nothing needs to run, nothing needs to mutate, and there is nothing to get wrong at 3am.

### Two divergences between this PRD and `LDR-APP-ARCHITECTURE.md` — flagged, not assumed

**1. §3.4 streak semantics contradicts D3.** The architecture defines the streak as *consecutive* complete couple-days, with grace credits (one per rolling 7 days), a `pauses` table for visits, and "two incomplete days in a row with no credit ends the streak." That is a *softer breakable streak*. D3 is an *unbreakable count*: complete days are counted, incomplete days are not counted, nothing ever breaks or resets. The architecture's stated intent is right and its §3.4 reasoning is good — the founder simply went further than it assumed, after it was written.

The correction simplifies the build rather than complicating it: the count becomes `count(*)` over complete couple-days instead of a consecutive-run scan; **`streak_grace_per_week` and the whole grace-credit mechanism can be deleted**; and the **`pauses` table is no longer needed for this purpose** — during a visit, days simply aren't complete and therefore aren't counted, with nothing to pause. CTO's instinct to compute from a view rather than store a mutable counter is exactly right and should stay.

**2. ~~The seam affordance's ±2 h window doesn't cover Adam's most natural posting hour.~~ — SUPERSEDED. CEO endorsed this flag and sent it to CTO before the model ruling landed; it needs retracting in its original form so nobody builds against it.**

The flaw was specific to the 08:00Z anchor: a fixed ±2h window around IL 10:00/11:00 missed Adam's IL 05:00–08:00 morning, so a daily photo of his own morning filed to the previous day with no toggle. **Under the reinstated local-date model that photo files under Adam's own date, correctly, by construction. The flaw dissolves with the model that had it.**

What survives, in better form: a seam still exists, but it moves to **each person's own local midnight** — the boundary humans already understand ("it's 00:30 but this is still Tuesday night to me") rather than an abstract UTC instant. So keep a "post to the other day" toggle on daily posts, anchored there. It is simpler than the version CEO endorsed, and it also covers the one real hazard introduced by preferring the device-reported zone: a photo posted mid-flight or on a device with a stale timezone.

Divergence 1 stands. Neither is a blocker.

---

## 12. Open questions for the founder

All five answered 2026-08-02 and locked in §0.

1. ~~Is there a next-visit date?~~ → **D2. No date; countdown cut, and the whole counter register with it.**
2. ~~Names or second person?~~ → **D4 + D5. "Eva & Adam." Real names, third person, Eva first, no Eden theming.**
3. ~~How forgiving should the streak be?~~ → **D3. It never breaks. It only counts up.**
4. ~~Where do the existing photos live?~~ → **Answered. Two iPhone camera rolls, nothing to integrate with. No import; native iOS multi-select, seeded by hand. Now a Phase 1 screen with its own states and ACs (§4, AC-42→AC-44).**

**Nothing is outstanding.** Every question that changes the build has an answer.
5. ~~Will this hold anything genuinely private?~~ → **D1. Yes. Risk tier Full; AC-24→AC-32 added.**

---

## Appendix — the research this rests on

| Claim used | Source | Type |
|---|---|---|
| 60 of 98 activities are `works_asymmetric`; 24 need both alert, 20 of those work on Saturday | `library.json` | fact (countable) |
| No couple app documents split-day behaviour; 8 of 10 undocumented, 2 survive only by having no daily mechanic | `APP-COMPATIBILITY.md` Part 3 (T6) | verified research |
| 7 window contraindications, reducible to truncation / depletion / asymmetry-breaks-premise | `WINDOW-CONTRAINDICATIONS.md` (T5) | verified research |
| LDR couples idealize more; idealization + long gaps predicts instability at reunion | Stafford & Merolla 2007, *JSPR* 24(1) | peer-reviewed, high confidence |
| Video restructures couple connection vs. in-person; the couple advantage disappears on video | *SCAN* 2025, PMC12413897 | peer-reviewed, high confidence |
| Standard iCloud Backup is not E2E; ADP is opt-in and per-Apple-ID | `PRIVACY-NOTES.md`, Apple Platform Security | verified, high confidence |
| IL/NY gap is 6h for ~26 days a year | tzdata, `Asia/Jerusalem` / `America/New_York`, computed 2026-08-02 | fact (computed) |
| Tiers are logistics-only; no taste profile was collected | `library.json` → `ranking.basis` | stated by source |

**Grounding gap, stated plainly:** `.claude/memory/USER-INSIGHTS.md` is empty. The customer language in this document comes from the founder's own words in the brief and from the couple's window names in `library.json`, which for a two-person product is the primary source rather than a proxy for it. Every Reach and Impact figure in §7 is `(assumed)` and should be revised the moment the product has been used for two weeks. I've populated USER-INSIGHTS.md with the verbatim phrases available so downstream agents inherit the same grounding.
