---
title: Dates — the ritual, and 30 of them
lens: dates inside the book
author: creative ideation squad, lens 1
date: 2026-08-02
status: ideation — not a spec, not a build order beyond §5
supersedes: CREATIVE-MINIGAMES.md (deleted; the reframe changed what qualifies, not just what it is called)
inputs: docs/10-activity-library/library.json (T4, T3, T2), ACTIVITY-LIBRARY.md, WINDOW-CONTRAINDICATIONS.md, docs/04-features/LDR-APP-DESIGN-DIRECTION.md, LDR-APP-PRD.md
---

# Dates

*Eva in New York, Adam in Israel. Six or seven hours apart. Saturday is the only day they are both off.*

**A date that unfolds across a day is not a broken game. It is a long date.** Everything below is built on that sentence.

---

## 1. What makes something a date

### 1.1 The test

Four questions. I applied them to every concept, including the ones I had ranked highest a day ago, and several of my own favourites failed.

1. **Would they say “we did this”?** Not *I played a thing on my phone.* An occasion has a subject and a verb with *we* in it.
2. **Can you point at where it began and where it ended?** A date has edges. A thing that runs forever has none.
3. **Does the book keep something afterwards?** A date that vanishes leaves nothing to remember it by, and the whole object is a book that accumulates.
4. **Is it about *them*, rather than about words or trivia in general?** Two people who have been apart for years do not need a vocabulary exercise.

**Four out of four is a date. Three is a date with a fix available — and the fix is usually to give it edges.** Two or fewer is a diversion or a thread; §6 names those honestly rather than dressing them up.

### 1.2 The occasions

The founder is right that a Tuesday lunch and a Saturday are different *kinds* of thing. Seven registers, mapped to the library's own windows, written in the register the shelf names already use:

| Occasion | Window | What it is |
|---|---|---|
| **The overnight date** | W1 → his morning | She falls asleep in the middle of it. He wakes into it. **The signature form.** |
| **The day-long date** | 5am IL → 11pm NYC | It takes the whole day, in moves. Nobody sits down for it. |
| **Lunch** | W4 | Half an hour, in public, silent, and she has to go back. |
| **The commute** | W3 | She cannot look at anything and her hands are full. |
| **Saturday** | W7 | Both awake, no ceiling, and it carries the whole week. |
| **His Friday · her Sunday** | W8 / W9 | One has the whole day, the other is working. |
| **Worth staying up for** | W6 | It costs him a night. Only for what cannot happen at any other hour. |

**Generate for the occasion.** A lunch date is not a short Saturday date. An overnight date is not a slow anything — it is the one form that *requires* the gap, and it is the only form no other product on earth can offer them.

### 1.3 The two rules that fall out of calling them dates

**You do not score a date.** The metaphor now enforces what used to be a rule someone had to remember. If a concept needs points to be fun, it is not a date — it is a game, and GamePigeon already lives in the thread they text in, `tier S`, and is better at that than anything we would build.

**A date ends, and something remains.** The book keeps a page. That is the only accumulation in the product and it is already the sanctioned one — §7 of the design direction settled it: the thickness of the book is the count, it never decreases, it has no target, and it cannot be lost.

One consequence worth stating because it constrains everything below: **the book records what happened, never who won.** Every fragment is already set in its author's ink, so if someone lost, the ink says so and the app never has to. The interface does not express judgment; the content does.

---

## 2. The ritual — arriving, being on one, and it being over

*The founder asked whether there is an answer here worth more than five concepts. I think there is, and I think it is worth more than all thirty, because it is the thing that makes this a place two people go rather than a screen with activities on it. It is also nearly free: almost every piece below is a component the design direction has already specified for another reason.*

### 2.1 Being asked

The app asks. Neither of them has to think of something — that is CPO's locked thesis and it matters more here than anywhere, because *deciding what to do* is the specific fatigue that kills couples two years into distance.

The invitation is the **tipped-in slip on the cover** (§5.2), already specified: a title, one line, one metadata line, and two deliberately unequal buttons. Nothing changes about it except what `We're doing this` now means.

### 2.2 Setting the table

**Pressing `We're doing this` does not start anything. It lays a leaf.**

A new page appears at the unfinished end of the book — after today's page, before the colophon — carrying the date's name and today's date at the head, set in Fraunces, **signed in the ink of whoever accepted.** Then the book closes on it.

That is the whole gesture, and it is the correct one for two people seven hours apart: you do not start a date with someone who is asleep. **You set a table and you leave.**

### 2.3 Arriving

The other one's arrival is the better half, and it needs no new component at all.

§5.3 already specifies that the most recent thing the other person left sits tucked into the cover — **lifted 2px, rotated 0.6°, full shadow, because it has not been pressed flat yet.** That is already the unread indicator, and it is already better than a badge.

**An invitation arrives exactly that way, and you accept it by smoothing the page down.** The settle from 0.6° to 0° is the arriving gesture. There is no Accept button, no “Adam invited you,” no notification voice. The design direction calls that settle “a small, good moment,” and it costs one `transform`.

Three things follow, and all three are load-bearing:

- **Nothing announces.** No push during their night, ever — already law (§6.5). An invitation is *found*, not delivered, and being found is warmer than being told.
- **There is no decline.** An invitation nobody takes up is a blank leaf at the end of the book. Either of them can write over it, bind it, or leave it. **The app never says anyone declined, and never says anyone is waiting.** A “waiting since Tuesday” label is the single fastest way to turn this product into a guilt machine, and it is the default an engineer will reach for.
- **The corner-lift from §3.2 is the sound of the door opening.** If the paper sound ships, this is the second place it belongs.

### 2.4 Being on one

**One date is open at a time.**

This is the most important rule in the document. Five open games is an inbox. One open leaf is an evening. It also dissolves the abandonment problem structurally — you cannot accumulate twelve half-finished things, because starting a second one binds the first.

Three things say *you are on a date* without a single new element:

1. **Both ribbons on the same page.** §4 already gives each of them a personal ribbon marking where they last were, and already notes that this means each can see where the other is reading. **Two ribbons on one leaf is the entire presence system.** No green dot, no “typing…”, no real-time infrastructure, no `C17` — which the PRD already cut on exactly this reasoning. And when one of them is asleep, §6 already specifies that their ribbon lies flat and still. **A sleeping partner's ribbon lying flat on the page you are both on is the most tender state in the product and it is already built.**
2. **The page is the venue.** Everything happens on one leaf. You do not navigate a date, you are *at* it. The moment a date spans three screens it becomes a feature again.
3. **Both clocks at the head of the leaf.** Small, `caption`, oldstyle figures, in the manner of the Old Farmer's Almanac sun tables already cited as reference 10. The date knows what time it is for both of you — the product's thesis, at the scale of one page.

And one prohibition: **no timers.** A date with a countdown is a meeting. The only exception is a date whose rule *is* a clock, and there is exactly one of those (#26).

### 2.5 It being over

A date ends when its own rule is satisfied, or when either of them **turns the page.** The end of a chapter is turning away from it — the gesture already exists, is already the signature interaction, and needs no button. If a label is required anywhere, it is `Leave it here.` Never `Finish`, never `Submit`, never `Done`.

Then the app writes the footer. **This is the artifact of their asynchrony and nothing else in the world can print it:**

> `Begun 11.42 p.m. New York · closed 8.15 a.m. Tel Aviv`

Set as book matter in `--ink-soft`, oldstyle figures, at the foot of the leaf. Two clocks, two cities, one evening. It is the most romantic true sentence this product can write, it is a pure function of state, and it costs nothing.

**One flag for the founder.** I would like to add ` · nine hours` to that line, because *this date lasted nine hours, and one of us was asleep for seven of them* is the single best thing about the way they are forced to live. It is a number, and D3 closed that register. My reading: it is a fact about one evening, it never accumulates, it is never compared to another date, and it is never shown twice. That makes it prose rather than a metric. **But it is a number next to a date, and §7 of the design direction is explicit that a count next to a date invites subtraction. Your call, not mine.**

### 2.6 What remains

On close, **the leaf takes its date and falls back into the chronology.** It stops being at the unfinished end and slots in at the day it closed. Physically, the book thickens by one page — visible on the fore-edge, which §7 already established as the only ambient measure in the product.

Then it becomes **the thing tucked into the cover** (§5.3), lifted and unpressed, until the other one presses it flat. Which means the last thing they left is now the last thing they *did together*, and the closing gesture of one date is identical to the arriving gesture of the next.

**Nothing is rated at the close.** `C25`'s quiet private thumb still needs to exist to build the taste profile the research deferred, but it must not appear as part of the ending or the ending becomes a review. Ask later, elsewhere, or not at all.

### 2.7 One structural idea this unlocks: Saturday is the reveal

Sealed things all week — the folded panels, the blind photographs, the predictions — **open on Saturday.**

This gives the week a shape it does not currently have. The async dates stop being consolation for the days they cannot be together and become the *build-up* to the one day they can. Saturday stops being the day everything demanding queues behind and becomes the day everything arrives. The library warns that Saturday is a single point of failure carrying twenty of the twenty-four both-alert activities; this does not remove the load, but it changes its character from backlog to occasion.

Cheap to build: a `reveals_on` field, and one Saturday page that lists what is about to open.

---

## 3. The dates

Marked: **occasion · async or live · what a turn is · what the book keeps · build cost.** The library ancestor is named where there is one.

---

### A · The overnight date
*She falls asleep in the middle of it. He wakes into it. The form nobody else can offer.*

---

**1 · Consequences** — *original; the Victorian folded-paper parlour game*

The page prints a form with blanks — *[adjective] Eva met [adjective] Adam at ___. He said ___. She said ___. And the consequence was ___.* Each fills alternate blanks without seeing the others. When the last one lands, the whole thing prints.
**Async** · a turn is one blank, thirty seconds · sits indefinitely
**Keeps:** a finished page, and it will be the funniest thing in the book.
**Why it needs the app:** a perfect fold that cannot be peeked at. Impossible aloud; the reason the parlour version needs paper is the reason this needs software.
**Cost:** trivial.
**Note:** write six or eight forms in the book's own voice. Do not generate them — a generated Consequences form is a slot machine, a written one is a game.

---

**2 · Description** — *original*

He photographs something from his day and **describes it in words only.** She never sees the photograph. She draws it from his description. The reveal is a spread: the photograph on the verso, her drawing on the recto.
**Async** · a turn is one photo and one paragraph, or one drawing · sits indefinitely
**Keeps:** a page holding a photograph next to a drawing of that photograph, made by someone who never saw it. The best artifact anything in this document produces.
**Why it needs the app:** enforced blindness, and a page that can hold both halves at once.
**Cost:** moderate — camera plus canvas, both of which the daily exchange and #3 need anyway.

---

**3 · The Folded Page** — *original; exquisite corpse*

He draws the top of a figure and the app folds it, leaving two stub lines crossing the crease. She wakes to a page showing nothing but those stubs and draws the bottom. **The fold opens on Saturday.**
**Async** · a turn is one panel, two to five minutes · sits indefinitely
**Keeps:** a drawing made by two people that neither could have made.
**Why it needs the app:** a fold nobody can lift.
**Cost:** moderate — canvas, two inks, **one stroke weight, no brushes, no colour picker.** The design direction's rejection of Paper's watercolour simulation applies exactly.

---

**4 · One Night's Story** — *from `t4-fortunately-unfortunately` (T4)*

Alternating *Fortunately* / *Unfortunately*, **four lines each, and it closes by morning.** She writes two before sleep; he finds a boat sinking at 5am and writes his way out of it.
**Async** · a turn is one sentence · closes on the eighth line
**Keeps:** a short story in two inks.
**Why it needs the app:** spoken, this is a five-minute laugh that evaporates. And the bounded length is what turns an endless thread into an evening — **the fix that made it a date was giving it eight lines.**
**Cost:** trivial.

---

**5 · The Interview** — *original; adjacent to `t5-gottman-love-map-single-question` (T5)*

She records five questions in her last waking minutes — real ones, about his first apartment, about the year before they met. He answers into the recorder at 5am, half awake, which is when people tell the truth. She hears them at lunch.
**Async** · a turn is five questions, or five answers · sits indefinitely
**Keeps:** the questions typeset, the answers attached as audio via `C35` *hold to hear*. A recording of him at five in the morning is worth more in ten years than anything else here.
**Why it needs the app:** it exists at all — the hour is unusable for a call — and the audio attaches to a page instead of dying in a message thread.
**Cost:** moderate.

---

**6 · Two Truths, in his voice** — *from `t4-two-truths-and-a-lie` (T4)*

Three recorded statements about his day. One is a lie. She picks in the morning.
**Async** · a turn is three short recordings, or one tap
**Keeps:** the recording, and the line about which one she fell for.
**Why it needs the app:** sealing, and it works with her eyes shut — see #21 for the lock-screen version.
**Cost:** moderate.

---

**7 · The Errand** — *original*

She leaves him a small commission for his day: *buy me something from the shuk for under twenty shekels*, *find out what the man in the corner shop is called*. He does it while she is asleep and photographs the result. It is waiting when she gets home.
**Async** · a turn is one commission, or one photograph and one line · sits a day
**Keeps:** a photograph of a thing that exists in the world because she asked for it.
**Why it needs the app:** nothing about the mechanism — everything about the framing. This is the only date here where one of them **acts in the world on the other's behalf**, and it is the closest thing to *he brought me something* that distance allows.
**Cost:** trivial.

---

### B · The day-long date
*Begins at five in the morning in Tel Aviv, ends when she goes to bed in New York. Nobody sits down for it.*

---

**8 · The Assignment** — *original*

One word for the day — *warm*, *almost*, *Tuesday*, *loud*. **Both** photograph it in their own city, at their own hour, blind to each other. Sealed until both are in, then revealed as a spread.
**Async** · a turn is one photograph · sits until both are in
**Keeps:** two photographs on facing pages, and after a year, a book full of paired days.
**Why it needs the app:** sealed simultaneity — whoever showed first would otherwise contaminate the other. And it produces exactly the artifact the book already wants.
**Cost:** trivial on top of the daily photo pipeline.
**Works in every window including the commute** — she can shoot it on the platform without breaking stride, which almost nothing else here can claim.

---

**9 · Twenty** — *from `t4-twenty-questions` (T4)*

She seals a secret before bed. He spends his day asking yes/no questions. She answers at lunch. He solves it before she sleeps. **The secret must be something in her actual life** — a thing in her flat, someone she saw, a moment from the week. General trivia makes this a pub quiz; her own day makes it a date.
**Async** · a turn is one question or one answer · sits indefinitely
**Keeps:** twenty yes/no lines in two inks — a transcript of one person feeling their way toward another's day.
**Why it needs the app:** it holds the secret so nobody can quietly revise it, and it counts.
**Cost:** trivial.

---

**10 · The Sound Walk** — *original*

Six ten-second recordings across his morning: the kettle, the bad hinge, the shuk, the bus, the sea. She plays them in order on her commute and guesses each. The page keeps all six.
**Async** · a turn is six recordings, or six guesses · sits indefinitely
**Keeps:** six sounds attached to one page, playable years later.
**Why it needs the app:** on a call she can hear where he is anyway; the point is that these are chosen, sequenced, and kept. It is also **the only date here that makes the other city the content**, which is otherwise spent entirely on the clock and the sky.
**Cost:** moderate.
**Note:** this is a date because it is six, in order, with a walk implied. One recording would be a text message.

---

**11 · His Dinner, Her Lunch** — *from `ldr-his-dinner-her-lunch` (T2), `tier S`*

The gap puts his evening meal in the middle of her working lunch. The app writes **one menu** for both, sized for one person each. He cooks it at eight; she eats it at one. The page keeps two photographs of two plates.
**Async, feels live** · a turn is one meal and one photograph · one day
**Keeps:** two plates on facing pages with the two clocks at the head.
**Why it needs the app:** the app is the only thing that knows their meals coincide, and the only thing that will write the menu so neither has to decide.
**Cost:** moderate — needs a small written menu set, not a recipe API.

---

**12 · The Museum of One Object** — *original*

Each photographs one object in their home and writes its **wall label** — provenance, date, one sentence on why it is in the collection. Two objects, two labels, one spread.
**Async** · a turn is one photograph and forty words · sits indefinitely
**Keeps:** the best-looking page in the document after #3 — the label format is oldstyle figures and small caps and it is what this typography was built for.
**Why it needs the app:** the format. Said aloud it is a nice anecdote; typeset as a museum label it is an object.
**Cost:** trivial.

---

**13 · The Word** — *original*

Wordle where **you choose each other's word**, and the word is always from their life — a street, a dish, a private noun. Six guesses across the day. On solve, the setter writes one line about why they chose it, **and that line is the page.**
**Async** · a turn is one guess · sits indefinitely
**Keeps:** one sentence explaining a word. Not the grid.
**Why it needs the app:** unplayable aloud, obviously.
**Cost:** moderate — dictionary validation, on-device, because her subway has no signal (`C34`).
**Note:** render in ink and paper-edge rules, never green and yellow. If it cannot be made to look like a book, cut it.

---

**14 · Closer** — *original; and see the structural note below*

The daily photograph, posted **cropped to about 8×**. One guess. Wrong, and it opens one ring. Three rings and it is fully revealed — and the full photograph lands on today's page exactly as it would have anyway.
**Async** · a turn is one crop or one guess, fifteen seconds
**Keeps:** nothing new. It produces the artifact the book already produces.
**Why it needs the app:** a progressive crop is software-only.
**Cost:** moderate, with one real constraint: **ship only the cropped bytes until the reveal.** A CSS mask over the full image is a lie, and `C37` — gone means gone — makes lies about what has been transmitted structurally unacceptable in this product.

> **Closer is not a date. It is the doorway.** Under the founder's test it fails question 1 — nobody says *we did the zoom thing on Tuesday*. But it is the right shape for the daily exchange, which happens whether or not there is a date on: the photograph arrives cropped, opening it is a two-turn exchange across the sleep gap, and **the page it opens onto is where an invitation can be waiting.** The greeting at the door, not the evening.

---

### C · Lunch
*Half an hour, in public, possibly silent, and she has to go back.*

**The constraints, absolutely:** a turn is under ninety seconds, saves on every keystroke, and is complete the instant she lifts her finger. **No audio.** **No countdown.** The app has an unfair advantage over GamePigeon here — a page of serif type on warm paper looks like reading, not like playing. The `C26` contraindication guardrail should govern the slip at lunch exactly as it governs the deep-talk protocols: **W4 is offered nothing it can truncate.**

---

**15 · The Postcard** — *original*

One photograph from her Tuesday and three lines written to him **as though from somewhere.** *The weather here is stupid. There is a man on the seventh floor who sings.* It arrives while he is asleep.
**Async** · a turn is one postcard, ninety seconds · one sitting
**Keeps:** a postcard page — image on one side, three lines and a stamp-shaped date on the other. A format that is already a book object.
**Why it needs the app:** the format, and the fact that a real postcard from New York to Israel takes eleven days.
**Cost:** trivial.
**This is the best lunch date here** — it is one sitting, it is silent, it is discreet, it cannot be truncated, and it is unambiguously a thing you did.

---

**16 · Which of Us** — *original; generalising `t4-newlywed-prediction-quiz` (T4)*

Five statements — *is more likely to cry at a film*, *would survive longer in a blackout*, *apologises first.* Both answer **you** or **me**, blind. Reveal when both are in.
**Async** · a turn is five taps, thirty seconds
**Keeps:** five lines. Where they agreed, the two answers sit on the same line.
**Why it needs the app:** sealing. Aloud, whoever speaks second is contaminated — and the library's own Newlywed entry has to instruct them to *“say it under your breath, cover the phone, or hold it in your head,”* which is a person improvising a sealing mechanism because they do not have one.
**Cost:** trivial.
**The rule that keeps it safe:** never say *correct*, never show *3 of 5*. A match simply looks like a match on the page. The moment this becomes an examination of how well you know your partner it is the exact metric the founder banned.

---

**17 · The Questions** — *from `t4-newlywed-prediction-quiz` (T4) + the twenty-nine T5/T6 deep-talk entries*

Three questions, and for each you both **answer it and guess how the other answered.** Sealed until the pair completes. This is `C29`, which the PRD cut as “a variant, not a feature” — I want to argue it back, not as a feature but as **the conversion layer that turns the entire deep-talk library into dates.**
**Async** · a turn is one answer plus one guess, sixty seconds
**Keeps:** three questions, four answers each time, set as a page.
**Why it needs the app:** as #16.
**Cost:** trivial on top of `C27`/`C28`.
**Guardrail:** it must inherit `WINDOW-CONTRAINDICATIONS.md` wholesale. The heavy protocols — 36 Questions in full, Hold Me Tight, Dreams Within Conflict — are **never** a lunch date. Truncating a vulnerable conversation at a hard stop is worse than not starting, and that ruling already exists in the library as an enforcement rule rather than advice.

---

**18 · Blind Ranking** — *original*

Five things — five of their own photographs, five places, five of his cooking attempts. Both rank privately; the reveal sets the two orders side by side.
**Async** · a turn is one ranking, ninety seconds
**Keeps:** two columns, and the argument about the gap between them.
**Cost:** trivial. Drag-to-order is the only list allowed in the product, because it is content rather than navigation.

---

**19 · The Argument** — *from `t4-would-you-rather-deep` (T4)*

A forced choice, and then **three sentences each**, alternating, defending it. The page prints both cases.
**Async** · a turn is one sentence · sits indefinitely
**Keeps:** a transcript of two people arguing in good faith about something that does not matter, which is one of the better things a couple can have on paper.
**Cost:** trivial.

---

### D · The commute
*Forty minutes, hands full, headphones in, and she cannot look at anything.*

*This is the thinnest window in the library. Its entire current answer is a voice note and a manually synced audiobook. Everything here rests on one unverified mechanism.*

> **THE SPIKE.** An installed PWA playing audio can register **Media Session** handlers for `play`, `pause`, `previoustrack` and `nexttrack`, which surface as iOS lock-screen buttons — and are reachable from an AirPod without touching the phone at all (single squeeze play/pause, double next, triple previous). That is a **two- or three-way eyes-free, hands-free input channel**, and it is the only one available to a PWA on iOS.
>
> **I have not verified that these handlers fire reliably in standalone iOS Safari. Spike it in week one, before designing anything on top of it.** Fallback: a screen with two full-height tap zones and no text to read, since the audio already said what the options were — worth perhaps half as much, because the phone has to come out.
>
> **And because there are no haptics** (confirmed, P5), every eyes-free answer must acknowledge itself **in audio.** Reuse the 40 ms paper sound from §3.2 as the confirm tick. A page turn is exactly the right sound for *registered, moving on.*

---

**20 · The Commute Tape** — *from `t4-would-you-rather-deep` fused with `t4-newlywed-prediction-quiz` (both T4)*

At five in the morning he records ten Would You Rathers in his own voice — **and privately records what he thinks she will choose.** She presses play once on the platform and answers with ⏮ / ⏭ for the next forty minutes. That evening the page shows ten lines: her choice and his guess. Where he was right, they sit on the same line.
**Async** · a turn is one recording session (~6 min) or one playthrough (~8 min) · sits days
**Keeps:** ten lines, and his voice.
**Why it needs the app:** it exists at all in a window that admits nothing else, and the prediction layer cannot be done honestly aloud.
**Cost:** hard, and gated on the spike.
**The reason this is a date and not a playlist:** he spent an hour of his morning working out what she would say. That is the entire point of everything in this document.

---

**21 · Twenty, on the train** — *from `t4-twenty-questions` (T4)*

The inverse of #9, and the better use of W3. **She holds the secret; he asks.** He records questions across his morning; she answers twenty times with two buttons and never looks at the phone. He finds out that evening whether he got it.
**Async** · a turn is one recorded question, or one press
**Keeps:** the transcript.
**Cost:** hard, gated on the spike — but **degrades to #9 with no new rules**, which makes it the safest thing to bet on in this section.

---

**22 · He Read to Me** — *from `t2-read-aloud-bedtime-book` (T2)*

The library's reading-aloud entry is `w1` only, because it assumes a call. Break that: **he records two pages of the novel they are both reading** and she hears it on the train. The page keeps where they stopped, and a ribbon marks it.
**Async** · a turn is one recording of five or six minutes, or one listen
**Keeps:** the recording, and a bookmark that is a real bookmark.
**Why it needs the app:** it moves the single warmest activity in the library out of the one window that requires them both awake and into the one window that has nothing.
**Cost:** moderate.
**Not a game at all, and clearly a date.** The reframe is what surfaced it — I did not have this when I was generating minigames.

---

**23 · The Sound Walk** — *cross-listed from #10.* Listening is free on a train; the guesses are two buttons.

---

### E · Saturday
*Both awake, no ceiling, and it carries the whole week.*

---

**24 · Opening the Week** — *original; a ritual rather than a date, and see §2.7*

Everything sealed during the week opens together: the folded page, the paired photographs, the predictions, the letters. The app lays out what is about to open, and they go through it.
**Live** · thirty to sixty minutes
**Keeps:** the week, bound. Six or seven leaves that all take their date at once.
**Why it needs the app:** it is the only thing that has been holding the seals.
**Cost:** trivial once sealing exists — a `reveals_on` field and one page.
**This may be the highest-value item in the whole document per unit of effort,** because it retroactively improves every async date by giving the week a shape: the days apart stop being consolation and become the build-up.

---

**25 · Draw Me** — *original*

Five minutes, both drawing the other from memory. Simultaneous reveal.
**Live-ish** — the app holds both until the second lands, so it survives one of them being called away
**Keeps:** two bad drawings, which is the point.
**Cost:** trivial once #3's canvas exists.
**Frequency:** four times a year. Monthly would wear it out; yearly would be better.

---

**26 · Just a Minute** — *from `t4-just-a-minute` (T4)*

Sixty seconds on a given topic without hesitation, repetition or deviation. **The challenge is async:** the listener taps the instant they hear a repeat and the app timestamps it and plays the moment back.
**Async, though it plays best live** · a turn is one sixty-second recording, or one listen-and-challenge
**Keeps:** sixty seconds of your partner talking fluent nonsense.
**Why it needs the app:** an exact minute, and a timestamped challenge that is strictly better than a person interrupting.
**Cost:** moderate.
**Windows:** W7, W1, W8/W9. **Never W3 or W4 — she cannot talk on a train or at a desk.** The only date in the document whose rule is a clock.

---

**27 · The List** — *original*

Ten things you would do on your first day in the same city. Both write privately, sealed, opened on a Saturday.
**Async, opened live** · a turn is one list
**Keeps:** two lists on facing pages, and the overlaps.
**Cost:** trivial.
**Flag for the founder — read before shipping.** D2 cut the countdown and forbade backfilling it, and this is adjacent to what was cut. My reading is that a countdown says *endure this until it ends* while a list says *imagine this*, present tense, with no date attached and nothing ticking. But it is close to the line and it is your line, not mine.

---

### F · His Friday · her Sunday
*One has the whole day; the other is working.*

---

**28 · A Day You Weren't There For** — *from `C10` in the PRD, made into a date*

He has Friday; she is working. He drops **six frames across her working day** — not a running commentary, six chosen ones — and the page assembles itself. She opens it once, at the end, and it is a whole day.
**Async** · a turn is one frame, dropped hourly · one day
**Keeps:** a six-frame day. The nearest thing to having been there.
**Why it needs the app:** the restraint. Six frames on a page is a photo essay; sixty in a message thread is noise, and the thread cannot make the difference.
**Cost:** trivial.
**Mirror it exactly for her Sunday.**

---

**29 · The Long Cook** — *original; extends `t2-read-recipe-aloud-while-cooking` (T2)*

He has the whole day and makes something slow. She checks in from her desk three times: at the start, halfway, and at the table.
**Async, three brief live moments** · one day
**Keeps:** three photographs of one thing becoming itself, and the recipe.
**Cost:** trivial.

---

### G · Worth staying up for
*It costs him a night. The library flags this window as rare-by-design and event-grade only.*

---

**30 · Her Sunset, His Three in the Morning** — *original*

The one form that cannot happen at any other hour: he stays up to be present for something of hers that is happening live — her walking home at dusk, a rooftop, a party ending. He is not doing anything. He is just there, at 3am.
**Live** · sixty to ninety minutes
**Keeps:** one photograph, and the footer — `Begun 6.10 p.m. New York · closed 3.40 a.m. Tel Aviv` — which is the entire content of the date, stated as a fact.
**Why it needs the app:** nothing, mechanically. Everything, editorially: **the slip must say what it costs him** before he accepts, and the app must never propose W6 for anything that could have happened in another window. The library is blunt about this and the app should be too.
**Cost:** trivial.

---

## 4. Top 8

Ranked on the four-part test, then on what it costs.

| # | Date | Why |
|---|---|---|
| **1** | **Consequences** (#1) | Four out of four, thirty seconds a move, and it demonstrates the complete arc — set the table, both contribute blind, reveal, close, residue — which makes it the right first tenant of the container in §2. It is also the funniest thing here, and a first date should be funny. |
| **2** | **The Assignment** (#8) | Two people going out into two cities to photograph the same word, blind, and finding out at the end of the day what the other one saw. It rides the daily photo pipeline entirely, adds no artifact type, works in **every** window including the commute, and after a year it is a book of paired days. |
| **3** | **The Commute Tape** (#20) | The highest strategic value and the highest risk in the document. W3 is fifteen hours a week in which Eva is reachable and the library has almost nothing for her. Gated on a spike that might fail — which is exactly why it should be spiked first. |
| **4** | **Description** (#2) | The best artifact anything here can produce, and the purest expression of what an overnight date is for: you are not playing, you are building something for someone to wake up inside. **The one most likely to become their favourite.** Fourth only because it needs both a camera pipeline and a canvas. |
| **5** | **Opening the Week** (#24) | Not a date — a ritual, and worth more than most of the dates. It gives the week a shape, converts every sealed thing into a Saturday event, and costs a field and a page. |
| **6** | **The Postcard** (#15) | The best lunch date available. One sitting, silent, discreet, untruncatable, and unambiguously a thing she did on a Tuesday. |
| **7** | **The Interview** (#5) | Him answering her questions at five in the morning, half awake, is the most valuable recording this product could possibly hold. Ten years from now it is the reason the book exists. |
| **8** | **The Folded Page** (#3) | Two people making one drawing neither could have made, opened on Saturday. Build it in the same cluster as #2 and #25 — one canvas, three dates. |

**Just outside:** The Sound Walk (#10), which is the only date that makes the other city into content and which I suspect I am still under-rating. He Read to Me (#22), which the reframe surfaced and which costs almost nothing. The Errand (#7), the only date where one of them acts in the world on the other's behalf.

---

## 5. Build these first

### One · The evening itself, with Consequences in it

**Build §2 before you build any date.** Arriving, the venue, leaving it here, the footer, and the leaf falling back into the chronology. Almost every piece of it already exists for another reason — the tipped-in slip, the tucked-and-unpressed page with its 0.6° settle, the two ribbons, the corner lift, the fore-edge — and assembling them into a ritual is a smaller job than any single date that needs a canvas. What it produces is the thing that separates this from a screen with activities on it: **a place two people go, one at a time, one evening at a time.**

Then put exactly one date in it, and make it Consequences, because Consequences exercises the whole arc. The table gets set at eleven at night in New York. He arrives at five in the morning in Tel Aviv by pressing a page flat. They fill alternate blanks blind across a day. It reveals itself. Someone turns the page. The footer says `Begun 11.42 p.m. New York · closed 8.15 a.m. Tel Aviv`, the leaf drops into the chronology, and the book is one page thicker. Every architectural question the dates surface will ever ask is answered by shipping that once — including the ones that would otherwise be answered badly, like what a stalled turn looks like (a blank line in someone's ink) and what an unanswered invitation looks like (a page nobody pressed flat).

### Two · The Assignment

Build it second because it is the cheapest thing in the document that is unambiguously a date, and because it makes the daily photograph — the product's spine, `§3.4` and `§5.3` seen twice — into an occasion without changing it at all. One word arrives in the morning. Both of them carry it around for a day. She photographs *almost* on a platform at 8.15 in New York; he photographs *almost* on a balcony at 7 in the evening in Tel Aviv; neither sees the other's until both are in, and then it is a spread. The engineering is the sealing and the pairing, and both are needed anyway for #16, #17, #18 and #27. The reason to rate it this highly is what it looks like after a year: a book in which most spreads are two people, on the same day, in two cities, having been given the same word.

### Three · The Commute Tape — and spike it in week one

Fifteen hours a week, five days out of seven, in which Eva is awake, reachable, and completely unreachable by everything this product currently plans to build. The library's whole answer for that window is *send her a voice note*. If Media Session action handlers fire on the iOS lock screen in an installed PWA, then a two-button eyes-free channel exists, and with it: ten Would You Rathers in his voice with a hidden prediction layer, twenty questions answered without looking, three recorded statements one of which is a lie — all of it played by a woman holding a coffee and a rail, answering by squeezing an AirPod. Nobody has built that. If the spike fails, the fallback is a two-zone tap screen and W3 keeps a diminished version rather than losing it. Either way, spike it before it is designed around, because half of this section's value evaporates if the answer is no — and it is better to find that out in week one than in month three.

---

## 6. Not dates — demoted, and honestly

*Several of these I ranked highly a day ago. The founder's test is stricter than mine was, and it is right.*

**Threads — real value, wrong name.** These are what happens *between* dates, the equivalent of texting. Ship them if they are cheap; never present them as dates, never put them on the slip, and never give them a page of their own.

- **Ghost** (`t4-ghost-word-game`) — a set has an end and the app can referee the dictionary, but nobody says *we played Ghost on Tuesday*, and it leaves one dead word. It was in my top eight yesterday. It should not have been.
- **The Minister's Cat** (`t4-ministers-cat`) — the A-to-Z page is still the prettiest artifact I found, and it still takes a week, which makes it a correspondence rather than an occasion. Keep it as a thread that binds into a page at Z.
- **The Chain** and **One Word at a Time** — one token per turn, no edges, nothing you would describe to a friend.
- **I'm Going on a Picnic** (`t4-going-on-a-picnic`) — the hidden-list version is a genuinely good use of software and a genuinely punishing thing to fail at overnight. A thread, cooperative only, never eliminating.

**Cut, with reasons, so nobody re-proposes them.**

- **Live drawing** (`t3-skribbl-io`) — the only real-time infrastructure in the document, for a thing they can do by holding up paper on the call they are already on. skribbl.io is free and better. The PRD already cut `C17` on the identical argument: *the call is the co-presence channel.*
- **Botticelli** (`t4-botticelli`) — the best game in T4 and the worst fit here. Its pleasure is fast bluffing, and judging whether two people meant the same famous person has no good implementation.
- **Contact** (`t4-contact-two-player`) — the five-count *is* the game, and async kills it.
- **Never Have I Ever** (`t4-never-have-i-ever-verbal`) — the elimination structure is meaningless async; what is left is a confession format that belongs behind the private door (`C36`), not in the book.
- **Dots and Boxes, Sprouts, and every abstract pen game** — deliberately unnumbered. **Do not rebuild GamePigeon.** It holds twenty of these inside the thread they already text in, it is `tier S` in the library, and it is indistinguishable from texting if she needs to close it. If they want a game about nothing, they have one. This app exists for the things that are about *them*.
- **The weather guess** — three seconds, and it drags in a weather API that the design direction deliberately avoided by computing the sky from solar geometry instead.
- **Where am I** — GeoGuessr is better at being GeoGuessr, and the only thing ours has is that it is his street. If it ships at all it is the *nearer or further* version, which needs no map.
- **Hum it** — charming, evaporates, fails questions 2 and 3.
- **Sealed Prediction** (`C11`) — already cut once, correctly. As a two-person prediction market with no score it is funnier than it was as a vault, and it is still used twice a year.
- **Categories** — the one concept that genuinely requires a score to work, which under the new frame is the definition of not-a-date.

---

## 7. What this needs from the rest of the product

| Need | Status | Note |
|---|---|---|
| **The date container** (§2) | **Not specified anywhere — the gap** | Arriving, one open leaf, the footer, falling back into the chronology. Build first. |
| `C7` *left for you* | Phase 1, already prioritised | Every async date is `C7` plus a rule set. One turn table, one state blob, one page renderer. |
| The tucked-and-unpressed page (§5.3) | Specified | **Doubles as the invitation with zero new work.** The single best reuse available. |
| Two ribbons (`C15`) | Phase 2 | Move to Phase 1. It is the entire presence system for dates and it kills the case for `C17` permanently. |
| A place for unfinished things | Not specified | After today's page, before the colophon. On close, the leaf takes its date and slots into the chronology. |
| Sealing + `reveals_on` | New, small | Needed by #8, #16, #17, #18, #24, #25, #27. Build it once, early. |
| Camera / crop pipeline | Daily exchange needs it | #2, #8, #11, #12, #14, #28. |
| Canvas — one weight, two inks | New | #2, #3, #25. One cluster, three dates. |
| Audio record + attach to page | `C35` *hold to hear* is in the PRD | #5, #6, #10, #20, #21, #22, #26. |
| **Media Session on the iOS lock screen** | **UNVERIFIED — spike week one** | Gates the entire commute section. |
| `C26` contraindication guardrail, extended to dates | Free — it is a filter | W4 sees only sub-90-second turns and nothing truncatable; W3 sees only eyes-free; W6 sees only what cannot happen elsewhere, with its cost stated on the slip. |
| **No turn clocks, no waiting badges, no “your move” ages, no decline** | Must be written into the spec explicitly | §2.3 and §2.4. This is the one thing that would turn dates into a guilt machine, and it is the default an engineer reaches for. |
| Founder decisions needed | — | (a) the `· nine hours` duration line in the footer — §2.5; (b) **The List** (#27) and its adjacency to what D2 cut — §3E. |

---

```json
{
  "status": "complete",
  "concepts_generated": 30,
  "top_3": [
    "The evening itself — the date container from §2 (setting the table, arriving by pressing a page flat, both ribbons on one leaf, leaving it here, the two-city footer, the leaf falling back into the chronology) shipped with Consequences as its first tenant",
    "The Assignment — one word for the day, both photograph it in their own city blind to the other, sealed until both are in, revealed as a spread",
    "The Commute Tape — ten Would You Rathers in his voice with a hidden prediction layer, answered eyes-free on the iOS lock screen; spike Media Session in week one"
  ],
  "best_async_idea": "Description — one photographs something and describes it in words only; the other draws it from the description without ever seeing the photograph; the reveal is a spread with the photograph on the verso and the blind drawing on the recto",
  "best_no_screen_idea": "Media Session lock-screen buttons as a two/three-way eyes-free input channel, reachable from an AirPod squeeze with the phone in a pocket — carrying The Commute Tape, Twenty-on-the-train, and Two Truths in his voice; UNVERIFIED on standalone iOS Safari and flagged as the first spike",
  "ritual_answer": "Arriving is pressing a tucked page flat — the 0.6-degree settle already specified as the unread indicator, reused as the accept gesture, so there is no Accept button and no notification. Being on a date is both ribbons resting on the same leaf, with the sleeping partner's lying flat. It ends by turning the page, and the app writes a footer no other product can print: begun 11.42 p.m. New York, closed 8.15 a.m. Tel Aviv. Then the leaf takes its date, falls back into the chronology, and the book is one page thicker. One date open at a time — an inbox is five games, an evening is one leaf.",
  "deliverable": "docs/04-features/ideation/CREATIVE-DATES.md"
}
```
