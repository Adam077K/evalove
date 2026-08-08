---
date: 2026-08-08
role: ceo
task: visual-rebuild-pin-a-real-reference
status: GATE_OPEN — awaiting founder reaction to the reference wall
qa_verdict: N/A — no code changed this session
tier: n/a
---

# The references were never opened

**The finding.** The founder collected 26 reference images on 2 and 4 August. The design law
(`handoffs/2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md`, 54KB) and the style bible (44KB) cite them
**by filename**. `DECISIONS.md` already recorded that "rev 5 was written without ever seeing its
own references." **No agent opened them until today.** They were classified from folder names.

**What opening them changed.** The folder everyone called "Figma asset packs and torn-paper
textures" contains **three shipped products for private two-person memory books** — Evalove's
exact product:

1. A **locked gift** — passcode screen, *"From: Zoey / For Jim / a little secret…"*; inside,
   embedded Spotify and YouTube players, a voice note with a real waveform, a "Memory map"
   pinning a photograph to Nha Trang, unfiltered polaroids of one real couple. One continuous
   pannable surface. No tabs, no dock.
2. A **page-deck viewer** — turnable card spreads on deep navy, four small circular controls.
3. A **desktop scrapbook editor** — real tool rail (scissors, washi roll, glue pen), sticker
   tray, Copy / Paste / Duplicate / Bring to front.

**The law mined three working interfaces for their wallpaper and discarded their product.**
Meanwhile the folder the founder actually labelled *app design inspo* is four Dribbble concepts
plus SORDJATI, a furniture marketing site — and only SORDJATI was used, as "palette and
typography." **Not one reference behind the shipped design is a phone app.** That is why A/B/C
were each rejected: A took the SORDJATI strand, B the craft strand, C the deco strand.

**Two second-order consequences.** Product 1 embeds Spotify, YouTube, voice notes and a map as
first-class page objects — Evalove holds three videos it cannot display because `photos.mime` is
image-only. And all three products make hand-composition the point, with tools visible; the law
says composing is never solicited. Both tensions are now on the table rather than latent.

**Delivered.** A reference wall at 393×852, published for the founder, holding the 26 correctly
classified for the first time plus nine "before" captures. Verified by render, not by report:
all 35 images decode, no horizontal scroll, captions match their images.

**Two defects caught before they reached him**, both invisible in the producing agent's own
report: design-lead fabricated captions for 11 images it never opened (every one I spot-checked
was wrong, and two buried the best references in the set), and the page rendered mojibake
because omitting `<head>` left it with no charset declaration.

**Principles banked from the craft research.** Sparseness is a *page*, not an empty container —
NYT Cooking's three-recipe state reads as a curated shelf because each item is a complete
editorial unit (this is the positive form of the no-empty-slots law). And a photograph is an
*object*: no card, no shadow, no rounded corner, neutral field — Darkroom.

**Founder decisions.** App family is the target · source shipped apps, not concepts ·
skeuomorphism decided after the reference, not in the abstract · all seven parked decisions
stay parked, design only.

**The peer-app tier is thin, and that is a finding.** Seven shipped apps were verified live via
the iTunes lookup API and their screenshots opened. **Most App Store screenshots are marketing
composites** — phone frames on gradient grounds — so only Retro's carousel yielded real
interface. Three results worth keeping:
- **Retro** is structurally the closest shipped app (private, few people, per-person columns)
  and is mostly a *negative* reference: a `+` in an empty day slot, "Weeks Posted: 32", an
  "8 new" badge — three banned mechanics on one screen. But its recap screen is a genuine find:
  a print at full strength over a blurred, darkened copy of *itself*, with an absolute stamp
  beneath. That satisfies the no-dimming law rather than bending it.
- **Day One markets streaks as a headline feature** ("Build a Habit — Track your journaling
  streaks"). The most-decorated journal app on the store leads with the mechanic Evalove bans.
- **A relayed principle did not survive checking.** "The photo IS the container, no card" was
  cited from NYT Cooking; the actual screen is a two-column grid of white rounded cards.
  Corrected to the founder after it had already been relayed to him.

**The three products were NOT identified.** The category is confirmed, live and named —
personalised digital gift pages / "love pages", a private scrapbook built for one named person
behind a link. Live players: GiftFeels (page-turning memory book, polaroids, voice notes),
MadeFor.one (Spotify **and** YouTube embeds, "For Elise — From Daniel" labelling), Your Love
Page (polaroids and tape), Scrappbook. **No single product carries the full distinctive set**
(passcode keypad + memory map + voice-note waveform + both embeds + polaroid deck), and naming
one on a partial match is the failure this session exists to correct. **Most probable cause of
the miss: WebSearch is US-only and the strongest signal is Vietnamese** (the map pins Nha Trang
and Khánh Vĩnh) — an instrument pointed away from the answer, which is this project's recurring
shape. Treat it as *not found by us*, not *does not exist*. **Cheapest resolution is the
founder's own browser history from the morning of 4 August.**

**Open.** Founder reaction to the wall is the gate — nothing is built before it.
`refero` MCP returns `NO_SUBSCRIPTION` and the `refero-design` skill was never installed, so the
previous handoff's top recommendation is unavailable twice over.

**Not done, at his instruction:** SESSION_SECRET rotation (time-sensitive — a valid token
reached an agent log), caption fix, three attributions, video schema, `people` migration,
delete-still-serves-bytes, the empty `/img/` allowlist, Eva's own credential, and the five
questions written for Eva on 3 August.
