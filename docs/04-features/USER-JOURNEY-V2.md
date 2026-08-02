---
date: 2026-08-02
from: cpo (session cpo-vision-v2)
status: PROPOSED
companion: docs/04-features/PRODUCT-VISION-V2.md
clock: 7h gap (IL ahead), 6h for ~26 days a year. Adam works Sun–Thu, Eva Mon–Fri.
citation_rule: every claim traces to a research file with a quote, or carries [MY JUDGEMENT]
---

# Eva & Adam — User Journey V2

Every time below is real. The dates are real dates: day zero is **Sunday
2 August 2026**, which is a workday for Adam and a weekend day for Eva, because
their weeks do not line up [REIMAGINE-BRIEF §2]. Both clocks are given
throughout, because a journey written on one clock is the exact failure mode
this project keeps having.

Two facts do most of the work in what follows, and both come from the library's
own window definitions [library.json, `windows`]:

- **`w1` — "She's in bed, he's awake", IL 05:00–09:00 / NYC 22:00–02:00 — is
  described in the library itself as "the biggest window you have."** More of
  this product's sessions happen with Eva's lights off than at any other hour.
- **Adam's entire workday (IL 09:00–17:00) lands between 02:00 and 10:00 in New
  York.** Almost everything he leaves during a working day is left while Eva is
  asleep. And her afternoon from about 16:00 NYC onward is past midnight for
  him. Both directions have a genuine asleep window; his is bigger.

The days they do not open it are in here too. P1 wrote an honest Tuesday evening
where the app loses to Instagram and said she would rather it be honest about
that than pretend otherwise; that is the standard.

---

## Day zero, before either of them has opened anything

**What exists before first open matters more here than in any normal product.**

Two things must already be true on the morning of Sunday 2 August, or the rest
of this journey does not happen the way it is written:

1. **The Book is not empty.** Roughly 300 curated photographs from their
   existing camera rolls are already imported — a backlog the founder has
   already confirmed [DECISIONS.md, LDR-App cost model v2]. This is not a nice
   first impression. It is the answer to the hardest attack on the product:
   *"Eva & Adam has no pump at all. One hundred percent of every artefact that
   will ever exist in this product must be authored by two people, one of whom
   is asleep at any given moment"* [P4, FATAL 2]. The archive can only resurface
   what it holds. Seeded, it works on day one; unseeded, it works in month six,
   which is exactly when P3 says the product dies.
2. **The export already runs.** Before the first photograph is accepted, both of
   them have run an export and looked at the folder it produced [VISION §6].
   This is a build-order rule, not a launch checklist item.

**App state:** two hundred days of their past already inside, nothing waiting,
no notification ever sent.

---

## First open — Sunday 2 August

### Adam, 05:40 IL / 22:40 NYC Saturday night

**What pulls him:** he built it, so this one is not evidence of anything and I
am not going to pretend it is [MY JUDGEMENT].

**What he does:** it opens into The Book, because nothing has been left yet.
Not an onboarding carousel, not a welcome screen, not a "let's get started" —
their own photographs, one at a time, from years neither of them has looked
through. R4 found the reference for this shape already sitting in the founder's
own folder — the first-open screen built from scattered photo cards *"rather
than an illustration"* [DESIGN-DIRECTION §2, the memories app] — though P4 is
right that the scatter pattern was borrowed from a *family* app and does not
survive n=2, where the scatter is Eva, Adam, Eva, Adam [P4, visual direction, 5].
One photograph at a time is the version that survives.

**What he feels:** recognition, not instruction. The first thing the product
does is hand him something that was already his.

**Then he leaves one thing.** The camera, one tap. The coffee. Not a good
photograph. He does not write a caption.

**App state:** one item in Today. Stamped *left while Eva was asleep · 5:52 his
morning · 22:52 her night*. No push sent yet — there is no relationship to
notify into. A dot on her icon, no number [VISION §4.2].

### Eva, 09:15 NYC / 16:15 IL

**What pulls her:** he told her about it on the phone. Also not evidence.

**What she does:** taps the icon. The coffee is the entire screen, full bleed,
with the stamp under it. There is nothing to dismiss, nothing to reply to, no
thread, no heart button. She looks at it. She scrolls once, into The Book,
lands on a photograph from a trip three years ago, and stays there for four
minutes.

**What she feels:** the thing P1 asked for, which is the absence of an
obligation — *"A message implies a thread, and a thread implies an expectation…
A thing left implies none of that. It only has to be found"* [P1, §2].

**What the app does not do:** it does not tell Adam she opened it. Ever
[VISION §4.2].

**App state:** unchanged. The coffee is still there. Nothing has been consumed.

---

## Day one — Monday 3 August

Adam's second workday of the week, Eva's first.

### 05:10 IL / 22:10 NYC — the biggest window in the week

Adam wakes before the alarm. P2's own account of this: *"Awake without needing
the alarm, most days. Phone off the nightstand before my eyes track properly"*
— and it is not anxiety, it is a clock nobody set, matching the forum voice
*"Sometimes my body just wakes itself up at 5 after going to sleep at midnight"*
[R1, C.M., 2012].

Eva is not asleep yet. It is 22:10 for her; she is in bed with the lights off,
which is what `w1` actually means. So for the next forty minutes they are both
awake, and the honest thing to say about this window is that **most of what
happens in it will happen on the phone, not in this app** — the highest-scored
piece of evidence in the entire corpus is someone describing exactly this hour
on FaceTime, at 2,898 upvotes [R1b, "The asleep hours"]. The product does not
compete with that and should not try.

**What Adam does in the app:** nothing yet.

### 06:40 IL / 23:40 NYC

She has gone to sleep. He leaves something on his way out — the light on the
building opposite. The ceremony rule fires on her side later, because she was
genuinely asleep when it was left [VISION §4.3].

### 11:20 IL / 04:20 NYC — the middle of his workday, the middle of her night

He leaves a second thing. This is the window nobody designs for and it is
enormous: his whole working day is her night.

**App state:** two items. Today shows the newest. The older one has not
disappeared — it is in The Book, where everything goes, immediately, without a
separate action.

### 09:05 NYC / 16:05 IL — Eva's morning

**What pulls her:** the dot. One tap.

**What she does:** the app opens into the newest thing and it unseals — the
spring flip that already exists in `SealedCard.tsx`, stripped of the violet
gradient it currently wears [R4, Part 1; DESIGN-DIRECTION §5]. It fires because
she was asleep at 11:20 his time. It takes about half a second and then it is
over.

**What she feels:** the small specific thing R3 identifies as the whole reason
asynchrony can be a gift rather than a delay — arrival, not inspection
[R3, Q2].

**What she does next:** nothing. She does not reply. She puts the phone down and
goes to work. The product has no opinion about this.

---

## Day two — Tuesday 4 August

The point of this day is that it is the same as day one and that this is
correct.

**05:15 IL / 22:15 NYC** — Adam wakes into whatever she left during her
afternoon. Her 16:00–17:00 NYC is his 23:00–midnight; if she left something at
16:30 he was probably asleep, so it unseals for him too.

**09:00 NYC / 16:00 IL** — Eva opens, finds one thing, closes.

**Total time in the app across both people, both directions: under four
minutes.** P2 named this as the correct size rather than a compromise: *"Most
mornings, honestly: three minutes… That's not a compromise, that's the correct
size for a 5am ritual"* [P2, §5]. A product that needs twenty minutes a day from
either of them has already lost to their actual lives.

**What must not happen on day two:** nothing new is introduced. No tips, no
"here's what else you can do", no feature tour. P3's death mechanism starts
here — *"delight turns into obligation the moment it stops being something only
the two of us know about and starts being something a third party is
tracking"* [P3, §4].

---

## Day nine — Tuesday 11 August. The day it loses.

This day is in the document because P1 wrote it and it is the most honest page
in the research.

### Eva, 18:45 NYC / 01:45 IL

Home from work. Adam has been asleep for roughly two hours. Dinner alone, phone
propped against a water glass, half-watching something.

**What pulls her to open the app: nothing.**

### 20:30–22:00 NYC

Chores, a show, texting a friend, scrolling. Whatever happened today she already
told him at 16:00 her time, live, when he was awake and could answer.

### 23:00 NYC / 06:00 IL

*"Nothing's pulling at me. I open Instagram, exactly like the brief predicted,
and that's fine — I'd rather the app be honest about the nights it loses to
Instagram than pretend it wins every one."* [P1, "an ordinary Tuesday"]

**What the app does about this: nothing at all.** No push. No "Adam left
something two days ago." No reminder. This is not restraint for its own sake —
P1's own list of what would make her delete it has this second from the top, and
R1b documents the mechanism: the identical gesture is beloved when spontaneous
and becomes *"everything always has to be my way"* the moment it is requested
[R1b, "Good-morning texts"].

**App state on day nine:** exactly what it was on day eight. The last thing Adam
left is still on Today. It has not expired, greyed, or moved to a "missed"
section, because those do not exist.

**Why she opens it on day ten:** because on most days there is something, the
cost of finding out is one tap, and nothing punished her for the day she
skipped. P1 is precise about the causality and it is counterintuitive: *"the way
to get me back tomorrow at 11pm is for the app to say nothing to me about it
today."*

---

## Day thirty — Tuesday 1 September

A month in. This is where products in this category usually start to be
noticeable in a bad way, and where the shape of this one should be visibly
different from a messaging thread.

### Adam, 05:20 IL / 22:20 NYC

**What pulls him:** it has become a fact about his mornings rather than a task
inside them, which is the thing P2 named as the only durable pull: *"It costs
nothing to check. Three minutes, folded into coffee. A ritual that requires a
decision to start won't survive; one that's just part of how the coffee gets
made will"* [P2, §7].

**What he actually does that is new at day thirty:** he scrolls past the newest
thing. There are now about thirty days of their own material on top of three
years of imported photographs, and the second thing he does after looking at
what she left is go backwards. P2 predicted this exact moment in his own
timeline — *"05:15 — Coffee's ready. I sit with it. Sometimes I scroll back
further than today — this is the moment closest to what the research calls the
archive doing its work, not the new stuff."*

### The first resurfacing

Somewhere in the first month, The Book puts up something on the day that matches
it — a photograph from this date, a year ago, three years ago. Not a
notification. It is simply what is there when he goes looking.

This is the single most evidence-backed mechanic in the entire research set, and
it is the reason the backlog import is load-bearing rather than cosmetic: Day
One's "On This Day" has a value *"structurally proportional to how long you've
used the product"* [R3, Q4], and P3 says it is the only thing that reliably
stops her: *"if something surfaces itself — this exact day, one year ago, three
years ago — I always stop. Every time"* [P3, §3]. With the backlog, this works
in month one. Without it, the app has nothing to resurface until month six,
which is precisely when P3 says it dies.

**What it must not do:** compare. No "you two were more active last month". No
recap. P5 is right that running the resurfacing mechanic on a weekly cadence
turns an archive into a scoreboard [P5, "What would ruin it"].

### Eva, 22:50 NYC / 05:50 IL

Ten minutes before bed she leaves twenty seconds of voice. Not composed. R1 is
unambiguous that this format outperforms text across a gap: *"The short voice
notes that just say good morning or goodnight end up giving me the biggest
boosts"* [R1, §2].

He will find it at 06:00 his time, ten minutes after she left it, awake. **So it
does not unseal.** It is simply there. The ceremony is proportional to the real
gap and there was no gap [VISION §4.3].

**App state at day thirty:** ~40 items of their own, ~300 imported, zero
counters, zero streaks, no notion anywhere of how many days either of them has
contributed to.

---

## Day ninety — Saturday 31 October. The week the clocks are wrong.

This day earns its place because the research says it is the loudest real event
in their year and the product currently has nothing to say about it.

Israel's clocks went back on Sunday 25 October. New York's do not go back until
Sunday 1 November. **For these seven days the gap is six hours, not seven**
[REIMAGINE-BRIEF §2 — ~26 such days a year; the arithmetic of which weeks is
mine, from the two countries' published DST rules]. This is exactly the
situation R1b found people naming, unprompted, in dedicated threads with their
own upvote counts:

> *"The difference in our timezones increasing from 7 to 8 hours is painful."*
> — 61 upvotes, 2022-11-05
> *"We change the time one week before my BF's country does so. So for a week we
> had only sweet 6 hours in between us, and now we're back to 7. It really made
> a difference."* — Iubita_lui_dracu
> *"we always dread the time changing because it just shakes up the routine"*
> — laurathestork

P3, three years in, says this week never got easier and that it is *"one of the
only days a calendar app could name honestly that I'd actually want named."*

**What the app does:** the one clock line at the top of Today reads differently
for those seven days, and says the true thing plainly — six hours this week, not
seven. That is all. No banner, no countdown to when it goes back, no push, no
"enjoy the extra hour" copy. R1b's own recommendation is to surface rather than
silently recompute, because *"surfacing them may land as validating rather than
as showing math homework"* [R1b, Gap 1].

**And it is a Saturday**, their only shared day off. The real overlap that day
is IL 16:00–23:00 / NYC 09:00–16:00 — about seven hours where both are awake,
of which roughly three (IL 18:00–21:00 / NYC 11:00–14:00) are genuinely
symmetric in energy [P5, "The real overlap"]. The library's own label for this
window, *"Both fresh, no ceiling"*, overstates it and P5 says so.

**What the app does on that Saturday: nothing.** There is no Saturday surface
[VISION §3.2]. If at some point in the afternoon they are on a call and neither
can think of anything, one gesture returns one suggestion and no record is kept
of having asked. Most Saturdays it is never used, and P5 — arguing her own case
as hard as she could — landed there herself: *"Most of my seven hours should
probably just be that, with the app saying nothing at all."*

---

## Day two hundred — Thursday 18 February 2027

Adam's last workday of his week. Eva's fourth of hers.

### What the app is now

Roughly two hundred and forty items of their own, on top of the imported
backlog. Every one stamped with both clocks. No dates missing from a grid,
because there is no grid — The Book's default is resurfacing by match, not a
calendar of squares with holes in it. That was P4's sharpest attack on the
archive — *"A date-ordered archive of a daily ritual makes every gap permanently
legible… You have removed the counter and kept the ledger"* — and the default
view is the mitigation, honestly labelled in VISION §7.3 as partial.

### Adam, 05:05 IL / 22:05 NYC

**What pulls him:** the same reflex as day thirty, now completely unremarkable.

**What is different at two hundred days:** the resurfacing is no longer only
imported material. What comes back is a photograph *from this product*, from
last summer, from a day he does not specifically remember — and the stamp under
it says what her clock was doing at the time. That is the compounding P2 named
as the third and final condition for the habit surviving past novelty: *"It gets
better with time, not just bigger… If day two hundred occasionally hands me back
something from day thirty, that's a reason"* [P2, §7].

**What he feels:** the thing R3's strongest academic source describes — the
object doing memory work by existing rather than by being searched [Phillips
2016, peer-reviewed, R3 Track B].

**This is also the first day worth twenty minutes**, and P2 is explicit that
those should stay rare: *"Everyday mornings shouldn't be engineered to try to
earn twenty minutes."*

### Eva, 23:10 NYC / 06:10 IL

She goes looking for something specific — a photograph from a particular week —
and finds it by asking for it in words. The reply is her own photographs and his
own sentences, with dates, and nothing that neither of them wrote [VISION §2.4].
It does not talk to her. She would not want it to: *"If I'm lonely enough to want
that, I don't want a puppet. I'd rather have nothing"* [P1, §1].

**App state:** unchanged in kind from day two. That is the claim this product is
making — that day two hundred is the same two places, with more in one of them.

---

## Day two hundred and one — Friday 19 February 2027. Nothing is left.

Adam's day off; Eva works. This is the day P4 asked for, moved to a date where
it is most likely.

### Eva, 15:00 NYC / 22:00 IL

Adam has been at a family thing since morning. He has left nothing since
yesterday. Eva has a gap between meetings and taps the icon.

**What she sees:** yesterday's photograph, exactly as it was, full bleed, with
its own absolute stamp — *Thursday, 5:14 his morning*. Not "1 day ago". Not
"nothing new". Not a dashed empty rectangle waiting to be filled, which is what
the current build shows [R4, Part 1]. There is no state in this product that
means *empty*, because nothing is ever consumed [VISION §4.4].

**What she feels:** nothing in particular, which is the goal. P3 set the bar at
day four of a three-day silence: *"reopening it feels exactly like reopening it
after three hours — nothing diminished, nothing expired, nothing waiting to be
'caught up on'."*

**What she does:** scrolls into The Book for ninety seconds. Leaves nothing
herself. Closes it.

**The honest part.** By the third consecutive day of the same photograph, the
sameness itself says something, and I have not solved that — I have only refused
to let the software do the subtraction on her behalf. It is listed as a real
failure mode, not papered over [VISION §7.4].

**What she is still able to do, and what the app must never suggest:** say
something to him about it, in her own words, in the ordinary way, whenever she
wants. P3 draws the line exactly here and it is the sharpest distinction in the
research: *"the system acknowledging is scorekeeping, a person acknowledging is
just talking"* [P3, JSON verdict].

---

## The days that are not in this document

Written down so they are not mistaken for oversights.

- **The days neither of them opens it at all.** They exist and they are fine.
  P2's version: *"Running late, phone stays in my pocket through the whole
  routine… This happens. Building for a five-day-a-week 5am miracle would be
  building for a person who doesn't exist."*
- **The week one of them is travelling and the gap is a different number.** The
  day model already handles arbitrary offsets [REIMAGINE-BRIEF §1]; the stamp
  just reads differently. Nothing in the journey changes.
- **A fight.** No product feature. The app does not detect it, does not soften
  it, does not offer a prompt. Anything built for this moment would be the
  single worst thing in the product.
- **The day the distance ends.** Covered in VISION §5: the stamp reads *this
  afternoon*, the ceremony stops firing because nobody was asleep, and the Book
  becomes the only place that remembers what those years were like.

---

## What has to be true for this journey to be the real one

Four dependencies. If any of them is not met, the journey above is fiction and
should be rewritten rather than shipped against.

1. **The backlog import happens before first open.** Day zero, day thirty and
   day two hundred all depend on The Book having something to resurface. It is
   the product's only answer to having no content pump [P4, FATAL 2].
2. **The export runs before the first photograph is accepted** [VISION §6].
3. **Quiet hours are computed and verified in both zones, not one.** The bug
   most likely to exist and least likely to be noticed, because it will only be
   debugged for the schedule the builder lives [DESIGN-DIRECTION §8.3].
4. **Eva answers five questions, in her own words, in the repo, before another
   surface is designed.** There are currently zero Eva-sourced inputs anywhere in
   this project [P4, FATAL 3]. Every hour above is written from one person's
   account of what the other one feels, including the hours that argue with each
   other. That is the cheapest fix available and the most expensive thing to
   leave undone.
