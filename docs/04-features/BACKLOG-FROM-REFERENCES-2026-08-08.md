---
date: 2026-08-08
author: cpo (ranked), ceo (verified + corrected)
status: PROPOSED — no founder decision on any item yet
source: the 26 reference images the founder collected, opened for the first time 2026-08-08
---

# Backlog from the references

The founder asked for new ideas taken from the UI references, plus more. This is the ranked
result. **Nothing here is approved.** Reach is always 2 — impact and confidence carry every score.

Provenance rule used throughout: an item marked `ORIGINAL` is not from the references. Claims
about Retro, 1SE, NYT Cooking, GiftFeels et al. are **second-hand** — the CEO opened those
screenshots, CPO did not.

## Ranked

| # | Item | Source | RICE | Effort |
|---|---|---|---|---|
| 1 | **Eva-authored answers, kept as pages** | ORIGINAL | **7.2** | S |
| 2 | **Sign what you know** — close the 26 unsigned | ORIGINAL | 6.4 | S |
| 3 | The archive plays — 48 photographs as one object | 1SE | 3.2 | S |
| 4 | Print over a blurred copy of itself, absolute stamp beneath | Retro | 2.8 | S |
| 5 | The pair-at-zero-UTC band — the one hour both are free | ORIGINAL | 2.8 | S |
| 6 | Silent hour — a manual veil on what you add | ORIGINAL | 1.2 | M |
| 7 | Video the three files that already exist | bug | 0.9 | **L** |
| 8 | Manual place pin — typed, never auto-located | Product 1 | 0.7 | M |
| 9 | Per-person columns in the archive | Retro | 0.7 | M |
| 10 | Ransom-letter headline | reference folder | 0.7 | S |
| 11 | The two-city sky, ambient | ORIGINAL | 0.5 | M |
| 12 | Voice note — **one-directional, Adam→Eva in v1** | Product 1 | 0.27 | L |
| 13 | Spotify card — read-only public embed | Product 1 | 0.25 | M |

**#1 is more than twice anything else, and it is the item that has outlasted every session:**
the five questions written for Eva on 3 August, shaped as pages she walks through rather than a
prompt. Zero Eva-sourced input exists anywhere in this repo; every claim about her half of the
product is Adam's account. Two agents converged on this independently today.

**#2 turns a restriction into an act.** A one-tap glyph on an unsigned photograph — `eva` /
`adam` / `neither of us knows` — that disappears after use. The law *"an unsigned photograph
must never invent an author"* becomes something the two of them can close, rather than a
permanent gap.

## Declined, so nobody re-proposes them

- **Passcode-locked gift page.** A numeric keypad is a game mechanic ("guess my code"), and
  `/pocket` already is the private surface. If the need is "only for the receiver," the honest
  shape is a visibility toggle, not a puzzle.
- **YouTube embed.** Lookup-shaped, not ambient. Marginal over the Spotify card.
- **One continuous pannable canvas as the whole app.** A rewrite of seven shipped routes, and it
  contradicts a founder-locked decision (DECISIONS.md 2026-08-02, "multi-surface companion app").
  A category error to backlog as a feature.

## Already specced — do not re-propose, but do re-decide

The **scrapbook editor with scissors, tape and a pen** is specced at
`docs/04-features/specs/hand-composed-book-pages.md`. CPO argues it fights the founder's own law
that composing is never solicited: *after a week with scissors visible, an untouched page reads
as a page you haven't decorated yet.* The alternative is shipping outcomes as **properties of a
photograph** (caption, signature, pin, stamp, song) rather than as a canvas and a tool rail.
**Founder decision needed before anyone builds the spec.**

## Two corrections the CEO made, and was wrong about

**The memory map is not a privacy reversal.** `apps/web/lib/photo/guard.ts` was read in full: it
defends against EXIF/XMP/IPTC segments **surviving a re-encode**, and its own comment says *"the
way GPS reaches the server is somebody adding a fast path."* That guards against bytes carrying
a location without the person's knowledge. **A pin someone types is authorship, semantically a
caption.** Only auto-locate would be the reversal. The CEO had briefed this as a privacy
decision; it is not.

**The voice note is worse than the reference makes it look.** `USER-INSIGHTS.md` records *"works
with my eyes closed"* and *"I'm in public with a hard stop."* Audio is a leak she cannot defer on
a subway. It is genuinely compelling in the other direction — his 1am, quiet house, warmth
without waking her. **One-directional in v1**, bidirectional in v2 or never.

## Verified costs — these change scoping

- **Video needs three migrations, not one.** `photos.mime` (`20260802090200_photos.sql:59`),
  `vault_items.mime` (`20260802090300_vault_items.sql:50`), and the storage bucket's
  `allowed_mime_types` (`20260802091000_storage_media_bucket.sql:87`) are each hard-locked to
  `image/jpeg`. Plus a **new MP4 metadata stripper** — `guard.ts` walks JPEG segments only, and
  MP4 hides GPS in `moov`/`udta`/`©xyz` atoms. **Irreversible tier.**
- **`/pocket` declines everything by design.** `PocketGate.tsx` says so in its own error string:
  *"the real lock isn't wired on this build yet; it declines everything."*
- **`lib/shared-day/` is genuinely 109 tests** across 2 files — measured by running it, not
  inherited from a handoff. The golden file is parameterised, which is why an `it()` count reads
  as ~30.
- 13 migration files exist, not the 11 some notes claim.

## Not assessed — the honest list

Whether MP4 stripping is tractable in-browser at 30–200 MB · whether Spotify's oEmbed still
gives an unauthenticated preview on iOS Safari PWA in 2026 · whether iOS PWA `getUserMedia` is
reliable for recording · whether `hand-composed-book-pages.md` has already shipped a route ·
whether "27 of 44 assets never render" is accurate (45 material files confirmed to exist; render
paths not audited) · tile provider and weather API costs · whether Retro's recap actually
structures the blurred copy as a **sibling** rather than an ancestor, which #4 depends on to
keep `lamp-never-reaches-a-photograph.test.tsx` green.
