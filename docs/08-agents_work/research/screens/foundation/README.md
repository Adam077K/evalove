# Foundation screens — what each set is, and what it is not

All captures are iPhone size, **393×852, DPR 2**, taken against a local dev
instance. Read this before drawing conclusions from any of them.

## `viewport-*` — the honest renders

True viewport size, no `fullPage` flag. **These are the ones to judge.**

## `after-*` — deleted, and worth knowing why

There used to be a full-page (`fullPage: true`) capture of every surface here:
19 files, 23 MB, more than half the folder.

They were removed because **a full-page capture lies about anything
`position: fixed`.** It paints fixed elements at their viewport offset inside a
document taller than the viewport, so the dock appeared in the middle of the
page, across content it does not cover in reality. Three separate "defects" were
reported against the dock from those images and all three were the same
artifact — one of them cost a full review round to disprove.

Carrying 23 MB of captures already labelled misleading was the worst of both:
the cost of the bytes and the risk of someone trusting them. If a full-page view
is ever needed for a scroll-length question, take one; do not judge chrome from
it.

## The two Tuesday sets — they are not the same test

The Tuesday test is the acceptance criterion in
`docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md` §8: render the
surface with **no photograph on it at all**, because that is an ordinary
afternoon rather than an edge case, and ask whether it is still somewhere worth
being.

### `tuesday-real-*` — the actual test. Judge against these.

Rendered with the fixtures genuinely emptied: no photograph posted for the day,
no book cover, nothing sealed. Every empty state is the component's own real
branch. Verified programmatically — **zero `<img>` elements on the page**.

The fixture edits that produced these were temporary and are not committed. To
reproduce: set `evaPosted`/`adamPosted` false for `FIXTURE_TODAY` in
`lib/fixtures/book.ts`, make `leftFor()` return `[]`, and null the book cover
lookup in `app/(app)/home/page.tsx`.

### `tuesday-*` — a pessimistic approximation. Do not judge against these.

Produced by removing every `<img>` from the DOM after render. That is **harsher
than the truth**: stripping the image leaves the photo container behind rather
than triggering the component's empty branch, so Adam's Today slot shows as a
bare box instead of the well-and-`+` it actually renders, and the book shows
nothing instead of its coverless state.

They are kept because they were the first evidence that the coverless book tile
was compositing a dark gradient over a `well` — a real bug, now fixed — and
because a pessimistic render is worth more than an optimistic one as long as
everyone knows which it is.

## `before-*` — the v6 build these replace

Copied from the renders committed at `04c538d`, the aurora build. Same app, same
seven surfaces, previous design system.
