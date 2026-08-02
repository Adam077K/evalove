---
date: 2026-08-02
from: cpo (session cpo-vision-v2)
status: PROPOSED — contains two argued reversals of founder-set surfaces (§3). CEO must route those to the founder.
supersedes: the surface list in docs/04-features/LDR-APP-PRD.md §"seven surfaces"
companion: docs/04-features/USER-JOURNEY-V2.md
evidence: 9 research artefacts, 5 personas, ~105 sources
citation_rule: every claim below traces to a file with a quote, or carries [MY JUDGEMENT]
---

# Eva & Adam — Product Vision V2

## 0. Why this document exists and how to read it

Two builds have been rejected. The CEO's diagnosis is the useful part and I am
going to take it literally: *"Every previous agent started from our own
documents. Coherent documents produced a coherent app nobody wants"*
[REIMAGINE-BRIEF §0]. A vision document is the single easiest artefact in this
project to write beautifully and emptily, so the rule I have imposed on myself
is that every sentence that makes a claim carries a citation or is marked
`[MY JUDGEMENT]`. Where the evidence conflicts, I pick a side and say why.

There is no RICE score in this document. RICE needs a reach number and the
reach is two people, forever [REIMAGINE-BRIEF §4.1]. A prioritisation
arithmetic built for markets produces noise at n=2, and running it anyway would
be exactly the process-performance this brief was written to stop.

---

## 1. What this app is

**Eva & Adam is two places. One holds the last thing the other one left. The
other holds everything either of them has ever left. That is the entire
product.**

The longer version, once, and then I will stop restating it:

One of them is always awake while the other sleeps — for seven hours a day they
are not even on the same calendar date [REIMAGINE-BRIEF §2]. The app's only job
in that condition is to let whoever is awake leave one ordinary, unperformed
thing — a photograph of what is actually in front of them, twenty seconds of
voice, a line — and to have it be *already there*, without ceremony and without
owing anyone a reply, when the other one wakes. It never asks for anything. It
never counts anything. It never reports who has seen what. And because both of
them will do this for years, the second thing it does is keep every one of those
in an object that gets better with age, that comes back to them on the day it
matches, and that either of them can carry out of the building alone, at any
moment, without the other's help.

It is not a place to be together. Being together is what FaceTime is for and
they already have it, free, on both phones — the highest-scored piece of
evidence in this entire research corpus is a person describing FaceTime
(*"I love falling asleep on the phone with you every night"*, 2,898 upvotes)
[R1b, "The asleep hours"; P4, FATAL 1]. This is the place where the hours they
are apart stop vanishing.

### Why I believe this rather than something else

Two people who never saw each other's work designed the same product. P1 — the
advocate, writing from Eva's 11pm — ended with: *"let me leave one true,
unperformed thing… that arrives quietly in his ordinary view the moment he
wakes, not as a notification demanding a reply, with no delivered-and-seen
status reported back to me, and no penalty of any kind on the nights I have
nothing to leave. Not a message. A lamp left on."* P4 — the adversary, whose
entire assignment was to kill this product — ended with: *"I would keep it if it
never asked me to open it. If the only thing it ever did was put the last
ordinary photograph he took — not a good one, the boring one, his desk, the
street, the thing he ate — on my lock screen at full size with nothing else on
it, and the only way to answer was to take one back."*

When the advocate and the assassin independently draw the same object, that is
the strongest signal available in this project and I am building it.

---

## 2. What I would cut, and why

This section is the one the brief demands most explicitly, so it is specific
about files and named surfaces rather than about principles.

### 2.1 Cut: five of the seven current surfaces

The app currently ships `home` · `book` · `today` · `dates` · `send` · `echo` ·
`pocket` [REIMAGINE-BRIEF §1]. Seven surfaces for two people is the structural
tell that nobody decided what this was.

**`home` — cut outright.** It is a dashboard that summarises the other six.
R4 walked it live: two clock cards, a Today preview, a date-idea card, two tiles
linking elsewhere [R4, Part 1]. A dashboard exists because tabs exist. Remove
the tabs and Home has nothing to be. Its one genuinely good element — the
computed line *"Eva's just off work, Adam's fading"*, which R4 confirmed is
live, not fixture text — moves to the top of Today as a single line.

**`send` — cut, merged into Today.** The build currently distinguishes a heavy
daily photo ritual from a light "something small" quick-send, headed *"LIGHTER
THAN THE DAILY PHOTO"* [R4, Part 1]. Two ways to send is one too many, and the
existence of a "heavy" tier is what turns leaving something into a performance.
One act, no tiers.

**`dates` — cut as a destination.** See §2.3.

**`echo` — cut as a destination, narrowed as a feature.** See §2.4.

**`pocket` — kept, but never a tab.** A dock item labelled "private" is a
signpost pointing at the private thing. §4.2 of the brief requires that private
content never appears in an ordinary view; a permanent navigation entry is an
ordinary view. Reaching it stays deliberate and re-authenticated, which is what
it already does [R4, Part 1] — it just stops advertising itself.

### 2.2 Cut: the completed pair, the half pair, and the single plate

This is the most specific cut in the document and the one I would defend
hardest.

The current Today surface groups the day into three named states: *"THE HALF
PAIR — THE DAY IS STILL OPEN"*, *"THE COMPLETED PAIR"*, and *"THE SINGLE PLATE —
A DAY THAT CLOSED HALF-FINISHED"* [R4, Part 1, observed live]. R4 called this
structure *"a direct, visible expression of `lib/shared-day/`… worth keeping
outright in the rebuild."*

It is beautifully engineered and it is a scoring mechanic. "A day that closed
half-finished" is a verdict on a day one of them did not post. "The completed
pair" is its opposite, which is what makes it a verdict. This is a direct
violation of the founder's own immovable — *"nothing that makes a missed day
feel like failure"* [REIMAGINE-BRIEF §4.3] — and it survived because it is
written in good prose rather than rendered as a number. P4 named the general
form of this exactly: *"You have removed the counter and kept the ledger"*
[P4, "The archive is a streak with the counter filed off"].

Nothing in this product may ever classify a day by how many people contributed
to it.

### 2.3 Cut: the 98 date ideas as a browsable surface

I am not cutting the library. It is 98 activities across 179 sources, 89 of them
verified [library.json `counts`; DECISIONS 2026-08-02], and it is the single
largest researched asset in the repo. I am cutting the idea that it is a place
you go.

The evidence against a Saturday tab is stacked and each layer is independently
sufficient:

- P4 analysed all 98 records: *"Of the 15 S-tier entries… 14 name a third-party
  product… FaceTime appears in 48 of the 98 entries… Zero of the top fifteen
  happen inside Eva & Adam."* The library's function is to route them out of the
  app, which is correct advice and a bad destination.
- The project's own memory already says it: *"they open this mid-call; browsing
  a list is a failure state"* [USER-INSIGHTS.md, founder verbatim]. The
  library's native content type is a list.
- P5 — the persona whose entire job was to advocate for Saturday — did the
  cadence arithmetic and rejected weekly novelty herself: only 20–24 items are
  both-alert eligible, so *"twenty-four items, used once every single Saturday,
  is exhausted in about four and a half months, not two years"*, and concluded
  *"I'd rather be a day that's occasionally, gratefully rescued by 98 good ideas
  than a day that quietly runs a content queue."*
- A tab that is dead six days out of seven does not stay discoverable inside a
  daily app [P4, "Saturday — the weakest surface"].

**What it becomes instead:** one gesture, available from anywhere, that returns
exactly one suggestion already correct for the moment — P5's *"one tap for how
much of me they have, then one card, then get out of the way"* — with `not this
one` costing nothing and no record kept of having asked. It is a rescue, not a
menu. It is not one of the surfaces built first.

### 2.4 Cut: the AI that represents the other partner

The founder reversed the original non-goal and asked for *"an AI that represents
the other partner"* [DECISIONS.md, 2026-08-02, founder verbatim]. I am not
cutting a founder decision, but I am recommending a hard narrowing and flagging
it rather than doing it quietly.

P1, at the exact hour this feature is imagined for, rejects it: *"A chatbot
standing in for him at 11pm is the most content-heavy, most performed thing I
could open. If I'm lonely enough to want that, I don't want a puppet. I'd rather
have nothing."* That sits directly on top of R1's strongest finding — that what
this population treasures is *"intimacy with zero content and zero
performance"* [R1, "What surprised me"] — and on top of the peer-reviewed
concern already recorded in DECISIONS.md, that long-distance couples over-
idealise each other and that idealisation predicts trouble at reunion
(Stafford & Merolla 2007).

The narrowing: **keep a strictly-quoting search over the archive; delete the
partner simulacrum.** You ask it something and it hands back their actual words
and actual photographs, with dates, and never a sentence neither of them wrote.
This is not a compromise I invented — the current build's own copy already says
it: *"It will quote Adam word for word. It will never guess what Adam would
say"* [R4, Part 1, observed live], and R4 correctly called that the best-written
line in the app. It stops being a chat partner and becomes how you find things
in two hundred days of material. It lives inside The Book. It is not a tab.

**Flagged to CEO:** this narrows a founder decision. The founder should see
P1's paragraph and decide.

### 2.5 Cut: The Gap as a destination

Founder-set surface, argued reversal — see §3.

### 2.6 Cut: Saturday as a destination

Founder-set surface, argued reversal — see §3.

### 2.7 Cut: the per-person hue as an authorship marker

Minor, but it is a tell. At n=2 an authorship marker solves a disambiguation
problem that cannot exist — every item was made by one of exactly two people and
the receiver always knows which, because she made the other half [P4,
SURVIVABLE]. The DESIGN-DIRECTION keeps it as a founder carve-out at hairline
scale [§1], so it costs nothing and I am not fighting it. Noted, not demanded.

---

## 3. The two reversals I am asking the founder for

DESIGN-DIRECTION §7 sets three surfaces to build — **Today**, **The Gap**,
**Saturday** — and marks them founder-chosen. I am keeping one and asking to
swap two. Both arguments are below in full so the founder can reject them on
the merits.

### 3.1 The Gap: keep the engine, cut the room

`lib/shared-day/` is real engineering — 109 tests, all four DST transitions,
provably cannot file a photo on a day that is already complete
[REIMAGINE-BRIEF §1]. Nothing here touches it.

But a clock is not a destination. It is right on day one and right on day four
hundred, and correctness generates no reason to return: *"You look at it, you
learn the number you already knew, you close it. There is no second visit that
differs from the first"* [P4, "The Gap"]. Worse, it is built on the one ache two
independent research passes searched for explicitly and could not find. R1 §3:
*"no one was found putting the date-crossing specifically into words"*
(confidence LOW). R1b Gap 1, after nine dedicated threads, full comment greps
and DuckDuckGo phrase searches: *"did not surface anyone framing the
date-crossing as its own named ache"* (LOW-MEDIUM).

**The Gap becomes a stamp, not a room.** Every single item in the product
carries both clocks and the other person's state at the moment it was left —
*left while Eva was asleep · 5:12 his morning · 22:12 her night*. That is the
two-timezone engine doing visible work on every screen instead of on one screen
nobody revisits, and it is a caption rather than a dashboard. One line at the
top of Today carries the live version, in the couple's own window language, the
way the current build already computes it [R4, Part 1].

**And it gets one thing it does not currently have.** R1b's single most
directly-relevant unprompted finding is not the date-crossing at all — it is DST
asymmetry, which is Eva and Adam's literal situation, 7 hours for ~339 days and
6 for ~26 [REIMAGINE-BRIEF §2]:

> *"The difference in our timezones increasing from 7 to 8 hours is painful."*
> — 61 upvotes, dedicated thread, 2022-11-05
> *"we always dread the time changing because it just shakes up the routine"*
> — laurathestork
> *"For a week we had only sweet 6 hours in between us, and now we're back to 7.
> It really made a difference."* — Iubita_lui_dracu

P3, three years in, says it never got easier: *"the week the clocks change…
Three years hasn't dulled that week for me either."* P4 named the imbalance
precisely: *"The engineering effort went to the silent condition; the loud one
gets nothing."*

So for those ~26 days a year, the one clock line reads differently and says so
plainly. No banner, no countdown, no push — the register is a fact, not an
event. R1b's own recommendation: *"don't hide or smooth over the DST transition
weeks… surfacing them may land as validating rather than as showing math
homework."* This is the cheapest correct thing in the document.

### 3.2 Saturday: cut the surface, keep the day

Argued in §2.3. The one point I want to add, because it is the strongest and it
comes from the research rather than from me: the founder's premise for a
Saturday surface is that their one shared day needs help. R1b looked for that
and found the opposite. Across nine threads and ~22 relevant commenters, the
corroborated severe pain is having **no** shared day — *"we don't get to spend a
single day off together. It's very hard"* (27 upvotes, top comment) — while
couples who *have* a protected day describe building the whole week around it,
without complaint [R1b, Gap 3]. R1b explicitly retracts R1's single-source
"weekends are hardest" claim. Eva and Adam have a Saturday. The surface answers
a question nobody in the data is asking.

P5, arguing her own case as hard as she could, arrived at the same place:
*"Most of my seven hours should probably just be that, with the app saying
nothing at all."*

### 3.3 What I am asking to build instead

**Today** (kept, promoted — it is no longer a tab, it is what the app *is* when
you open it) and **The Book** (the archive), with **The Pocket** as a locked
drawer inside the Book rather than a third place.

The Book is not a nice-to-have that got promoted. It is the answer to three
separate fatal problems at once — the empty state, the content supply, and what
survives the distance ending — and I make that case in §5 and §6.

---

## 4. The core mechanic, in its PWA-constrained form

### 4.1 The act

Either of them, at any moment, leaves **one thing**: a photograph taken now, up
to about thirty seconds of voice, or a line of text. Camera first and fastest.

- **No blank composer.** P1 names an empty prompt as one of three things that
  would make her close the app feeling worse: *"A blank prompt with a cursor in
  it — 'Share something with Adam' — staring at me with nothing behind it."*
  The capture surface is a viewfinder, not a text field with a placeholder.
- **No caption required.** No recipient to choose. No tiers, no "heavy" and
  "light" versions of the same act (§2.1).
- **It does not create a thread.** There is no reply affordance on an item. The
  only response is to leave one back — the same act, the same weight, not a
  reply to a message. This is the load-bearing distinction and it comes straight
  from P1: *"A message implies a thread, and a thread implies an expectation —
  did he see it, is he going to answer, why hasn't he answered. A thing left
  implies none of that. It only has to be found."*
- **It is stamped automatically** with both clocks and the other's state at the
  moment of leaving (§3.1). Absolute time, never relative. *"Monday, 5:12 his
  morning"* is a caption; *"3 days ago"* is a ledger entry. [MY JUDGEMENT — the
  distinction is mine; the prohibition on the product keeping score is R1b's.]

### 4.2 The arrival

- **A silent dot on the app icon. Never a number.** The Badging API can set a
  dot with no count; a count is a tally of what you owe. [MY JUDGEMENT on the
  rule; the prohibition on counting is founder-locked, REIMAGINE-BRIEF §4.3.]
- **Optional push, quiet-hours-aware, computed per person in both zones.** This
  is the bug most likely to exist and least likely to be noticed, because it
  will only ever be debugged for the schedule the builder personally lives
  [DESIGN-DIRECTION §8.3]. The push carries the fact, never a demand; the words
  *"Eva is waiting"* and every variant of them are banned — R2 found a
  competitor built its entire positioning against that exact sentence, which
  means it is a recognised pain point in this category [R2, §3].
- **Opening lands directly on the newest thing, full bleed, zero navigation.**
  One tap from icon to content. This is the whole compensation for not having a
  widget and I discuss what it does not compensate for in §4.5.
- **No seen status. Ever.** Not delivered, not read, not opened, not "active
  now". This is a hard rule with the same status as the privacy rules, not a
  preference. P1: *"A 'delivered' state is fine. The moment it shows me 'seen',
  it's turned a gift into a stakeout."* It is also her second stated reason for
  deleting the app.
- **Never record or display who left more.** Adam's slack 5am against Eva's
  rushed commute-prep morning means he can leave more, and richer, without it
  meaning anything about how much he loves her [P2, asymmetry 4;
  DESIGN-DIRECTION §8.3].

### 4.3 The ceremony, and exactly when it is allowed

`SealedCard.tsx` is a real spring-based sealed-to-opened flip and R4 confirmed
it works live, with the app's own deliberately stiff spring (stiffness 300,
damping 30, measurably stiffer than the `motion` library default of 100/10)
[R4, Part 2]. It is the best interaction in the codebase.

**Rule: the ceremony fires only on items left while you were genuinely asleep.**
If you were awake when it arrived, it is simply there, no unsealing. The
ceremony is proportional to the real gap and is never manufactured — which is
both the design direction's standing rule (*"the seal must be the real gap.
Never a manufactured timer, never a global reveal clock"*, DESIGN-DIRECTION §5)
and R3's line: *"an artificial delay earns its place only if… it's mirroring
something factually true about the two people's lives (their actual 7-hour gap
already does this work)"* [R3, Q1].

This also resolves the asymmetry P2 flagged loudest — that a slow savourable
reveal is a gift at his alert 5am and friction at her exhausted 11pm. It fires
on *her* morning too, because Adam's entire workday (IL 09:00–17:00) lands
inside her night [derived from REIMAGINE-BRIEF §2 and library.json windows —
MY JUDGEMENT on the derivation, arithmetic from sourced inputs].

### 4.4 There is no empty state, because nothing is ever consumed

This is the structural answer to the attack that would otherwise kill the
product.

P4's first withdrawal condition: *"Show me a screenshot of a Tuesday at 15:00
Eva's time. Adam has been asleep six hours. He left nothing. Nothing arrived.
Show me that screen, and show me why Eva opens it again on Wednesday."*

**Answer: that screen shows the last thing he left, unchanged, still there.**
Nothing in this product is ever marked read, cleared, archived-on-open or
consumed. The last thing left stays up until it is replaced. There is no unread
count, no inbox to empty, no "nothing new today" copy to write — because the
state does not exist. It is a lamp, and a lamp that has been on since yesterday
is still on.

P3 stated the requirement from the other end, at day four of a three-day
silence: *"reopening it feels exactly like reopening it after three hours —
nothing diminished, nothing expired, nothing waiting to be 'caught up on'."*
P2 stated it from his side: *"If I open it and there's nothing fresh, I should
land somewhere with weight already in it — the accumulated archive, not a blank
tray with a sad little icon."*

**The honest cost, stated rather than hidden:** the same photograph on the third
consecutive morning does communicate something. I have removed the count and the
grey gap, but I have not removed the fact. My mitigation is that the item's
stamp is absolute rather than relative, so the surface never does the
subtraction for you. Whether that is enough is genuinely unknown and it is in
§7.

### 4.5 What is lost against the widget version, precisely

The immovable is *"installed to the home screen… no app store"* [REIMAGINE-BRIEF
§4.7], which means a PWA. P4 flagged, correctly and as an unverified blocker,
that home-screen and Lock Screen widgets require a native WidgetKit extension
inside a native binary, which a home-screen web app cannot provide — and that
this makes *"the single mechanic in your entire research corpus with proven
multi-year two-person retention technically unavailable to this product by its
own immovable constraint"* [P4, FATAL 1]. My reading agrees with his; **CTO must
verify on iOS 26 before this is designed around.**

What is genuinely lost:

1. **She has to decide to open it.** Locket's entire achievement is that
   *"the photo simply is there the next time you glance at your phone"* — the
   gift quality comes from it *"appearing in your ordinary environment… rather
   than in a place you have to remember to check"* [R3, Locket]. We cannot do
   that. Every arrival in our version costs a decision, and P1's honest Tuesday
   is what that decision loses to: *"I open Instagram, exactly like the brief
   predicted, and that's fine."*
2. **Presence becomes intermittent instead of ambient.** A widget is present
   whether or not anyone chose it. We are present only in the seconds after a
   tap.
3. **The dot cannot say what arrived.** A widget's content *is* the
   notification. Ours announces that something exists and withholds it, which is
   a strictly worse shape and slightly closer to the thread we are trying not to
   be.
4. **Opens become instrumentable, which is a temptation the widget never
   created.** Rule, stated now so it is not discovered later: opens are never
   recorded, never surfaced, never used to time anything.

What we get that the widget version does not have: **the archive.** Locket has a
monthly recap video and nothing else — it is a river. Ours is an object, and
§5 argues that the object is the part that survives.

**One unverified lever worth a single check, not a redesign:** if iOS 26 Safari
web push can carry an image in the notification body, the arrival itself moves
to the lock screen and loss (1) and (3) shrink substantially. I could not verify
this and neither could R4. CTO to check; do not design around it until then.

**And the honest note on the constraint itself:** "no app store" is the single
most expensive line in the immovables. It is not my call to move and I am not
asking to move it — but it should be priced out loud rather than absorbed
silently, because it costs the one mechanic with proven multi-year retention at
n=2.

---

## 5. What happens on the day the distance ends

P4 found this and nobody else did, and he is right that having no answer is not
an option: *"This product is designed for a condition both of its users are
actively trying to end, and nobody has written a line about what it becomes on
the day they succeed."* The immovables lock two users forever; they never lock
seven hours forever. And the strongest longitudinal voice in the corpus — 19
years together, 6 of them long-distance — says the distance is the thing you are
supposed to be dismantling: *"it needs a plan… 'One day' isn't enough. We had
timelines"* [R1b, Gap 2]. A second voice, 13 upvotes: *"It's an obstacle, a
temporary one."*

**The answer: the mailbox becomes obsolete, the archive becomes the product, and
nothing has to be deleted or rebuilt — because the gap was never a surface.**

That is the whole reason for §3.1. If The Gap were a room, the product would
have a room that empties on the best day of their lives. As a stamp, it
degrades gracefully: on the day they share a city the stamp reads *"this
afternoon"* instead of *"while you were asleep"*, the ceremony in §4.3 simply
stops firing because nobody was asleep, and `lib/shared-day/` keeps working
because two people in one city are the zero-offset case of a two-timezone day
model, not a different model. No code dies. No screen empties. [MY JUDGEMENT on
the degradation behaviour; the engine's capability is sourced to
REIMAGINE-BRIEF §1.]

Today, likewise, does not need the gap. It needs one of them to leave something
and the other to find it later, and "later" is still true when later is four
hours instead of fourteen.

The Book needs the gap least of all. A scrapbook of two hundred days does not
stop meaning anything when you move in together; it means more, and it is the
only place that will remember what those years were actually like. R3's
strongest academic source is exactly this: Phillips 2016 (peer-reviewed) treats
the scrapbook as an artefact through which people *"collect, reconstruct, and
protect autobiographical memories"* via the object itself, not its contents
[R3, Track B].

**What the product does not do about the ending: it does not track it.** No
countdown, no "days until", no plan tracker, no reunion feature. This is a
locked founder decision and I am honouring it rather than routing around it —
*"a counter with no end in sight reads as pressure, not comfort… the whole
arithmetic-of-separation register is off the table. Applies to any future
feature"* [USER-INSIGHTS.md, founder preferences, 2026-08-02].

**But I am flagging the tension rather than burying it,** because it is real and
the founder should own it with the evidence in hand: the single most-endorsed
longitudinal advice in the research corpus is that a long-distance relationship
*needs a written plan with dates*, and this product is forbidden from holding
one. I think the lock is still right — a plan belongs between two people, and a
date they have to look at every morning is the exact shape of the pressure the
rule exists to prevent [MY JUDGEMENT] — but that is a call for the founder, not
for me, and it should be made knowingly.

---

## 6. What guarantees the archive outlives the app

R2 promoted this above every other finding, in its own section, and it is
currently unaddressed. The documented worst case is not churn:

> Couple (formerly Pair): 100,000 users in week one. Three of four cofounders
> left for Dropbox in 2014. Acquired 2016, transferred to an unrelated entity in
> 2018 *"announced to users via a single tweet."* By April 2019 the web app
> returned 503, **account deletion was broken, and there was no communication to
> users about what happened to their years of private photos, messages, and
> shared history.** [R2, "Do not miss this"]

The contrast case shipped an export tool before it died [R2, Avocado]. R2's own
conclusion: *"good behavior at the end doesn't prevent the end, it only makes
the end survivable for users."*

Now apply it here. The engineering organisation is one person, who is also half
the user base, and R4 could not open six of seven surfaces of the live app
because the shared password *"lives only in the founder's password manager"*
[P4, FATAL 3]. **The single point of failure is not hypothetical; it already
blocked work in this session.**

Here is what must be true. This is a governance property, not a feature, and I
am stating it as a build-order constraint because that is the only form in which
it survives contact with a backlog.

**1. The export ships before the archive accepts its first photograph.** Not a
backlog item, not Phase 2 — a sequencing rule. Nothing may be imported into The
Book until there is a tested export that gets it out again.

**2. Eva can run it alone.** She needs her own credential. Right now the app has
one shared app password plus a "who's this?" identity picker [R4, Part 1], which
means Eva cannot get in without Adam's password, cannot change it, and cannot
recover it. That is a governance fact hiding inside an auth design and it should
be read as one.

**3. The export must open with the app gone and the company gone.** Original
files, unmodified, in dated folders, with a plain index — not a proprietary
blob, not a format that needs our code to read. Openable on a laptop in ten
years.

**4. Either of them can delete what they made, unilaterally, without the
other.** §4.2 of the brief makes privacy a real security property against
outsiders. Nothing currently protects either of them from the other, and P4 is
right that in a bad ending the archive is *"intimate photographs and voice
notes, hosted on infrastructure one partner owns, behind a password in one
partner's manager, with no export."*

**5. The strongest version, and the one I actually want: the copy is automatic
and it lands somewhere Eva owns.** A scheduled export of everything, in open
formats, written to storage under her own account, on a recurring basis, so that
the archive's survival never depends on anyone remembering to run anything or on
anyone still caring. Avocado's export only ran because someone chose to run it.
A recurring copy into the other partner's own storage is strictly stronger than
a button, and at this data scale it is close to free — the cost model already
provisions an automated mirror to R2 and a nightly job [DECISIONS.md,
LDR-App cost model]. The change is not the mechanism; it is *whose account the
copy lands in.*

**6. One written paragraph in the repo: what happens if Adam stops.** Who pays
Supabase, who can restore it, what Eva does at 3am in New York if it returns
503 [P4, FATAL 3, withdrawal condition 3].

P3 supplies the reason this is worth doing early rather than eventually, and it
is not risk management — it is a product argument: *"if I trusted the exit was
real and always available, I think I'd put more in, not less. The fear that
currently makes me hold something back from any shared app isn't 'will this
end' — everything ends — it's 'will I be able to leave with what's mine when it
does.'"*

---

## 7. What would make this fail

My own list. If I cannot argue against this convincingly I have not understood
it.

**1. The open never happens.** This is P4's FATAL 1 and I have only partly
answered it. I claim that one tap with zero navigation is enough of a
substitute for ambient arrival. I might simply be wrong, and the failure would
be quiet: P1's honest Tuesday, repeated, where Instagram wins and nothing bad
ever happens. The mitigation I do not have is the widget, and the constraint
that removes it is not mine to move.

**2. Two exhausted authors and no content pump.** P4's FATAL 2 stands: every
product in the graveyard had an outside source of material and several still
died within a year — Agapé hit the wall in under twelve months *with* a
professional library refilling daily. My answer is that the archive is the
pump and the founder-confirmed backlog of ~300 curated photographs
[DECISIONS.md, cost model v2] is its starting fuel, so resurfacing works from
day one instead of month six. I explicitly reject the other candidate pumps —
weather, sunrise, "the world" — as decoration, which is P4's own "widget with a
thesis". **If the backlog import does not happen, this vision loses its answer
to its second-biggest attack.** That makes an import job a dependency of the
concept, not a convenience.

**3. The archive records the gaps anyway.** I have removed the counter and the
grid, and P4's attack still partly lands: dates are in the data whatever the
default view does. Resurfacing by anniversary rather than by ledger reduces the
addressability of an absence; it does not eliminate it.

**4. The last-thing-still-there becomes its own quiet counter.** §4.4's honest
cost. Three mornings of the same photograph is information, and I have not
found a way to remove it that does not reintroduce an empty state.

**5. Eva has still never been asked anything.** Zero Eva-sourced inputs exist in
the entire repo; USER-INSIGHTS.md's source log has two rows and both are Adam
[P4, FATAL 3]. Every persona in this research, including the five that argued
with each other, is downstream of one person's account of what the other one
feels. P4's cheapest fix is five questions in her own words, verbatim, in the
repo, before another surface is designed. Nothing in my vision survives her
answering them differently, and I would rather find that out now.

**6. The builder's own hour is the only hour that gets iterated on.** Adam will
live his 5am hundreds of times and never once live Eva's 11pm [P2, asymmetry 3;
DESIGN-DIRECTION §8.3]. Everything drifts toward fitting him exactly and
approximating her, invisibly, because from inside it only ever feels better.

**7. It competes for the resource it exists to serve.** *"Every minute inside
this app is a minute not on the call… This app asks them to leave the channel
and go somewhere else to feel close, using energy they are documented as not
having"* [P4, FATAL 2]. Every hour building it is an hour not spent in the
seven-hour-wide window it is about.

**8. The thing they actually miss cannot be delivered by anything.** R1's own
conclusion, which no product in this category has ever solved: *"The complaint
isn't 'we need better video,' it's 'video cannot do this specific thing, and
nothing can.'"* And R1 §4: *"Nobody invented technology — they invented tiny
private language… None of it needed an app. That's worth sitting with."*

**9. My own sharpest self-attack:** I have kept the surface P4 said would be
visited twice, called it a stamp, and declared the problem solved. If the stamp
is not genuinely felt — if *"left while Eva was asleep · 5:12 his morning"*
reads as metadata rather than as a fact about their life — then I have renamed a
clock and shipped it on every screen instead of one.

---

## 8. Where I disagree with the research

Stated so these are decisions rather than oversights.

**R1's "weekends are the hardest day."** Rejected. Single source
(ThePhoenixRises), and R1b looked for corroboration across nine threads and
found none, plus one direct counter-quote [R1b, Gap 3]. R1b's own retraction is
explicit and I follow it.

**R3's ranking of unlock-on-arrival above ambient arrival.** R3 ranks
Slowly/FutureMe-style delayed unlock first and Locket-style ambient second
[R3, Q2]. For *this* couple I invert it. Slowly's and FutureMe's power comes
from elapsed time making the sender unfamiliar to themselves — R3 says so
directly: *"FutureMe's version needs years to work because the sender needs to
become unfamiliar with their own past self; a 7-hour gap between two people who
know each other intimately doesn't reproduce this."* Seven hours is a real gap
and a poor mystery. Ambient wins here on the evidence R3 itself supplies.

**P5's proposed one-tap duration selector for Saturday.** Rejected along with
the surface. It is a good design for a screen I am not building, and adding a
"how much time do you have" question is the app asking them something, which is
the thing the whole product is trying not to do [MY JUDGEMENT].

**P2's "hand me the pen" reframe on a quiet morning.** Partly rejected. He
proposes that on a morning with nothing new, the app should *"hand me the pen
rather than dwell on her silence."* I agree with the intent and reject the
implementation, because an invitation to post is a prompt, and P1 names prompts
as a delete-trigger. The pen is always in the same place; it is never handed to
anyone.

**The library's own S-tier ranking of a Duolingo streak.** P4 found a genuine
live contradiction: the top tier of the couple's own library includes a streak,
which is the exact mechanic the founder banned [P4, "The 98 date ideas"]. I
resolve it in the founder's favour and note why the library's justification does
not rescue it: the library argues the streak is fine because it checks each
person's own calendar day independently. That answers the timezone objection and
not the guilt objection, which is the one the ban is about. The ban stands; the
library entry is not surfaced.

---

## 9. What is not mine to decide

- **Visual language, palette, motion craft** — Design-Lead, under
  DESIGN-DIRECTION. One product statement that does bear on it: `w1`
  ("She's in bed, he's awake", IL 05:00–09:00 / NYC 22:00–02:00) is the
  library's own largest window [library.json], so night is where most sessions
  are. Design it first or alongside, never after. That is a claim about session
  distribution, which is mine; how it looks is not.
- **File structure, worker split, branch strategy, whether shared-day needs a
  sleep-window config** — CTO.
- **Whether iOS 26 Safari web push can carry an image** — CTO, and it is the one
  open technical question that changes how much §4.5 costs us.
- **The AI narrowing in §2.4 and the two surface reversals in §3** — founder,
  via CEO. I have made the arguments; I have not made the decisions.
