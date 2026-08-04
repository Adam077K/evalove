---
date: 2026-08-02
persona: P4 — the deleter
stance: >
  Adversarial. I have been long-distance for years and I have installed and
  deleted every product in this category — Between, Paired, Agapé, Lovewick,
  Locket, Noteit, Cupla. Not one of them lasted a month. I am not cynical about
  the relationship. I am cynical about software for the relationship. My
  position is that this category is a solution looking for a problem, and that
  the thing it claims to solve is not solvable by an app. My job on this board
  is to find the fatal flaws while they are still cheap to fix.
files_read:
  - docs/08-agents_work/handoffs/2026-08-02-REIMAGINE-BRIEF.md
  - docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md
  - docs/08-agents_work/research/2026-08-02-R2-why-couple-apps-die.md
  - docs/08-agents_work/research/2026-08-02-R1-voices-of-the-gap.md
  - docs/08-agents_work/research/2026-08-02-R1b-reddit-voices.md
  - docs/08-agents_work/research/2026-08-02-R3-asynchrony-as-gift.md
  - docs/08-agents_work/research/2026-08-02-R4-motion-and-real-products.md (frontmatter)
  - .claude/memory/USER-INSIGHTS.md
  - docs/10-activity-library/library.json (analysed, 98 records)
  - /Users/adamks/Downloads/Eva & Adam -app deisgn inspo/ (5 images, 2 viewed directly)
---

# P4 — The Deleter

Everything below names a mechanism and cites a product that died of it. Where I
could not evidence something I have marked it `[UNEVIDENCED — my judgement]`.
There are four such marks in this document and I have tried to make each one
earn its place.

I want to say one thing before the attacks, so the rest is read correctly: the
research on this project is better than the research on most funded startups.
R2's ownership section and R1b's streak distinction are genuinely excellent. My
attacks are not that you researched badly. My attacks are that the product
being drawn does not follow from what you found, and in three places directly
contradicts it.

---

## FATAL 1 — "Presence with zero content" describes a property of bodies. Rendered as software it is an empty screen with a good excuse.

**Lethality: FATAL. This is the idea with the most momentum and it has had the
least scrutiny, which is exactly why it will survive to launch and then kill
you quietly.**

### The mechanism

The hypothesis was derived from R1 §7 and R1's "what surprised me" section:
people adore the unglamorous, passive version of presence — hearing a partner
sleep, watching them drift off, both doing separate things in the same room.
That finding is real and well-sourced. The inference drawn from it is not.

Go back and look at what every single one of those quotes is physically
describing:

> "as close to falling asleep WITH him as I can get" — AllieCat1989, 2011-06-25
> "we will say goodnight then watch the other drift off to sleep" — Shortstuff, 2011-02-28
> "I absoultely adore hearing my SO sleep" — differentcountries, 2014-05-21
> "I love falling asleep on the phone with you every night" — r/LongDistance, 2019-11-22, **2,898 upvotes — the highest-scored post in R1b's entire pass**

Every instance is **an open audio or video channel left running**. Not one of
them is a screen. The single highest-signal piece of evidence in the whole
research corpus is a person describing FaceTime. The mechanic with the most
enthusiastic testimony you found is *already shipped, already installed on both
their phones, and free*.

The remainder of the ambient-presence evidence — "doing separate things in the
same room," "seeing him opposite me when I open my eyes," "I can't actually
hold his hand" — is describing physical co-location. R1's own conclusion, which
I do not think anyone on this board has quoted back yet:

> "The complaint isn't 'we need better video,' it's **'video cannot do this
> specific thing, and nothing can.'**" — R1 §7

And R1 §4, on the rituals people actually invented for themselves:

> "Nobody invented technology — they invented tiny private language... **None of
> it needed an app. That's worth sitting with.**"

The leading hypothesis takes "people want unperformed presence" and infers
"therefore build a surface that renders unperformed presence." But presence with
zero content has, by construction, nothing to render. Strip the content and what
is left on a Tuesday afternoon is a clock, a status dot, and a claim about
intimacy. That is not the asynchronous equivalent of sitting in the same room
saying nothing. That is a widget with a thesis.

### The evidence that the *right* container is not this app

R3 found the one shipped product that actually delivers ambient two-person
presence with proven retention — Locket. 47.6% one-month retention on new US
users; average user has 14 friends, not thousands; the mechanic works fine at
n=2. R3 is also explicit about *why* it works:

> "Locket has **no reveal ceremony at all** — the photo simply *is there* the
> next time you glance at your phone. The 'gift' quality... comes from the photo
> appearing in your ordinary environment (the home screen you already look at
> dozens of times a day) **rather than in a place you have to remember to
> check.**" — R3, Track A

Ambient presence is not a surface. It is the *absence* of a surface. The moment
you require someone to open an app to feel ambiently present, you have converted
ambient into scheduled, and scheduled presence is a chore — which is exactly the
mechanism that killed BeReal (DAU 15M → <6M in five months, Oct 2022–Mar 2023;
"posting became housekeeping — an obstacle to be cleared").

### The constraint nobody has checked

REIMAGINE-BRIEF §4.7 locks: iPhone, installed to the home screen, **no app
store.** That is a PWA.

To the best of my knowledge, WidgetKit home-screen widgets and Lock Screen
widgets require a native app extension shipped inside a native app binary. A
home-screen web app cannot provide one. Web push works on installed PWAs; a
home-screen widget does not.

**If that holds, the single mechanic in your entire research corpus with proven
multi-year two-person retention is technically unavailable to this product by
its own immovable constraint** — and nobody has written that sentence down. I am
flagging this as a blocker to verify on iOS 26 before another hour of design
work, not as a settled fact; I could not test it in this session. But if it is
true, the ambient hypothesis and §4.7 cannot both survive, and the board should
know that before it picks one.

### What would make me withdraw this attack

Two things, either of which does it:

1. Show me a screenshot of a Tuesday at 15:00 Eva's time. Adam has been asleep
   six hours. He left nothing. Nothing arrived. Show me that screen, and show me
   why Eva opens it again on Wednesday. Not a description — the actual render.
   If that screen is good, I am wrong about the whole attack.
2. Ship the ambient layer as a real home-screen or Lock Screen surface that
   renders without the app being opened, and demonstrate it working on both
   their phones. If presence arrives without an open, my mechanism does not fire.

---

## FATAL 2 — Two people forever is not a purity that protects the product. It is a content supply of exactly two exhausted humans, and every product in your graveyard had more.

**Lethality: FATAL.**

### The mechanism

Everyone on this project treats "two users, forever" as the thing that makes
Eva & Adam immune to the graveyard: no growth pressure, no funding runway, no
acquirer, therefore no reason to die. R2 says this cleanly and honestly, and
also flags that it is **untested** — nothing in the public record tests it.

Here is the part the framing hides. The graveyard products did not only have
growth pressure. They also had **content pumps** — sources of new material that
arrived without either partner having to author it:

| Product | Its outside content pump |
|---|---|
| Paired | Therapist-written question, delivered daily, authored by a company |
| Agapé | A professionally-built question library, refilling on a schedule |
| Lovewick | 350k-user-scale question library |
| Between | Sticker packs, imported calendar events, "memory box" resurfacing |
| Cupla / TimeTree | **The world** — work, flights, appointments generate the content |
| Marco Polo | Many-to-many; multiple threads feeding one inbox |
| Locket | 14–20 friends generating photos into one widget |

Every one of those had a pump. Several of them still hit the wall. **Agapé hit
it in under a year with a professional library refilling daily:**

> "we had answered so many questions and we didn't even reach 1 year before we
> decided we no longer want to use the app" — App Store, 2023-11-21
> "it gets tiring answering the same question in different wording all the time"
> — App Store, 2024-08-27

Eva & Adam has **no pump at all.** One hundred percent of every artefact that
will ever exist in this product must be authored by two people, one of whom is
asleep at any given moment. That is not a purity. That is the thinnest possible
content supply in the entire category, feeding a product that must stay
interesting for decades.

### The compounding half — the app competes for the resource it claims to serve

R1 and R1b both document, at high confidence, that this exact population is
already running a chronic energy deficit to maintain the relationship:

> "I have been living on Aussie time...I am exhausted, I've messed up my
> circadian rhythm" — AussieAmericanGirl66, 2014-05-16
> "I have got used to surviving on much less sleep than I used to!" — yachica, 2012-06-20
> "I've been staying up until 3 AM a lot of nights just to try and help bridge
> the time zone gap" — Moostronus, 2015-11-11
> "I'm putting off going to bed till I can say goodmorning to her right now" — throwawaywhargharble

These two people have a few hours of overlap and one shared day. Every minute
inside this app is a minute not on the call. Marco Polo, Locket and iMessage all
survive because they sit *inside* the existing channel or replace nothing —
Locket's whole design is that you never open it. This app asks them to leave the
channel and go somewhere else to feel close, using energy they are documented as
not having.

Tuned had 909,000 downloads, Meta's distribution, and zero customer-acquisition
cost, and died in 26 months. It failed for a different reason than this will —
it needed scale and could not get it, and you do not need scale. But note what
Tuned had that this does not: a company generating features, a content team, and
909,000 people worth of usage data telling it what was broken. This product has
two users and one of them writes the code.

### What would make me withdraw this attack

Name the non-user content source — the thing that puts something new in the app
without either of them authoring it — and show it does not run out in 12 months.
There are real candidates and I will name them so this is not a cheap shot:
their existing camera rolls (years of photographs neither has looked at); the
world (sunrise in each city, the weather Eva is walking through right now, the
DST asymmetry); and the archive itself resurfacing. If one of those is built as
a genuine pump rather than as decoration, this attack does not fire.

---

## FATAL 3 — The founder is one of the two users, he is the entire engineering organisation, and Eva has never been asked a single question.

**Lethality: FATAL, and this is the one I would fix first because it is the
cheapest to fix and the most expensive to leave.**

### The evidence

I grepped the entire `docs/` tree and `.claude/memory/` for any trace of
Eva-sourced input — anything she said, asked for, rejected, or was interviewed
about. **Zero results.** `USER-INSIGHTS.md`'s source log has exactly two rows:

| Date | Channel | Collected by |
|---|---|---|
| 2026-08-02 | **Founder brief via CEO** | CPO |
| 2026-08-02 | 7-thread literature synthesis | Research-Lead |

The nine time windows are described as being "in the couple's own language."
They are in *one* member of the couple's language. Every pain phrase in the
customer-voice file — "worth staying up for," "see what we do, but you feel
connected" — is Adam's phrasing of what Adam believes Eva feels. Fifty percent
of the user base has not been consulted about a product that will hold her
intimate photographs.

### Failure mode 1 — what he over-builds

`lib/shared-day/`. 109 tests. All four DST transitions. Provably cannot file a
photo on a day that is already complete. The REIMAGINE-BRIEF calls it "real
engineering and the app's one genuine differentiator," and it is.

It is also the most engineered thing in the product, and it serves an ache that
**two independent research passes searched for explicitly and could not find a
single person articulating.**

> "no one was found putting the *date-crossing* specifically into words the way
> the brief describes it" — R1 §3, confidence **LOW**
> "Genuine, repeated searching... did **not** surface anyone framing the
> date-crossing as its own named ache" — R1b Gap 1, confidence **LOW-MEDIUM**

That is what a builder builds when he is also the user: the part that is
interesting to build. Meanwhile R1b found the thing people *do* name, with
volume, unprompted, in dedicated threads — **DST asymmetry**:

> "The difference in our timezones increasing from 7 to 8 hours is painful." — 2022-11-05, 61 upvotes
> "we always dread the time changing because it just shakes up the routine" — laurathestork
> "For a week we had only sweet 6 hours in between us, and now we're back to 7. It really made a difference." — Iubita_lui_dracu

R1b calls this "the single most directly-relevant unprompted finding in this
pass." It is Eva and Adam's literal situation — 7 hours for ~339 days, 6 for
~26. The engineering effort went to the silent condition; the loud one gets
nothing.

### Failure mode 2 — what he never notices is broken

DESIGN-DIRECTION §8.3 lists the acceptance test: *"does it work for Eva in New
York at 11pm with the lights off?"* Adam structurally cannot run that test. He
can run 5am. Every surface on Eva's side of the gap will be validated by proxy,
forever, by someone who is asleep when it is being used. That is not a quality
process, it is a hope.

### Failure mode 3 — what happens when he loses interest

R2 promoted exactly one finding to its own section, above the teardown table,
because it is the most important thing in the report: **Couple/Pair did not die
of churn. It died of ownership discontinuity.** Three of four cofounders left in
October 2014; the product limped through an acquisition and a transfer announced
by a single tweet; by April 2019 the web app returned 503, account deletion was
broken, and there was no communication to users about what had happened to years
of their private photographs.

Now apply that to an engineering organisation of one, where the one is also
half the user base:

- There is no acquisition step. There is a Tuesday where Adam is busy.
- The Supabase project has a billing owner. It is him.
- The Vercel deploy has an owner. It is him.
- R4 could not open six of the seven surfaces of the *currently live app*
  because the shared password "lives only in the founder's password manager"
  and nobody answered the request. **The single point of failure is already
  instantiated and already blocking work.**
- There is no export tool. Avocado shipped one before it died and a competitor
  built an import path so its users had somewhere to land. Couple did not, and
  R2 documents a former user still trying to reach anyone about his data eight
  months after the shutdown.

Eva's two hundred days will live behind a login only Adam can repair.

### Failure mode 4 — the asymmetry ledger

R1b documents an 8.5-year long-distance relationship that ended, and it did not
end from lack of communication:

> "Verbal support is not supportive, **the partner in the host country has to
> share the burden or do more**" — cynthia_2901, 2026-06-21
> Top reply, 22 upvotes: "I completely agree... being the one who made
> financial/career/location changes to stay together while my ex partner from
> the host country did not make any sacrifices." — alrightk

Adam is about to spend hundreds of hours building an artefact for Eva. That is
an enormous, visible, unilateral investment. If she uses it less than he builds
it — and she will, because he is building it and she is receiving it — the app
becomes a running ledger of unequal effort, with a timestamped record. That is
the single worst object to place between two people in this situation, and it
will be sitting on both their home screens.

`[UNEVIDENCED — my judgement]` I have watched this happen in the small: the
partner who makes the thing starts checking whether the other one opened it.
There is no feature that causes this. The existence of the artefact causes it.

### What would make me withdraw this attack

Three concrete things, all cheap:

1. **Eva answers five questions in her own words, verbatim, transcribed into the
   repo, before another surface is designed.** Not paraphrased by Adam. Her
   sentences, with her name on them. If her answers match the nine windows and
   the three surfaces, I lose this attack outright and the product is on much
   firmer ground than I claimed.
2. **A working export Eva can run alone** — her photographs, her voice notes,
   out of the system, without Adam, without a password in his manager. Test it
   by having her actually do it.
3. **A written answer to: what happens to this if Adam stops.** One paragraph in
   the repo. Who pays Supabase, who can restore it, what Eva does at 3am in
   New York if it is 503.

---

## SERIOUS — Surface by surface: which gets opened twice and never again

### Today — dies as a strictly worse iMessage with an empty state it is forbidden to explain

**Mechanism.** Today is an inbox with one sender and a delay. Everything it can
deliver, Messages already delivers — with a timestamp, on the lock screen,
without an open. R1b's most-upvoted evidence for the wake-up moment is people
describing *Messages*:

> "the amount of times I've fallen asleep at 2am just to wake up to a message
> sent at 2:05 is unreal :(" — sunniifox, 110 upvotes on a 2,365-upvote post

That behaviour already exists and already works. Today has to be *better* than
the notification Eva already gets, not merely nicer-looking than it.

**The killing detail is the empty state.** On the days Adam leaves nothing —
and there will be many, because he works Sunday to Thursday and R1b documents
this population passing out mid-conversation — Today is a room with her name on
it and nothing inside. And REIMAGINE-BRIEF §4.3 forbids you from marking that in
any way that reads as failure. So the surface's job, on precisely the days it
matters most, is to render absence without affect. That is not a design problem
you solve with better typography. That is the surface being structurally empty
at its most important moment.

This is BeReal's exact death. Not the streak — the *obligation shape*. Once a
daily surface exists, not filling it becomes a thing that happened.

**Verdict: SERIOUS. Keep it, but only if it is the ambient layer (a widget) and
not a tab.**

### The Gap — beautiful, correct, and a glance rather than a session

**Mechanism.** A clock is not a destination. It is right on day one and right on
day four hundred, and correctness generates zero reason to return. You look at
it, you learn the number you already knew, you close it. There is no second
visit that differs from the first.

**And it is built on the one ache nobody could evidence.** Two research passes,
nine dedicated threads, full-text comment greps, DuckDuckGo phrase searches:
nobody names the date-crossing. R1b is generous about this — "nobody has claimed
this language yet" — and that generosity is doing a lot of load-bearing work.
The uncharitable reading is equally available: people fluently and constantly
quote their hour count like a badge, and never mention the date, because **the
hour count is what they feel and the date is arithmetic.**

Meanwhile the loud, dated, upvoted, dedicated-thread finding — DST asymmetry —
fires twice a year for ~26 days. That is the emotional event. A permanent spine
was built for the silent condition, and the loud one gets no surface at all.

**Verdict: SERIOUS. The two-clock model is excellent engineering and should be a
component that appears inside other surfaces. As a top-level destination it will
be visited twice.**

### Saturday — the weakest surface. I would cut it.

Three independent mechanisms, stacked, each sufficient on its own.

**1. Arithmetic.** It is empty six days out of seven. A tab that is dead 86% of
the time gets opened on Saturday only if they remember it exists — and they will
not, because they did not open it Sunday through Friday. There is no path by
which a weekly surface stays discoverable inside a daily app. This is not a
polish problem; it is a guarantee.

**2. Its only content is a directory of other apps.** I analysed all 98 records
in `library.json`. The findings:

- Of the 15 **S-tier** entries — the couple's own top-ranked ideas — **14 name a
  third-party product**: FaceTime, Messages, Discord, Duolingo, chess.com, Words
  With Friends, GamePigeon. The fifteenth requires *"nothing beyond the call
  itself."* **Zero of the top fifteen happen inside Eva & Adam.**
- **FaceTime appears in 48 of the 98 entries** — just under half the library is
  "get on FaceTime and do this."
- Only **12 of 98** require no tool at all.
- 68 of 98 are not screen-free.

The best thing this surface can do is successfully send them somewhere else.
And if it works, they will go there directly next Saturday and skip you. A
referral directory that succeeds makes itself redundant.

**3. The project already knows.** `USER-INSIGHTS.md`, written by CPO:

> "**Saturday is a single point of failure.** 20 of 24 both-alert activities land
> there with no weekday substitute."

**And it solves a problem they do not have.** R1b Gap 3 is unusually clear:
across nine threads and ~22 relevant commenters, the corroborated, severe pain
is **having no shared day at all** — "we don't get to spend a single day off
together. It's very hard." (27 upvotes, top comment). People who *have* a
protected shared day describe building the week around it, not struggling to
fill it. R1b also explicitly retracts R1's "weekends are hardest" claim as
single-source and uncorroborated. Eva and Adam have a Saturday. The surface
answers "what do we do with it," and nobody in the data is asking that.

**Finally, it violates the project's own locked constraint.** USER-INSIGHTS:
*"they open this mid-call; browsing a list is a failure state."* Saturday's
entire content type is a list of 98 things.

**Verdict: cut it. Take the three or four ideas that are genuinely good, make
them appear inside the other surfaces at the moment they are useful, and delete
the tab.**

---

## SERIOUS — The 98 date ideas

I am going to be fair here, because the obvious attack is wrong and making it
would cost me the real one.

**The obvious attack does not land.** R2's number-one documented killer is
static libraries running out within a year (Agapé, verbatim, dated). But the
library is not mostly one-shot content: **48 entries are classified `ritual`, 45
`repeatable`, and only 5 `one_time`.** A ritual does not exhaust. So the
exhaustion mechanism fires weakly here, and I will not pretend otherwise.

**Three sharper attacks, all evidenced from the file itself:**

**1. It is a referral directory, not a content library.** See the numbers above —
86 of 98 entries require another product, 48 require FaceTime, and not one of
the top-ranked fifteen happens inside this app. The library's
function is to route the couple out of the app. Which is *correct advice* and
*a bad product surface*: good advice that works exactly once, because they will
remember chess.com without you.

**2. The library's own top ranking contradicts the founder's hardest rule.**
Among the 15 S-tier entries — the highest-scored ideas in the couple's own
researched library — is:

> **"Duolingo — Friend Streak, plus the weekly Friends Clash"**

A streak. The number-one-tier ritual, in their own library, is the exact
mechanic REIMAGINE-BRIEF §4.3 bans and that R2 ranks as documented killer #2.
The library's justification is explicit and, annoyingly, good: *"the streak only
checks 'did you do a lesson today' per each person's own calendar day, [so] the
7h offset and the mismatched work week are irrelevant."* So either the ban is
too broad, or the top-tier ranking is wrong. **Nobody on this project has
reconciled those two documents, and they are both locked.** That is a live
contradiction sitting in the highest-value asset you own.

**3. The ranking has no taste signal in it, and taste is the only variable that
matters at n=2.** USER-INSIGHTS says it plainly: *"no taste profile — all
activity ranking is logistics-only."* You have 98 things ranked by how well they
fit a calendar window. At consumer scale, logistics ranking is a reasonable
prior. At n=2, the only question is "does Eva want to play correspondence
chess," and that is the one field not in the data. A ranked list built without
it is a list ranked by the wrong thing, presented with the confidence of a
computed score.

**Withdrawal condition:** show me the interaction where the library produces one
suggestion, unprompted, at the right moment, without anyone browsing — and where
being wrong costs nothing. If the answer is "a screen you go to," the surface is
dead regardless of the quality of the 98.

---

## SERIOUS — The archive is a streak with the counter filed off

**Mechanism.** The founder banned streaks: nothing that makes a missed day feel
like failure. Then the product proposes 200+ days of accumulated photographs
ordered by date. **A date-ordered archive of a daily ritual makes every gap
permanently legible.** You do not need a number for day 47's absence to be
visible; the grid renders it. You have removed the counter and kept the ledger.

R1b's finding is that this pressure is real *and already exists in the
relationship* before the app arrives:

> "not talking everyday = you don't actually prioritize or love each other" —
> ugly_sweaters, naming the community's own majority norm, 41 upvotes
> "No thanks. I'll take my consistent, everyday communication. We make the time."
> — 397 upvotes, the highest-scored reply in that thread

R1b's own conclusion is the correct one and it is subtle: the product must never
be the thing *applying* the pressure. My attack is that an archive does
something worse than apply it — it **records** it, permanently, in an object
they are told to treasure.

**Second mechanism: the evidence for the archive argues for the opposite
structure.** R3's strongest academic source, Phillips 2016 (peer-reviewed, the
highest-confidence citation in that report), says a scrapbook's meaning compounds
*because it is bounded, finite and physically accumulating* — R3 flags this
itself: *"a scrapbook's meaning compounds specifically because it is a bounded,
finite thing, not an infinite stream — same shape as the advent calendar's
finiteness argument."* An append-only day log is unbounded by construction. You
are citing finiteness research to justify an infinite object.

**Third mechanism, and this is the one nobody wants to write down: what the
archive is if things go badly.** It is intimate photographs and voice notes,
hosted on infrastructure one partner owns, behind a password in one partner's
manager, with no export. §4.2 makes privacy a genuine security property — against
*outsiders*. Nothing in the design protects either of them from the other. In a
bad ending, that archive is not a keepsake. Eva has no unilateral way to take it
or to delete it, and R2's whole promoted section is about what happens to
private couple data when the person responsible stops answering.

**Withdrawal condition:** ship the export and the unilateral delete *before* the
archive, and make the archive's default view something other than a date grid —
something that resurfaces by association rather than by calendar, so that
absences are not addressable positions.

---

## SERIOUS — The visual direction. This is not attempt #1 wearing a better argument. It is something more specific and more dangerous.

Nobody else on this board will push here, so I am going to push hard. I want to
be precise, because the lazy version of this attack ("white is cold") is wrong
and dismissible.

I opened the founder's reference folder and looked at the images rather than the
descriptions of them.

**1. The acceptance test is a description of the empty state.**

> "Remove every photograph from a screen. What remains must read as near-black
> ink on white." — DESIGN-DIRECTION §1, stated as binary and non-negotiable

In a product whose entire photograph supply is two people, and whose founding
premise is that one of them is always asleep, **"no photograph on screen" is not
a hypothetical stress test. It is Tuesday at 3pm.** The direction has taken the
app's degraded state, written it into law, and named it the standard. A colour
system whose only source of warmth is an asset that is structurally, frequently
absent is a colour system that is cold most of the time by design.

**2. The reference does not support the rule it was used to justify.**

I looked at SORDJATI. Two photographs occupy the majority of the first viewport.
They are warm — rust velvet, olive green, real sunlight, real shadow — and the
"Shop Now" pill reads as a warm dark oxblood rather than neutral black. Delete
those two photographs and you have a wordmark and some 11px labels on white, and
the page is dead.

SORDJATI is not a restrained page. It is a **photograph-dominated page with
restrained chrome**. Those are opposite briefs. The direction extracted "the
chrome is restrained" and dropped "the photographs are 60% of the composition
and never absent." On a furniture site the photography is a permanent, curated,
professionally-lit asset that is always there. Here it is two people's phone
snapshots, arriving unpredictably, sometimes not at all.

**3. The founder's own taste sample votes 4–1 against this direction.**

Four saturated consumer apps. One restrained furniture site. The direction adopts
the palette of the one and reclassifies the four as "structure only." That is an
override of the taste evidence, not a reading of it — and the direction's own §0
records that restrained-white has already been rejected once by this founder
("Attempt #1 copied the restrained one and got a lifeless book"). The argument
for why it is different this time is *"we will take layout and motion from the
other four."* Layout and motion are not what made those four feel alive. Colour
is what made them feel alive. That is why they are saturated.

**4. There is an unresolved contradiction at the exact centre of their usage.**

§1 is stated as absolute: white or bone canvas, no exceptions, ten-second
reviewer test. §3 keeps a night mode. §8.3 makes "Eva at 11pm with the lights
off" an acceptance test.

Now look at `library.json`'s own window definitions: **w1, "She's in bed, he's
awake" — IL 05:00–09:00 / NYC 22:00–02:00 — "the biggest window you have."**
The single largest overlap window in their entire week is one where Eva is in
bed in the dark. So the surface with the most usage in the product is the one on
which the one non-negotiable law cannot hold. Either §1 has an exception covering
a large share of all sessions, or night mode is an afterthought that will be
built last and badly. **Nobody has said which, and the document reads as though
this was not noticed.**

**5. One reference does not survive n=2.** The scattered-photo first-open
(`6b2ad671`) is lifted from a *family* memories app. I looked at it: the send
screen lists Grandma Rose, Dad, Cousin Jake; the album previews say "12 warm
moments"; there is a `+9` overflow tile. The scatter is beautiful *because it is
many different faces*. At n=2 the scatter is Eva, Adam, Eva, Adam. The pattern
was borrowed without checking it against the one constraint that defines this
product.

**6.** `[UNEVIDENCED — my judgement]` Restraint reads as *taste* to a designer
and as *distance* to a person in a long-distance relationship. The editorial
register says: this object is available, please consider it. The register these
two need is: someone was here. R2 could not isolate colour as a cheesiness
trigger — the documented triggers are infantilising copy and gamified
affection-tokens (hearts, "hug" buttons), **not** saturation. So the fear that
drove this direction is not the fear the evidence supports. You can be warm and
saturated without being cheesy; the graveyard says cheese comes from the words
and the tokens, not the palette.

**Verdict: the direction is coherent, well-argued, and solves the wrong problem.
It is not a repeat of attempt #1 — it is better-reasoned than attempt #1 — but
it will land in the same place, because the law it is built on describes the app
on the days nothing has arrived.**

**Withdrawal condition:** render three real screens with zero photographs — a
Tuesday Today with nothing waiting, the Gap at 3pm, night mode at 11pm — and put
them next to attempt #1's rejected book screens. If a neutral reviewer cannot
tell which is which, I am right. If the new ones are obviously alive, I withdraw
this entirely and apologise for the space it took.

---

## SURVIVABLE

- **Typography and motion craft floor** (§4, §5). Ease-out, ≤300ms, transform
  and opacity only, reduced-motion honoured, one signature moment. This is
  correct and uncontroversial. No attack.
- **The per-person hairline hue.** Not harmful, but it is a tell: at n=2, an
  authorship marker solves a disambiguation problem that cannot exist. Every item
  was made by one of exactly two people and the receiver always knows which,
  because she made the other half. It is a multi-user pattern imported without
  checking. Costs nothing; delete it when you notice.
- **The `shared-day` library as a component.** Excellent work. My attack is on
  it being a *destination*, not on it existing.
- **The reveal-gate mechanic**, if it survives. R2 notes that in every negative
  Agapé review found, nobody criticised the reveal-gate itself. That is a mild
  positive signal and I have no attack on it.

---

## The fatal three

1. **"Ambient presence with zero content" is a property of an open channel and a
   shared room, not of a screen.** Every quote supporting it describes FaceTime
   or physical co-location. The one product that delivers it — Locket — works
   specifically by *never being opened*, and that container may be technically
   unavailable to a PWA. Rendered as a surface, the hypothesis produces an empty
   screen with a good excuse.
2. **Two users forever is the thinnest content supply in the category, not a
   protective purity.** Every product in the graveyard had an outside content
   pump and several still died within a year; this has none, and it competes for
   the small overlap window it exists to serve.
3. **The founder is half the user base, the whole engineering org, and the sole
   keyholder — and the other half has never been asked anything.** Zero
   Eva-sourced inputs in the entire repo. No export. No continuity plan. R2
   promoted ownership discontinuity above every other finding for exactly this
   reason, and this structure is more fragile than Couple/Pair's, not less.

---

## What nobody has said

**This product is designed for a condition both of its users are actively trying
to end, and nobody has written a line about what it becomes on the day they
succeed.**

The immovables lock *two users, forever*. They never lock *seven hours, forever*
— and the strongest longitudinal voice in the entire research corpus says the
distance is the thing you are supposed to be dismantling:

> "it was knowing there had to be an end date. LDR can work, but **it needs a
> plan**... **'One day' isn't enough.** We had timelines, adjusted them when life
> shifted, but we knew we were moving toward being together."
> — 19 years together, 13 married, 6 long distance, r/LongDistance, 2025-07-05
>
> "LDRs are just relationships. Thinking of the distance as something that
> changes the nature of the relationship is a mistake. **It's an obstacle, a
> temporary one.**" — chux4w, 13 upvotes, same thread

Every one of the three surfaces is load-bearing on the gap. Today exists because
he is asleep when she wakes. The Gap *is* the seven hours. Saturday exists
because it is the only shared day. Same city, same bed: Today has nothing left
to deliver, the Gap collapses to zero, Saturday becomes every day, and the
product is obsolete at the exact instant the relationship wins.

That is a product whose success condition is its own deletion — and the archive,
the one part that would survive, is the part with no export and one keyholder.

There is a second edge to this that is harder to say. While the distance lasts,
every hour spent building this is an hour not spent closing it, and not spent
inside the small window it exists to serve. The most useful thing this codebase
could do for these two people is to be small enough that building it does not
compete with the thing it is about — and to have one written paragraph about
what happens to it on the day it is no longer needed. Right now it is neither
small nor planned for its own ending, and it is being built by the person whose
attention is the scarcest resource in the entire system.

---

## What would make me keep it

I would keep it if it never asked me to open it. If the only thing it ever did
was put the last ordinary photograph he took — not a good one, the boring one,
his desk, the street, the thing he ate — on my lock screen at full size with
nothing else on it, and the only way to answer was to take one back, and there
were no tabs, no archive I had to visit, no clock telling me what I already
know, and it never once counted anything. I would keep that, and I have kept
nothing else, because it would not be a place I have to go and perform being in
love from four thousand miles away. It would just be him, in the room, not
saying anything — which is the only thing on this entire list that I actually
miss, and the only one nobody has to show up for.
