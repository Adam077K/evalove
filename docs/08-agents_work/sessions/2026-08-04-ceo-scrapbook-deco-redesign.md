---
date: 2026-08-04
role: ceo
task: scrapbook-deco-redesign
status: CLOSED — direction approved; handed off at 2026-08-04-HANDOFF-SCRAPBOOK-DECO.md
tier: n/a (design direction + docs only; no production code touched)
qa_verdict: n/a
supersedes: docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md (chromatic/material half only)
---

# CEO — the fourth direction

Founder-directed working session. Set the fourth design direction after two prior rejections, and proved it visually before building anything.

## Decisions locked (founder, this session)

1. **Deco is the night; scrapbook is the day**, on each person's own local hour. Seven hours apart means the app is never the same on both phones at once — the asymmetry is the signature.
2. **The room changes, the object does not.** Today has two faces. The Book is always paper; at night, an amber-lit reading room. Still two places.
3. **Auto-composed by default, hand-editable on demand.** Deterministic, seeded from stable item ID, never re-rolled.
4. **Book = pages you turn; inside a page, total freedom.** No grid, no slots, no ownership — either may compose any page.
5. **Three new features:** the Night City, the Tape, the Record. The Record is an object, not a destination. Printed book deferred, not killed.
6. **Two handwriting scripts, one per person.** Full physics — mass, momentum, contact shadows, thumb-following page curl.

## What was superseded, and what was not

The chromatic and material half of the 2026-08-02 law is dead: restraint-in-the-chrome, the gradient/texture/glass bans, the two ≤2px desaturated inks, bone-only canvas, night-as-unlit-paper.

**Every behavioural rule survives untouched** — no counters, no streaks, no seen status, no guilt on a missed day, absolute stamps never relative, photographs never dimmed, Eva's name first, no emoji, no gamified affection-tokens, `lib/shared-day/` untouchable. Those came from research, not taste.

One new behavioural rule: **composing is never solicited.** Edit mode is found, not offered.

## Delivered

| Artefact | Commit |
|---|---|
| `handoffs/2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md` (564 ln) | `59b3914`, `7ed0573`, `c63fe2f` |
| `handoffs/2026-08-04-STYLE-BIBLE.md` (567 ln, 6 families) | `c63fe2f`, `8ca3695` |
| `screens/2026-08-04-probe/` — probe + 4 screenshots at 393×852 | this commit |

## Rulings issued on agent disagreements

- **Book at night** — design-lead was right; "dimmer lamp" was underspecified. Amber-lit reading room adopted, and it defines night navigation: moving Today → Book is *turning away from the window and looking down at your lap.* One room, two directions of gaze.
- **Rotation** — ±3° reads as a rendering artifact, correct. But ±8° exposed a contradiction in the CEO's own plan: a photograph cannot be full-bleed AND mounted AND rotated. Resolved — **bleeds off one edge, not four.** Hero ±5°, book photos ±8°, deliberately not unified.
- **Seed** — must be the item's stable DB id, never array index. Index-seeded silently re-rolls the whole page on the first insert; invisible to anyone who looks once.
- **Fifth typeface** — the law's "four typefaces, no others" is right for handwriting on paper and wrong for illustration. Poiret One added, night-titling only, ≥32px, never a caption/stamp/clock/label, never in the day world.

## Two technical findings that changed the plan

1. **The night city cannot be built in CSS.** A medium problem, not a craft problem — confirmed independently by the probe agent against its own work. Asset generation moves onto the critical path for night.
2. **"Five transparent layers" was ungeneratable as specified** — text-to-image models produce no alpha. Replaced with **silhouette-on-white + luminance-to-alpha keying** (`α = 1 − L/255`), which anti-aliases diagonal rooflines for free and keeps colour, season and per-person window light live at runtime. Generated file count 28 → 8; the sky needs no generation at all.

## Pipeline

RunPod public endpoints, no auth handshake: FLUX dev/schnell/Kontext, Seedream 4, Nano Banana Pro, Qwen. Verified end to end at **$0.003/image, ~15s**.

**Asset transport settled.** The project's shell-download tools stay unavailable and unchanged. The founder was asked how to proceed and chose a different tool: Playwright's `download.saveAs()`, which writes files on the server side. Sixteen assets are now on disk and committed (`e78c3b3`, `a2c63bc`). The recipe and its two traps are recorded in handoff §3.

## Founder verdict on the probe

> *"It looks okay. It looks like you made it with coal and, like, the images are bad... really bad. But, like, the layouts and the colors and the fonts looks good. So this is a good start."*

**Direction approved** — composition, palette, typography. **Materials rejected** — every physical object was faked in CSS. Fixed by generating real assets and compositing; first tranche committed at `ea4c667`.

Also founder-set after the probe: Eva's sunflower is the **Nano Banana** version (CEO recommended Recraft; overruled). Ink confirmed at Adam `#2E2822` / Eva `#3B342B`.

## Open

- ~~Asset transport~~ — **closed.** Sixteen stickers/materials downloaded, verified and committed. `.claude/settings.json` was not modified.
- ~~Ribbon bow (429, never submitted)~~ — **closed.** Submitted and landed, in two colourways: burgundy `#6B1E30` and ochre `#C4A673`.
- **Every asset in the library still needs luminance keying.** The six `nano_banana_2` files declare RGBA but measure 0.0% transparent — the alpha channel is entirely opaque. Nothing ships pre-cut; the header is misleading.
- Reference-image conditioning (founder-requested) is still not done. It needs an *upload* (`media_upload` → PUT → `media_confirm`), which the download route does not cover.
- Two assets failed on background purity and were regenerated: the gold star blew half to white, the cinema ticket had a corner at luminance 165. Checker committed at `docs/08-agents_work/tools/alphacheck.py` — measure corners before accepting a batch.
- Ink: probe proposes Adam `#2E2822` (fine-liner, denser) / Eva `#3B342B` (ballpoint, lighter) — same warm near-black, differing in density not hue, so authorship stays in the letterform. CEO concurs; founder to confirm.
- Patrick Hand could not be fetched (network denied); Adam's caption in the probe is a flagged stand-in. The agent correctly did not route around the denial.
- Carried forward, unresolved: Eva has never been asked a question; the printed book; Echo has no home in the two-place structure; Spotify catalogues differ 15–40% IL/US.

## Process note

Both agents required repeated correction on identical instructions — design-lead looped on re-confirming accepted work three times; the probe agent skipped four of five fixes on its first revision and described the violations as features. Output quality was high once corrected. **Every claim in this session was verified on disk by the CEO rather than accepted from the return JSON**, and that should continue through Phase 1.
