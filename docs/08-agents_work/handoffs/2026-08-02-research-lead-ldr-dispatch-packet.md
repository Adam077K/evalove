---
date: 2026-08-02
author: research-lead
type: dispatch-packet
consumer: ceo
threads: 7
target_total_activities: 103
window_model: 9-window full overlap clock (v2, supersedes 2-window v1)
categories: live-together | games | deep-talk | intimacy
status: READY_TO_DISPATCH
---

# LDR Activity Library — Researcher Dispatch Packet (v3)

**Purpose:** produce a sourced, personally-calibrated activity library for one specific long-distance couple (Israel ↔ NYC), which will become a small website the couple opens live during video calls to pick what to do together.

**v2 change:** the two-window model is dead. The library now covers the **full overlap clock — nine windows (W1–W9)**. Thin windows are an explicit hunting target, not an afterthought.

**v3 changes (2026-08-02, post-founder-answers):**
1. **`category` enum gains a fourth value: `"intimacy"`.** Physical and sexual intimacy was an unintentional omission in v1/v2 and is now in scope as thread **T7** (§3.7). T1–T6 were dispatched with the three-value enum and are unaffected — T7 is the only thread emitting `"intimacy"`. Synthesis validates against the four-value enum.
2. **W2 is downgraded from thin window to opportunistic.** She is up at NYC 05:00–07:00 only sometimes, mostly weekends. W2 is no longer hunted, no longer rewarded by the thin-window ranking factor, and its coverage-matrix cells are advisory — never RED. See §4.6. T1–T6 are mid-flight with W2 still framed as a thin window; this is absorbed at synthesis, not by interrupting them.
3. **Taste-profile re-ranking is now a planned step** (§4.3a), not a recommendation. The founder's taste profile is being collected in parallel and is assumed to arrive before synthesis.

**How to use this file:**
1. Copy the **SHARED PREAMBLE** (§1) once.
2. For each of the 6 threads (§3), paste `SHARED PREAMBLE` + that thread's JSON block as the `prompt` of a single `researcher` Task call.
3. Spawn all 6 in **one message** so they run concurrently.
4. Return all 6 outputs to Research-Lead for synthesis (§4).

**Pre-flight note:** `.claude/memory/USER-INSIGHTS.md` and `.claude/memory/DECISIONS.md` are both empty templates as of 2026-08-02. There is **no prior research to dedupe against** — all six threads are greenfield.

---

## §0 — Thread map (non-overlap contract)

| Thread | Slug | Owns | Yield | Thin windows it must feed |
|---|---|---|---|---|
| T1 | `shareplay-cowatch` | Synchronized media + SharePlay capability map | 13 | W3, W4, W6 |
| T2 | `co-presence-parallel-life` | Body doubling, co-cooking, workouts, sleep calls, ambient presence | 16 | W2, W3, W4, W8, W9 |
| T3 | `digital-two-player-games` | App/browser/console two-player games, async + real-time | 16 | W4, W8, W9 |
| T4 | `analog-verbal-mirrored-games` | Eyes-closed verbal games, mirrored board games, quizzes | 16 | W3, W4 |
| T5 | `evidence-based-protocols` | Citable psychology protocols (Aron, Gottman, EFT, Imago) | 13 | W6, W7 (long-form), plus micro-versions for W4 |
| T6 | `decks-journals-future-planning` | Commercial decks & couple apps, shared journals, check-in rituals | 16 | W3, W4, W8, W9 |
| T7 | `intimacy-across-distance` | Physical & sexual intimacy, long-distance touch devices, embodied presence, privacy/security | 13 | W4, W8, W9 (via anticipation) |
| | | **TOTAL** | **103** | |

**Ownership rule for boundary cases** (each thread carries its own `not_yours` list):
- A *game* that happens to support SharePlay belongs to **T3**, not T1. T1 only records its SharePlay status in the capability appendix.
- *Cook-along with a cooking show* belongs to **T2** (the doing), not T1 (the watching).
- *36 Questions* and any protocol with a published citation belongs to **T5**. A *purchasable deck* packaging similar questions belongs to **T6**.
- *Sleep calls* → **T2**. *Bedtime verbal games* → **T4**. *Bedtime deep questions* → **T6**.
- *Ambient "I'm here while you work" presence* → **T2** (this is the W8/W9 workhorse).
- **T7 boundary (new in v3):** *Sleep calls and falling asleep on call* stay with **T2** — T7 owns synchronized wearables, worn/scented objects, and touch devices. A conversation whose endpoint is **emotional** intimacy → **T5/T6**; a conversation whose endpoint is **physical/sexual** (desire mapping, erotic communication, negotiating what each wants) → **T7**. *Co-watching adult content together* → **T7** for the activity, **T1** for the sync mechanics (T7 cites T1's SharePlay appendix rather than re-deriving it).

---

## §1 — SHARED PREAMBLE (paste verbatim at the top of all 6 researcher briefs)

```text
You are a researcher worker. You are answering ONE bounded question for a
personally-calibrated activity library. Your output feeds a website directly, so
it must be machine-clean and every entry must be real and sourced.

=========================================================
THE COUPLE
=========================================================
- Person A ("he"): lives in ISRAEL, UTC+3. Works Sun-Thu. Flexible: up from 5:00am,
  and also available late at night.
- Person B ("she"): lives in NEW YORK CITY, UTC-4. Works Mon-Fri. Flexible: late
  night, late afternoon/early evening, and reachable at some other points in her day.
- Time gap: 7 hours, Israel ahead.
- Channel: FaceTime is primary. Both are on Apple devices, so Apple SharePlay is
  natively available and must be checked for every activity.

=========================================================
THE OVERLAP CLOCK — NINE WINDOWS. This is the core of the whole project.
=========================================================
Do NOT design only for the comfortable windows. The library must cover the whole
clock. Tag every activity with EVERY window it genuinely suits.

W1 — his early morning / her late night     IL 05:00-09:00  <->  NYC 22:00-02:00
     She is in bed winding down: sleepy, low light, possibly lying in the dark,
     may not want to hold a phone. He is fresh, just woken, hands free, mobile.
     Character: cozy, intimate, low-light. Duration ceiling ~180 min.

W2 — his midday / her dawn                  IL 12:00-14:00  <->  NYC 05:00-07:00
     Only works if she is up early. Narrow but real. He is mid-workday (lunch).
     Character: brief, waking-up, quiet. Duration ceiling ~60 min. THIN WINDOW.

W3 — his afternoon / her morning            IL 14:00-17:00  <->  NYC 07:00-10:00
     Her getting-ready and commute time. She is MOBILE, HANDS BUSY, often cannot
     look at a screen, may be on public transit with headphones. He is at work.
     Character: audio-first, no-screen, short. Duration ceiling ~45 min. THIN WINDOW.

W4 — his evening / her workday midday       IL 18:00-21:00  <->  NYC 11:00-14:00
     Her lunch break. She may be at a desk, in an office, or in public — audio out
     loud may be impossible, video may be awkward, and she has a hard stop.
     He is home, free, relaxed, post-work. Character: bounded, discreet,
     text-or-headphones tolerant. Duration 30-60 min HARD BOUND. THIN WINDOW.

W5 — his late night / her late afternoon    IL 22:00-01:00  <->  NYC 15:00-18:00
     He is fading: tired, end of day, on a couch or in bed. She is post-work
     energized, hands free, possibly out, possibly hungry.
     Character: he is passive, she is active. Duration ceiling ~120 min.

W6 — his deep night / her prime evening     IL 01:00-05:00  <->  NYC 18:00-22:00
     Her best hours, his hardest. He must stay up late or set an alarm — it COSTS
     him something. Reserve for occasional special occasions; the cost is exactly
     what makes it meaningful. Character: rare, event-grade, worth the sacrifice.
     Duration: unbounded, but must justify the price.

W7 — SATURDAY, the only full shared day off (Israel works Sun-Thu, US Mon-Fri).
     Both fresh, both free, unbounded. THE slot for long, high-energy, both-present
     activities. Note: Shabbat runs Friday evening to Saturday evening in Israel —
     flag any activity that would collide with it.

W8 — his Friday off / her workday.  He has the WHOLE DAY free; she is working.
     Asymmetric free day. Character: he is ambient and available all day, she dips
     in and out. Long-running, low-commitment, resumable. THIN WINDOW.

W9 — her Sunday off / his workday.  Mirror of W8: she has the whole day, he works.
     THIN WINDOW.

THIN WINDOWS = W2, W3, W4, W8, W9. These slots are currently EMPTY and are the
highest-value thing you can find. A 20-minute activity that only works during her
lunch break is MORE valuable to this project than a tenth cozy-evening idea.
Hunt for them deliberately. Never discard an activity for fitting only one window.

ENERGY ASYMMETRY remains a first-class filter, but it now VARIES BY WINDOW:
  - W1: she is low, he is high.
  - W3/W4: she is functional-but-constrained (mobile/public/desk), he is relaxed.
  - W5: he is low, she is high.
  - W6: he is very low (or paying a real cost), she is high.
  - W7: both high — the ONLY reliably symmetric window.
  - W8/W9: one is fully free, the other is working — availability asymmetry, not
    energy asymmetry.
Activities that TOLERATE asymmetry are good. Activities that EXPLOIT it (one
narrates while the other listens with eyes closed; one cooks while the other reads
the recipe aloud; one plays a turn at 6am and the other answers at 11pm) are BEST.

CROSS-BORDER FRICTION you must actively check and report:
  - Streaming catalogs differ between Israel and the US (a title on US Netflix may
    not exist on Israeli Netflix). Region-locked content is a REAL blocker.
  - App Store regions differ (IL vs US storefront availability).
  - Physical items must ship to Israel AND the US, or be buyable in both.
  - Currency/payment differences (ILS vs USD).
  - They sit on opposite holiday calendars (Israeli vs US). Note where relevant.

=========================================================
ANTI-SLOP MANDATE — read this twice
=========================================================
The internet is saturated with SEO listicles that recycle the same twelve generic
ideas ("watch a movie together!", "play 20 questions!", "send a care package!").
Those articles are WORTHLESS to this task. If a result reads like
"50 Long Distance Relationship Ideas" with no author, no specificity, and no
named tools, CLOSE IT and go deeper.

You are hunting for SPECIFIC, NAMEABLE, VERIFIABLE things:
  - A named app, with its actual App Store / product page.
  - A named game, with its publisher page or store listing.
  - A named protocol, with its academic paper or institute page.
  - A specific ritual described by real couples in their own words, on a forum,
    with the permalink.
"Watch a movie" is NOT an activity. "Blind rewatch: she picks a film he has never
seen, mutes her own audio for the first 10 minutes so his reactions are unprimed"
IS an activity. Push to that level of specificity.

PREFERRED SOURCE TYPES (roughly in order):
  1. Official product / vendor / developer documentation (Apple Support, App Store
     listings, publisher pages, API docs)
  2. Peer-reviewed papers and named institutes (for anything psychological)
  3. Real community consensus with permalinks: reddit.com/r/LongDistance,
     r/LDR, r/longdistancerelationship, r/ADHD (for body doubling), r/boardgames,
     BoardGameGeek forums, Hacker News
  4. First-person accounts from identifiable people (a named blogger, a YouTube
     couple, a newsletter) where the activity is described concretely
  5. LAST RESORT: general articles — and only if they name specific tools

=========================================================
SOURCING RULES — non-negotiable
=========================================================
- NEVER invent an activity. NEVER invent a source. NEVER invent a URL.
- Every activity needs a real `source_url` you actually opened.
- If a claim cannot be sourced, either DROP it or include it with
  `confidence: low` and an explicit note in `gaps` saying what is unverified.
- Prefer 10 real, specific, verifiable activities over 30 vague ones.
  Under-delivering on count with high quality is ACCEPTABLE. Padding is NOT.
- If you cannot verify whether something supports SharePlay, write
  `apple_shareplay: "unknown"`. Do not guess true/false.

=========================================================
CROSS-CUTTING QUOTAS — every thread must satisfy all six
=========================================================
1. THIN-WINDOW QUOTA (the most important one): at least 25% of your returned
   activities must fit at least one of W2, W3, W4, W8, W9. Of those, at least TWO
   must work under the W3/W4 constraints specifically — that is, playable while she
   is mobile with hands busy, or at a desk / in public where audio out loud and
   full video attention are not available. Your brief names the thin windows your
   territory is best placed to fill. If your territory genuinely cannot serve them,
   say so explicitly in `gaps` — do not fake it.
2. ASYMMETRY QUOTA: at least 30% of your activities must be
   `energy_symmetry: works_asymmetric` or `best_when_one_is_sleepy`.
3. WINDOW HONESTY: do NOT tag every activity with all nine windows. Tag only the
   windows where it genuinely works, and justify in `timezone_friction`. Precision
   is the product. An activity that only works in W4 is valuable BECAUSE it is
   precise — tag it `["w4"]` alone and be proud of it.
4. DURATION SPREAD: include short options (10-20 min) as well as long ones. Most
   windows are narrow; W4 is hard-capped at 60 minutes.
5. COST SPREAD: majority should be `free`. This is a daily-use library, not a
   bucket list.
6. RITUAL BIAS: prefer things that survive repetition (`repeatable` / `ritual`)
   over one-time novelties. They need daily fuel, not a to-do list.

=========================================================
PER-ACTIVITY OUTPUT SCHEMA — mandatory, identical across all threads
=========================================================
id                kebab-case unique slug, prefixed with your thread id, e.g. "t3-chess-daily-ladder"
name              short human name
category          "live-together" | "games" | "deep-talk"
subcategory       free text, 1-3 words
one_liner         one sentence: what it actually is
how_it_works      array of 3-6 concrete steps
window_fit        array, any of ["w1","w2","w3","w4","w5","w6","w7","w8","w9"]
                  — tag EVERY window it genuinely suits, and ONLY those
energy_required   "low" | "medium" | "high"
energy_symmetry   "works_asymmetric" | "needs_both_high" | "best_when_one_is_sleepy"
duration_min      integer, typical minutes
setup_effort      "none" | "light" | "prep_needed"
tools_needed      array of specific named apps/accounts/objects
cost              "free" | "cheap" | "paid"   (if paid, append approx price, e.g. "paid ($24.99)")
timezone_friction one line: what the 7h gap / offset weekends / region locks do to this,
                  and WHY you tagged the windows you tagged
apple_shareplay   true | false | "unknown"
novelty_curve     "one_time" | "repeatable" | "ritual"
intimacy_level    integer 1-5   (1 = light/fun, 5 = vulnerable/deep)
source_url        real URL you opened
source_date       publication date if known, else access date (2026-08-02)
confidence        "high" | "medium" | "low"

=========================================================
HOW TO RETURN
=========================================================
A) Write your raw JSON to:
   docs/08-agents_work/research/2026-08-02-ldr-<THREAD_ID>-<SLUG>.json
   Format: { "thread_id": ..., "activities": [ ...schema objects... ],
             "gaps": [...], "confidence_summary": "...", "sources": [...],
             "thin_window_note": "which of W2/W3/W4/W8/W9 you served and which you
                                  could not, and why" }
   (plus any thread-specific extra deliverable named in your brief)
B) ALSO return the same JSON inline as your final assistant message, so the
   orchestrator gets it even if the file is missed.
C) End with: activity count, thin-window count, confidence_summary (high/medium/low
   + one-line reason), and `gaps` — everything you could not verify.

BUDGET: aim for roughly 25-35 web searches/fetches. Do not exceed 45. If you are
running out of budget, return what you have with an honest gap list rather than
padding with unsourced entries.
```

---

## §1a — PREAMBLE DELTA (append to the SHARED PREAMBLE **for T7 only**)

§1 above is preserved verbatim as the text T1–T6 actually received. T7 is dispatched later and needs three corrections. Paste §1, then this block, then the T7 brief.

```text
=========================================================
CORRECTIONS TO THE PREAMBLE ABOVE — these override it
=========================================================
1. The `category` field now has FOUR legal values, not three:
     "live-together" | "games" | "deep-talk" | "intimacy"
   Your thread emits "intimacy".

2. W2 IS DOWNGRADED. The preamble lists W2 (his midday / her dawn, IL 12:00-14:00
   <-> NYC 05:00-07:00) as a thin window to hunt. It is NOT. She is up at 5-7am
   only sometimes, mostly at weekends. Do NOT spend budget hunting activities for
   W2. If something you find happens to fit W2, tag it `w2` and note "only if
   she's up" in `timezone_friction` — but W2 is opportunistic, not a target.
   The THIN WINDOWS you should actively hunt are: W3, W4, W8, W9.

3. REGISTER. Write matter-of-fact and practical, for two adults in a committed
   relationship. Clinical but warm — the same register a good sex therapist uses
   in a book, or the register the evidence-based-protocols thread uses for
   Gottman. Not coy, not euphemistic, not lurid, not jokey. If you would not write
   it in a clinician's handout, rewrite it. The couple will read these entries
   together on a screen; dignity is the bar.
```

---

## §2 — Dispatch instruction for the CEO

Spawn all six in a single message:

```
Task(subagent_type: "researcher", name: "ldr-t1-cowatch",    prompt: <PREAMBLE> + <T1 JSON>)
Task(subagent_type: "researcher", name: "ldr-t2-copresence", prompt: <PREAMBLE> + <T2 JSON>)
Task(subagent_type: "researcher", name: "ldr-t3-digigames",  prompt: <PREAMBLE> + <T3 JSON>)
Task(subagent_type: "researcher", name: "ldr-t4-analoggames",prompt: <PREAMBLE> + <T4 JSON>)
Task(subagent_type: "researcher", name: "ldr-t5-protocols",  prompt: <PREAMBLE> + <T5 JSON>)
Task(subagent_type: "researcher", name: "ldr-t6-decks",      prompt: <PREAMBLE> + <T6 JSON>)
```

T7 is dispatched separately (it was commissioned after T1–T6 were already running) and is the **only** thread that gets the §1a delta:

```
Task(subagent_type: "researcher", name: "ldr-t7-intimacy",  prompt: <PREAMBLE> + <§1a DELTA> + <T7 JSON>)
```

Retry policy: max 3 retries per thread. After 3 failures, accept PARTIAL and pass what exists to synthesis.

---

## §3 — The six thread briefs

### T1 — `shareplay-cowatch`

```json
{
  "thread_id": "T1",
  "slug": "shareplay-cowatch",
  "category_owned": "live-together",
  "bounded_question": "What are the specific, distinct FORMATS of watching or listening to something simultaneously that an Israel-NYC couple on FaceTime can actually run today — including short-form and audio-only formats that fit a 30-minute lunch break or a hands-busy commute — and exactly which apps support Apple SharePlay natively vs. requiring a third-party sync tool or screen sharing?",
  "why_this_thread": "Co-watching is the highest-frequency LDR activity and the one most degraded by region-locked catalogs and broken sync — it needs technical verification, not vibes. Audio-only co-consumption is also the single best fit for her commute (W3), which nothing else serves.",
  "thin_windows_you_own": ["w3 (audio-only, hands-busy, no screen)", "w4 (short-form, <=60 min, headphones, discreet)", "w6 (event-grade: the thing worth him staying up for)"],
  "search_strategy": {
    "priority_sources": [
      "support.apple.com SharePlay documentation and the official supported-apps list",
      "apps.apple.com listings (check the 'SharePlay' capability badge on each app page)",
      "Official help pages: Netflix, Disney+ GroupWatch, Prime Video Watch Party, Hulu Watch Party, Max, Apple TV+, Plex Watch Together, Spotify Group Session, Apple Music SharePlay, Apple Podcasts",
      "Teleparty / Scener / Kast / Rave / Metastream / Syncplay official docs and current status (several have shut down or changed — VERIFY they are alive in 2026)",
      "reddit.com/r/LongDistance permalinks where couples describe a specific watch or listen ritual"
    ],
    "query_seeds": [
      "site:support.apple.com SharePlay supported apps FaceTime",
      "\"SharePlay\" site:apps.apple.com",
      "Disney+ GroupWatch different countries region restriction",
      "Netflix profile region lock watch together different country",
      "Teleparty 2026 still working",
      "Plex Watch Together how it works",
      "Spotify Group Session two people different countries",
      "Apple Podcasts SharePlay listen together",
      "site:reddit.com/r/LongDistance \"we watch\" every night -\"ideas for\"",
      "site:reddit.com/r/LongDistance audiobook together listen same time",
      "shared audiobook listening two people different devices sync"
    ],
    "avoid": "Any article titled like '20 Long Distance Movie Night Ideas'. Any page that lists apps without linking to the app's own documentation."
  },
  "target_yield": 13,
  "must_cover": [
    "The Apple SharePlay capability map: which major streaming/music/podcast apps support SharePlay over FaceTime natively as of 2026, and which do not — with the Apple or vendor URL for each",
    "Region-lock reality: what actually happens when an Israeli account and a US account try to co-watch the same title (catalog mismatch, GroupWatch country restrictions, subscription-sharing rules) — this is the single biggest blocker and must be researched, not assumed",
    "SHORT-FORM formats that fit inside her 60-minute lunch (W4): a single 22-minute sitcom episode, a YouTube video essay, a short documentary, a stand-up set segment — plus the discretion problem (she may be at a desk or in public and cannot play audio out loud). Name formats, not just runtimes.",
    "AUDIO-ONLY co-consumption for the commute and the sleepy window (W3 and W1): co-listening to an album start to finish, a podcast episode, an audiobook chapter, one partner reading aloud over the call. Verify which apps actually sync playback vs. requiring a manual countdown. These are the W3 workhorses and nothing else in the library serves W3.",
    "Distinct long-form co-watch FORMATS for W1, W5, W6, W7 — not just tools: serialized one-episode-a-night, blind rewatch of a favourite, commentary-track viewing, reaction-cam viewing, foreign-language film with subtitles, YouTube rabbit-hole night, documentary + pause-to-discuss",
    "W6 event-grade viewing: what is genuinely worth him setting a 2am alarm for — live US sports, awards shows, election nights, a season finale premiering on US time — including the spoiler-avoidance problem when one partner is 7 hours ahead and could see the result first",
    "Fallback stack when SharePlay fails: screen-sharing over FaceTime, the '3-2-1 press play' manual sync, and which of those degrade audio quality"
  ],
  "not_yours": [
    "Games of any kind, including SharePlay-enabled games — those go to T3. Record their SharePlay status in your appendix ONLY, do not write activity entries for them.",
    "Cooking along with a cooking show — that is T2 (the doing, not the watching).",
    "Working out along to a video — that is T2.",
    "Reading a book aloud as a bedtime ritual to help her sleep — that is T2's narration territory. You own co-listening to a PUBLISHED audiobook; T2 owns him reading to her."
  ],
  "extra_deliverable": "A `shareplay_capability_appendix` array, separate from `activities` and NOT counted toward your yield: [{app_name, category, shareplay_supported: true|false|unknown, requires_both_subscribed: true|false, region_lock_notes, source_url}]. Cover at least 15 apps including games (so other threads can reference it).",
  "return_format": "Per the SHARED PREAMBLE schema, plus shareplay_capability_appendix and thin_window_note."
}
```

---

### T2 — `co-presence-parallel-life`

```json
{
  "thread_id": "T2",
  "slug": "co-presence-parallel-life",
  "category_owned": "live-together",
  "bounded_question": "What specific, named practices let two people on an open video call do ordinary life SIDE BY SIDE rather than entertaining each other — including the case where one is fully free all day and the other is at work, and the case where one is falling asleep and the other is fully awake?",
  "why_this_thread": "Parallel presence is the only mode that tolerates every kind of asymmetry this couple has — energy, schedule, and availability. It is the ONLY territory that can serve W8/W9 (one person's whole day off while the other works), and it is the most buried under listicle slop, so it needs community sourcing.",
  "thin_windows_you_own": ["w2 (his lunch / her dawn — waking-up-together rituals)", "w3 (her commute — walk-and-talk, mobile, hands busy)", "w4 (her lunch — co-eating: his dinner is her lunch)", "w8 and w9 (ambient all-day presence while the other works) — YOU ARE THE PRIMARY OWNER OF W8/W9, no other thread can serve them well"],
  "search_strategy": {
    "priority_sources": [
      "Body-doubling literature: Focusmate, Flow Club, Caveday official docs; r/ADHD threads on body doubling; ADDitude Magazine",
      "reddit.com/r/LongDistance and r/LDR permalinks where couples describe a specific daily ritual in their own words",
      "'Study with me' / 'work with me' culture on YouTube and Twitch — the mechanics, not the channels",
      "Sleep-call discussions: r/LongDistance threads on falling asleep on call, plus any product built for it",
      "Named cook-along and workout-along products: identical-meal-kit services and whether they ship to Israel, Apple Fitness+ SharePlay status, Zwift/Strava group features",
      "Remote-work 'virtual office' tools couples repurpose: Around, Gather, Tuple, Discord always-on voice channels"
    ],
    "query_seeds": [
      "site:reddit.com/r/LongDistance \"sleep call\" every night",
      "site:reddit.com/r/LongDistance \"body doubling\" OR \"work together\" video call",
      "site:reddit.com/r/ADHD body doubling how it works",
      "Focusmate how it works session structure",
      "Apple Fitness+ SharePlay work out together",
      "site:reddit.com/r/LongDistance \"we cook\" same recipe together",
      "site:reddit.com/r/LongDistance \"leave the call on\" all day while working",
      "always on voice channel couple presence Discord",
      "site:reddit.com/r/LongDistance walk and talk phone call commute",
      "reading aloud to partner over phone ritual chapter a night",
      "\"parallel play\" adults relationship intimacy"
    ],
    "avoid": "Generic 'virtual date night ideas' pages. Anything that says 'just do chores together!' without describing an actual structure."
  },
  "target_yield": 16,
  "must_cover": [
    "AMBIENT ALL-DAY PRESENCE for W8/W9 — the asymmetric free day, where one has the whole day and the other is working: the always-on low-attention call, the 'I'll be here, dip in when you can' contract, Discord/Around-style persistent voice rooms, him running errands with the call open while she works, resumable multi-hour presence. Verify the practical mechanics: battery, data, what devices survive an 8-hour call. NO OTHER THREAD CAN SERVE W8/W9 — this is your most important section.",
    "Body doubling / co-working: named services (Focusmate, Flow Club, Caveday) AND the DIY version over FaceTime; Pomodoro structures; the 'silent call' contract (camera on, mics on, no talking). Flagship W5 activity and a strong W8/W9 one.",
    "Sleep calls / falling asleep on video (W1) — the actual mechanics couples report: device placement, battery and overheating, Do Not Disturb behaviour, who hangs up, ambient-noise variants, and the specific 7h-gap version where he wakes up onto a call she is still sleeping through",
    "Co-cooking and co-eating across the clock: same-recipe cooking (W7), the asymmetric-meal pattern where his dinner is her lunch (W4) or his lunch is her breakfast (W2), one cooks while the other reads the recipe aloud, and whether food delivery can actually be ordered to an address in the other country (verify for Israel)",
    "MOBILE / HANDS-BUSY co-presence for W3: walk-and-talk with the camera out, her commute with him on audio, the sunrise-walk vs sunset-walk asymmetry created by the 7h gap, getting-ready-together on speakerphone. Must be doable with no hands and no screen.",
    "Movement: working out to the same class, stretching/yoga wind-down for the sleepy partner, running the same route on different continents with Strava comparison",
    "The narration / one-active-one-passive pattern explicitly: reading aloud until she sleeps, whisper calls, him walking her through his day while she lies in the dark, a guided tour of his neighbourhood. These exploit the asymmetry rather than fighting it and are the highest-value entries in this thread."
  ],
  "not_yours": [
    "Watching a film, show, or published audiobook together — T1 owns synchronized media.",
    "Any structured question or prompt exercise — T5 and T6 own those.",
    "Games with rules and a winner — T3 and T4."
  ],
  "return_format": "Per the SHARED PREAMBLE schema, plus thin_window_note."
}
```

---

### T3 — `digital-two-player-games`

```json
{
  "thread_id": "T3",
  "slug": "digital-two-player-games",
  "category_owned": "games",
  "bounded_question": "Which specific, currently-available digital games (iOS, Mac, browser, or console) can exactly TWO people on different continents play together — and for each, is it real-time-required or asynchronous, does it fit inside a 30-60 minute lunch break, and does it work over Apple SharePlay?",
  "why_this_thread": "Asynchronous games are the single best structural fit for a 7-hour gap and an offset work week — they turn the gap from a problem into the game's clock. They are also the only category that fills W8/W9 and W4 without needing both people present.",
  "thin_windows_you_own": ["w4 (short real-time sessions and discreet silent games playable at a desk)", "w8 and w9 (asynchronous turns taken across an asymmetric free day)", "w2 (a single quick turn over her coffee)"],
  "search_strategy": {
    "priority_sources": [
      "apps.apple.com store listings (authoritative for availability, price, and SharePlay badge)",
      "Official game/developer sites and their multiplayer documentation",
      "Apple Arcade multiplayer catalogue; Netflix Games catalogue; Game Center turn-based docs",
      "Board Game Arena, Tabletopia, PlayingCards.io — official rules on two-player and asynchronous/turn-based play",
      "reddit.com/r/LongDistance and r/iosgaming threads naming specific games couples actually stuck with"
    ],
    "query_seeds": [
      "site:reddit.com/r/LongDistance \"games we play\" -\"top 10\"",
      "site:apps.apple.com GamePigeon iMessage games list",
      "SharePlay games FaceTime multiplayer site:apps.apple.com",
      "Apple Arcade two player online multiplayer list",
      "Board Game Arena turn-based asynchronous two player",
      "site:reddit.com/r/iosgaming best two player cross device asynchronous",
      "GeoGuessr duels two players private",
      "chess.com daily games correspondence how it works",
      "Netflix Games multiplayer two player",
      "Stardew Valley co-op iOS multiplayer cross platform",
      "NYT Games Wordle Connections share score with friend"
    ],
    "avoid": "Listicles of 'best couple games'. Any game you cannot confirm is still live and still two-player in 2026 — check the store listing's last-updated date."
  },
  "target_yield": 16,
  "must_cover": [
    "ASYNCHRONOUS / CORRESPONDENCE games that exploit the 7h gap instead of fighting it — he moves at 6am, she answers at 11pm, the game lives in the gap: Chess.com daily games, Words With Friends, Wordfeud, turn-based Game Center titles, Board Game Arena turn-based mode. These are the strategic core of this thread AND the answer to W8/W9. Aim for at least 5 of your 16 here.",
    "iMessage / GamePigeon games specifically — both partners are on Apple, this is a zero-friction surface that also works silently at a desk (W4). Enumerate the actual game list.",
    "SHORT real-time games that fit a hard 30-60 minute stop (W4): verify actual session length, not marketing claims. A game with no natural stopping point is a bad W4 fit — say so.",
    "Real-time browser games needing only a shared link (skribbl.io, Gartic Phone, PlayingCards.io, Codenames online, Jackbox via screenshare, GeoGuessr duels) — verify each is currently live and works for exactly 2 players, since many party games need 3+",
    "Games verified to run over Apple SharePlay natively, with the source that confirms it",
    "Long-running leagues and score-keeping formats: NYT Games/Wordle/Connections shared scores, Duolingo leagues and streaks, Strava, chess ratings, weekly ladders and seasons. These create continuity BETWEEN calls, which is exactly what a 7h gap needs, and they populate the thin windows for free.",
    "Cross-platform and region checks: confirm iOS availability, whether the app exists on both the Israeli and US App Store, and price in both regions where it is paid"
  ],
  "not_yours": [
    "Verbal games with no app (20 Questions, Would You Rather, story games) — T4.",
    "Physical board games played by mirroring two copies over camera — T4.",
    "Quizzes about each other — T4.",
    "Co-watching a game stream — T1."
  ],
  "return_format": "Per the SHARED PREAMBLE schema, plus thin_window_note. For every entry, `tools_needed` must name the exact app and platform, and `how_it_works` step 1 must state real-time vs asynchronous."
}
```

---

### T4 — `analog-verbal-mirrored-games`

```json
{
  "thread_id": "T4",
  "slug": "analog-verbal-mirrored-games",
  "category_owned": "games",
  "bounded_question": "Which specific named games require NO app — either purely verbal games playable with eyes closed in the dark or while walking with hands full, or physical board/card games played by mirroring two identical copies over video — and what are their actual rules?",
  "why_this_thread": "Verbal games are the only game format that survives BOTH the sleepy window (W1, eyes closed, phone face down) and the commute window (W3, hands busy, no screen). No listicle covers them with reproducible rules.",
  "thin_windows_you_own": ["w3 (hands-free, screen-free games playable while walking or on transit)", "w4 (10-20 minute games with a clean stopping point)"],
  "search_strategy": {
    "priority_sources": [
      "BoardGameGeek forums and game pages — search for 'play over video call' and two-player variants; BGG has real threads on remote play",
      "Publisher rulebook PDFs (authoritative for whether a game works mirrored)",
      "reddit.com/r/boardgames threads on playing physical games over video with one copy each",
      "Named verbal/parlour game references with actual rules — not idea lists",
      "reddit.com/r/LongDistance for couple-invented games described in enough detail to reproduce",
      "Road-trip and car-game references — these are optimized for exactly the hands-busy, eyes-elsewhere constraint W3 imposes"
    ],
    "query_seeds": [
      "site:boardgamegeek.com play over video call two copies",
      "site:reddit.com/r/boardgames \"over video\" long distance two copies same game",
      "roll and write games two players remote play",
      "site:reddit.com/r/LongDistance \"game we made up\" OR \"our game\"",
      "verbal games no equipment two players rules",
      "\"Contact\" word game rules how to play",
      "Fictionary dictionary game rules two players",
      "road trip games two players no equipment rules",
      "couples quiz \"how well do you know me\" questions specific",
      "board games that work as roll-and-write remote",
      "storytelling games two players rules improv"
    ],
    "avoid": "Party-game idea lists. Any 'game' described in one sentence without rules — if you cannot reproduce it from your own entry, it is not usable."
  },
  "target_yield": 16,
  "must_cover": [
    "EYES-CLOSED / DARK-ROOM games (W1) — the flagship: games playable lying in bed with the phone face-down and the screen off, named, with complete rules. At least 5 of your 16 entries.",
    "HANDS-BUSY / WALKING games (W3) — games playable while she is commuting with headphones in and no screen: verbal, no scorekeeping that needs writing, interruptible if she has to cross a street. Road-trip and car-game literature is the best source. At least 3 entries. This window has almost nothing else in the whole library.",
    "Named verbal games with real rules, not vibes: 20 Questions variants, Contact, Fictionary, Ghost, Botticelli, Categories, Word Association chains, story-building games, 'Fortunately/Unfortunately' — find the actual rule sources",
    "Mirrored physical play (W7, and W1/W5 if light enough): which board and card games actually work when each partner owns their own copy and plays over camera. Roll-and-write and flip-and-write games are the strongest candidates — identify specific titles from rules or BGG threads, and check availability/shipping to Israel for each.",
    "Quizzes about each other: The Newlywed Game format, 'how well do you know me' structures, prediction games where each guesses the other's answer then compares — with a real source and a method for keeping score across sessions",
    "Duration-scaled options: a 10-minute version and a Saturday-length version of as many games as possible, since the windows range from 30 minutes to unbounded",
    "Score-keeping and continuity: how to run a season or league across an analog game so it carries between calls and across the gap"
  ],
  "not_yours": [
    "Anything requiring an app or a browser — T3 owns those.",
    "Question decks and vulnerability prompts — T6 owns those. A game with a winner is yours; a prompt that opens a conversation is theirs.",
    "Published psychological protocols — T5."
  ],
  "return_format": "Per the SHARED PREAMBLE schema, plus thin_window_note. `how_it_works` must be complete enough to actually play the game without opening the source."
}
```

---

### T5 — `evidence-based-protocols`

```json
{
  "thread_id": "T5",
  "slug": "evidence-based-protocols",
  "category_owned": "deep-talk",
  "bounded_question": "Which structured couple exercises come from published psychology research or a named clinical institute, what exactly is the protocol, and how does each one survive being run over video — including whether it can be split into short segments or must be done in one long sitting?",
  "why_this_thread": "This is the only deep-talk thread with academic verifiability — it anchors the library's credibility and separates real protocols from repackaged deck marketing.",
  "thin_windows_you_own": ["w4 (micro-versions: a single Love Map question, one repair attempt, a 10-minute stress-reducing conversation)", "w6 and w7 (the long-form protocols worth a Saturday or worth him staying up for)"],
  "search_strategy": {
    "priority_sources": [
      "Primary papers: Aron et al. 1997 'The Experimental Generation of Interpersonal Closeness' (Personality and Social Psychology Bulletin) — find the actual paper and the full 36-question list",
      "gottman.com and The Gottman Institute's published exercises",
      "iceeft.com / Sue Johnson's EFT and the Hold Me Tight conversations",
      "harvilleandhelen.com / Imago Relationships International for the Imago Dialogue structure",
      "PREPARE/ENRICH, PsycNET, Google Scholar, PubMed for anything with a citation",
      "The NYT 'The 36 Questions That Lead to Love' interactive as a secondary, plus any LDR-specific research"
    ],
    "query_seeds": [
      "Aron 1997 experimental generation of interpersonal closeness 36 questions pdf",
      "site:gottman.com State of the Union meeting weekly check in",
      "site:gottman.com Love Maps exercise questions",
      "Gottman \"Dreams Within Conflict\" exercise steps",
      "Gottman stress reducing conversation 20 minutes structure",
      "Sue Johnson Hold Me Tight conversations seven list",
      "Imago dialogue three steps mirroring validation empathy",
      "long distance relationship intimacy intervention study",
      "gratitude expression intervention couples study protocol",
      "attachment style assessment ECR-R free",
      "36 questions video call remote replication study"
    ],
    "avoid": "Blogs summarising Gottman without linking to Gottman. Pop-psych articles with no citation. Anything about love languages that does not acknowledge the weak empirical support — report that honestly rather than presenting it as validated."
  },
  "target_yield": 13,
  "must_cover": [
    "The 36 Questions protocol (Aron et al.) — the real citation, the three-set structure, the 4-minute eye-gaze closer, and specifically how the eye-gaze step translates to FaceTime; plus a segmentation plan: which windows can hold a full 90-minute run (W6, W7) and how to split it across shorter windows without breaking the escalating-disclosure design",
    "Gottman Institute exercises with named sources: Love Maps, Rituals of Connection, the weekly State of the Union, the 20-minute stress-reducing conversation, repair attempts and the Four Horsemen, Dreams Within Conflict. The stress-reducing conversation is explicitly time-boxed — check whether it fits W4 or W5.",
    "MICRO-VERSIONS for the thin windows: which protocols have a legitimate 10-20 minute single-question form that does not violate the protocol's design (a single Love Map question, one gratitude exchange, one repair attempt). Be honest where a protocol CANNOT be shortened without breaking — that is a valid finding.",
    "EFT / Hold Me Tight conversations and Imago Dialogue (mirror-validate-empathize) — the actual step structure, and which require both partners alert (these will be `needs_both_high` and W7/W6 only)",
    "Conflict-repair and rupture tools adapted for video: what changes when you cannot touch, cannot leave the room, and one of you is about to fall asleep — including an explicit rule about which windows are WRONG for a hard conversation (W1 when she is exhausted; W4 when she has a hard stop and has to return to work; W6 when he is running on no sleep). This window-contraindication mapping is a required deliverable, not optional.",
    "Assessment instruments the couple can take separately and compare: attachment style (ECR-R), Gottman relationship checkup, love-languages quiz — with an honest confidence note on each instrument's empirical standing. These suit W8/W9, where each does their half alone on their free day.",
    "Any research specifically on long-distance relationship maintenance (idealization effects, media multiplexity, findings that LDRs can show equal or higher intimacy) — cite it; it will inform how the library frames itself"
  ],
  "not_yours": [
    "Commercial question decks and couple apps — T6 owns those, even when they cite Gottman in their marketing.",
    "Future-planning and life-vision exercises without a clinical source — T6.",
    "Casual 'deep questions' lists — T6."
  ],
  "return_format": "Per the SHARED PREAMBLE schema, plus thin_window_note and a `window_contraindications` array: [{protocol, windows_to_avoid, reason}]. `confidence: high` requires a primary source (paper or institute page); anything sourced only to a secondary summary is `medium` at best."
}
```

---

### T6 — `decks-journals-future-planning`

```json
{
  "thread_id": "T6",
  "slug": "decks-journals-future-planning",
  "category_owned": "deep-talk",
  "bounded_question": "Which specific purchasable or free question decks, couple apps, and shared journals exist right now — and critically, which of them handle two timezones correctly — and what named check-in or future-planning rituals do real long-distance couples run, including the ones couples invented themselves?",
  "why_this_thread": "This is the library's everyday deep-talk fuel, and it is the only deep-talk territory that can produce genuinely short, low-energy, thin-window entries. It also has a real product landscape that can be verified against store listings rather than guessed at.",
  "thin_windows_you_own": ["w2 and w3 (one question, asked and answered in five minutes, no screen)", "w4 (a bounded lunch-break check-in with a hard stop)", "w8 and w9 (each writes their half of a shared journal or doc alone on their free day, and they read it together later) — this asynchronous-halves pattern is yours and is the best deep-talk answer to W8/W9"],
  "search_strategy": {
    "priority_sources": [
      "apps.apple.com listings for couple apps: Paired, Lasting, Gottman Card Decks, Coral, Evergreen, Cupla, Lovewick, Agapé, Between, LongWalks, Relish — verify each is still live in 2026, check IL/US storefront availability and price",
      "Official product sites for physical decks: We're Not Really Strangers, TableTopics, BestSelf Intimacy Deck, The And (The Skin Deep), Esther Perel's 'Where Should We Begin: A Game of Stories', Vertellis",
      "reddit.com/r/LongDistance permalinks describing a named recurring ritual (weekly check-in, shared doc, future-planning session)",
      "Free/open sources: the NYT 36-questions interactive, public question lists with identifiable authorship, Notion/Google Docs templates couples actually publish"
    ],
    "query_seeds": [
      "site:apps.apple.com Paired couples app",
      "\"We're Not Really Strangers\" official deck editions list",
      "The And card game The Skin Deep couples edition",
      "Esther Perel Where Should We Begin game of stories official",
      "site:reddit.com/r/LongDistance \"weekly check in\" ritual we do",
      "site:reddit.com/r/LongDistance shared notion OR google doc couple",
      "couples app daily question different timezones problem",
      "shared journal app for couples two devices sync",
      "long distance relationship \"closing the gap\" plan timeline discussion",
      "couples question deck ships internationally Israel",
      "site:reddit.com/r/LongDistance \"question of the day\" we ask each other"
    ],
    "avoid": "Affiliate-farm 'best couple card decks 2026' roundups — go to the product's own site. Any app you cannot confirm is still operating; several couple apps have shut down, so check the App Store last-updated date and report it."
  },
  "target_yield": 16,
  "must_cover": [
    "THE TIMEZONE-CORRECTNESS AUDIT — a required finding, not a nice-to-have: most daily-question and streak-based couple apps assume both partners share a calendar day. With a 7-hour gap, 'today's question' breaks. For every app you list, state whether it handles a split day correctly, breaks, or is `unknown`. An app that breaks is a disqualifier for this couple and saying so is a genuinely valuable result.",
    "Physical question decks: real titles, editions, price, and whether they ship to Israel — plus the single-copy asymmetric pattern (one partner owns the deck and reads cards aloud to the other), which deserves its own entry because it sidesteps the shipping problem entirely",
    "Couple apps and shared-journal apps: verified-live-in-2026 list with price, platform, and whether both partners need the paid tier",
    "MICRO deep-talk for the thin windows: one question asked over her commute (W3), a five-minute check-in over her lunch (W4), a single question over his lunch and her coffee (W2). No screen, no setup, hard stop tolerated. At least 4 entries.",
    "LOW-ENERGY BEDTIME variants (W1): one question asked to a nearly-asleep partner, gratitude exchange, 'best and worst of your day'. At least 3 entries.",
    "THE ASYNCHRONOUS-HALVES pattern for W8/W9: shared docs, shared journals, and prompts where each partner writes their half alone on their own free day and they read it together on the next call. This is your unique contribution to the two asymmetric-free-day windows.",
    "Future-planning and life-vision exercises: closing-the-gap timeline conversations, 'what does our ordinary Tuesday look like' visioning, money/career/kids conversations, mutual bucket lists, a shared long-term doc — including the unavoidable Israel-vs-US question of which country they end up in. These are W7-grade.",
    "Recurring check-in cadences invented by real couples: the weekly relationship meeting, the Sunday review, the temperature check, rose/bud/thorn — with permalinks. Note that Sunday is HER day off and HIS workday (W9), which changes where a 'Sunday review' actually lands.",
    "The offset-calendar ritual: how they mark each other's holidays (Israeli vs US), and how Saturday as the only shared day off becomes a recurring anchor conversation"
  ],
  "not_yours": [
    "Protocols with an academic citation (36 Questions, Gottman, EFT, Imago) — T5 owns those, even if a deck packages them. If a deck is explicitly Gottman-branded, you own the PRODUCT entry; T5 owns the underlying exercise.",
    "Verbal games with a winner — T4.",
    "Async surprises, care packages, gifts, letters, playlists, streaks — OUT OF SCOPE for this entire round. Do not research these."
  ],
  "return_format": "Per the SHARED PREAMBLE schema, plus thin_window_note and a `timezone_correctness_audit` array: [{product, handles_split_day: true|false|unknown, evidence, source_url}]. For every app/deck, `cost` must be verified from the store or product page."
}
```

---

### §3.7 — T7 — `intimacy-across-distance`

**Dispatch note:** paste §1 (SHARED PREAMBLE) + §1a (PREAMBLE DELTA) + this block. T7 is the only thread that receives §1a.

```json
{
  "thread_id": "T7",
  "slug": "intimacy-across-distance",
  "category_owned": "intimacy",
  "bounded_question": "For a committed couple 7 hours apart, what specific named practices, products, and protocols actually sustain physical and sexual intimacy across distance — which of them are verifiable against licensed clinicians, peer-reviewed research, or manufacturer documentation rather than affiliate marketing, and what are the real shipping, cost, and privacy consequences of each?",
  "why_this_thread": "This was an unintentional omission from the first round and it is the category with the worst signal-to-noise ratio on the open web — almost every search result is an affiliate funnel. It is also the category where getting the practical details wrong (a device that will not ship to Israel, a channel that is not actually end-to-end encrypted) causes real harm rather than mild disappointment.",
  "thin_windows_you_own": ["w4 (discreet anticipation and build-up she can receive at a desk)", "w8 and w9 (build-up sustained across an asymmetric free day)", "w3 (audio-only, headphones, no screen)"],
  "window_gravity_note": "Your category's natural home is W1 (she is in bed, low light, he is fresh) and W6 (event-grade, her prime evening, worth him staying up for). Clustering there is EXPECTED and correct — do not distort your findings to spread evenly. But you must still return at least 3 entries that genuinely serve W3/W4/W8/W9, and the anticipation/build-up mechanic is how you get there.",
  "search_strategy": {
    "priority_sources": [
      "Licensed and named clinicians: AASECT-certified sex therapists, published authors with clinical credentials (e.g. Emily Nagoski, Ian Kerner, Vanessa Marin), and their own sites or books — not third parties summarising them",
      "Peer-reviewed research: Journal of Sex Research, Archives of Sexual Behavior, Computers in Human Behavior; Justin Lehmiller and Kinsey Institute publications; research on sexting, cybersex, and sexual satisfaction in long-distance relationships specifically",
      "Manufacturer documentation and official store listings for any device — the manufacturer's own site for specs, app requirements, and shipping policy; never a retailer's description",
      "Security and privacy research on connected intimacy devices: published vulnerability disclosures, regulator actions, court filings and settlements, and independent security audits",
      "Apple's own security documentation for the encryption status of iMessage, FaceTime, iCloud Backup, iCloud Photos, and Advanced Data Protection — verify, do not assume",
      "Real community consensus with permalinks: reddit.com/r/LongDistance threads where couples describe what actually worked and what did not"
    ],
    "query_seeds": [
      "long distance relationship sexual satisfaction study Journal of Sex Research",
      "sexting relationship satisfaction committed couples research Lehmiller",
      "AASECT certified sex therapist long distance couples advice",
      "site:reddit.com/r/LongDistance \"what actually worked\" intimacy -\"top 10\"",
      "Lovense Kiiroo We-Vibe long distance app control official documentation",
      "We-Vibe Standard Innovation privacy settlement data collection",
      "connected sex toy security vulnerability disclosure research",
      "teledildonic device ships to Israel international shipping policy",
      "site:support.apple.com iMessage end-to-end encryption iCloud Backup",
      "Apple Advanced Data Protection what it covers iCloud Photos",
      "Bond Touch bracelet how it works official site",
      "desire discrepancy couples clinician managing mismatched libido"
    ],
    "avoid": "Affiliate roundups, retailer 'top 10' pages, sponsored 'best of' listicles, and any product claim not traceable to the manufacturer. This domain is saturated with them and they are the single biggest threat to this thread's usefulness. If a page has affiliate links and no named author with credentials, close it. Also avoid generic 'spice up your LDR' content — it recycles the same six ideas and names no products, protocols, or people."
  },
  "target_yield": 13,
  "must_cover": [
    "WHAT ACTUALLY WORKS OVER VIDEO vs. what the internet claims — sourced to clinicians or research. Include the honest negative findings: practices widely recommended online that clinicians or research do not support, or that couples in community threads consistently report falling flat. A well-sourced 'this is over-recommended and here is why' is a valuable entry.",
    "LONG-DISTANCE TOUCH AND APP-CONTROLLED DEVICES — named products with manufacturer URLs. For EACH device you must report: (a) does it ship to Israel, and does it ship to the US; (b) price in both markets if determinable; (c) does ONE partner need hardware or BOTH; (d) does the control app require both partners to hold accounts; (e) does it work across a 7-hour gap and over cellular, or does it need both online simultaneously. Shipping and customs into Israel are real blockers — if you cannot confirm shipping, say `unknown`, do not assume.",
    "ANTICIPATION AND BUILD-UP ACROSS THE 7-HOUR GAP — the structural advantage almost nobody writes about. The gap is an ASSET in this category, not only an obstacle: he wakes at 5am to something she sent as she was falling asleep; she opens her phone at lunch to something he composed over his evening. Hunt specifically for practices that use delay as the mechanism rather than fighting it. This is your most novel territory and where your W4/W8/W9 entries will come from. Aim for at least 3 entries here.",
    "NON-SEXUAL PHYSICAL CLOSENESS as a distinct sub-area serving different windows: synchronized wearables and long-distance touch bracelets (name them, verify each still exists and ships), worn or scented objects, matched physical items, heartbeat-sharing devices, and rituals of embodied presence. Verify current availability — several products in this space have shut down.",
    "PRIVACY AND SECURITY — REQUIRED, NOT OPTIONAL. This is the section most likely to actually matter. Cover, each sourced to vendor documentation or published security research: (a) the verified end-to-end-encryption status of every channel they would realistically use — iMessage, FaceTime, and any third-party app — checked against Apple's own security documentation rather than assumed; (b) what iCloud Backup and iCloud Photos expose, and what Advanced Data Protection changes; (c) whether 'hidden' photo albums are actually protected; (d) what connected-device manufacturers collect and retain, including any documented incidents, regulator actions, or settlements; (e) the app-permission and Bluetooth/cloud-relay model of connected devices; (f) screenshot and screen-recording behaviour on the platforms involved. Present this as practical safety guidance, not scare copy — but do not soften a verified finding.",
    "DESIRE ASYMMETRY AND CONSENT ACROSS A BROKEN CLOCK — the structural problem this couple actually has: their category-appropriate windows are exactly the ones where one partner is depleted. In W1 she is exhausted; in W5 he is. There is no weekday window where both are rested AND private. Find clinician-sourced guidance on mismatched desire, on the obligation dynamic that distance can create, on scheduling intimacy without it feeling transactional, and on declining without it reading as rejection. This is a required sub-area — it is the honest core of the category for this couple.",
    "DESIRE MAPPING AND EROTIC COMMUNICATION — structured practices for two people telling each other what they actually want, where the endpoint is physical rather than emotional. Named exercises with clinical provenance where they exist."
  ],
  "not_yours": [
    "Sleep calls and falling asleep on video — T2 owns those. You own synchronized wearables, worn/scented objects, and touch devices; T2 owns the open call itself.",
    "Emotional-intimacy protocols and vulnerability exercises — T5 (if clinically cited) and T6 (if a product or a community ritual). The dividing line is the endpoint: emotional closeness is theirs, physical/sexual is yours.",
    "The technical mechanics of synchronized playback — T1 owns those. If an activity involves watching something together, describe the activity and cite T1's shareplay_capability_appendix rather than re-deriving the sync method.",
    "One-off surprise gifts, care packages, and mailed presents — out of scope for this whole round. NARROW EXCEPTION: a physical object that creates ONGOING embodied presence (a worn shirt kept, a shared scent, a paired wearable) IS yours, because it is a recurring ritual rather than a one-time surprise. Judge by whether it is repeatable."
  ],
  "return_format": "Per the SHARED PREAMBLE schema (with `category: \"intimacy\"`), plus thin_window_note and a `privacy_findings` array, separate from `activities` and NOT counted toward your yield: [{subject, finding, practical_implication, source_url, source_date, confidence}]. Expect `intimacy_level` to cluster at 4-5 across this thread; that is correct, not a flaw. `confidence: high` requires a clinician, a peer-reviewed paper, a manufacturer page, or a vendor security document — community consensus caps at `medium`."
}
```

---

## §4 — Synthesis plan (Research-Lead, second invocation)

### 4.1 Intake and validation

Hard gate — entries failing any of these are dropped, not silently patched, and the drop count is reported:
- missing or fabricated-looking `source_url` (spot-check ~10% by fetching)
- missing `confidence`
- `category` outside the four-value enum `live-together | games | deep-talk | intimacy`
- **T7 only:** any device entry whose shipping-to-Israel status is neither confirmed nor explicitly `unknown`, and any privacy claim not traceable to vendor documentation or published security research. This thread's failure mode is confident-sounding affiliate copy, so it gets the strictest gate.
- `window_fit` containing more than five windows with no justification in `timezone_friction` (over-tagging destroys the product's value)
- `window_fit` containing `w4` with `duration_min > 60` — internally contradictory
- `window_fit` containing `w3` while `tools_needed` requires looking at a screen — internally contradictory
- `how_it_works` that is not actually reproducible

### 4.2 Dedupe rule

1. **Exact:** normalize `id` and `name` (lowercase, strip punctuation/stopwords) → exact collisions merge.
2. **Semantic:** same core mechanic AND overlapping `tools_needed` → merge.
3. **Merge policy:** higher `confidence` wins; on a tie, the thread that **owns** the territory per §0 wins. Union `tools_needed` and `source_url`; keep the richer `how_it_works`; **union** `window_fit` but re-validate each window against §4.1's contradiction checks; keep the more specific `energy_symmetry`.
4. **Variant preservation:** near-duplicates that differ in *ritual framing* or *window fit* stay separate, and the generic parent is deleted. "Watch a movie" dies; "blind rewatch" (W1/W7) and "one 22-minute sitcom episode over her lunch" (W4) both live. A window-specific variant of an existing activity is a NEW activity, not a duplicate — this rule matters more under the 9-window model than it did under the 2-window one.
5. Every merge is logged so nothing disappears untraceably.

### 4.3 Ranking rule — what makes an activity top-tier FOR THIS COUPLE

Score each surviving activity 0-100:

| Factor | Weight | Top score when |
|---|---|---|
| Energy/availability-asymmetry fit | 20 | `works_asymmetric` or `best_when_one_is_sleepy`. `needs_both_high` scores 0 **unless** `window_fit` includes `w7` or `w6`, where it scores full — those are the windows that can carry it. |
| **Thin-window coverage** | 15 | Fits **W3, W4, W8, or W9**. Scales with how thin the served cell is at scoring time — an activity landing in a near-empty cell scores highest. This is the factor that makes the clock get covered instead of the comfortable windows getting nine variants each. **W2 no longer scores here** (v3): fitting W2 is neither rewarded nor penalized. |
| Window realism | 15 | Maps to windows it actually fits, and `duration_min` respects that window's ceiling (W2 ≤60, W3 ≤45, W4 ≤60 hard, W5 ≤120, W1 ≤180, W6/W7/W8/W9 unbounded). |
| Ritual-ability | 15 | `ritual` > `repeatable` > `one_time`. They need daily fuel, not a bucket list. |
| Friction to start | 15 | `setup_effort: none` and `cost: free`. Purchases, shipments to Israel, and both-partners-paid tiers are penalized. |
| Cross-border cleanliness | 10 | No region lock, no App Store split, no shipping problem, no broken split-day handling. |
| Source confidence | 10 | `high`. A `low` caps the activity out of the top tier entirely. |

**Anti-monoculture correction:** ranking is applied *within* buckets, never globally — otherwise the library collapses into fifteen variants of "talk in bed." Buckets: window (9) × category (4) × intimacy band (1-2 / 3 / 4-5). Each bucket surfaces its own top entries. Note that T7 will legitimately monopolise the 4-5 intimacy band inside W1 and W6; that is correct and the bucketing is what stops it from crowding out the other categories elsewhere.

### 4.3a Taste re-ranking pass (new in v3)

The founder's taste profile is being collected in parallel and is assumed to arrive before synthesis. It is applied as a **multiplier after** §4.3 scoring, never as a filter before it — so that a taste-mismatched but structurally perfect activity is demoted rather than deleted, and the library keeps its coverage.

- Strong positive match on a stated interest: ×1.25
- Neutral / not addressed by the profile: ×1.0
- Named as disliked, or already tried and gone stale: ×0.6, and the entry is annotated with the reason rather than hidden
- Explicitly ruled out by the founder: removed, and logged in the drop list

If the profile does not arrive in time, synthesis proceeds without it and the pass is deferred to a re-rank of the finished `library.json` — the structure supports re-scoring without re-running research. This does not block.

### 4.4 Coverage matrix — required deliverable

`coverage-matrix.md` renders the library as **windows × categories** — now **9 × 4 = 36 cells**, each showing the activity count and the top-scoring entry.

- Cells with **0 entries** = RED, commissioned immediately as a targeted top-up thread.
- Cells with **1–2 entries** = AMBER, listed as round-2 research commissions.
- Cells with **3+** = green.
- **The four W2 cells are ADVISORY (v3):** reported for information, never scored RED or AMBER, never commissioned. W2 is opportunistic — an empty W2 row is the expected and correct outcome, not a gap. Effective scored surface is therefore **32 cells**.

Two secondary matrices for diagnosis:
- **windows × energy_symmetry** — verifies that each window's real energy profile is served (e.g. W1 should be dense in `best_when_one_is_sleepy`; if it is dense in `needs_both_high`, the tagging is wrong).
- **windows × duration band** (≤20 / 21–60 / 61–120 / 120+) — verifies that hard-bounded windows like W4 actually have short options and are not filled with things that overrun.

Predicted RED/AMBER cells before any data arrives:
- Carried from v2: `W3 × games`, `W4 × live-together`, `W8/W9 × deep-talk`. (The two v2 predictions `W2 × games` and `W2 × deep-talk` are retired — W2 is advisory now.)
- New with the intimacy row: `W3 × intimacy` predicted RED and **appropriately so** — she is commuting in public; near-empty is the right answer, not a gap to fill. `W4 × intimacy` predicted AMBER, servable only by the discreet anticipation mechanic. `W8/W9 × intimacy` predicted AMBER, servable only by sustained build-up. `W5 × intimacy` predicted AMBER for a substantive reason rather than a sourcing one: he is fading while she is energized, which is precisely the desire-asymmetry problem T7 is briefed to research head-on.
- `W7 × intimacy` should come back **green** — Saturday is unbounded and both are rested; distance is unchanged by the day of week, so nothing structurally blocks this cell.

### 4.5 Final library structure

1. `library.json` — the machine-clean array, schema-validated, one record per activity, each carrying `score`, `tier`, and `merged_from`. This is the website's data source.
2. **Tiers:** S = daily drivers (~15), A = strong rotation (~30), B = the long tail.
3. **Shelves** — pre-computed index views the site renders as one-tap filters. The primary shelf set is now the clock itself, phrased in the couple's own terms rather than as window codes:
   - `She's in bed, he's awake` (W1)
   - `She's up early` (W2)
   - `She's on her commute` (W3)
   - `Her lunch break` (W4)
   - `He's fading, she's just off work` (W5)
   - `Worth staying up for` (W6)
   - `Saturday — go long` (W7)
   - `His Friday off` (W8) · `Her Sunday off` (W9)
   - `She's up early` (W2) — present but de-emphasised; opportunistic, not a primary shelf
   - Cross-cutting: `Zero setup, right now` · `One of us can't look at a screen` · `We need to talk about something real` · `15 minutes` · `3 hours`
4. `coverage-matrix.md` per §4.4.
5. `sources.md` — every URL with access date, so nothing in the library is unfalsifiable later.
6. `privacy-notes.md` — T7's `privacy_findings` array rendered as plain practical guidance (encryption status of each channel, what iCloud retains, what devices collect). It sits outside the activity list because it applies across the whole intimacy category rather than to any single entry.
7. Append genuinely new relationship-behaviour findings to `.claude/memory/USER-INSIGHTS.md` as `[YYYY-MM-DD] — [Finding] — Source: [URL]`. Only with a URL.

**Product note for whoever builds the site:** the intimacy category should be its own shelf and should not render on the default screen. This is a site they open live during video calls, sometimes with other people in the room. A one-tap reveal rather than an always-visible row is the difference between the library being usable in the daytime and not. Flagging it here because it is a synthesis-time observation, not a design decision I own — CPO/Design-Lead's call.

### 4.6 W2 downgrade — absorption protocol (v3)

T1–T6 were dispatched with W2 framed as a thin window and may have spent budget there. That cost is sunk; no thread is re-dispatched. Handling at intake:

- **Retain, do not drop, W2-tagged entries.** They cost nothing to keep and she is genuinely up sometimes at weekends.
- Set `opportunistic: true` on any entry whose `window_fit` is `["w2"]` alone, and append "only if she's up — mostly weekends" to its `timezone_friction`. Entries tagging W2 alongside other windows need no change.
- W2-only entries are **capped out of Tier S** regardless of score. A daily driver cannot live in a window that may not occur.
- The thin-window ranking factor ignores W2 entirely (§4.3).
- Report the W2 spend in the synthesis summary — how many entries across the six threads landed W2-only — so the founder can see what the corrected brief cost. That number is also the honest measure of how much a mid-flight scope correction is worth catching earlier.

---

## §5 — Coverage risks

1. ~~**Taste is unknown.**~~ **RESOLVED in v3** — the founder's taste profile is being collected in parallel and is applied as the §4.3a re-ranking multiplier. Residual risk: if it arrives late, the pass is deferred to a re-score of the finished `library.json` rather than being skipped.
2. **The thin windows may be thin for a reason.** W4 (her workday lunch, possibly in public) and W3 (commuting, hands busy) impose real constraints, and the honest answer for some cells may be "almost nothing fits here." Researchers are instructed to report that rather than fabricate. `W3 × intimacy` is the clearest example: near-empty is the correct answer there, not a gap.
3. ~~**The 9-window model assumes availability the couple may not actually have.**~~ **PARTIALLY RESOLVED in v3** — W2 is confirmed opportunistic and has been downgraded (§4.6). Residual risk: **W3 and W4 remain inferred, not confirmed.** If she does not in fact take calls on her commute or at lunch, two of the four remaining thin windows are fiction, and the thin-window quota that six threads are currently working against has been pointed at empty slots. W2 cost roughly a tenth of the budget before it was caught; W3+W4 together would cost more. Worth confirming with the founder before synthesis, though it does not block anything.
4. ~~**Physical intimacy is absent from scope.**~~ **RESOLVED in v3** — confirmed as an unintentional omission and added as category `intimacy` / thread T7 (§3.7). Residual risk: T7 is dispatched a full cycle behind T1–T6, so its returns cannot inform their briefs; any intimacy-adjacent activity the other six encountered has already been discarded as out of scope and will not be recoverable at synthesis.
5. **T7's sourcing floor may not hold.** This is the one category where the open web is overwhelmingly affiliate-funded, and the strictest gate in the packet is pointed at it. The realistic outcome is a smaller thread than 13 with a heavier `gaps` list — device shipping-to-Israel status in particular may come back largely `unknown`, since manufacturers often do not publish country-level shipping tables. Under-delivery here is preferable to fabrication and the brief says so, but it means the intimacy row of the coverage matrix may be thinner than the other three regardless of how well the thread executes.
6. **English-language and US-centric sourcing bias.** All seven threads search in English. Israeli-specific activities, Hebrew content, and Israeli product availability will be under-sampled. Threads check Israeli *availability* but will not *discover* Israeli-origin activities. This bites hardest on T7, where shipping into Israel is decisive.
7. **Reddit anecdote ceiling.** Community-sourced rituals cannot exceed `medium` confidence — they are real reports, not evidence of efficacy. T5 and T7 are the only threads that can produce `high`-confidence efficacy claims, and only where a clinician or paper backs them.
8. **Product volatility.** Couple apps, watch-party tools, and intimacy hardware all shut down frequently — the connected-wearable space in particular has a graveyard. Every T1/T3/T6/T7 entry has a shelf life; `source_date` makes staleness detectable. Re-verify before the site goes live and roughly every 6 months after.
9. **Async / surprise category deliberately excluded** per founder instruction (care packages, gifts, letters, playlists, streaks). It is the largest known gap and the obvious next round — and note that W8/W9 (asymmetric free days) are exactly the windows where async would have been strongest, so those cells will look thinner than they would with the full category in scope. T7's narrow exception for ongoing embodied objects recovers a sliver of this, not the category.
10. **Region-lock could invalidate a whole category.** If IL/US catalog mismatch is severe, much of T1 collapses. T1 researches rather than assumes it, but a bad answer there would meaningfully reshape the library.
11. **W8/W9 depend on one thread.** T2 is the primary owner of the asymmetric-free-day windows, with T3 (async games), T6 (asynchronous halves) and now T7 (sustained build-up) as secondary. If T2 returns thin or fails, two windows lose their main supplier at once. Check that cell first at synthesis and be ready to commission a targeted top-up.
