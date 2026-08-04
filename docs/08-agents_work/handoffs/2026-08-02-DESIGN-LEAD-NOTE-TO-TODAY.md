---
date: 2026-08-02
from: design-lead (session design-foundation, branch feat/design-foundation)
to: whoever composes Today and The Book
status: advisory — neither of these is a defect in the foundation, and
        neither is mine to decide
---

# Rules that came out of review, and two things the foundation could not fix

## 0. Two rules to inherit

Both were established by review rather than by design, which is why they are
written down: each one cost a round to discover and neither is recoverable from
reading the tokens.

### The authorship mark attaches to artefacts, never to intentions

> **The mark attaches to a thing that exists and that someone made. Never to a
> turn, a state, an intention, or a slot. It answers *who left this*, not *who
> is this about*.**

The first pass spent the two inks on a clock card, an empty photo slot, a
prepared plate, a presence dot, the login chooser and a whose-turn chip. Six
places, none of them made by anybody, every one individually defensible. That
is the whole mechanism by which "two hairlines of colour" turns into
colour-coded UI — not one bad decision, but six reasonable ones in a row.

The last of those, a pending turn in an authored back-and-forth, was the
strongest case for an exception that exists in this product. It was removed for
exactly that reason: accept the strongest case and every element *about* a
person becomes eligible.

### The clock is a stamp. Type size is a claim, and it counts.

Asked directly, on review: the clock rail was built at masthead scale, and
`PRODUCT-VISION-V2.md` §3.1 cut The Gap as a surface because *"a clock is
correct on day one and on day four hundred, and correctness gives nobody a
reason to return."* Had we deleted the room and then rebuilt it at the top of
the first screen?

**Yes, and it has been corrected.** The tempting defence is that a clock you
pass on the way somewhere is categorically different from a clock you navigate
to — no destination, no back button, nobody ever *chooses* it. That argument is
true and it is not sufficient, because it only addresses placement. The vision's
objection was never about routing. It was that correctness is a poor reason to
return, and **type size is a claim about importance that does not care whether
there is a back button.** At 59px the largest object in the product was the one
thing guaranteed to look identical in a year.

The test that settles it: *of the things on this screen, which one is different
from yesterday?* Whatever answers that gets the large end. Here it is the live
window sentence — computed from `lib/shared-day`, changing four or five times a
day, the sentence the whole product is organised around. So the sentence took
47px and the hours dropped to 38px underneath it, as its evidence.

What survives from the first version is the part that was actually good, and it
was never the size: the rail structure. Two full-width rows on hairline rules
with no cards, which removed two cards and a 50/50 from the column, and let the
hours sit directly on the paper.

**Inherit the rule, not the layout:** on any surface, the large end of the scale
belongs to what changed, and supporting facts stay small however identifying
they are. The two clocks are the most identifying thing in this product and they
still do not get to be the biggest.

### A measurement can prove the wrong thing

The photo scrims were defended with a contrast measurement — worst case 6.24:1
over a hypothetical white photograph, reported as a guarantee. The number was
correct. It was also answering a different question than the one that mattered:
**it proved the type was legible, it did not prove the law was kept.** §1 does
not say photographs may be washed as long as the caption passes AA; it says
photographs are never washed.

Watch for this shape generally — an easy-to-compute metric standing in for a
hard-to-compute property, and passing. The metric will keep passing right up
until someone looks at the screen.

---

## 0b. The last 50/50, and the one way out that was tried

Home has one 50/50 pair left: the two Today slots, one per person. On a true
Tuesday, when neither has posted, it is the most prominent object on the card —
two identical rectangles, exactly the templated shape argued against everywhere
else in this note.

**Why it is still there:** the only axis available is *person*, and ranking
people is forbidden — not by taste, but because the product must never render
one partner larger than the other.

**The proposal, which is better than the constraint it questions:** make the
asymmetry track **state, not person**. The empty slot and the filled slot are
not the same kind of object — one is an invitation, one is a photograph. Size
them differently by *that*, and the shape is unequal without anyone being
ranked. Better still, it would swap sides on its own as the day fills, so
neither person is structurally favoured; the layout would just report what has
happened. A pair that is equal only when the states are equal is a genuinely
different thing from a pair that is always equal because nobody found a second
axis.

**It was tried on paper and it fails on this specific pair. Here is why, because
the reason is not obvious and it will recur.**

Both directions were checked:

- *Filled side larger* — the photograph has something to show, and §6 of the
  direction explicitly gives photographs scale and air.
- *Empty side larger* — the invitation is the call to action, and an empty
  screen is supposed to be an invitation to act.

The second fails immediately on a hard rule: **no guilt, nothing that makes a
missed day feel like failure.** Showing Eva a large empty rectangle where her
photograph should be, beside a small version of Adam's, is that rule broken.

The first fails less obviously, and this is the part worth inheriting.
**The state is not independent of the person. It is a function of the
timezone gap.** Adam is in `Asia/Jerusalem`, Eva in `America/New_York` — he is
seven hours ahead, so his day begins seven hours before hers. For the whole
first stretch of any shared day, *only Adam can have posted*. And that stretch
is not an edge case: `library.json`'s w1, the largest overlap window in their
week, is named in `lib/fixtures/members.ts:58` as **"Eva's in bed, Adam's
awake."**

So "filled side larger" means: during the single most-used window in the
product, on Eva's phone, Adam is rendered bigger than her. Every day. By
geography.

That is the failure mode §8.3 of the direction warns about in its own words —
the product drifting to fit him exactly and approximate her, invisibly, because
from inside it only ever feels better. A state-tracking asymmetry launders a
person-ranking through the back door whenever the state correlates with a
person, and here it correlates almost perfectly.

**What survives, and it is the useful half:** the axis is sound. It fails here
because of a condition that is checkable, so check it rather than discarding the
idea —

> Before making a layout asymmetry track state, ask whether that state is
> independent of *which person*. If the seven-hour gap predicts it, it is a
> person-ranking wearing a state's clothes.

**And one residual idea that escapes the trap, untested.** The asymmetry does
not have to be *size*. Two slots can differ in **shape at equal visual weight** —
the filled one keeping its 4:5 portrait, the empty one becoming a wider, shorter
field. Neither is bigger; they are different kinds of object, which is the true
thing being expressed. Nothing is ranked because nothing is larger, so the
geography problem never arises. I have not built or rendered it and I am not
confident it composes — flagging it as the most promising unexplored direction,
not as a recommendation.

---

## Two things the foundation could not fix

Both were found by screenshotting the foundation at 393×852. Neither is a
token problem, which is why neither is fixed on `feat/design-foundation`.
They are composition decisions and they belong to the surface, not the
system. Inherit the reasoning rather than rediscovering the problem.

---

## 1. The fixed dock occludes content at every scroll offset but the last

### What is actually true

The end-of-scroll case is already correct and was correct before I arrived.
At maximum scroll on Home, measured live:

```
scrollY 337 = maxScroll 337
dock pill top 770        main content bottom 852
main padding-bottom 144px      html scroll-padding-bottom 96px
text elements under the dock: []          ← zero
```

`app/(app)/layout.tsx` reserves the dock's footprint plus 4rem, and
`app/layout.tsx` sets `scroll-padding-bottom` so the guarantee holds at
every scroll the browser performs, not only at the end. Read the comments
in both files before touching either — they explain why both are needed
and why one is not enough.

**What is left is the ordinary condition:** a fixed dock covers roughly
82px of the viewport bottom at every offset except the last. On Home that
lands mid-card often enough that a reviewer read it as three separate
defects. It is not a defect. It is what a fixed dock does.

### The options, and what each costs

| Option | Cost | Benefit |
|---|---|---|
| **Leave it fixed and floating** | ~82px occluded mid-scroll | Zero complexity. Navigation always one thumb away. Now legible as *floating* thanks to `--e-float`. |
| **Hide on scroll down, reveal on scroll up** | A scroll listener and a transform on the most-repeated surface in the product. Thrashes on short pages. The dock is sometimes absent exactly when reached for. | Content unoccluded while reading. |
| **Edge-docked opaque bar** — full width, glued to the bottom | Throws away the detached-pill idea, which is one of the founder's own reference contributions (`24199150…`, the events app: "the floating dock as a detached pill rather than a bar glued to the bottom edge"). | Content ends cleanly against a bar instead of sliding under a hovering object. |
| **Inline nav at the end of the column** | Navigation requires scrolling to the bottom. | Nothing is ever occluded. |

### What I would choose, and why

**Leave it.** Two reasons, and the second is the one that matters.

Hide-on-scroll fails the 11pm test. Eva reads this in bed, tired, one
thumb, in the largest overlap window in their week. A dock that hides is a
dock she has to fish for, and it adds motion to the surface she sees most
often — against an app whose own springs are deliberately stiff and
restrained. The behaviour that feels responsive at 5am to the alert one is
friction at 11pm to the exhausted one.

Inline nav is disqualified outright: this is a product you open to check
one thing, and burying navigation at the bottom of a scroll taxes exactly
that.

The edge-docked bar is the only real alternative and it is a fair call, but
it solves a problem that mostly looked like a problem because the dock did
not read as floating. That is now fixed at the token level.

**The genuine fix is compositional, and it is finding #2:** don't put
content that matters in the bottom 82px band at the offsets people rest at.
That is a layout decision on Today, which is the whole point of this note.

---

## 2. Home is five stacked rounded rectangles, and no radius value fixes it

I brought the radius scale down one step (28/36 → 20/28) and I stand by it —
paper does not have a 36px corner. But I want to be honest about what that
change did: **it removed a signal. It did not add a structure.**

Look at Home with the gradients gone. Header, a 2-up clock pair, the Today
card, the sealed card, the activity card, a 2-up tile pair. Five full-width
elements at the same width, the same radius, the same elevation, the same
vertical rhythm. That is a list of cards, not a composition. Softening the
corners by 8px does not change the fact that the eye finds a rhythm on the
second element and stops reading.

### Why the founder's own reference does not have this problem

SORDJATI (`8d075fd5…`) works precisely because it **refuses the column**:

- a masthead set edge to edge, larger than anything else will ever be
- then a photo pair at deliberately **unequal** weights — one tall block
  carrying white text overlaid, one wide one taking a caption below it
- then a two-line headline at a different measure entirely
- then a small pill label beside a circular arrow button

Nothing is the same width as the thing above it. There is no rhythm to
settle into, so the eye keeps moving. That is the whole trick, and it costs
nothing but the willingness to let elements differ.

### Concrete things to try on Today

- **Let one element go full-bleed.** The column is `max-w-md px-5`. A photo
  that breaks out to the viewport edge, once per screen, does more for the
  page than any amount of corner tuning.
- **Make the pair unequal.** Two 50/50 tiles is the most templated shape in
  the system, and Home currently has it twice.
- **Use `type-masthead` once per surface.** It exists, it is 59px on a
  phone, and the login door is currently its only user. The extreme scale
  contrast that §4 asks for only exists if something actually takes the
  large end.
- **Let type sit directly on paper.** A card means "this is a discrete
  object you can act on." If everything is a card, nothing is. The warm
  canvas was chosen so that ink can live on it unhoused — use that.
- **Vary the vertical rhythm.** Equal gaps between unequal things is what
  makes a page read as generated.

None of this needs a new token. The foundation already carries a masthead
size, two paper stocks, a float shadow and an authorship edge that all
survive being composed unevenly. They were built expecting it.
