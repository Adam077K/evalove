---
date: 2026-08-10
author: design-lead
branch: design/board-decomposition
parent: design/board-port-probe
subject: Porting design-H to React — the staged decomposition, and where it lands
status: decision document, nothing implemented
---

# The board port

`apps/web/public/design-H.html` is 2415 lines, self-contained, and the founder
likes it. This document says how to build it in React, in what order, and which
routes it replaces. It does not relitigate orientation — that was settled by the
probe on this branch's parent and is quoted, not re-derived.

Two deliverables: **A**, six tasks in dependency order; **B**, the route decision.
Then the things that cannot be ported, the places the brief is wrong, and the
things nobody has checked.

---

## 0 · Three findings that set every task boundary

Read these first. Each one changes what a task is allowed to be.

### 0.1 · design-H has no layout. It has 2400 lines of hand-placed coordinates.

Every object on the table is absolutely positioned with a tuned `left`/`top`, a
tuned `width`, and a tuned `data-rot`:

```
<div class="obj print pickup" data-rot="-3.4" data-photo="p6"
     style="left:60px;top:236px;width:250px">
```

The world is `950 × 2860` px, fixed, declared in CSS at `#surface` and again in
JS at `var W = 950, H = 2860`. The day-stacks come from a literal array of twelve
positions:

```
var STACK_AT = [ [470,70],[588,58],[700,88],[812,66], ... ];   // twelve pairs
DAYS.forEach(function(day, i){ var at = STACK_AT[i]; if (!at) return; ... });
```

**The thirteenth day is silently dropped.** Not truncated with a message —
`return`. Eva and Adam are on day twelve of a library that grows every week.

So the port's real work is not "convert the markup". It is: **invent the
placement rule design-H never had, and make it produce something as composed as
the mock's hand-tuning.** That is T2, it is the load-bearing task, and the CEO's
brief does not name it.

The good news: the rule already has a home. `components/book/compose.ts` exposes
`seeded(id)`, `seededIn(id, min, max)` and `seededPick(id, options)` — deterministic
per-photograph pseudo-randomness seeded off the database id, already used to
decide mounts and tape corners for The Book, already under test. The board's
placement is the same idea on a bigger surface. Extend it; do not write a second
PRNG.

### 0.2 · A third to a half of the board is bare wood, and that is the design.

Visible at 393×852 in `docs/08-agents_work/probes/shots/PROBE-0-table-as-approved.png`:
the top of the screen is a torn date scrap, then two photographs, and then roughly
the bottom third is walnut with nothing on it at all.

design-H fills its table because it has eight loose photographs, a voice note, two
paper scraps, a hardback book, an illustration, a clock card, an invitation and a
song card all laid out at once. **Six of those cannot ship** (see "What cannot be
ported yet"). An ordinary day — Eva sends one, Adam sends one — puts two
photographs on a 950×2860 table.

This is not a bug to fill. Bare wood between objects is what makes it read as a
table rather than a grid, and it is the single thing that distinguishes it from
the four rejected directions. But it means T2 has an explicit requirement that
sounds strange written down: **the placement rule must decide where the emptiness
goes.** A rule that only decides where objects go will cluster them at the top
left and leave 1800px of dead wood below, which is not composition, it is a short
page with a long scroll.

Consequence for T2: the world's *height* must be derived from the content, not
fixed at 2860. Its *width* stays 950 — that is the pan budget the mock was tuned
against (2.4× a 393px screen).

### 0.3 · design-H's own CSS is the photo-treatment law, written out.

The port does not need to re-derive the rule that the app may never treat a
photograph. design-H encodes it three times, with reasoning, at
`apps/web/public/design-H.html`:

- line 217, `.print` — the mount's paper tooth comes from `background-blend-mode`
  on the *mount's own two background layers*, because "a child always paints above
  its parent's background. mix-blend-mode could [reach the photograph], so it is
  not used here."
- line 259, `.tape` — "real washi is slightly translucent. It is not allowed to be
  here, because a translucent thing lying on a print tints the print. The tape is
  opaque and earns its depth from its own shadow instead."
- line 1044, `#hint` — "opaque, and no backdrop-filter. This pill can pass over a
  print on its way past, and a blur that samples the pixels under it would be
  treating the photograph."

Every `filter:` in the file is `drop-shadow` (which paints outside the alpha
channel and touches no pixel of the image) or the literal `filter:none` written
onto every `img`.

One thing to watch, because a React tree loses it easily: `.grain`
(`z-index:2`, `mix-blend-mode:overlay`, `top:1150px`) is the night falling on the
table. Objects are `z-index:10` and up, so the grain paints **under** every
photograph. Move it above one and it becomes an overlay blend on a photograph —
a treatment, illegal, and invisible in a diff. This is a trap-test candidate:
assert the grain's computed z-index is below the lowest object's, then mutate the
grain to `z-index:99` and watch the assertion go red before you keep it.

---

## Deliverable A — the staged decomposition

Six tasks. T1 and T2 can overlap once T1's coordinate types land; everything after
is a chain.

```
T1 the ground ──┬─► T2 the placement ──► T3 the board reads the database ──┬─► T4 the deck
                │                                                          ├─► T5 the days
                └──────────────────────────────────────────────────────────┴─► T6 the night end
```

---

### T1 · The ground: a table you can move on, with nothing real on it

**Goal.** The pannable, zoomable, pick-things-up surface, ported exactly, still
carrying design-H's hard-coded objects. No database, no placement rule. The point
of stopping here is that it is the only task whose success criterion is
"indistinguishable from the mock" — every later task changes what is on the table,
so this is the last moment the comparison is honest.

**Files to create**

```
apps/web/components/board/Table.tsx           viewport / surface / world, the three nested boxes
apps/web/components/board/usePanZoom.ts       Draggable pan, pinch, double-tap-to-fit, bounds
apps/web/components/board/usePickup.ts        pick up, tilt toward level, elastic drop
apps/web/components/board/objects/Print.tsx   photograph on a paper mount with a chin
apps/web/components/board/objects/Bare.tsx    photograph with no mount
apps/web/components/board/objects/Scrap.tsx   torn paper (torn-b / torn-tb clip paths)
apps/web/components/board/objects/Furniture.tsx  tape, pin, pressed sticker, handwritten label
apps/web/components/board/board.css           or Tailwind equivalents; the clip-path polygons are verbatim
apps/web/app/(app)/review/board/page.tsx      dev-only viewing surface, `export const dynamic = "force-dynamic"`
```

**Files to touch.** `apps/web/package.json` — add `gsap@^3.13.0`. Nothing else.

**Success criteria**

1. `/review/board` at 393×852 is visually indistinguishable from design-H at the
   same pan offset, checked by looking at both images, not by reading a diff.
2. Pan bounds respect the *measured* bottom chrome, rebased off the viewport's own
   rect — design-H line 1528 documents the exact bug: inside a frame,
   `getBoundingClientRect().top` is measured from the browser window, not the
   glass, and the pan floor is wrong by however far down the page the frame sits.
3. `prefers-reduced-motion` kills every tween (design-H's `REDUCED` branch is in
   ten places; all ten port).
4. No `filter` on any `img` except `none`. No `mix-blend-mode` or
   `backdrop-filter` anywhere above `z-index:10`.
5. A test asserts the grain paints below the lowest object, and that test has been
   watched to fail against a mutated z-index.
6. `pnpm build`, then `pnpm test`, then `pnpm typecheck` — in that order, numbers
   reported.

**Risk tier.** Lite — isolated, no API, no DB, no auth. One caveat that is not a
tier bump but wants one sentence in the PR: GSAP 3.13 including Draggable is free
for commercial use under GreenSock's standard licence, and a private two-person
app is comfortably inside any reading of it. Say so once in the PR body so nobody
has to re-establish it later.

**Worker.** `frontend-engineer`.

---

### T2 · The placement: where a photograph lands on the wood

**Goal.** A pure module, no React, no DOM. In: the day's photographs and the
archive's days. Out: for each object, a position, rotation, width, mount kind, and
its attendant furniture — plus the world's derived height.

This is the task that replaces 2400 lines of hand-tuning, and it is the one most
likely to produce something that looks like an algorithm ran. Two rules from the
mock keep it honest:

- **Loose on the wood is for today; every other day is a stack.** design-H puts
  eight photographs loose and eleven days in piles. 24 July has nineteen
  photographs in the mock's own library and not one of them is loose. So: today's
  photographs go on the wood, bounded (five is the mock's practical ceiling);
  every prior day is one pile whose thickness is `min(9, 1 + round((n-1) * 0.42))`
  — the mock's line, and its comment is the law: *thickness, not a number*.
- **Furniture attaches to objects, never to coordinates.** Every piece of tape,
  every pin, every pressed sticker in design-H sits at a hand-tuned offset from
  the photograph it holds down. In the port it must be a function of the object's
  own box, seeded off the object's id, or the first photograph that lands somewhere
  new will have its tape floating in mid-air.

**Files to create**

```
apps/web/components/board/place.ts             the rule
apps/web/components/board/__tests__/place.test.ts
```

**Files to touch.** `apps/web/components/book/compose.ts` — extend, do not fork.
`seeded`/`seededIn`/`seededPick` are already there and already tested.

**Success criteria**

1. Handles 0, 1, 2, 5, 19 and 46 photographs without overlap and without leaving
   any object outside the 950px width.
2. Handles an all-landscape day (31 July, three photographs) and an all-portrait
   day without either producing a visibly different density.
3. Deterministic: the same photograph ids produce the same board across renders,
   reloads and server/client boundaries. Composition never re-rolls.
4. The world's height is derived and shrinks when there is less on the table.
5. **The emptiness is decided, not left over.** The rule states where the bare
   wood is; a snapshot at 393×852 of a two-photograph day shows a composed corner
   and open wood, not two prints stranded at the top of a 2860px table.
6. The no-overlap assertion has been watched to fail: force two prints onto the
   same coordinates, see red, restore.

**Risk tier.** Lite — pure module, no route, no data.

**Worker.** `frontend-engineer`.

---

### T3 · The board reads the database, and becomes `/today`

**Goal.** Hard-coded objects out, real photographs in. `/today` renders the board.
The tome becomes the door to `/book`; the invitation becomes the door to `/dates`
(see Deliverable B — the board does not carry copies of either).

**Files to create**

```
apps/web/components/board/Board.tsx      composes place.ts output into T1's primitives
apps/web/lib/data/board.ts               one read: today's photographs + the archive's days
apps/web/lib/data/__tests__/board.test.ts
```

**Files to touch**

```
apps/web/app/(app)/today/page.tsx        replaced; keeps `liveTodayObject`, drops the paper column
apps/web/app/(app)/layout.tsx            only if the Band's height needs to be readable by the board
```

Do not touch `apps/web/middleware.ts` or `apps/web/next.config.ts` under any
circumstance.

**Success criteria**

1. `export const dynamic = "force-dynamic"` on `/today`, and a check that proves
   it: a live Supabase read does **not** make a route dynamic — supabase-js issues
   an ordinary `fetch` that Next is free to cache, which is exactly how `/book`
   came within one merge of shipping frozen at deploy-day contents.
2. The photographs render with `naturalWidth > 0`. Every screen judged before
   8 August had 401s where the photographs go; a board of empty mounts looks
   plausible in a screenshot.
3. An unsigned photograph (`author_member_id` null) renders with no byline and no
   invented one. `authorshipOf` in `compose.ts` forces the branch; use it.
4. Thirteen days do not drop the thirteenth. Forty days do not drop the fortieth.
5. Zero photographs — day one, a genuinely empty archive — is a clear table, not a
   container waiting to be filled. No copy, no dashed rectangle, no promise.
6. Screenshots at 393×852 of: a two-photograph day, a nineteen-photograph day, and
   an empty archive. Looked at, not described.

**Risk tier.** **Full.** It replaces the route both of them land on, it changes the
shape of a database read, and the diff will clear 300 lines. Pipeline: code-reviewer
plus qa-engineer plus semgrep plus security-engineer plus craft-reviewer plus the
Codex CLI second opinion.

**Worker.** `frontend-engineer`, with `backend-engineer` for `lib/data/board.ts` if
the read wants its own pass.

---

### T4 · The deck: reading one photograph, and the first caller `DELETE` has ever had

**Goal.** Tap a loose photograph, the deck comes up: the recent run of photographs
across days, opened at the one you tapped, swipeable, and each print turns over to
show what was said about it, when, and by whom.

Three things in the mock's deck have no data behind them and must be decided here:

- **`place` does not exist.** The deck's front reads `Lisbon · 6 August 2026`.
  There is no place column on `photos`, and there never can be by accident — EXIF
  and GPS are stripped twice, on the device and again server-side. The mock
  already falls back: four of its eight cards use the date as the place
  ("2 August", "30 July"). **Recommendation: ship the fallback as the only
  behaviour.** The front carries the date. If the founder wants places, that is a
  nullable text column somebody types into, and it is a separate ticket.
- **`said` is `photos.caption`**, set once at upload and immutable. There is no
  update path and this task does not build one.
- **`by` must handle null.** The mock has no unsigned state. `authorshipOf`
  provides the branch and refuses to let a render site fall through to "must be
  Adam".

The back of the card is where **`DELETE /api/photos/[id]`** gets its first UI
caller in the app's life. The route is written, tested and correct; wire it, do
not rebuild it. Its own header sets the copy constraints: the removal is a soft
delete, bytes are retained indefinitely, and **the UI must not promise propagation
or a deletion window** — there is nothing to propagate and no destruction coming.

**Files to create**

```
apps/web/components/board/Deck.tsx
apps/web/components/board/DeckCard.tsx        front, back, the flip
apps/web/components/board/useDeck.ts          swipe, throw, fling thresholds (THROW 84 / FLING 620)
apps/web/components/board/__tests__/deck.test.tsx
```

**Files to touch.** `apps/web/components/board/Board.tsx` — the tap handler.

**Success criteria**

1. A dealt card travels to `x:-520` and stops being there. It never crosses the
   card beneath it at partial opacity — design-H line 1775 is explicit about why,
   and the finding behind it is in the memory: five fades over photographs, each
   illegal only mid-flight.
2. Delete removes the photograph from the board and from the deck without a reload,
   and the copy claims nothing about bytes.
3. The unsigned case renders. There is a test for it that has been watched to fail.
4. Keyboard: left, right, Enter to turn, Escape to close. The mock has all four.
5. A mid-gesture screenshot, not only a settled one. The `preserve-3d` ghost only
   shows up mid-flight.

**Risk tier.** **Full** — it wires a mutation route for the first time.

**Worker.** `frontend-engineer`.

---

### T5 · The days: the piles, one day opened, and the whole roll

**Goal.** The day-stacks on the board open a day; a proof sheet lying on the table
opens every day at once. This is `/book/days`' job, done on the table.

**Reached how.** A client overlay over a frozen board, with no server round trip.
Not an intercepted route and not a search param that the server re-renders on:
`/today` is `force-dynamic`, so a `?day=` that the server reads means a full
round trip on every tap of every pile, on a phone, on a mobile network. Dates
needs to be able to link to a day's page ("Its page" in the mock's past-dates
list) — so `/today?day=20260803` is read **once on mount, client-side**, and never
again. One server render on arrival, none afterwards.

**Files to create**

```
apps/web/components/board/objects/Stack.tsx
apps/web/components/board/DayOverlay.tsx
apps/web/components/board/ContactSheet.tsx
apps/web/components/board/__tests__/day-overlay.test.tsx
```

**Files to touch.** `apps/web/components/board/Board.tsx`;
`apps/web/components/dates/BetweenThem.tsx` for the link into a day.

**Success criteria**

1. A day of nineteen photographs scrolls at 393×852 without a jank spike, with
   `loading="lazy"` below the fold.
2. The pile's thickness reflects the day's size and **no number is rendered
   visibly.** See "the count question" below.
3. A landscape-only day and a portrait-only day both fill the grid; neither
   produces a column of letterboxes.
4. Escape closes; focus returns to the pile that was tapped.
5. Opening a day and closing it restores the board's pan and zoom exactly
   (design-H's `freeze`/`thaw`).

**The count question, for the founder.** design-H renders `2026 · 19 photographs`
in the day header and speaks the same count in every `aria-label`. The shipped app's
law is no counters, and `/book`'s own header comment says "No count on this page".
These contradict. **Recommendation: keep the count in the `aria-label`** — a screen
reader has no other way to know how much is there — **and drop the visible line.**
The pile's thickness already says it, which is the mock's own stated principle:
*thickness, not a number*. This is a one-sentence ruling from the founder, not a
blocker; build it dropped and it is one line to restore.

**Risk tier.** Lite.

**Worker.** `frontend-engineer`.

---

### T6 · The night end: the illustration, the two clocks, the invitation

**Goal.** The bottom half of the table — everything below y≈1400 in the mock. The
Art Deco couple at the window, the clock card with its 24-hour band showing when
Eva and Adam are both free, and the invitation card that is the door to `/dates`.

**What shrinks.** The mock's night end runs from y=1440 to y=2860, and two of its
four objects cannot ship: the song card and the voice note. So the night end loses
roughly 700px of its 1400. T2's derived height absorbs that; do not pad it back
with decoration.

**What is already real.** The clock band is not a drawing —
`lib/shared-day/` computes the windows from two real clocks across four DST
transitions and has golden tests. It is marked untouchable and it is the one part
of the night end that needs no new data. The invitation is real too: `feat/dates`
merged propose-to-agree-to-a-page with a `date_plans` migration.

**One live bug this task will sit on top of.** There are two different taxonomies
both keyed `w1`–`w9`, and the code treats them as one set. `w4` is labelled
"Eva's lunch break" and is her 08:00. `w7` is "Saturday — Eva and Adam both off",
a weekday name on a time band. The bands are computed correctly; the strings are
prose that no longer describes reality. The clock card will render the same wrong
label the shipped `/dates` renders. It is a correctness fix wearing a copy hat and
it needs the founder's sign-off because it is his product's voice. Do not let this
task quietly fix it — flag it, land the board, fix the strings on their own ticket.

**Files to create**

```
apps/web/components/board/objects/CoupleAtTheWindow.tsx
apps/web/components/board/objects/Clocks.tsx        wraps the existing band SVG
apps/web/components/board/objects/Invitation.tsx    door to /dates
```

**Files to touch.** `apps/web/components/board/Board.tsx`;
`apps/web/components/board/place.ts` — the night region's own placement.

**Success criteria**

1. The clock band's free-together hours are read from `lib/shared-day`, never
   hard-coded, and are correct across a DST boundary.
2. The invitation reflects the real state of `date_plans` — asked, agreed, or
   absent — and when the migration has not been applied the card is absent rather
   than showing a fixture.
3. The illustration renders as a mounted print with hard paper edges. No radial
   mask, no masked bleed: design-H's own comment at lines 181-196 records that the
   two window illustrations and their radial masks were removed on the founder's
   instruction, and that the masks had been smudging a soft grey halo onto the
   wood. The one picture that remains is a mounted print with hard paper edges.
4. Eva's clock before Adam's, everywhere, including in the `aria-label`.
5. Judged at 393×852 at the width the illustration ships at, at device DPR. Two
   illustrations that look like siblings at 768px can look like two different
   artists at 178px.

**Risk tier.** Lite, rising to **Full** if the `date_plans` read is not already
behind the try/catch `/dates` uses. Check before assigning.

**Worker.** `frontend-engineer`.

---

## What cannot be ported yet

The CEO's brief names three mime gates. There are **four**, and the three blocked
pieces are blocked on different things at very different costs. Verified in
`apps/web/supabase/migrations/`.

| Gate | Where | What it says |
|---|---|---|
| 1 | `20260802091000_storage_media_bucket.sql:87` | the `media` bucket's `allowed_mime_types` is `image/jpeg` alone |
| 2 | `20260802090200_photos.sql:59` | `mime text not null check (mime = 'image/jpeg')` |
| 3 | `20260802090300_vault_items.sql:50` | same check, same column |
| 4 | `20260802090000_extensions_and_enums.sql:40` | `photo_kind` is `enum ('daily','book')` — **not named in the brief** |

### The voice note with the waveform — blocked, expensive

Blocked on all four gates, plus three things nobody has costed:

- `lib/photo/guard.ts` walks JPEG segments only and its first `MetadataKind` is
  `not-a-jpeg` — so it **refuses** a non-JPEG rather than passing it through. That
  is the right failure, and it means there is no stripper for audio. One would have
  to be written; recorder metadata routinely carries a device identifier.
- There is no waveform anywhere. design-H draws a synthetic one. A real waveform
  means either decoding the file on the device at record time and storing peaks,
  or decoding it on every open.
- Adding a value to `photo_kind` is `ALTER TYPE ... ADD VALUE`, which in Postgres
  cannot be used in the same transaction that then uses the new value. It is a
  two-migration dance and it is not reversible.

**Cost to unblock: irreversible tier, its own multi-task decomposition.** Not part
of this port.

### The song card — blocked, but not on what the brief says

**A song is a link. A link carries no bytes, so no mime gate applies to it.** The
handoff has this right ("songs are cheapest — a URL and an oEmbed card, no
upload"); the brief's framing does not.

What actually blocks it: **no table in this schema can hold a URL.**

- `photos` requires `width`, `height`, `bytes`, `checksum_sha256` and two storage
  paths, all `not null`.
- `vault_items` requires `storage_path_display not null`.
- `book_entries` carries a check constraint `(photo_id is null) <> (date_id is null)`
  — a row is a photograph or a date, exclusively. There is no third arm.

So it needs one new table, roughly six columns. **Cost to unblock: one migration
(Full tier, not irreversible — a new table adds nothing to remove), one oEmbed
fetch, one card.** It is genuinely the cheapest of the three. Two things to settle
first: an oEmbed call is an outbound request from an app whose entire premise is
that it is private, and an embedded third-party player is a script running over
their photographs.

### Video — blocked, most expensive

Everything the voice note needs, plus an MP4 metadata stripper. `guard.ts` walks
JPEG segments; MP4 hides GPS in `moov`/`udta`/`©xyz`. Shipping video without that
stripper publishes two people's home addresses. **Irreversible tier, and it should
not be attempted in the same quarter as the board.**

### The three that are not blocked

The Art Deco couple, the pressed stickers, the washi and the pushpins are static
assets in `apps/web/public/materials/` (46 files). They are not user media, no gate
touches them, and they ship with T1.

---

## Deliverable B — the route decision

> **The board becomes `/today`. It is not a shell. `/book`, `/dates`, `/send` and
> `/pocket` stay exactly where they are, and the Dock stays with them. The board's
> own fixed chrome — the ribbon and the two chips — does not ship.**

### Why not a shell above the routes

A shell means the table is a layout and every route renders as an overlay inside
it. Next layouts do not unmount between sibling routes — the Dock's
`layoutId="dock-active"` pill already depends on that being true. So the board's
GSAP Draggable instances, its pan state and its forty-odd `<img>` tags would stay
mounted and live behind `/send` while somebody is picking a photograph out of their
camera roll, and behind `/pocket` while it is locked. On two iPhones over mobile
data, that is the wrong thing to pay for on every navigation in the app.

### Why not "a new route alongside"

Because then the app has a table *and* three screens that show the same
photographs a different way, and the founder has already rejected four directions
for looking like an app. The board is not an addition. It is the thing you land on.

### Why `/today` specifically

Look at what is actually in the top-left corner of the mock, at the coordinates
you arrive at (`gsap.set(srf, { x:-40, y:0 })`): a torn scrap reading **Sunday
9 August · New York · 3:41 PM**, a cue that says *seven hours ahead, further
down*, today's two photographs, and a line in Eva's hand. That is `/today`'s
content, exactly. Panning right reaches the archive; panning down reaches the
night. **design-H is Today with everything else laid out around it**, and the
route that opens it should be the route both of them land on without a tap.

### The chrome arithmetic, which comes out even

This is the part that decides it. Two competing sets of fixed furniture:

| | top | bottom | total |
|---|---|---|---|
| design-H | two chips at `12px + safe-area-top` | ribbon, `~75px + safe-area-bottom` | `CHROME = 150` (its own constant, line 1519) |
| the shipped shell | `--band-height: 56px + safe-area-top` | `--dock-footprint: 3.75rem + max(0.5rem, safe-area-bottom)` | 124–150px |

**The same budget.** design-H already reserves precisely the space the Band and the
Dock occupy. So the board drops into the existing shell with nothing lost —
*provided the ribbon and the chips do not also ship.* Ship both sets and 250px of
an 852px screen is two navigation systems doing the same job, which is 29% of the
screen, which is the exact figure the deco quarantine just clawed back.

What the ribbon and chips did, and where each job goes:

- **the ribbon** — jump to a day. The piles do this. They are on the table, they
  are the right size, and reaching them is the pan gesture the whole design is
  built on.
- **"All of it"** — zoom to fit. Double-tap already does it; the handler is in the
  mock (`lastTap`, line 1620).
- **"Photographs"** — the contact sheet. It becomes an object on the table: a proof
  sheet lying on the wood, which is what it is.

### What the Dock keeps that design-H does not have at all

`grep -in "send\|upload\|camera\|input type=\"file\"\|pocket\|sign out"` across all
2415 lines of design-H returns **one match**, and it is the word "send" inside the
prose of a date idea.

**The approved mock has no way to add a photograph.** No upload, no camera, no
pocket, no sign-out. Upload is the one path in this product that verifiably works
end to end — signed PUT, HEIC decode on iOS, a durable OPFS outbox, EXIF stripped
twice. The Dock is the only route to it, and to the lock, and to the only sign-out
in the app.

So the Dock stays, unchanged, with its three tabs and its send button. That is not
a compromise with the design; it is the design missing a fourth of the product, and
it is the single largest gap in design-H. **Flag it to the founder as its own
question:** where does *adding something* live on a table?

### One thing the Band should stop doing on `/today`

The board carries its own masthead — the date, the city and the clock, on paper, at
the top left. A fixed 56px Band above it repeats all three. `today/page.tsx`'s own
header already states the law: *"No masthead, no greeting, nothing above the item
(§0). The photograph is Today's masthead."* The shell contradicts a law the route
already wrote down.

**Recommendation: the Band does not render on `/today`.** It is a sibling of
`<main>` in `app/(app)/layout.tsx`, so suppressing it conditionally does not remount
the layout and does not disturb the Dock's shared pill. That returns 56px, and it
means the board's glass is 852 − dock ≈ 758px rather than 702px. It is a change to
the shared shell, so it is the founder's call, not mine — but it is the same call he
already made twice this month.

### The book and Dates keep their own routes, and the board is their door

design-H carries a book with a drag-turn and a Dates invitation as modal overlays.
Both already exist as merged, working routes with more in them than the mock has:
`/book` opens on tap with pages that turn inside and three ways out, and `/dates`
runs a real propose-to-agree-to-a-page loop against `date_plans`.

Porting the mock's versions would be **replacing shipped features with fixtures.**
So: the tome on the table navigates to `/book`; the invitation navigates to
`/dates`. The felt difference — a route change instead of a sheet sliding up — is
worth closing with a slide-up view transition on those two navigations, which
Next 16 supports. If it does not feel right, that is a polish ticket, not a reason
to rebuild The Book.

### The 190px, corrected

The brief says `/book`, `/send` and `/pocket` "reportedly lost 190px of vertical
space in an earlier change — verify before relying on it." Verified at `3bc0aa8`:

```
-      <main className="relative pt-[var(--band-height)]">
-        <Seam rotated height={190} />
+      <main className="relative pt-[var(--band-height)]">
         {children}
```

The Seam was `height={190}`, in the normal document flow, at the top of `<main>`,
on every route. Removing it **gave those three routes 190px back.** They lost the
torn edge as an *element*; they gained the *space*. The board inherits the gain.

---

## Where the brief is wrong

1. **The 190px is inverted.** Above. They gained the space and lost the element.
2. **`patchBookEntry` does not belong to this port.** It writes `book_entries`
   (`caption`, `position`) — the curated spreads of The Book. The board has no
   spread: a day's photographs come from `photos.shared_day`, in chronological
   order, with nothing curated about them. There is no honest place to wire it on
   the table. It belongs to a `/book` ticket, outside this decomposition, and
   forcing it in would mean inventing a curation surface nobody asked for. Note
   also that the SQL and `lib/types.ts` describe `position` with two incompatible
   strategies — the migration says fractional index, the type says sparse integers
   re-spaced on reorder — and that contradiction is flagged in the migration itself
   and still unresolved. Whoever wires it settles that first.
3. **Songs are not blocked by the mime gates.** A link carries no bytes. They are
   blocked because no table can hold a URL, which is a much cheaper fix. Different
   blocker, different tier.
4. **There is a fourth gate**: `photo_kind enum ('daily','book')`, and it is the
   one that makes audio and video two migrations rather than one.
5. **"design-H contains a book with drag-turn and a Dates invitation" reads as
   a port list.** Both are already built and merged. Porting the mock's versions
   is a regression.
6. **design-H spans four routes, not three** — it also covers `/book/days`, via the
   day overlay and the contact sheet — **and it spans nothing at all for `/send`
   and `/pocket`.** The mock has no upload affordance. That absence is the biggest
   single thing wrong with the approved design and it needs the founder, not a
   worker.

---

## What I did not assess

Short lists here are suspicious, so this one is not short.

- **I never used design-H.** I read all 2415 lines and I looked at the probe's
  replica at 393×852. I did not run `serve-mocks.command` and open it on a phone.
  Every claim in here about how the board *feels* — swipe weight, whether the pan
  is nice, whether the pinch fights the pull-to-refresh — is inferred from source.
  That is precisely the trap this project has paid for seven times. The founder's
  own pass on the mock, on his phone, should happen before T1 starts.
- **Nothing has ever been opened on a real iPhone.** `dvh`, `touch-action:none`,
  `mask-image` and momentum are exactly what a desktop Chromium cannot tell you,
  and design-H's viewport is `touch-action:none` over the full screen.
- **The chrome numbers are computed, not measured.** `--dock-footprint` is
  `3.75rem + max(0.5rem, env(safe-area-inset-bottom))`, which I read off
  `app/layout.tsx:79` and evaluated by hand as 68–94px. Nobody measured it in a
  running browser on a device with a real safe-area inset.
- **I did not read `lamp-never-reaches-a-photograph.test.tsx`.** I confirmed it
  exists and I derived the photo-treatment rules from design-H's own CSS. Whether
  a walnut ground and a `mix-blend-mode:overlay` grain at `z-index:2` trip that
  test's assertions is unknown, and it should be the first thing T1 runs.
- **Migration application status is still unknown for all fourteen files.** I read
  the SQL; I did not check what is applied to the live project. Every gate quoted
  above is a gate *in the repository*.
- **I did not benchmark anything.** Forty-six `<img>` tags on a 950×2860 transformed
  surface, with GSAP driving `transform` on a phone, is the kind of thing that is
  fine until it is not. T1 should capture a frame-time number, not an adjective.
- **I did not open PROBE-1 through PROBE-8.** The orientation ruling was settled
  and I was told not to redo it; I looked only at PROBE-0, for the bare wood, and I
  am relying on the probe author for the rest.
- **I did not check whether `/review/board` can render photographs.** Workers
  cannot authenticate, `/review/*` is public in development only, and the memory
  records that every screen judged before 8 August had 401s where the photographs
  went. Whether a review page can serve real photograph bytes is a question T1 will
  hit in its first hour and I have not answered it.
- **The slop test is the founder's alone.** Nothing in this document is a verdict
  on whether the port will look good.
