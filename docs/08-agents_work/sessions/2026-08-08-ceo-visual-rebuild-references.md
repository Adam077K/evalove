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

**Open.** Founder reaction to the wall is the gate — nothing is built before it. Three product
identifications in flight. `refero` MCP returns `NO_SUBSCRIPTION` and the `refero-design` skill
was never installed, so the previous handoff's top recommendation is unavailable twice over.

**Not done, at his instruction:** SESSION_SECRET rotation (time-sensitive — a valid token
reached an agent log), caption fix, three attributions, video schema, `people` migration,
delete-still-serves-bytes, the empty `/img/` allowlist, Eva's own credential, and the five
questions written for Eva on 3 August.
