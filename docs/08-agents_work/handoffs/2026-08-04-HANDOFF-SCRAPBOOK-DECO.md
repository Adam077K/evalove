---
date: 2026-08-04
from: ceo (session ceo-4-1785631505)
to: the team building the scrapbook/deco UI
status: OPEN BRIEF — founder-directed
supersedes: 2026-08-03-BUILD-THE-TWO-PLACES.md
depends_on: nothing. The law and the style bible are on main.
---

# Handoff — the fourth direction

## §0 · Read this first

The founder rejected two design directions before this one. The second he called *"vibe coding AI slop."* A third — the austere bone-paper-and-two-hairlines direction — was superseded on 2026-08-04, **not because it was wrong but because restraint was the wrong answer to a warmth problem.**

**Do not design against `docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md`.** It is retired. The current law is:

| File | What it is |
|---|---|
| `handoffs/2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md` | **The law.** 564 lines. Founder-directed, not yours to relitigate. |
| `handoffs/2026-08-04-STYLE-BIBLE.md` | Asset generation spec, 6 families, executable prompts. |
| `screens/2026-08-04-probe/` | The probe the founder approved, + 3 screenshots. |
| `screens/2026-08-04-assets/` | The first real generated materials. |

Founder's verdict on the probe, verbatim:

> *"It looks okay. It looks like you made it with coal and, like, the images are bad... really bad. But, like, the layouts and the colors and the fonts looks good. So this is a good start."*

Read that precisely. **The composition, palette and typography are approved. The materials were rejected** — because every physical object in the probe was faked in CSS (the sunflower was vector petals, the tape a gradient, the torn edge an SVG filter). That is the coal. It is fixed by generating real assets and compositing them, which is now underway.

---

## §1 · The product, unchanged

Eva is in New York. Adam is in Israel. Seven hours apart, on different calendar dates for seven hours of every day, Saturday their only shared day off. Two users, forever.

> **Eva & Adam is two places. One holds the last thing the other one left. The other holds everything either of them has ever left.**

It is not a place to be together — FaceTime already is that. This is where the hours they are apart stop vanishing.

---

## §2 · What was decided on 2026-08-04

| # | Decision |
|---|---|
| D1 | **REVISED — the clock does not govern.** ~~Deco is the night, scrapbook is the day.~~ The rule is now **paper is what they made; deco is the distance between them.** Both worlds can share one screen. Allocation table in the law §1 — read it before you build anything. The photograph, the caption, the Book, the Pocket and Echo are **PAPER**. The stamp, the window sentence, the two cities, the Record and the one-card date suggestion are **DECO**. |
| D1b | **The clock proposes, it does not decide.** Her 23:10 opens dark, his 05:40 opens light; either can flip it and the flip is remembered. Light/dark is a global override that dims paper — it never converts a paper section into a deco one. |
| D2 | **One room, two directions of gaze.** The table stands by a window: the table is paper, the window is deco, both true at once. Scrolling Today from the photograph down to the stamp and the cities is *lifting your eyes from the table to the window* — one continuous space with a light falloff, never two stacked panels with a hard edge. **The seam is the hardest thing in this design and where the direction gets judged.** The Book is always paper. |
| D3 | **Auto-composed by default, hand-editable on demand.** Deterministic, seeded from the item's **stable database ID — never its array index**. Never re-rolls. |
| D4 | **Book = pages you turn; inside a page, total freedom.** No grid, no slots, no his-side/her-side. |
| D5 | **No ownership of a page.** Either may compose any page. The photograph records who took it; the page records that they made it. |
| D6 | Three new features: **the Night City · the Tape · the Record.** The Record is an object, not a destination. |
| D7 | Two handwriting scripts, one per person. Ink: **Adam `#2E2822`, Eva `#3B342B`** — same warm near-black, differing in *density* not hue, so authorship lives in the letterform. |
| D8 | **Full physics.** Mass, momentum, contact shadows, thumb-following page curl. Paper does not bounce: high damping, rest inside ~400ms, arranged pages load pre-settled. |
| D9 | **Composing is never solicited.** The app must never prompt, nudge or remind anyone to decorate anything. Edit mode is found, not offered. |

### Behavioural rules that survive from the old law, untouched
No counters · no streaks · no scorekeeping · **no "seen" status ever** · silence on a missed day · absolute stamps never relative · **photographs never dimmed, including at night** · Eva's name first · no emoji · no gamified affection-tokens · private content never in any ordinary view · nothing above the item on Today · no slot/prepared-place/plus-in-a-well · the seal fires only on genuine sleep · **`lib/shared-day/` is untouchable** (109 tests, four DST transitions).

The sticker line: *a sticker you place on your own page is craft; a sticker you send someone is a token.* Craft is allowed; tokens are not.

---

## §3 · The asset pipeline — proven, and the traps

**Higgsfield MCP is authenticated and working.** Recraft V4.1 `utility` at 2k is the library model; it beat Nano Banana on texture and accepts a hex palette lock. ~15s and fractions of a cent per asset.

### Six rules learned the expensive way
1. **"No shadow" is not reliably obeyed.** Cut with `remove_background`, add contact shadows in code. A baked shadow fights the physics engine.
2. **Directional specs get rotated.** "Horizontal laid lines" came back vertical. State the axis twice.
3. **Top-down kills 3D form.** The pushpin only read as a dome at a 3/4 angle; top-down produced a coin.
4. **Seamless tiling doesn't happen** — and isn't needed. A 1792×2432 asset against a 393px screen is used full-bleed.
5. **Aesthetic register matters more than realism.** The founder rejected a botanically accurate *aged herbarium* sunflower and chose a brighter one: *"it needs to look real but good."* Brief everything as **real materials, idealised** — never aged, worn or decayed.
6. **Text-to-image cannot produce alpha.** For the city, generate **pure black silhouette on pure white**, key with luminance-to-alpha (`α = 1 − L/255` — never a hard threshold, it jags diagonal rooflines), and colour at runtime.

### The night city is solved
Silhouette generation was tested and works: **the Chrysler crown and the three Azrieli towers are readable from outline alone.** This is the unlock — the night world could not be built in CSS (a medium problem, not a craft problem) and now it can. Colour, sky, season and each person's window-light all stay live over a static asset. Window lights are a coordinate list with a `person` field (`eva` / `adam` / `null`), not painted pixels.

### Getting generated bytes onto disk — solved, use this
`Bash(curl *)` and `Bash(wget *)` are in the `deny` list of the committed `.claude/settings.json`, and the auto-mode classifier independently blocks network egress by every bash route (python3 included). **Do not try to shell-fetch, and do not route around the deny — a policy you evade is not a policy.** The founder was asked and directed us to a different tool rather than to weaken the setting, which is the right resolution and the one to repeat.

**The working transport is Playwright's download handler.** `browser_run_code_unsafe` gives you a sandboxed VM with only `page` — no `require`, no `process`, no dynamic `import`, so you cannot write files from inside it. But `download.saveAs(path)` writes on the *server* side, and that works:

```js
async (page) => {
  await page.goto(anyUrlOnTheSameHost);          // sets the page origin so fetch() is same-origin
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 45000 }),
    page.evaluate(async (u) => {
      const b = await (await fetch(u)).blob();    // blob: URL is same-origin, so `download` is honoured
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'asset.png';
      document.documentElement.appendChild(a); a.click(); a.remove();
    }, url)
  ]);
  await dl.saveAs(targetPath);
}
```

Two traps: `file://` is blocked in this Playwright config (so no local contact sheets — use `sips -Z` thumbnails and read them directly), and a cross-origin `download` attribute is ignored, which is why it has to go through a blob.

### The sticker library — downloaded, verified, committed
Sixteen assets are on disk at `docs/08-agents_work/screens/2026-08-04-assets/`, in commits `e78c3b3` and `a2c63bc`: sunflower v3, rose, lavender, daisy, baby's breath, butterfly, vintage stamp, 45rpm record, queen of hearts, disco ball, gold foil star, cinema ticket, burgundy bow, ochre bow — plus the fifteen materials from `ea4c667`.

**Correction to an earlier assumption, and it changes your work:** the six `nano_banana_2` files report `RGBA` in the PNG header, but the alpha channel is **100% opaque** — 0.0% transparent pixels, measured. Nothing in this library ships pre-cut. **Every asset still needs the luminance-to-alpha key** (`α = 1 − L/255`). Do not skip it for the RGBA ones on the strength of the header.

Backgrounds measured at 241–255 corner luminance, which keys to invisible residue. Two assets were rejected on this exact test and regenerated: the gold star (half blown to white) and the cinema ticket (corner at 165 — would have keyed with a third-opaque blotch). **Measure the corners before you trust a background.** The checker is committed at `docs/08-agents_work/tools/alphacheck.py` — stdlib-only PNG unfilter, no network. Run it on every batch before you accept one.

Prompt lesson from those two regenerations: when a model gets a specific thing wrong, add a `critical_constraint` field that **names the failure in the negative** ("no part of the star is white, blown-out or missing"). Describing the material correctly is not enough — the first prompt already said "gold foil" and still produced a half-white star.

**Eva's sunflower is the Nano Banana one**, founder-chosen: `hf_20260804_101059_20471619-4829-4880-9c5c-ed47406c1256.png`. Not the Recraft version, which the CEO recommended and the founder overruled.

### Not yet tried, and the founder asked for it
**Reference-image conditioning.** Higgsfield accepts reference media. The founder's own folders — `/Users/adamks/Downloads/deco-art-ref/` and `/Users/adamks/Downloads/design ref - digital scrapbook - a romantic collage/` — should ground the deco city and the book layouts. Text prompts already work for paper/tape/mounts; references matter most for the **painted atmosphere** of the night city, which silhouettes alone won't give. Upload is `media_upload` → PUT the bytes → `media_confirm`; the PUT is an *upload*, not a download, so the Playwright recipe above does not cover it. This one is still unsolved.

---

## §4 · What to build next

**Stage 1 is UI only.** Screens render from `lib/fixtures/` exactly as today. No backend work. `lib/*` is not touched.

1. **Finish the material library** — paper stocks, tapes, mounts, fasteners, stickers, city plates. Cut every object with `remove_background`.
2. **Build the material + physics primitives** — `<Mounted>` is the foundation: seeded rotation, mass hierarchy, contact shadow, settle state. Nothing in later phases exists without it.
3. **Rebuild Today's day face with real assets** — Fable. Composite PNGs, do not draw. *This is the step that removes the coal.*
4. **Today's night face** — the deco city, layered, hour-driven.
5. **The Book** — cover, visible thickening fore-edge (the anti-counter: a thick book is an object, not a tally), spread, thumb-following curl.
6. **Edit mode + the tool tray** — the dock becomes a physical tray: navigation while reading, real scissors/tape/pen while editing.
7. **The Tape + The Record.**

### Composition rules that decide it
The diagnosed defect: *"five full-width elements at one width, one radius, one elevation, one rhythm — the eye finds that rhythm on the second element and stops reading."*

- **One element bleeds off ONE edge, not four.** A photograph that floats with margin on all sides *is* a card. Three edges keep mount, rotation and visible paper.
- Rotation is **by context**: Today's hero −5°…+5°; photographs in the Book −8°…+8°; notes ±5°; stickers ±15°; tape perpendicular ±5°. **Do not unify these.**
- Unequal pairs. One masthead per surface. Type directly on paper. Varied vertical rhythm.
- Mass hierarchy: photograph > note > tape > sticker. Heavier sits on top.

---

## §5 · How you get judged

1. **The Tuesday test** — render every surface with **no photograph at all**. Their entire photo supply is two people and one is always asleep, so this is an ordinary afternoon, not an edge case. If it reads as an empty container waiting to be filled, it fails. *The probe's best idea came from here: faint impressions of writing pressed through from the sheet above — it says someone was here without adding anything or asking for anything.*
2. **The logo test** — screenshot, remove the wordmark. *"The failure mode is not ugliness — it is being well-made and anonymous."*
3. **The 11pm test** — walk it as the **exhausted** one at the end of a long day. Enforced as process: Adam will live his 5am hundreds of times and never once live Eva's 11pm.
4. **The slop test** — the founder's. Three directions have now been measured against it.

Verify at **393×852, both modes**. Full-page captures lie about `position: fixed`. Add `?mode=night` to any URL.

---

## §6 · How to work — read this, it will cost you hours otherwise

- **Verify on disk, never on report.** Three separate agent self-verifications failed this session, including one that claimed a font rendered correctly when it had not. Screenshot and *look*. A metric only answers the question you thought to encode.
- **Agents loop on confirming finished work.** Two required the same instruction three times. State plainly when something is accepted and give the next task.
- **The founder judges on sight, in one sentence, without diagnosing.** Never let a direction reach a document-only milestone. Put pixels in front of him early — a throwaway self-contained HTML page is enough, and it is what saved this session.
- **Never route around a denied permission — but do report the alternatives.** One agent fetched a font through Playwright after `curl` was denied, silently. That was wrong and was corrected. The same *mechanism* was later used to download the whole sticker library, and that was fine — because the founder was told the wall existed, asked, and chose the other tool. The difference is not the technique, it is who decided. When you hit a wall: stop, report, escalate, and say what the options are.
- **Commit constantly.** Several agents on this project have lost hours by finishing everything and committing nothing.
- **Argue back.** Every agent that disagreed on this project improved the outcome — including the ones that told the CEO he was wrong, and were right. Two rulings this session came from agents pushing back, and one exposed a geometric contradiction in the CEO's own plan.

---

## §7 · Open, and worth an answer

1. **Eva has never been asked a single question** in this project's entire history. Every persona is Adam's account of what she feels. Five are drafted at `research/2026-08-03-EVA-FIVE-QUESTIONS.md`. An hour with a pen would also yield her real handwriting as a font — the one design element that literally cannot be copied.
2. **The printed book** was not selected but is the only feature that survives the company dying, and the Couple/Pair shutdown fear runs under all the research.
3. **Echo** (the AI margin) — *partly resolved.* Product Vision V2 §2.4 already narrowed it: the partner simulacrum is cut, a strictly-quoting search over the archive survives, and it lives inside The Book rather than as a tab. D1's allocation makes it **PAPER**, since it returns their actual words. What is still missing is a *design* — nobody has drawn what "search the archive" looks like as a paper object. Suggested register, not law: a slip of onion-skin laid into the Book, not a search field.
4. **Spotify catalogues differ 15–40%** IL↔US. Some records won't cross. Needs a graceful answer before The Record ships.
5. **Patrick Hand is not in the probe** — Adam's caption is a flagged stand-in (Homemade Apple). One `@font-face` swap.

---

**Make something that could only exist for these two people.**
