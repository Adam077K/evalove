---
date: 2026-08-06
role: design-lead
task: dates-rebuild
status: COMPLETE — spec only, no source file changed
qa_verdict: N/A (no code produced; gates this spec must be measured against are in §8)
viewport: 393 × 852, deviceScaleFactor 3, isMobile, both modes
hydration: verified — React fibre attached (`__react*` keys on `[role=tab]`)
measured_against: main @ 0a4148a, live at localhost:3000/dates
---

# Dates — the window

## §0 · The law already answered "which world", and I should say so before anything else

The brief asks me to resolve Dates against §1 and warns the burden is on me if it needs a third treatment. It does not. **§1's own allocation table already contains this row:**

> | The one-card date suggestion | **DECO** | **The founder's instinct, and it is right.** A date is the plan to be together across the distance — so it is the distance, not the artefact. One card, gold on midnight, then out of the way. It was never going to be a browsable shelf; as a single deco card it is the best-dressed thirty seconds in the product. |

DECO, one card, gold on midnight, explicitly not a browsable shelf. The only thing that changed since that row was written is that Dates became a *place* rather than a gesture — and a place in DECO is already provided for: the Night City is a DECO place, and §1's one-room rule says both worlds share a screen. **A window is a place you go to.** No third treatment, no §1 conflict.

## §1 · What Dates is

**Dates is the window. You go to it, and it shows you one thing that is possible right now.**

The three places are three directions of attention in one room, which is what §1 has been building toward since the Book-at-night ruling:

| Place | Direction of gaze | World |
|---|---|---|
| The Book | down, at your lap | PAPER |
| Today | the table, with the window beyond it | PAPER → DECO across the seam |
| **Dates** | **up and out, through the window** | **DECO** |

A window is a place. You do not browse a window — you look out of it, and what is there is what is there. That is how Dates is a place without being a list.

**The shape, complete:** one card, already lit when you arrive. One control that changes it. Nothing else. You never choose a window — the window is a fact about two clocks, and it is told to you, not offered.

This satisfies §2.3's *"one gesture… that returns exactly one suggestion already correct for the moment"* without contradicting the founder's three-places decision: **arriving at the place is the gesture.**

## §2 · Material vocabulary

**The warning that matters most.** The CEO's coverage metric counts `under-lamp`, `paper-`, `Taped`, `Mounted` as "law-era markers." A builder chasing that metric will paper-ify this surface and produce the worst output of the whole redesign. **Law-era is not paper-era.** On a DECO surface: zero `Taped`, zero `Mounted`, zero `Torn`, zero paper stocks, and **`.under-lamp` must not appear anywhere in the deco region** — the lamp dims the paper table, and the window is not on the table. The correct markers here are the night palette, the keyed shore plates, and flat hard-edged illustration.

| Element | Treatment |
|---|---|
| Ground | `--night-sky` `#0D1220`, full bleed |
| Scene | the existing keyed shore plates (`deco-nyc-shore.webp`, `deco-tlv-shore.webp`) — **the same city as Today's DECO band.** §1's one-room rule requires it; a second, different city would be two apps again |
| The card | a **lit panel** — §1's night-photograph mount #2 ("a lit window in the building facade") generalised. A window across the street with the light on |
| Card border | flat geometric deco rule in `--night-gold` `#C49A1E`. Hard-edged. No gradient fill, no glow, no blur, no glass |
| Fasteners | **none.** Washi, pushpins, torn mounts are PAPER vocabulary (§3) |

Type, per §2's register table:

| Content | Face | Size |
|---|---|---|
| The window sentence | Fraunces italic | 15px |
| The proposal (card line) | **Fraunces italic** — the app's own voice | 27px |
| What to actually do | Fraunces italic, `--night-mute` | 15px |
| Duration, screens-down | **Outfit** — data values | 11px, uppercase, tracked |
| `not this one` | Outfit, `--night-gold` | 12px lowercase |

**Poiret One is not used on this surface, deliberately.** §2's leash bans it from captions and body text, and a date proposal is content, not titling. Its licensed uses here (city indicators, the wordmark) are not needed. The leash exists because "a deco face with no constraint becomes a costume" — do not add it as decoration.

`--night-mute` on `--night-sky` is 5.96:1, AA pass. `--night-ink` is 14.08:1.

## §3 · Interaction

**Arrival.** The card is already there. No button to press to get a suggestion, no skeleton, no shimmer, no `.well`. The window already has a view.

**Selection.** `currentWindow(new Date())` → windowId. Deck = entries whose `windowFit` includes it, ordered by a seeded shuffle. **Seed = `sharedDay + windowId`.** Stable for the whole day, per §4's "never re-rolls" precedent — if it is right at 9am it is right at 9pm. Cursor starts at 0.

**`not this one`** → cursor += 1. Next card in the shuffle, no repeat within the visit.

**What is remembered: nothing.** No `sessionStorage`, no `localStorage`, no server call, no analytics event, no seen-set, no count, no "you've looked at four today", no last-viewed. Leaving the route resets the cursor to 0.

Returning an hour later and getting the same first card is **correct, not a bug**. Two reasons, both structural: it is the only implementation that honours *no record kept of having asked*, and it is the product's thesis — **nothing is ever consumed.** A date idea is not used up by being seen. `react-ui-patterns`' first principle, *"never show stale UI"*, is the exact inverse of this product and is hostile here.

**Motion.** The light in the window goes out and comes back with something else. Contents opacity 1→0 over 120ms `--ease-out`; the gold border dims to 30%; new contents opacity 0→1 over 180ms with `translateY(6px)→0`; border restores. Total 300ms — inside §5's 220–320ms UI transition band. Transform and opacity only. `prefers-reduced-motion` → **full removal** (Sonner precedent), instant swap.

## §4 · The thin window

**The current trigger is wrong, and the library says so.** `DatesExplorer.tsx:118` fires the empty state on `entries.length === 0`. But `library.json`'s own `windows` array declares:

| Window | `thin` | status |
|---|---|---|
| w3 Eva's commute | **true** | confirmed |
| w4 Eva's lunch break | **true** | confirmed |
| w8 Eva's at work, Adam's day is free | **true** | confirmed |
| w9 Eva's day is free, Adam's at work | **true** | confirmed |
| w6 Worth staying up for | false | **rare-by-design** |

**w4 is flagged thin and holds 36 activities — the second-most-populated window in the library.** Thinness is a fact about their life (a commute, a lunch break, a workday), not a count of the shelf. The founder's sentence was always describing the *window*, never the shelf — which is exactly why it survived research and why it reads well.

**Housing.** The sentence fires when there is genuinely nothing more: the deck is empty, or it has been exhausted by tapping. The `thin` flag is the *reason* that happens sooner in four windows — an explanation, not the trigger.

The card is **replaced in place** by the sentence — same lit panel, same gold border, same position. Not a different container, not a centred `card` with `py-10`. The window is still lit; there is just nothing on tonight.

Verbatim, **no interpolation**:

> A thin window — some windows are for sleeping, not planning. Another window has more.

The current build injects the window name — *"Nothing on the shelf fits eva's just off work, adam's fading — some windows are…"* — which is both a rewrite of founder-locked copy and the site of the `.toLowerCase()` bug. **Removing the interpolation removes that bug at its source rather than fixing its symptom.** Coordination point: `feat/three-places` is fixing the same line; the two branches must not fight — see the packet.

One control in this state: **`another window`** → steps to the next window in clock order that has entries, and starts its deck. One step, no options displayed. It is not a menu, and the sentence promised it.

## §5 · What leaves the surface

| Removed | Why |
|---|---|
| **The window rail** (9 tabs) | It *is* the menu the law forbids — *"they open this mid-call; browsing a list is a failure state."* It also holds **all 9 sub-44px targets and 14 of the 16 overflows.** The window is a fact, not a choice |
| **The `NOW` badge** | With one window shown there is nothing left to contrast it against. "Now" is carried by the sentence's present tense. **The computation survives and becomes more load-bearing** — it now selects the entire content of the surface instead of pre-selecting one of nine tabs |
| `Dates` header + "for the two of them" | §4 move #3, one masthead per surface — the card is it |
| "The idea shelf" / "Open between them" | All-caps micro labels over cards is the 2019 costume |
| **Shimmer skeletons in `.well`** | Direct violation of *no slot, no prepared place*. Not replaced by a nicer skeleton — removed structurally: see below |
| `hover-lift` on inert `<motion.li>` | An affordance that lifts under the finger and goes nowhere |

**The skeleton's structural fix.** The shimmer exists only because `currentWindow` runs in a `useEffect`, so the first paint has no window. Compute the window **server-side** and render the card directly; the client does not recompute on mount. That deletes the loading state, the `.well` and the shimmer at once. If the window changes while the page is open, nothing happens until navigation — correct, per §4: a page that re-rolls itself is a page that never finishes.

**HostedDates leaves this surface.** The three games are a different object type: things they are *already making together*, with live state ("Eva writes next"). By §1 that is an artefact — PAPER — and its home is The Book. A place that hands you one thing cannot also be a status board for three running games. `HostedDates.tsx` and its fixture **stay on disk, unrouted**; the final placement is a CPO call, not mine. This removes both truncation defects and all three `hover-lift` markers.

Worth naming: those cards truncate the couple's own sentences mid-word — *"Fortunately, Eva h…"* (328px of content in a 125px box), *"A man on the fir…"* (592px in 111px). Echo's rule is that it *quotes; it never invents*. A quote cut mid-word is neither.

## §6 · The content dependency — the honest blocker

Measured from `library.json`, all 98 records:

| Field | min | median | p90 | max |
|---|---|---|---|---|
| `name` | 10 | 40.5 | 58 | **75** |
| `one_liner` | 106 | **184.5** | 251 | **346** |

Longest name: *"Event-Grade Live Sports via SharePlay (the W6 Alarm-Worth-Setting Activity)"* — carrying a window code the law bans from any UI. Longest one-liner opens: *"Netflix carries no native SharePlay support, so co-watching requires the Teleparty browser extension…"*

**These are research fields, not interface copy.** Rendering them on a card reproduces the truncation defect at a larger size. The 5-entry fixture exists precisely because someone already hit this — its own docblock says *"The slip shows: title, one line (≤66 chars)."*

The card needs a display-copy layer: per activity, `cardTitle` ≤ 34 chars and `cardLine` ≤ 66 chars, **derived from the record, never invented** (the fixture's existing rule). Authoring 98 pairs is **CMO work** — word choice is CMO's domain, not mine — and it gates wiring the real library.

**And this is why the surface I captured is showing an empty state.** The fixture covers only w1, w3, w4, w8, w9. **w2, w5, w6 and w7 render the thin-window state permanently** — including w7 (Saturday, the flagship, 40 real entries) and w5, which is the window live at the time of measurement. That is not a bug in the empty state; it is a hole in the fixture, and it is a real part of why Dates feels bad.

Interim that unblocks the build: extend the fixture to **≥3 entries per window across all nine** (~27), authored to the contract from real library records.

## §7 · Cadence — answering P5

P5's arithmetic is confirmed from source: `energy_symmetry: needs_both_high` = **exactly 24**. But it was computed against a *weekly Saturday tab*, and the unit has changed.

- 98 activities carry **214 window-fits**: w1 31 · w2 13 · w3 17 · w4 36 · w5 30 · w6 10 · w7 40 · w8 17 · w9 20.
- Windows fire **daily**, not weekly. The both-alert constraint binds only on w7, which holds **40** entries — roughly nine months of Saturdays without a repeat.
- The other eight windows hold 174 fits between them and are live every day.

Exhaustion largely dissolves once the unit is "the window happening now" rather than "the weekly shelf." Where it does not: **a repeat is not a failure.** The design must never mark a card as seen, dim it, sort it last, or apologise for it. That would be a "seen" status, which is banned outright.

## §8 · Acceptance gates — measurable, §9.8 style

At 393 × 852, 3×, viewport captures only, both modes, hydration verified first:

1. **Overflow: 0 elements** with `right > 393.5` or `left < −0.5`, excluding the tray's own designed bleed. Current build: 16.
2. **Touch targets: 0 interactive elements** under 44 × 44. Current build: 9 at 38px.
3. **Truncation: 0 leaf text elements** with `scrollWidth > clientWidth + 1`, excluding the dock's visually-hidden labels (`clientWidth === 1` — these are `sr-only`, not defects; they were in my first census and are a false alarm).
4. **Marker census on the deco region:** `card` 0 · `well` 0 · `hover-lift` 0 · `shimmer` 0 · `pill-ink` 0 · `Taped` 0 · `Mounted` 0 · `under-lamp` 0. Current build: card 16, well 3, hover-lift 3, pill-ink 2.
5. **One card:** exactly one proposal element in the DOM at any time. Not a list of one — a list of one is still a list.
6. **No record:** after ten `not this one` taps then a navigation away and back, `localStorage` and `sessionStorage` contain no key referencing dates/suggestions/seen/cursor, and the first card equals the first card of the previous visit (same shared day).
7. **Day-stability:** two arrivals within the same shared day and window return the same first card.
8. **Thin window:** copy renders **character-identical** to the verbatim sentence — no window name interpolated, no `.toLowerCase()` anywhere in its render path.
9. **Window coverage:** all nine windows return ≥1 card. Current build: four windows return the empty state permanently.
10. **Contrast:** every text element ≥ 4.5:1 against its actual composited ground, sampled from the 3× capture, both modes.
11. **Mode invariance:** the deco region's rendered pixels are identical in light and dark. Only the tray differs.
12. **The logo test:** screenshot, remove nothing (there is no wordmark). Two shore plates of their two real cities and a gold-bordered card. If it could be any product's "suggestions" screen, it has failed.

---

*Measured, not asserted. Geometry from `getBoundingClientRect` and computed style on a hydrated page at 393 × 852; library statistics computed over all 98 records in `docs/10-activity-library/library.json`. Nothing captured `fullPage`.*
