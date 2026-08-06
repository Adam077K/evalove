---
agent: frontend-engineer
task: book-opens (tap-to-open, usable inside, emboss + day/night fixes)
branch: feat/book-opens (from feat/the-book)
qa_verdict: PENDING
tier: full
---

- The Book opens on tap (founder's ruling): the cover is a two-face flap (CoverBoard front, endpaper back) swinging positive rotateY on the off-screen spine hinge — the 8b leaf mechanism, no second motion vocabulary. Timing measured on capture: --ease-io was past the last visible degree by 120ms; keyframes now spend the curve inside the visible arc, lift-first.
- Inside: ribbon's page first (`whatCameBack` wired), then the kept days on the same leaf-turn rail as /book/days (leaves extracted to `components/book/leaves`). Held CDP touch verified: tilt/sheen/shadow track the finger, both modes. Close = cloth band tap, quiet caption line, or Escape; focus follows in and back out; reduced motion jumps phases on plain-CSS settled poses (probed: animation none, flap at 172°).
- Blind stamp rebuilt: the transparent fill was why the walls cancelled — the impression now has a floor plus crisp 1px lit/shaded lips; colophon pressed deeper, legible. Night is directional now (LampShade on cloth/fore-edge + room shade layer): "the lamp came down," not "nothing happened."
- Ribbon is a bookmark: lies on the held page under everything mounted (BookSheet `underlay`), exiting at the foot where the closed tail hung. Tuesday test moved it there — draped from the head it crossed caption and stamp.
- Real bugs found by looking: Paper's inner box was content-height so bottom-anchored underlay floated 175px high (h-full fix); bone stock only fetched at tap so a cold open painted composition on bare cloth (preload while closed, with the held photo).
- Screens in `screens/2026-08-06-book-opens/`. Pre-existing, untouched: 7 lint errors; bone tile repeat seam on tall sheets; sw.js 404 dev badge. Session-route timing test flakes under parallel load, passes 22/22 isolated.
