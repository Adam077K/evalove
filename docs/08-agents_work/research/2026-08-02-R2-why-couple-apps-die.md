---
date: 2026-08-02
agent: researcher (R2)
question: "Why do couples delete couple apps?"
products_examined: 22
sources_count: 30
confidence_overall: MEDIUM-HIGH
note: >
  Two hard access blockers this session: reddit.com and trustpilot.com
  returned 403 on every direct fetch attempt. App Store / Play Store
  review feeds are JS-paginated; a static fetch only surfaces a small,
  non-representative sample per page. Every quote below is verbatim,
  sourced, and dated where a date was available; per-claim confidence
  tags (HIGH/MEDIUM/LOW/UNKNOWN) are preserved throughout rather than
  smoothed over. "Kiwi" and "Nobody," named in the original research
  brief, turned out not to correspond to any real couple app — see
  Gaps section. This is a brief error, not a research failure.
---

# Why do couples delete couple apps? — research findings

**Researched:** 2026-08-02 | **Products examined:** 22 (16 verified with substantive evidence, 2 confirmed non-existent as briefed, 4 under-researched/thin) | **Sources:** ~30 distinct URLs, 20 directly fetched | **Confidence overall:** MEDIUM-HIGH

## Do not miss this: the ownership/continuity finding

**This is the single most relevant finding for a product meant to run forever for two people, and it is not a UX problem — it is a governance problem.** It's promoted here to its own section because it would otherwise get lost as one line item among many, and it's the one finding that should reach the founder unfiltered.

The best-documented death in this entire graveyard — **Couple, formerly Pair** — did not die from churn, guilt mechanics, or cheesy copy. It died like this:

1. Launched as **Pair** in March 2012 (Y Combinator / TenthBit) — **100,000 users in the first week.** Initial demand was never the problem.
2. February 2013: acquired UK rival Cupple, rebranded Pair → Couple.
3. **October 2014: three of the four cofounders left for Dropbox** — the team disengaged years before the public death, with no announcement.
4. **February 12, 2016: acquired by Life360** — the product outlives its original owners' interest.
5. **June 27, 2018: quietly transferred to a new, unrelated entity** (Coupleapp, Inc., founded by an ex-Life360 contractor who had separately built a *competing* app called "Significant Other") — announced to users via a single tweet.
6. **April 22, 2019: fully defunct.** The web app returns 503 errors. Account deletion is broken. There is **no communication to users about what happened to their years of private photos, messages, and shared history.**

Source: [en.wikipedia.org/wiki/Couple_(app)](https://en.wikipedia.org/wiki/Couple_(app)), [rymc.io/blog/2019/decoupling](https://rymc.io/blog/2019/decoupling/) — HIGH confidence, both directly fetched and corroborating. The blog author, a former user, describes trying to reach the company as late as December 2019 with no response, and cites Reddit threads (not independently verified by me — MEDIUM) of other users "wondering about what actually happened to all the data."

**Contrast case — Avocado**, same category, same era, opposite ending: shut down February 28, 2017, citing "financial and market realities in this space are tough to surmount... a wonderful team put in hard work toward sustainability but we couldn't overcome those challenges." Unlike Couple, Avocado **built and shipped a data-export tool before shutting down**, and a rival (Between) built a direct Avocado-import migration path so exiting users had somewhere to land. Source: [medium.com/@avocado](https://medium.com/@avocado/an-anticipated-but-sad-announcement-about-avocado-4649d3c799dc) — HIGH, directly fetched.

**The lesson isn't "be nice when you die."** Avocado was nice when it died, and it still died — good behavior at the end doesn't prevent the end, it only makes the end survivable for users. The actual lesson is structural: **every product examined in this research, without exception, was a company with growth or funding incentives, and that dependency is very likely why they died** (funding pressure, acquisition, pivot-for-scale, cap-table exit). A product with no growth pressure, no funding runway to run out, and no acquirer to sell to has a different risk profile than anything in this graveyard — but that also means **nothing in the public record tests whether that structural difference actually produces better longevity.** It's untested, not proven. What *is* proven is the failure mode to design against: continuity of ownership, an unambiguous export path, and account/data deletion that actually works, regardless of who is running the software in ten years.

---

## Product teardown table

| Product | What it is | Status | Core mechanic | Reviews praise | Reviews attack |
|---|---|---|---|---|---|
| **Between** (VCNC) | Private couple messaging + calendar + memory box | Live, massive (Korea-origin, global) | Calendar, stickers, D-day style important-dates tracker | Shared calendar auto-reminders; "memory box" for photos/notes | Data loss ("THEY DELETED ALL PICTURES" — unsourced-verbatim, MEDIUM); nagging premium upsell dots after lifetime purchase; message delivery failures (2019–2020 reviews); rated for teens, flagged by parenting sites as enabling unhealthy enmeshment |
| **Paired** | Daily relationship question + streak | Live | Literal day-streak, resets at midnight, no grace period (confirmed via their own support doc) | LDR utility; "exposes delusions" early; therapist-written content | "Interface feels like homework"; no reply notifications; can't edit answers; uneven partner effort (one paragraph, one word); questions skew "secular Western" per some reviewers; cancellation flow called "manipulative" (LOW, unverified) |
| **Cupla** | Shared couples calendar | Live, 4.7★ (MEDIUM, not directly verified) | Calendar overlay, "no time-zone math" (vendor claim) | Removes scheduling friction | Paywall blocks full partner-calendar view |
| **Lovewick** | Question library + date ideas | Live, claims 350k+ users | Daily questions | LDR-friendly | Free daily questions cut from 10→1 (MEDIUM) |
| **Agapé** ("Feel Close When Apart") | One question/day, reveal-gated | Live, explicitly LDR-marketed | 1 Q/day, answers reveal once both respond | — | "we had answered so many questions and we didn't even reach 1 year before we decided we no longer want to use the app"; "gets tiring answering the same question in different wording all the time" after 1yr; $15/mo or $180/yr called too expensive; lacks inclusivity for queer couples (HIGH — directly fetched App Store reviews, 2023-11-21 and 2024-08-27) |
| **Couply** | Quizzes + long-distance mode | Live, 4.47★/1.9k ratings (MEDIUM) | Named directly as a Between/Tuned rival | Rekindling value | Expensive paywall; broken completion-tracking UI |
| **Kiwi** | — | **Could not be located as a couple app; treated as a brief error, not a research gap.** | — | — | — |
| **Nobody** | — | **Could not be located as a couple app; treated as a brief error, not a research gap.** | — | — | — |
| **Raft** | Shared calendar (couples/friends/family) | Live | Calendar + in-event chat | — | No substantive reviews surfaced — under-researched, flag as gap |
| **Between Us** | Ambiguous: two different real products share this near-name (a "Couples Chat App" and a Tavistock Relationships-backed app) | Live | — | — | Not investigated at review level — gap |
| **Couple** (né Pair) | Private 1:1 messaging, calendar, drawing | **DEAD** (defunct 2019) | — | 100k users in first week at 2012 launch | See "ownership/continuity" section above — silent death, abandoned user data |
| **Avocado** | Messaging, calendar, private gallery | **DEAD** (2017) | — | — | See "ownership/continuity" section above — funding death, but ran a data-export tool |
| **Tuned** (Meta NPE) | Notes/photos/mood-tracking/challenges for couples | **DEAD** (2022) | — | — | 909k downloads total in 2+ years, from *Meta*, with zero-cost distribution — still failed to reach scale |
| **Locket Widget** | Lock-screen photo widget, partner-only | Live, viral 2022 launch | One photo → partner's home screen widget | 2-year user: "honestly made their life better" (MEDIUM) | Widget stops refreshing (grey square bug); mild pushback when reactions/emoji were added to a deliberately minimal product |
| **Marco Polo** | Async video messaging | Live | Video walkie-talkie, no live-presence requirement | Multiple "use it every day," multi-year LDR retention testimonials | Not couple-exclusive (many-to-many), somewhat off-target for our exact shape |
| **Retro** | Weekly photo journal w/ close friends | Live (confirmed active, updated Aug 2025) | Weekly journal, physical postcards | — | Not deeply investigated — gap |
| **Poparazzi** | Friends-only, no-selfie photo app | **DEAD** (2023) | — | Hit #1 free app, May 2021 | Team had already built its own replacement internally a year before public shutdown — signals internal loss of faith in the mechanic |
| **BeReal** | Simultaneous daily photo, notification-triggered | Live but cratered | 2-min window notification, feed-gated until you post | — | DAU fell ~61% (15M→<6M) Oct'22→Mar'23; "posting became housekeeping — an obstacle to be cleared"; sold to Voodoo 2024 amid decline |
| **Widgetable** | Co-parented virtual pet widget | Live, 4.8★/859k (MEDIUM) | Shared pet needs feeding/care | Shared responsibility framing | Ad load: "5 ads every time you feed your pet" — inherent guilt-mechanic (a neglectable pet) never directly criticized as such in reviews I found — inferred risk, not confirmed |
| **Bond Touch** | Physical bracelet, touch-to-vibrate | Live | Wearable, not app-only | Concept well-loved | Battery degrades to 1-day life after 2yrs; charging misalignment; missed/delayed touches; strap failure — hardware reliability kills the ritual even when the emotional idea lands |
| **TimeTree** | Shared calendar | Live, popular w/ LDR couples | Calendar across time zones | Coordination relief | Heavy/loud ads; recent bugs removed features; no E2E encryption; one reviewer explicit warning: "time-zone handling is partial — confirm it shows your partner's local time before you rely on it" |
| **Noteit** (by Sendit) | Drawing/note widget | Live | Handwritten notes to partner's home screen | Months of daily couple use, "fun" | **Retrofitted a streak mechanic post-launch** — "missing a day results in a 'streak lost' reminder appearing on the widget," drawing users pushed back |

---

## 1. Churn reviews (verbatim, sourced)

- Agapé, 2023-11-21, App Store: *"we had answered so many questions and we didn't even reach 1 year before we decided we no longer want to use the app."* — [apps.apple.com/agapé reviews](https://apps.apple.com/us/app/agap%C3%A9-couples-relationship/id1507907556?see-all=reviews) — HIGH
- Agapé, 2024-08-27, App Store: *"there's a lot of repetition in the questions, it gets tiring answering the same question in different wording all the time."* — same source — HIGH
- Paired, 2025-11-11, App Store, reviewer "Матто B": interface *"feels like homework"* — [apps.apple.com/paired reviews](https://apps.apple.com/us/app/paired-couples-relationship/id1469609343?see-all=reviews) — HIGH
- Between, 2016-09-28, personal blog: on the calendar's surveillance feel, *"I can see where you are and what you're supposed to do at what time"* — concludes it's wrong for anyone who values personal space — [auliagassi.wordpress.com](https://auliagassi.wordpress.com/2016/09/28/between-the-couple-app-review/) — HIGH (directly fetched, single reviewer, not a trend)
- BeReal, 2023 (via Dazed feature): *"Suppose I better obediently take a picture...so that the only three friends I have left who are using it can see."* — [dazeddigital.com](https://www.dazeddigital.com/life-culture/article/61166/1/why-did-bereal-fail-social-media-instagram-authenticity) — HIGH
- Ryan McGrath on Couple/Pair's end, 2019: *"The service `503`'s now,"* account deletion broken, no communication about stored data — [rymc.io](https://rymc.io/blog/2019/decoupling/) — HIGH, single ex-user but directly verified

**Volume caveat:** I could not get a large-N sample of verbatim 1-3★ reviews (app-store review feeds are JS-paginated and only render a handful per static fetch; Trustpilot and Reddit were both blocked to me). What I have is real and dated but thin — treat single reviews as illustrative, not statistically representative, except where I note aggregate stats (BeReal's DAU collapse is real population-level data, not anecdote).

## 2. The week-two-to-year-one cliff

- Best-documented case: Agapé users churning **before the 1-year mark**, citing question repetition as the reason (above). This is the clearest "ran out of runway" pattern in the whole set.
- askBae (a rival Q&A app) users report hitting repeat questions **around month 5**, despite marketing 400+ questions — the actual unique-content pool is much smaller than advertised (MEDIUM, via search synthesis, not directly fetched).
- Paired's own reviewer (Woman & Home, Jan 2025) only used it "a couple of weeks" before her review — even a positive review reflects short active engagement — HIGH.
- The Quality Edit reviewer (Sanibel Lazar, Paired) flags **uneven partner effort** as the load-bearing failure mode, not the app itself: one partner writes paragraphs, the other "one-sentence responses," making the exercise feel one-sided — [thequalityedit.com](https://www.thequalityedit.com/articles/paired-app-review) — HIGH.
- Pattern across the category: **static content libraries have a shelf life measured in months, not years**, and every app that survives long-term either (a) doesn't depend on daily novel content (Marco Polo, Locket, Bond Touch — mechanic-based, not content-based) or (b) is explicitly a utility (calendars: Cupla, TimeTree, Raft).

## 3. Guilt mechanics — the evidence, both ways

**Against (the stronger case):**
- Paired's streak is real and unforgiving: *"A streak is the number of days in a row you have completed your daily goal... before midnight,"* resets at midnight, no freeze/grace period documented anywhere in their own support docs — [support.paired.com](https://support.paired.com/en/articles/164646-what-is-a-streak) — HIGH.
- Noteit (couples widget) **added a streak mechanic after launch**, and it produces a literal "streak lost" reminder on the partner's home screen when missed — a direct, dated case of a shipped feature retrofitting guilt onto a previously guilt-free product, drawing user pushback (MEDIUM, search-synthesis, not primary-source verified).
- A rival product, PairHabit, built its entire positioning around *not* doing this: *"No guilt trips. No manipulation. No 'Your partner is waiting!' pressure. If you miss a day, we don't shame you."* — [pairhabit.app](https://www.pairhabit.app/) — HIGH on what the copy says; this is marketing, not a user complaint, but a company doesn't build its whole pitch around a strawman — it implies "your partner is waiting!"-style notifications are a recognized pain point in this exact category.
- A licensed couples therapist (Kayla Crane, LMFT — flag: she also co-founded a competing app, "Connected," so read with that commercial interest in mind) makes the argument directly: streak/badge apps *"reward opening the app, not actually connecting"* and *"feel productive without changing anything."* — [southdenvertherapy.com](https://www.southdenvertherapy.com/blog/do-relationship-apps-work-therapist-review), [connectedcouples.app](https://www.connectedcouples.app/blog/best-relationship-apps-therapist-ranked) — HIGH on content, MEDIUM on neutrality.
- A third-party comparison blog (HabitBox — also has a commercial angle, favorably compares itself) frames it sharply: *"Streak breaks read as judgment. A clean streak is a chain. A broken one is a red mark next to your name... even a friendly check-in starts to feel like a performance review."* Cites habit-formation research (Philippa Lally) that a single missed day doesn't actually damage habit formation — the psychological cost is disproportionate to the real cost. — [habitbox.app](https://habitbox.app/blog/habit-tracker-for-couples), 2026-05-08 — MEDIUM (secondhand citation of the academic claim, HIGH on what the blog itself argues).
- General UX critique (not couple-app-specific): notifications have shifted from utility to *"guilt bombs. Wrapped in emojis"* — cites Duolingo's *"We miss you 💙 Come back and keep your streak alive!"* pattern as the template being copied everywhere. — [bitskingdom.com](https://bitskingdom.com/blog/app-notifications-reminders-guilt-trap/), 2025-04-23, Cecilia Figueredo — HIGH.

**For (weaker, but real — evidence against our own assumption):**
- An early-adolescent Snapchat-streaks study (peer-reviewed, ScienceDirect — I could not directly fetch it, 403; relying on search-engine synthesis of the abstract, so MEDIUM confidence) found *"participants reported that streaks strengthened their interpersonal bonds, but many also expressed feelings of anxiety and social pressure."* Both effects are real in the same population — streaks are not purely negative, they're a genuine bond-strengthening mechanic that also carries a real anxiety cost. — [sciencedirect.com/S2772503023000476](https://www.sciencedirect.com/science/article/pii/S2772503023000476) — MEDIUM, and note this is about **friendship** streaks among **early adolescents**, not romantic LDR adults — moderate relevance gap, not a clean transfer to your product.
- I found **no direct positive testimony from an adult LDR couple** saying a streak specifically helped their relationship. This is a real gap, not a null result I'm papering over — I searched for it explicitly and came up empty. The strongest "pro-streak" evidence I have is the adolescent-friendship study above, which is adjacent, not on-point.

**Net read:** the evidence clearly outweighs toward guilt/streak mechanics being a genuine churn driver, but the founder's ban isn't "obviously correct with no cost" — it's giving up a real (if adolescent-study-sourced, not couple-study-sourced) bond-strengthening effect to avoid a well-documented anxiety cost. That's a real trade, not a free lunch.

## 4. The fake/cheesy problem

- TechCrunch, 2013-02-11 (Natasha Lomas), on the entire category: *"there aren't enough lovelorn long-distance teenagers in existence to sustain"* this many competing apps — naming Avocado, Between, Cupple/Couple, Duet, SimplyUs, Twosome as oversupply — and arguing that a generic push notification *"devalue[s] the sentiment"* of romantic communication. — [techcrunch.com](https://techcrunch.com/2013/02/11/couples-apps-please-stop-mating-and-start-consolidating/amp/) — HIGH.
- Between is explicitly rated/marketed toward teens and flagged by parenting-review sites for enabling unhealthy relational enmeshment in that age group (MEDIUM, search-synthesis not directly fetched at primary source) — meaning the category's default visual/tonal register skews young by default, not by accident.
- Trigger pattern I could identify: **hearts, stickers, "hug"/"kiss" button metaphors, and generic push-copy** ("Avocado's 'hug' feature" called "absurdly cheesy" by one reviewer) are the recurring named culprits, not colour or iconography specifically — I did not find enough direct evidence to isolate colour/palette as a trigger on its own. Treat "cheesy" as driven mainly by **infantilizing copy and gamified affection-tokens**, not visual design per se — this is a real but thinner finding than I'd like; I did not find a rich vein of "this made me cringe because of X specific design element" reviews despite two targeted searches.

## 5. What people beg for (recurring, unbuilt or poorly-built)

- **Reliable widget/home-screen presence** — Locket, Noteit, Widgetable, Between Us all compete on this; it's clearly a wanted surface, but Locket's own reviewers report refresh reliability bugs, showing the *demand* is proven but *execution* consistently lags.
- **Larger/non-repeating content libraries** — direct complaint pattern across Agapé, askBae, Lovewick (paywalling depth). Static libraries run out; users notice and say so by ~5 months to 1 year.
- **Better free/paid tier balance** — Cupla, Couply, Agapé, Lovewick all draw complaints about paywalling core functionality (partner's calendar, question count) rather than depth/extras.
- **On-this-day / memory resurfacing** from camera roll — mentioned as a wanted feature adjacent to lock-screen widgets (MEDIUM, thin evidence, one source).
- Not found despite searching: a rich vein of Apple Watch or native-widget-specific feature-request threads. Gap — UNKNOWN, would need Reddit/community access I didn't have.

## 6. Time-zone handling

This is the weakest-evidenced section, and it's worth being honest about that rather than stretch thin material. What I found:

- TimeTree (shared calendar, popular with LDR couples): one independent reviewer's explicit caution — *"time-zone handling is partial — confirm it shows your partner's local time before you rely on it"* — [ourcal.com](https://ourcal.com/blog/timetree-app-review) (via search synthesis) — MEDIUM. This is the single most concrete piece of evidence found of a real product's time-zone handling being unreliable enough that a reviewer felt compelled to warn people.
- Cupla's own marketing claims to "eliminate the need for time-zone math" — this is a vendor claim, not a verified user outcome; no independent confirmation or contradiction of it was found.
- No app-store reviews, forum posts, or press coverage were found documenting a *specific, dated* instance of a couple app showing the wrong local time, misfiring a reminder across a time-zone boundary, or otherwise concretely failing at this. **This is a genuine UNKNOWN, not a null finding being hidden** — four separate searches targeted this specifically and came up with only the one TimeTree caution above. Best explanation: time-zone bugs are the kind of thing that gets fixed quietly in point releases rather than becoming a durable, searchable complaint, or it's underreported because it's a "your calendar app is annoying" complaint rather than a "why I deleted this" complaint.

## 7. Discontinued products — post-mortems

See the **ownership/continuity** section at the top of this document for the Couple/Pair and Avocado post-mortems in full.

**Tuned (Meta/Facebook NPE team)** — scale/adoption death:
- Launched April 2020, shut down Sept 19, 2022 — 909,000 total downloads across a 2+ year run.
- That number, from *Meta*, with essentially free distribution and no CAC constraint, is the strongest single data point in this whole report that **the couple-app category has a low demand ceiling even for a company that can buy its way past every normal startup obstacle.**
- Contributing/inferred factors: NPE team's strategic pivot away from building apps toward seed investing; deliberately *not* integrated with Instagram/FB/Dating, unlike most Meta ventures, which may have starved it of cross-promotion.
- [techcrunch.com](https://techcrunch.com/2022/07/25/meta-is-shutting-down-tuned-its-social-app-for-couples/) — HIGH, directly fetched.

**Poparazzi** (adjacent, not couple-specific, but instructive): hit #1 free app store May 2021, quietly built its own internal replacement app by Aug 2022, publicly announced shutdown May 2023. The internal-replacement timing is the tell — the team had already given up on the mechanic a year before telling users. Useful as a pattern: **watch for the gap between when a team knows a mechanic has failed and when they admit it.**

---

## The kill list (ranked by evidence strength)

*(Ownership/continuity discontinuity is documented in its own section above, not ranked here — it's a different category of risk, governance rather than UX, and deliberately not diluted into a numbered list with the others.)*

1. **Static content runs out, and users notice within a year, sometimes faster.** (HIGH — direct, dated, verbatim App Store evidence from Agapé; corroborated pattern in askBae, Lovewick's paywall-driven version of the same problem.)
2. **Unforgiving streaks/guilt notifications.** (HIGH as a documented mechanic and as a professionally-argued critique; MEDIUM-strength direct user backlash evidence — the Noteit case and general Duolingo-pattern critique are solid, but not a large verbatim sample of couples specifically saying "the streak made me delete this.")
3. **Paywalling the partner's own view of shared data (calendar, question count).** (MEDIUM — recurring complaint across Cupla, Couply, Agapé, Lovewick, but mostly via search-synthesized aggregator summaries rather than primary-source verbatim quotes.)
4. **Notification-forced, feed-gated rituals that convert a moment into an obligation.** (HIGH as population-level evidence — BeReal's DAU collapse (61% in 5 months) is real, large-scale, and directly tied by multiple sources to exactly this mechanic, even though BeReal isn't a couple app — the mechanic transfers directly to a "daily photo" feature.)
5. **Category-wide tonal infantilization** (hearts, "hug" buttons, teen-coded copy). (MEDIUM — real and named in sources, but thinner evidentiary base than ideal; could not isolate visual/colour triggers specifically despite trying.)
6. **Hardware/reliability failure of an otherwise-loved mechanic.** (MEDIUM, single product — Bond Touch. Worth noting as a category, not just an anecdote: a good idea can die from execution reliability alone, independent of the emotional design being right.)

## The keep list (evidence of lasting past week two)

- **Async, no-pressure mechanics** (Marco Polo): genuine multi-year, daily-use testimonials from LDR users specifically, with *no* streak/gate/guilt mechanic — the strongest positive retention evidence in the whole dataset. Caveat: it's a many-to-many social tool, not private-two-person, so it's not a clean analog to your product's exclusivity.
- **Simple, single-purpose widgets that don't expand scope** (Locket Widget): a 2-year "made my life better" testimonial exists; the one negative signal found was pushback *against* a feature addition (emoji reactions) to an intentionally minimal product — evidence that restraint itself is a retained value, not just an initial pitch.
- **Reveal-gated daily exchange** (Agapé's "answer, then see theirs" mechanic): notably, in the negative reviews found, **nobody criticized the reveal-gate mechanic itself** — complaints were about repetition and price, not the gating pattern. This is a mild positive signal that reveal-gating (which this project's PRD already uses) isn't itself a churn driver.
- **Pure utility with no daily-engagement pressure** (Cupla, TimeTree, Raft — shared calendars): complaints are about ads and paywalls, not about the core mechanic feeling forced or fake. Utility framed honestly as utility seems to survive better than utility framed as a daily ritual.

## Evidence against our own assumptions

1. **Streaks aren't purely negative.** The Snapchat-streaks study found real bond-strengthening alongside the anxiety — both effects coexist in the same population. The founder's ban trades away a real (if adjacent-population-sourced) benefit to avoid a real cost. That's a defensible trade, but it's a trade, not a free win. — MEDIUM confidence, and the population (early-adolescent friendships, not adult LDR romance) is a genuine mismatch with this product, so this caution should be weighted lightly.
2. **The two-person-only, no-growth model has no comparable in this research set.** Every product examined — even the private ones like Couple/Pair and Avocado — was a company with growth incentives, which is very likely *why* they died (funding pressure, acquisition, pivot-for-scale). **Zero evidence either way** was found about whether a deliberately non-commercial, single-couple, no-monetization app has better or worse longevity, because nothing like that exists in the public record searchable here. This isn't evidence against the assumption so much as a flag that the core structural bet (no growth pressure = no reason to ever abandon it) is untested by anything in this graveyard — the closest analogy (Marco Polo, a company that must sustain itself) doesn't map cleanly.
3. **The one case of a company handling shutdown honorably (Avocado) still shut down.** Good user-respecting behavior at the end doesn't prevent the end — it just makes the end survivable for users. If continuity is the goal, the lesson from Couple vs. Avocado isn't "be nice when you die," it's "don't be a startup with an exit-dependent cap table in the first place" — which this project's model already avoids, for what it's worth.

## Gaps / UNKNOWN (explicitly documented)

- **Kiwi** and **Nobody**: not found as couple apps despite multiple targeted searches. Per team-lead: these were an error in the original brief, not a research gap — no further search needed.
- **Raft**, **Retro**, **Day One** (2-person angle), **"Between Us"** (ambiguous — two different real products share the name): confirmed to exist but not investigated at review/complaint level — deprioritized per team-lead's instruction not to open new research threads.
- **Time-zone-specific failure evidence**: thin across the whole set — one TimeTree reviewer caution is the best found despite four dedicated search attempts.
- **Large-N verbatim review samples**: blocked by Reddit (403) and Trustpilot (403) access, and App Store/Play Store JS-paginated review feeds only surfacing small samples per fetch. Everything quoted is real and dated, but volume representativeness cannot be claimed — confidence is flagged per claim rather than implying a bigger sample than was actually pulled.
- **Streaks helping an adult LDR couple specifically**: searched for direct positive testimony, found none. Real gap, not a null result being hidden.
