---
date: 2026-08-03
from: ceo (session ceo-3-1785631504)
to: Adam — this one is not delegable
status: OPEN — awaiting Eva's answers, verbatim
blocks: nothing today; revises everything downstream
source: P4 — the deleter, FATAL 3, withdrawal condition 1
---

# Five questions for Eva

## Why this file exists

P4 grepped the entire `docs/` tree and `.claude/memory/` for any trace of
Eva-sourced input — anything she said, asked for, rejected, or was interviewed
about — and found **zero results**. `USER-INSIGHTS.md`'s source log has two rows
and both of them are Adam.

Every persona in this project, including the five that argued with each other,
is downstream of one person's account of what the other one feels. The nine time
windows are described as being "in the couple's own language." They are in *one*
member of the couple's language.

P4 called this the cheapest of the three fatal flaws to fix and the most
expensive to leave, and stated the withdrawal condition precisely:

> **Eva answers five questions in her own words, verbatim, transcribed into the
> repo, before another surface is designed.** Not paraphrased by Adam. Her
> sentences, with her name on them. If her answers match the nine windows and
> the three surfaces, I lose this attack outright and the product is on much
> firmer ground than I claimed.

The founder has chosen to build in parallel rather than hold the wave. That is a
reasonable call and it does not retire the item — it means anything her answers
contradict gets **revised rather than rebuilt**, which is only true while the
surfaces are young. The value of this file decays fast.

## How to run it

- **Her words, typed as she says them.** Not cleaned up, not summarised, not
  reordered. Half-sentences and "I don't know" are data.
- **Don't defend the app.** If she says something that contradicts the vision,
  that is the single most valuable output this file can produce. Write it down
  and do not argue with it in the transcript.
- **Don't ask them all at once**, and don't ask them as a survey. They are
  designed to be askable over a normal call.
- **Don't tell her what each one is testing.** The annotations below are for the
  repo, not for her.

---

## The questions

### 1. Think about an ordinary weekday — not a bad one, not a special one. When in that day do you most notice Adam isn't there? What are you doing when it happens?

> *(Eva's answer, verbatim:)*

<!-- Tests: the nine time windows and w1's status as "the biggest window you
have." The entire window taxonomy is Adam's reading of her day. If her answer
names a different hour, or names an activity rather than an hour, the windows
are wrong and several design decisions rest on them. -->

### 2. When you wake up and there's something from Adam waiting, what makes the difference between one that lands well and one that doesn't? Can you think of a real example of each?

> *(Eva's answer, verbatim:)*

<!-- Tests: the core mechanic — "one true, unperformed thing, already there,
owing no reply." P1 and P4 independently drew this object, but both are
downstream of Adam. If what actually lands for her is effort rather than
ordinariness, the central design principle inverts. -->

### 3. When you haven't answered him for a while — a few hours, a day — what's actually going on for you? Does it sit with you, or not really?

> *(Eva's answer, verbatim:)*

<!-- Tests: the no-guilt rule and the ban on seen/delivered status. Both are
locked as hard rules with the same status as the privacy rules. If this doesn't
weigh on her, part of the design is solving a problem she doesn't have; if it
weighs heavily, the rules are right — but possibly for reasons nobody has
written down yet. -->

### 4. Is there anything from the last couple of years with Adam — photos, voice notes, screenshots, anything — you'd be upset to lose? Where does it live now? Have you ever gone back and looked at it?

> *(Eva's answer, verbatim:)*

<!-- Tests: the entire Book thesis, and P4's sharpest unanswered question —
whether an archive is ever actually revisited or merely valued in the abstract.
"Where does it live now" also tests whether the ownership and export problem
(vision §6) is felt or theoretical. The third clause is the one that matters;
don't drop it. -->

### 5. If Adam built something for the two of you and you found yourself not opening it, what would the reason most likely be? Say the real one.

> *(Eva's answer, verbatim:)*

<!-- Tests: FATAL 1 (the open never happens — a quiet failure where Instagram
wins and nothing bad ever occurs) and FATAL 4 (the asymmetry ledger: a large
unilateral build becomes a timestamped record of unequal effort). This is the
question most likely to falsify the whole vision, which is why it is asked last
and why it asks for the real reason rather than a kind one. -->

---

## What to do with the answers

1. Paste them above, verbatim, and commit.
2. Add her rows to `.claude/memory/USER-INSIGHTS.md`'s source log — CMO and CPO
   are the only authorised writers of that file.
3. Route contradictions to CPO. Anything her answers contradict in
   `PRODUCT-VISION-V2.md` gets an argued revision, not a silent edit.
4. If her answers broadly match the windows and the two surfaces, record that
   too — P4 said explicitly that this outcome retires the attack, and a
   surviving assumption is worth as much as a falsified one.
