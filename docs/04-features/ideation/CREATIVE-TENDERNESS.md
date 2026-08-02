---
title: Small acts of tenderness — 44 ideas
owner: creative (lens 2 — tenderness)
date: 2026-08-02
revision: 2 — incorporates the founder's vocabulary decision (they are DATES, not activities or games)
status: ideation — not spec, not build
scope: what the PRD's cute-things list missed
---

# Small acts of tenderness

*Forty-four ideas, then the top ten, then three I would defend in a room, then the fourteen I threw out and why.*

---

## The vocabulary decision changed the shape of this document

The things Eva and Adam do together are **dates**. Not activities, not games, not minigames. That word arrived mid-flight and it did more than rename a noun — it reorganised the best territory in this file, so revision 2 leads with the consequence rather than appending it.

A date is an **occasion**. It has a beginning, an end, and it is remembered afterwards. That single property does something an "activity" never could: **an occasion can be begun by one person and joined by the other.** A note left at midnight is sweet. A *date* begun at 23:40 in New York and joined at 05:10 in Israel is not a workaround for the gap — it is a form the gap makes possible, and it is unavailable to every couple who share a bed.

So the seven hours stop being dead time between two people trying to play together. **The seven hours go inside the date.** That is the strongest frame anyone has put on this product so far, and Section A is built entirely on it.

Two consequences worth stating before the list:

**The word raises the register, and a raised register can manufacture obligation.** If everything is an Occasion, then doing nothing starts to feel like standing someone up. This is a real risk introduced by a decision I agree with, and it has two mitigations, both of which are ideas below: the smallest things in the library must be dates too (idea 8), and **a date must always be completable alone** (idea 2). Without those, "date" becomes the heaviest word in the product on precisely the days it should be the lightest.

**Dates are prepared, never scheduled.** A date with a time attached can be missed, and a missed date is standing someone up. Nothing in this document books a time, and the rejected section explains why the obvious version of that idea is the most dangerous one in the file.

---

## How these were generated, and the test each one had to pass

Everything here was written against one question: **what is only possible because Eva is in New York and Adam is in Israel?** If an idea works equally well for two people in the same apartment, it isn't in this document.

Every idea then had to survive five filters, in this order:

1. **The bad-day test.** What does this feel like during a fight, on a day one of them is ill, or on the morning after something went wrong? If the answer is "slightly accusing," it's rejected — see the last section, which is the most useful part of this file.
2. **The reply test.** Does using this create an obligation on the other person? The best gestures here cannot be replied to at all. An underline has no reply. That's the point.
3. **The counter test.** Does it produce, imply, or invite a number that measures the relationship or the separation? D2 closed that register and it stays closed — including for numbers that look harmless, like *how long a note has been waiting* or *how long a date has been open*.
4. **The year-two test.** Is this better in month twenty-four than in week one? A novelty that dies after a week is a liability in a product with exactly two users who cannot be re-acquired.
5. **The date test (new).** If this touches something they do together, does it hold up as an *occasion* — does it begin, end, and leave something behind? And can it be gone on alone without that reading as failure?

**A note on what's new and what isn't.** Some of these are new features. Some are *expressions* of things the PRD already committed to — a gesture for an existing requirement, or a second use of a computation already being built. I've marked which is which, because a lead reading this needs to know whether an idea costs a sprint or an afternoon.

---

## The forty-four

### A · Dates begun by one, joined by the other

*The territory the vocabulary decision opened. This is the most important section in the document.*

**1 · Begun**
One of them starts a date and takes their half; it stays open; the other joins it hours later; the closed date becomes a page carrying both halves and both timestamps.
*Lives in:* the handoff — Eva's last waking minutes in W1, joined in Adam's 5am. Also W5→W1, and across the asymmetric days off.
*Warm because:* it is the only mechanic in this product where the seven hours are *inside* the thing rather than around it. Eva writes three claims for Two Truths and a Lie at 23:40 and falls asleep; Adam guesses at 05:10 with his coffee. Neither of them waited. Both of them went on the date. A couple in one city physically cannot do this — for them it is one conversation with a pause in it, and it would be worse. And the page it leaves behind carries the seam: `23:40` in her ink above `05:10` in his. The gap is legible in the artifact, which is the truest thing the book could record.
*Complexity:* medium-high, and it is the flagship. Needs an open/closed state on a date, a rule that an open date never notifies twice, and the content work in idea 3.
*Hard rule:* an open date never displays how long it has been open. Not ever, not anywhere, not as "since yesterday." The wait is the shape of the thing; a number on it is a debt.

**2 · A date can be finished alone**
A date nobody joined is not a failure state: it closes on its own and becomes a page anyway, with one ink on it.
*Lives in:* every day one of them is ill, angry, buried at work, or simply not up to it.
*Warm because:* this is the rule the entire dates frame rests on, and it is the direct application of D6's half-pair logic to the new vocabulary. Eva went on a date. Adam didn't join. Nothing failed, nothing expired, nothing is owed, and the book has a page of Eva's evening on it that is worth having. It also legitimises something genuinely lovely on its own terms — reading the chapter, walking the route, doing the thing without them, and leaving the record for the other one to find. *"I went without you"* is a warm sentence at this distance when it means *I did the thing and here is what it was like.*
*Complexity:* low as a rule, and it must be written into the spec before idea 1 is built rather than after. *Copy rule:* the solo page says nothing about being solo. One ink, one time, no sentence. Anything that names the absence is a rebuke with a typeface.

**3 · The solo first move**
Mark which dates have an opening move one person can genuinely make alone, and let those be begun.
*Lives in:* the content layer, invisibly.
*Warm because:* the library is already full of these and nobody has noticed. Two Truths and a Lie opens with three claims written alone. 20 Questions opens with one person secretly picking the thing. Ghost opens with a letter. Fortunately/Unfortunately opens with a sentence. The Newlywed Game opens with answering about yourself. The asynchronous-halves shared journal *is* this pattern already, written down. The flagship idea needs almost no new content — it needs one field that says which of the 98 can be started by one person.
*Complexity:* medium, and it is content work rather than engineering. **Checked against `library.json`: this field does not exist.** The closest signals are `energy_symmetry` (`works_asymmetric` 60, `best_when_one_is_sleepy` 14, `needs_both_high` 24) and `timezone_friction`, which is free prose, not an enum. Neither is the same as *has a solo opening move* — a date can be asymmetric and still need both people present. Someone has to read 98 `how_it_works` fields and author the flag.

**4 · Eva chose this one**
Pick a date *for* the other person, with no time attached and no acceptance required.
*Lives in:* the cover, as a slip in the chooser's ink.
*Warm because:* choosing something for someone is most of the content of a gift, and the current design only has the mutual form (`We're doing this`). The asymmetric form — *I picked this one for you* — is warmer, cheaper, and structurally safe: with no time on it there is nothing to be late for, and with no accept button there is nothing to decline. It can sit on the cover for a week and mean the same thing on day seven as on day one.
*Complexity:* low. It is the existing suggestion slip, addressed.

**5 · Set the table**
Do the solo preparation for a date in advance — but never book a time for it.
*Lives in:* W8 and W9, the asymmetric days off, when one of them has a whole free day and the other is working.
*Warm because:* setting a table for someone is a small, old act of love, and one of the very few domestic gestures distance cannot take away. `setup_effort: prep_needed` is on 8 of the 98 and `light` on 42 — there is real prep to be done, and one of them is nearly always free while the other works. The rule that makes it safe: **prepared, never scheduled.** A set table that goes unused is not a rebuke. A booked 9pm slot that goes unused is.
*Complexity:* low-medium.

**6 · The long date**
A date with more than two moves, held open across days, that becomes a single page when it ends.
*Lives in:* the background of an ordinary week.
*Warm because:* correspondence chess, Words With Friends and GamePigeon already work this way and already live on their phones — but they live as *infinite feeds of turns*, which is why they eventually feel like a chore rather than an occasion. The thing this book can do that those cannot is give a long date **one beginning, one end, and one page.** It closes, it gets bound in, it is remembered. That is the difference between a date and a notification stream.
*Complexity:* medium. It is idea 1 with more than two moves and a deliberate close.

**7 · The date is a page, not a log entry**
What a date leaves behind is book matter — a page with its name, both cities' times, and whatever it produced — rather than a row in a history list.
*Lives in:* the book, interleaved chronologically with the daily spreads.
*Warm because:* the PRD has this as C23, "what we actually did," specced as a minimal log feeding anti-repeat. Under the new vocabulary that is the wrong object. A log is a list of things done; a page is an occasion remembered. The reranking data the log exists for can be derived from pages just as easily. It also means the book collects *dates and days together*, in one sequence — which is what makes it a book of their life rather than a photo album with a history tab.
*Complexity:* low-medium as a reframe of work already scoped.

**8 · The five-minute date**
The smallest entries in the library are named as dates too, explicitly.
*Lives in:* the bad day, the desk, the ninety seconds.
*Warm because:* it is the guard against the word inflating. "One Love Map Question, Asked in Passing" is ten minutes and S-tier in four separate windows; "One line at her lunch desk" is five. If a date is only an evening-sized occasion, those stop being dates and the product quietly acquires a threshold below which nothing counts — which is exactly the pressure the whole design was built to avoid. On a bad day, five minutes has to be a real date, and the app has to say so without hedging.
*Complexity:* none. A copy and taxonomy rule that costs nothing except being decided.

---

### B · Things left for someone to find

*C7 ("left for you") is the primitive and the PRD builds exactly one ritual on it. These are the rest of the surface. Section A is the highest form of this territory; these are the objects rather than the occasions.*

**9 · Tucked in**
Anything — a slip, a photo, a line, a voice note, a begun date — can be tucked behind *any* existing page anywhere in the book, and is found only by turning to that page, whenever that happens to be.
*Lives in:* anywhere, at no particular time. That is the mechanic.
*Warm because:* it is the only gesture here with no delivery guarantee, which is what makes it a gift rather than a message. Eva tucks something behind a page from March; Adam finds it in November, or next Tuesday, or never — and the not-knowing is hers to enjoy. Nothing arrives, so nothing is owed. It is the physical act of leaving a photograph in a book for someone to find, which people have been doing for four hundred years.
*Complexity:* medium. Needs an attachment on a page and a rule that it produces no notification, no badge, and no marker on the fore-edge.

**10 · Face down**
A daily photo can be posted face down: the page shows the back of the print with one line written on the reverse in that person's ink, and turning it over reveals the picture.
*Lives in:* the daily exchange — most often Eva's last minutes awake, found in Adam's 5am.
*Warm because:* it restores a property of photographs that digital threw away. A print left face down on a table is one of the most loaded objects in domestic life, and the back of a print is where people have always written the date and the joke. It costs the poster nothing and adds a second beat to the finding.
*Complexity:* low. A per-photo flag and a `rotateY` that already exists for page turns.

**11 · The underline**
Underline one line of anything — a caption Eva wrote, a line in a date's description, a margin note — in your own ink. No comment attaches. There is no reply.
*Lives in:* everywhere, especially the ninety seconds at a desk.
*Warm because:* it is the smallest possible unit of "I read this and it landed," and it is structurally incapable of demanding anything back. You cannot reply to an underline. On a bad day it is the only thing either of them could manage, and it is enough.
*Complexity:* low.

**12 · Dog-ear**
Fold down the corner of a page. That is the entire feature. Either of them can fold; either can unfold.
*Lives in:* the book, at any hour.
*Warm because:* a dog-ear on a page you made means someone came back to it. It carries no words, so it cannot be misread on a bad day, and it accumulates — in year two the fore-edge has a scatter of folded corners that is a hand-drawn map of what mattered. The design direction already shortlisted "Dog-ear" as a product name for exactly this reason.
*Complexity:* low. One corner transform, one bit of state, visible on the closed book's fore-edge.

**13 · The blank slip**
Leave a tipped-in slip with nothing written on it.
*Lives in:* the cover, on a day with nothing to say.
*Warm because:* it means *I came, I had nothing, I still came.* Every messaging product in existence makes the empty message impossible, so the gesture doesn't exist anywhere else. Because the slip is a real paper component with a real edge and shadow, a blank one reads as deliberate rather than as a bug.
*Complexity:* trivial once slips exist — it is permission, not code.

**14 · Addressed to a moment**
Leave something — including a begun date — *for the commute*, *for lunch*, *for Saturday*; it surfaces when that window arrives and sits quietly until then.
*Lives in:* W3, W4, W7 — whichever was chosen.
*Warm because:* it points at a *kind* of moment rather than a date on a calendar, which is why it survives D2 where C11 ("sealed until") struggled, and why it isn't scheduling. A date addressed to her commute opens when she has headphones in and her hands full — precisely when a voice from Israel is worth most and precisely when no reply is even possible.
*Complexity:* medium. The window engine already computes the trigger; this is a queue with a window predicate instead of a timestamp.

**15 · A reading**
One of them records themselves turning through a set of pages and talking over them; it plays back hands-free, page turns and all.
*Lives in:* recorded in W8/W9 free time, played in W3 — her commute.
*Warm because:* it is one person holding the object and the other only listening, which is the library's dominant shape (60 of 98 are `works_asymmetric`) applied to the book itself. Distinct from C9's commute tape, which is a queue of voice memos: this one has the book in it, so what she hears is him moving through their own pages. It is also, properly, a date — it has a beginning and an end and it leaves something behind.
*Complexity:* high. Audio capture plus a recorded turn sequence. Phase 3 material, listed because it is the best answer to W3 the book itself can give.

**16 · The one line**
A single-line field on the cover with no send button; what gets written becomes a slip on the other one's side.
*Lives in:* W4 — the library's S-tier "One line at her lunch desk," made into the cheapest act in the product.
*Warm because:* the friction of composing a message is what stops small thoughts from being sent. One line, no subject, no thread, no send button, no reply affordance — the constraint is the kindness. It is the fallback when someone has thirty seconds and a bad day.
*Complexity:* low. It is C7 with a fast path.

---

### C · The book as an accumulating object

**17 · The index**
A real alphabetical index at the back, built from the words in their captions and the names of the dates they went on, with page numbers. `Bagel, 14, 89, 203.` `Ghost, 41, 88.`
*Lives in:* the back of the book, entered deliberately.
*Warm because:* it is the funniest and most quietly devastating thing a two-person book could have. It is *alphabetical, not ranked* — page numbers are locations, not counts — so it measures nothing, and yet in year two it is an accurate portrait of two lives that nobody sat down to make. It is also genuinely useful: it is how you find the picture of the thing you're both remembering, mid-call. Real books have indexes; no app does.
*Complexity:* medium. Word extraction, a stop-list, and a typeset page with leaders. Worthless in month one and superb in year two, so it ships when there is something to index.

**18 · Errata**
A tipped-in slip that corrects an earlier page — including emotionally. *"The photo on page 40 wasn't a bad day. I was wrong about that day."*
*Lives in:* any page, any time, usually much later.
*Warm because:* it is the only idea here that lets time change what something meant. Books have errata slips; relationships have them constantly and no product has ever provided the surface. It cannot manufacture obligation, because nobody can be behind on issuing a correction.
*Complexity:* low. It is a slip with a page reference.

**19 · Plates**
Either of them can promote a page — a photo, or a date's page — to a *plate*: the heavier stock a book reserves for its good pictures, with a distinct fore-edge line, findable with a thumb in the closed book.
*Lives in:* the book; found by riffling.
*Warm because:* it is a favourite without being a rating. No score, no count, no comparison, nothing to be second-best at — one person decided something deserved better paper. And it makes the closed book physically navigable, which is a real bookbinding property rather than a metaphor.
*Complexity:* medium. A per-page flag, a second paper treatment, a fore-edge variant.

**20 · The margins fill up**
Margin notes accumulate around old pages over years, in two inks, so a page from last spring slowly acquires a crowd of small remarks.
*Lives in:* old pages.
*Warm because:* C14 is in the PRD as a *feature*; this is the argument that it is really an *accumulation property*, and that the page layout has to reserve margin from the first commit or the property is unbuildable later. A page with eleven remarks on it in two colours, added across two years, is the best artifact this product could produce. Retrofitting margin space onto a fixed layout is the kind of thing that quietly never happens.
*Complexity:* low as a layout decision now; high as a retrofit later. That asymmetry is the entire reason it is listed.

**21 · The inscription**
The inside front cover holds one line from each of them, written once, changeable but almost never changed.
*Lives in:* the endpaper, seen every time the book opens.
*Warm because:* it is the only surface designed to be updated approximately never, which is what makes it worth reading a thousand times. Every other surface refreshes; this is the one that doesn't. Books are inscribed by the person who gave them, and the inscription is what turns a copy into *the* copy.
*Complexity:* low.

**22 · Bound when full**
When the book fills, it closes and becomes a volume; a new one begins.
*Lives in:* structural.
*Warm because:* thickness cannot grow forever and the honest answer is the physical one — a full notebook gets closed and a new one started, which is a completion rather than a deadline. Binding on **thickness, not on the calendar** matters: a year boundary is a date, and a date invites arithmetic. A book that is simply full invites nothing.
*Complexity:* medium. *Flag:* volume numbers are labels, not measures. No volume count on the cover.

**23 · The almanac line**
Each spread carries, as book matter, the sun times and the moon's phase for both cities that day.
*Lives in:* every spread, unremarked.
*Warm because:* it is what a book of this kind has always carried, and the design direction already names the Old Farmer's Almanac as a layout reference. It is free — solar position is a pure offline function and the moon phase comes from the same maths — and the moon is the one physical object genuinely in both their windows. In year two, riffling shows two years of seasons passing in two cities at once, with nobody having done anything.
*Complexity:* low; `suncalc` is already in the reference list at ~2 KB. *Caution:* a hairline typographic line, never a glowing moon icon. That is exactly where this tips into twee.

**24 · Pressed**
Flat objects — a ticket, a receipt, a leaf, a metrocard, a pharmacy bag — photographed and rendered *at real scale* as pressed items rather than as photographs.
*Lives in:* any day, especially unremarkable ones.
*Warm because:* it collects the evidence of ordinary days that a camera roll throws away, and the PRD's own research says mundane beats curated. A pressed metrocard is more specifically *her New York* than any photograph of a skyline. The distinct rendering is the whole idea: a receipt shown as a photo is a bad photo; shown at real scale on paper it is an artifact.
*Complexity:* medium. Different crop, scale and shadow treatment from a photograph.

**25 · Two hands on one page**
Both of them can caption the same photograph — and both can write at the foot of a date's page — in two inks, one line under the other.
*Lives in:* any page.
*Warm because:* it is the product's thesis, one thing seen from two sides, at the smallest available scale. Eva's line and Adam's line about the same picture, months apart, in two colours, is a conversation that needs no thread and has no unread state. On a date's page it gives the occasion an ending, which is what occasions need.
*Complexity:* low.

---

### D · Asymmetry exploited, not tolerated

**26 · What the other one was doing**
Every photo carries, in soft ink beneath it, the window the *other* one was in when it was taken. `Adam was asleep.` `Eva was on her commute.`
*Lives in:* every page, forever.
*Warm because:* it is a line no same-city couple's book could contain, and it requires nothing from either of them. Every picture Eva takes silently records what Adam's body was doing at that instant. In year two the book is not an album, it is a record of two interleaved lives — assembled entirely by the clock the product was building anyway.
*Complexity:* low. The window engine exists; this is a second read of it. *Note:* stamp at post time and store the result, so a future tzdata change cannot retroactively rewrite their history.

**27 · The sky in the empty half**
The unposted half of a daily spread holds the live sky over that person's city until their photo replaces it.
*Lives in:* the half-pair state — which, with a 6–7 hour gap, is the screen for hours of every single day.
*Warm because:* it answers the PRD's hardest unsolved design requirement (AC-40: anticipation, never absence) with something *true* rather than something reassuring. The empty half is not a placeholder apologising for itself — it is a window onto the light the other person is actually standing in, and the reason their photo isn't there yet. When it arrives, it replaces the sky. *This is a reuse of C2's computation in a second slot, not a new feature.*
*Complexity:* low, **if** the sky gradient is built as a component that takes a city and a time rather than as a cover background. That decision happens before the cover is built.

**28 · Who's holding it**
The date names which of them reads the steps aloud tonight, computed from the window's energy asymmetry.
*Lives in:* every asymmetric window — W1, W5, W8, W9.
*Warm because:* the library's most common shape hands the two of them unequal roles and gives the tired one the job that costs nothing, and the PRD uses that data as a *filter* but never as an *instruction*. Being told that Adam reads this one out removes the small negotiation at the start of everything, at the exact hour one of them has no negotiating left. Under the date vocabulary it reads as hosting, not managing — someone is running the evening, and tonight it isn't you.
*Complexity:* low. `energy_symmetry` is already in `library.json`.

**29 · The gutter is the date line**
On a split day the two facing pages carry two different calendar dates, with the binding between them.
*Lives in:* every spread, for the ~7 hours a day their dates disagree.
*Warm because:* it expresses CTO's dual-date requirement as a property of the object rather than a chip stuck on top of it. The binding is *already* the line between her side and his side; letting it also be the line between Monday and Tuesday costs nothing and makes the split legible without a word of explanation. *A rendering proposal for an existing requirement, not a new feature.*
*Complexity:* low.

**30 · Friday evening there**
The app notices Israeli Friday shutdown and American Sunday evening and states them plainly. `Adam's Friday evening — everything's shut.`
*Lives in:* W8 and Eva's Sunday.
*Warm because:* it is a fact about the other one's world that neither would think to say out loud, because to the person living it, it isn't news. Israeli Friday evening is a real change in the texture of a city — it goes quiet — and it happens in the middle of Eva's working Friday morning. Knowing *why* it's quiet over there is the small fluency couples in one city get for free and long-distance couples never acquire.
*Complexity:* low. Day-of-week plus a local-hour threshold; more copy than engineering.

**31 · The clocks changed**
On the two days a year the gap shifts, the app says so plainly, and says why the windows moved.
*Lives in:* the cover, twice a year, for one day.
*Warm because:* it turns the product's highest-risk correctness area into a small moment of the object being trustworthy. The PRD is explicit that a wrong window in those weeks is confusing in exactly the way that damages trust; a book that announces its own recalibration is one that knows what it is doing. Phrase it without a countdown — *"Six hours apart for the next few weeks — New York's clocks changed"* — no day count, nothing to wait for.
*Complexity:* low. It falls out of the IANA computation the product must do anyway.

---

### E · Things that need no reply

*Ideas 11, 12 and 13 belong here too — they were the strongest in their own section.*

**32 · Leave the book open**
Close the app on a page rather than closing the book; the other one opens to it.
*Lives in:* the handoff between one person's night and the other's morning.
*Warm because:* it is a hand gesture — *look at this* — that carries no message and cannot be answered. Distinct from the two ribbons, which mark where each of them *is*: this is a deliberate placement *for the other one*. Passive versus active, and both should exist.
*Complexity:* low.

**33 · The caption written later**
Captions are never prompted at post time, and can be added days or years afterwards.
*Lives in:* old pages, at any hour.
*Warm because:* it separates the act of posting from the act of saying something, so neither contaminates the other. A photo posted at 23:50 while falling asleep needs no words; the words can arrive in March. And a caption appearing on a page they had both already seen is a free surprise — the page changed, and someone did that on purpose.
*Complexity:* trivial. It is a decision not to build a prompt, plus editable captions.

**34 · Marginalia on the library**
Write in the margin next to a date on the shelf. *"We did this in March. Adam fell asleep."*
*Lives in:* the browse view, second level.
*Warm because:* the 98 dates are finite and fixed on purpose, which means over years they become an annotated copy — the library stops being a catalogue and becomes *their* copy of it, marked up in two colours. Distinct surface from C14, which writes on photo pages. No other product can do this because no other product's content stands still.
*Complexity:* low. The same margin-note component pointed at a second content type.

**35 · Loose leaf**
Write a page and don't bind it in. It exists, in your ink, unbound, until you decide.
*Lives in:* the worst hours — a fight, a bad night, three in the morning.
*Warm because:* it is the opposite of sending. Every other channel they own makes writing and transmitting the same act, which is why the things most worth saying never get written at all. A drawer inside the object — where binding it in *later* is itself the gesture — is the safest surface in the product, and the one place a hard thing can be put down without being aimed at anyone.
*Complexity:* medium. Needs somewhere unbound leaves live that is neither the private door nor a draft list.

---

### F · The unglamorous moments

**36 · Open it anywhere**
Hold the fore-edge and let go: the book opens somewhere. No algorithm, no "memories," no notification, no date logic.
*Lives in:* the bad day, the boring Tuesday, the ninety seconds in a queue.
*Warm because:* it is the only resurfacing mechanic that cannot ambush anyone, because *they* initiated it. C16 (one year ago today) fires on a date and will eventually deliver a photo from a bad month on a bad morning, unasked. This is what people actually do with books they own — open them at random and read a bit. It cannot become an obligation, because not doing it produces nothing. It also pairs with idea 9: once things are tucked behind pages, opening at random occasionally finds one.
*Complexity:* low. It is the riffle with a release, which is already being built.

**37 · The three-in-the-morning state**
A designed state for opening the app in the middle of the night: the dial only, nothing to decide, no date offered, no action.
*Lives in:* 3am in New York, when Adam is mid-morning at work.
*Warm because:* the honest thing the product can do at 3am is show her where he is and ask nothing. The asleep-aware states in the PRD are about not disturbing the *sleeper*; this is about the *waker*, a different person with different needs, and it is not currently specced. Proposing a date at 3am is the app failing to read the room.
*Complexity:* low. A register change on an existing screen, not a new one.

**38 · The resting slip**
When nothing fits the window and nothing is waiting, the slip carries an almanac fact instead of a suggestion.
*Lives in:* the between-windows hours.
*Warm because:* the design direction commits to the slip never being empty, and the fallback of widening filters until *something* qualifies produces a bad suggestion — which is worse than none. A line about when the sun sets in Tel Aviv tonight is ambient, true, and requires nothing. **The book is allowed to have no date to propose; it is not allowed to have nothing to say.**
*Complexity:* low.

**39 · No caption is a complete post**
The caption field is never required, never prompted twice, and its absence is never remarked on anywhere.
*Lives in:* the daily exchange, on the hardest days.
*Warm because:* the most common bad-day interaction with this product will be posting a picture with nothing to say about it, and the product's job in that moment is to accept it without comment. This is a rule, not a feature — but it is the sort of rule quietly violated by a well-meaning "add a caption?" prompt in week six.
*Complexity:* none. A constraint to write into the spec now so it doesn't get built away later.

**40 · Somewhere for the ninety seconds**
The riffle, reframed: its real job is idle time, not navigation.
*Lives in:* the queue, the lift, the platform.
*Warm because:* the design direction justifies the riffle as fast scanning and flags it as cuttable on performance. That undersells it. The riffle is the *only* thing in this product you can do with no intention at all — the equivalent of picking a book off the table and fanning it. It is what makes the app something they touch on days they have nothing to say, which is most days. Worth defending in the performance budget harder than "coarse navigation" justifies.
*Complexity:* already scoped. An argument about priority, not a new build.

---

### G · The object itself

**41 · The back cover**
The private half is entered by closing the book, turning it over, and opening from the back — then re-authenticating.
*Lives in:* deliberate, rare, never accidental.
*Warm because:* it satisfies a security requirement (AC-25: never reachable by a swipe from the main book) with a bookbinding gesture instead of a padlock icon. Turning a book over to open it from the back is deliberate in a way no UI affordance can fake — several distinct physical actions, so it cannot happen by accident on a train. *An expression of C36, not a new feature.*
*Complexity:* medium, and it lands in the Full-tier security surface, so it gets the real review.

**42 · Between Eva and Adam, someone is always awake**
Their schedules interlock so completely that there is almost no hour when both are asleep. State it once, on the title page, and never again.
*Lives in:* the title page. Read once a year at most.
*Warm because:* it is true, specific to them, and the entire thesis of the product in seven words — it reframes the gap as a property rather than a cost. Adam sleeps through Eva's afternoon; Eva sleeps through Adam's morning; the book is never unattended. Said once on a title page it is an inscription. Said anywhere else, or twice, it is a slogan.
*Complexity:* none. It is a sentence.

**43 · The book collects the weather**
Each spread carries the two skies of that day as a hairline; riffling shows two years of seasons passing in two cities.
*Lives in:* every spread, unremarked, forever.
*Warm because:* it is the ambient version of idea 23 and requires nothing from anyone, ever. New York's winter and Israel's are not the same winter, and a book that riffles through both at once shows something neither of them can see from where they are standing.
*Complexity:* low on the solar version; higher if it needs real weather, which would break the offline guarantee. Ship the solar version.

**44 · The delivery is the waking**
Things left while someone slept arrive as their first page on waking — in the order they were left, stamped in the *leaver's* evening rather than the *finder's* morning.
*Lives in:* Adam's 5am, Eva's 6am.
*Warm because:* the timestamps are the tenderness. Seeing `23:40` under something Eva left, on a page opened at `05:10`, is the gap doing the work — he can see she was falling asleep. Stamping it in his time erases the only interesting fact about it. *A refinement of C8's delivery rule, not a new feature* — but the sort of detail that gets implemented as `formatTime(localNow)` unless someone writes it down. It is the same seam idea 1 prints on a date's page, and both should use one rule.
*Complexity:* low, if written down before it is built.

---

## Top ten

| # | Idea | Why it ranks here |
|---|---|---|
| **1** | **1 · Begun** | The vocabulary decision's payoff. A date started by one and joined by the other seven hours later is the only mechanic in this product where the gap is *inside* the thing rather than around it — impossible for a couple in one city, available to these two every single day. It also produces the best artifact in the document: a page with `23:40` in one ink above `05:10` in the other. |
| **2** | **2 · A date can be finished alone** | Ranked second only because it is the rule that makes the first one safe. A begun date nobody joined is the sharpest obligation risk the whole "dates" frame introduces, and this defuses it completely by making the solo date a legitimate first-class thing rather than a failure. If only one idea from Section A survives, it has to be this one — and it has to be written into the spec before idea 1 is built. |
| **3** | **9 · Tucked in** | The best pure leave-to-find object. The only gesture with no delivery guarantee, which is what separates a gift from a message, and it gets strictly better as the book ages — a five-page book has nowhere to hide anything and a five-hundred-page book is full of places. |
| **4** | **27 · The sky in the empty half** | Highest leverage per unit of build in the file. The half-pair is on screen for hours of every day, the PRD flags it as first-class and unsolved, and the answer is a second use of a computation already being built. The only real cost is deciding *now* that the sky is a component rather than a cover background. |
| **5** | **26 · What the other one was doing** | Free, universal, requires nothing from either of them, impossible for a same-city couple. Every photo quietly becomes a record of two lives at once, and in year two it is what makes the book unlike an album. |
| **6** | **3 · The solo first move** | Ranked on unlock rather than charm. It is the content work that makes idea 1 buildable, it is genuinely small (one authored field across 98 records), and it is invisible to the user — which is exactly why it will be dropped from a sprint unless someone names it. |
| **7** | **17 · The index** | The best answer to "what else can the book collect." Alphabetical, so it measures nothing; useful, so it earns its page; and in year two it is an accidental portrait nobody sat down to make. Worthless in month one, which is sequencing, not a demerit. |
| **8** | **36 · Open it anywhere** | The best bad-day-safe idea in the file. User-initiated so it can never ambush, algorithm-free so it can never be wrong, and it is what people genuinely do with books they own. Nearly free, since the riffle is already scoped. |
| **9** | **35 · Loose leaf** | The only surface built for the worst hours. Separating writing from sending is a small structural change that makes the hardest things sayable, and binding it in later is a better gesture than any message. |
| **10** | **20 · The margins fill up** | Ranked on timing, not charm. C14 is already Phase 2, but the *layout reservation* it depends on happens in Phase 1 or the accumulation is never possible. The one idea here that gets more expensive every week it isn't decided. |

**Just outside:** *12 · Dog-ear* (the purest zero-reply gesture, and trivial), *4 · Eva chose this one* (the asymmetric form of `We're doing this`, which the design currently lacks), *7 · The date is a page* (a reframe of C23 the new vocabulary makes almost obligatory), *18 · Errata*, and *30 · Friday evening there*.

---

## The three I would defend in a room

### 1 · Begun — a date one of them starts and the other joins

The brief's thesis is that parts of the gap are structure rather than cost, and calling these things *dates* is what finally makes that buildable. Every other channel Eva and Adam own delivers instantly, which means everything arrives as a message with all of a message's small obligations attached. A date does not arrive; it is *entered*. Eva writes three claims for Two Truths and a Lie at 23:40 in New York and falls asleep. Adam guesses at 05:10 in Israel with his coffee. Neither of them waited for the other, neither stayed up, and both of them went on the same date. That is not a degraded version of playing together — it is a form of playing together a couple sharing a bed cannot have, because for them it would just be one conversation with an awkward pause in it. The artifact is the part I would defend hardest: the date closes into a page carrying both halves and both timestamps, so the seam between her night and his morning is printed in the book. In year two there are two hundred of those pages, and the shape of their particular life is legible in the times alone. Two hard rules, both of which belong in the spec before a line is written: **an open date never shows how long it has been open** — the wait is the shape of the thing and a number on it is a debt — and **an open date never prompts twice.**

### 2 · A date can be finished alone

This ranks second because it is the price of the first, and because the failure it prevents is invisible until it happens. The moment a date can be *begun*, a begun-and-unjoined date exists, and that object is exactly the shape of a debt: something one person made, sitting there, with the other person's name implicitly on it. On a good day it is an invitation. On the day Adam is ill, or they have just had a fight, or work has eaten him alive, it is an accusation nobody wrote — and it is *indistinguishable from the good version*, because the recipient's state decides what it means, not the sender's. The fix is not softer copy or a dismiss button; it is structural, and it is already the product's own logic. D6 says a half-pair of photos is a first-class state, not a completed spread with a hole in it. Apply the same rule: a date nobody joined simply closes, becomes a page with one ink on it, and says nothing whatsoever about being solo. Nothing expired, nothing failed, nothing is owed, and the book gained a page of Eva's evening that is worth having on its own terms. It also legitimises something genuinely lovely rather than merely tolerable — going on the date alone on purpose, reading the chapter, walking the route, and leaving the record for the other one to find later. At this distance, *I did the thing and here is what it was like* is one of the warmest sentences available.

### 3 · Tucked in

The strongest object in the leave-to-find territory, and the one that most repays the book being a book. Anything — a slip, a photo, a line, a begun date — can be tucked behind *any* page anywhere in the book, and is found only by turning to that page, whenever that happens to be. There is no delivery. No notification, no badge, no marker on the fore-edge, and no way for the leaver to know when or whether it was found. Adam turns to a page from March in November and there is something behind it that Eva left in August, and neither of them planned the moment. That unplannedness is the whole value: it is the only interaction in this product that can genuinely surprise, and it is a surprise nobody manufactured. It passes the bad-day test in both directions — leaving one costs nothing and demands nothing, and finding one on a bad day is the best thing that could fall out of a book. It is strictly better in year two, because the book has more places to hide things in, and it turns idea 36 (open it anywhere) into a small lottery. One hard rule, the same as the flagship's: **nothing may ever indicate how long it waited.** The wait is the gift; a number on it converts the whole thing into the arithmetic register D2 closed.

---

## Rejected, and why

*The most useful section in this file. Each of these seemed good, and each fails the bad-day test, smuggles in obligation, or reopens a closed register. The first six are new in revision 2 — they are the ideas the "dates" vocabulary makes tempting.*

**A date with a time on it. Scheduling, in any form.**
The single most dangerous idea the new vocabulary invites, because it is the obvious one. A date at 9pm can be missed, and a missed date is standing someone up — a category of hurt this product does not currently contain and should never acquire. Worse, it lands hardest on their only symmetric day: Saturday already carries 20 of the 24 both-alert entries with no weekday substitute, so putting a bookable slot on the one irreplaceable day is the worst risk-to-reward trade available. **Dates here are prepared, never scheduled** (idea 5). If a time is genuinely needed, it belongs in their calendar app, not in the book.

**"You have an open date waiting."**
A reminder about an unjoined date. The most obligation-shaped notification it is possible to construct: it names a thing one person made, points out that the other hasn't reciprocated, and does it on the app's schedule rather than theirs. Every argument for it ("but he'd want to know") is an argument for the thing sitting quietly on the cover, which it already does.

**A date that expires, or shows its age.** *"Eva began this three days ago."*
Every discovery and hand-off mechanic tempts you to reveal the wait, because the wait is genuinely the most interesting fact about it. Say it and it becomes arithmetic — and arithmetic about how long one of them has not joined something is arithmetic with a victim. Auto-closing is fine and correct (idea 2); *marking* the close is not.

**Who begins more often.**
A scoreboard the instant it is visible, and one that measures effort inside a relationship — the exact thing the non-goals forbid and the exact comparison that surfaces during a fight. Out even as a private statistic, because private statistics become sentences.

**"Date night."**
The phrase, not the concept. It imports four assumptions that are all false for these two: that it is in the evening, that both are free, that it happens weekly, and that it is a single occasion rather than 98 of them across nine windows. Their evening is his 3am. Whatever the Saturday register is called, it cannot be this.

**Rating a date together.**
C25's quiet private thumb is right and feeds the taste re-rank. A *shared* rating is a verdict delivered to the person who chose it, about an evening they proposed. Out.

**Read receipts, in any disguise — including "pressed flat."**
The design direction has a lovely mechanic where an unseen photo sits tucked at 0.6° and settles flat when looked at. Extending it so the *other* person can see it settle is the obvious next move and it is wrong: it converts silence into visible, timestamped silence. *She opened it and said nothing* is a wound that does not exist until a product manufactures the evidence, and once the evidence exists it cannot be unseen on a bad night. Keep the settle as a private detail on the viewer's own device.

**A status — "away," "busy," "I'm ill," "give me a day."**
A status you have to set is an obligation, and forgetting to clear it produces a second, sillier guilt. An unset status on a bad day reads as a choice not to explain. The window engine already knows more about where each of them is than any status they could declare, without anyone declaring anything.

**"The book hasn't been opened in a while."**
A guilt engine with a bookish accent. Any feature whose *trigger condition is absence* is a rebuke however gently phrased, and this one fires hardest in exactly the weeks it would do the most damage.

**Reactions on photos.**
Turns the book into a feed and immediately creates a new absence to notice: the photo that got no reaction. The daily pair *is* the reaction — posting yours is what acknowledges theirs — and a second, lighter acknowledgement layer devalues the first.

**The page that waits for you.**
One of them places a photo on a spread and deliberately leaves the facing page blank for the other. It reads as an invitation on a good day and a debt on a bad one, and it is *indistinguishable between the two by construction*. The sharpest illustration of the principle in this list: an idea can be entirely warm in intent and still fail, because the recipient's state decides what it means.

**Ink that changes with mood.**
Mood tracking with extra steps. A non-goal outright, it puts emotion in the chrome the design direction reserves for content, and it fails mechanically too — the palette has no contrast headroom for tone as a state (`--ink-a` at 70% falls to 3.77:1, below AA, already computed in the design direction).

**A shared list for the visit — "things to do when we're together."**
Every item is a small countdown and the list is a ledger of things not yet possible. D2's closed register wearing a hat.

**A "surprise me" that fires on its own.**
The scheduled version of idea 36. It will eventually surface a photo from a bad month on a bad morning, unasked. The user-initiated version does the same emotional work, costs less, and cannot be badly timed. The same reasoning is worth weighing against C16 (one year ago today) when it comes up in Phase 3.

**Fore-edge painting.**
A hidden image visible only when the pages are fanned — a real bookbinding treasure and entirely on-theme. Rejected on build, not on feeling: it needs an authored image re-rendered whenever the page count changes, which is daily. Worth revisiting only if the book is ever bound into fixed volumes (idea 22), where the page count finally stops moving.

---

## Four things I'd flag upward

**1 · The vocabulary raises the register, and that cuts both ways.** "Date" is the right word and it unlocked the best section of this document. It also means that on a bad day, doing nothing starts to feel like standing someone up — a pressure the product did not previously contain. Two things hold it in check and both are cheap: the five-minute entries must be named as dates too (idea 8), and **a date must always be completable alone** (idea 2). Neither is engineering work; both are decisions that have to be made before the word ships.

**2 · One piece of content work is on the critical path and is invisible.** The flagship needs to know which dates have a genuine solo opening move. Checked against `library.json`: **that field does not exist.** `energy_symmetry` gives `works_asymmetric` 60 / `best_when_one_is_sleepy` 14 / `needs_both_high` 24, and `timezone_friction` is free prose rather than an enum — neither is the same thing, because a date can be asymmetric and still need both people present at once. Someone has to read 98 `how_it_works` fields and author the flag. It is an afternoon of careful reading, it unlocks the best idea in this file, and it is exactly the kind of task that gets dropped because it produces no visible diff.

**3 · Two decisions are cheap now and expensive later.** Reserving margin on the page (idea 20) and building the sky as a component that takes a city rather than as a cover background (idea 27) both cost approximately nothing today and cannot be retrofitted cheaply. Both get decided in Phase 1 whether or not anyone is thinking about these ideas.

**4 · One rule is worth writing into the spec verbatim.** Generalised from idea 39: **the product never remarks on an absence.** Not a missed day, not an unwritten caption, not an unopened book, not an unfound note, not an unjoined date, not an unanswered anything. The PRD has this rule for the day count specifically (D3, AC-14, AC-16). Every idea in the rejected section above violates it in some form — strong evidence that it is the actual load-bearing principle of the whole design, and that it deserves to be stated once as a general law rather than re-derived feature by feature.

---

```json
{
  "status": "complete",
  "ideas_generated": 44,
  "top_3": [
    "Begun — one of them starts a date and takes their half, it stays open, the other joins hours later, and the closed date becomes a page carrying both halves and both timestamps",
    "A date can be finished alone — a date nobody joined is not a failure state: it closes on its own, becomes a page with one ink on it, and says nothing about being solo",
    "Tucked in — anything can be hidden behind any existing page, found only by turning to it, with no notification and no record of the wait"
  ],
  "best_left_for_you_idea": "Begun — a date begun at 23:40 in New York and joined at 05:10 in Israel; the asymmetry becomes the form of the occasion rather than a workaround, and the page it leaves behind prints the seam",
  "best_bad_day_safe_idea": "Open it anywhere — hold the fore-edge and let go; the book opens somewhere, user-initiated so it can never ambush and never becomes an obligation. Its structural companion is 'A date can be finished alone', which is what keeps the entire dates frame bad-day-safe.",
  "deliverable": "/Users/adamks/VibeCoding/evalove/.worktrees/ceo-1-1785631504/docs/04-features/ideation/CREATIVE-TENDERNESS.md"
}
```
