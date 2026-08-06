---
role: frontend-engineer
task: lamp-ancestor-fix
branch: feat/lamp-ancestor-fix
base: integration/wave5 (d973812)
tier: full
qa_verdict: PENDING
visual_verification: PENDING
---

- Diagnosis confirmed structurally: `.under-lamp` on BookObject's cloth wrapper was an ancestor of every `img.photo` in the open Book; a CSS filter composites its subtree then filters the result, so the photographs were dimmed ×0.73 + sepia at night with no child-side escape.
- Fix: the cloth becomes a sibling layer beneath the pages (Paper.tsx's precedent), carrying the lamp, the LampShade and the board's cast shadow. Curve untouched; `isolation: isolate` replaces the stacking context the filter used to provide (turning leaves carry z 1000+).
- Swept all 15 `under-lamp` sites plus every inline lamp filter. BookObject:198 was the only ancestor-of-photograph. Pinned/Polaroid/Taped/Torn/Seam/Paper/Dock/BookCover/BookTurnStage all put the lamp on a sibling or a leaf `<img>` — clean.
- Regression test walks UP from every photograph on every surface, in both modes, with the dimming classes parsed out of the real globals.css. `drop-shadow` is the sole exemption (it never touches source pixels). A trap test proves the instrument fails on the structure that shipped.
- Verified: `tsc --noEmit` clean · lint 28 problems / 4 errors, identical to the wave5 baseline · vitest 43 files, 562 passed, 1 failed (documented `tools/export`), 2 skipped.
- NOT verified with eyes — every route is behind the login wall. Needs a 393×852 capture of `/book` opened, day and night, to confirm the cloth still reads as dimmed and the photographs do not.
- Observation for the lead, out of scope: `lib/fixtures/photos.ts` mints a fresh `uuid()` per process, so a fixture photograph's seeded mount is not stable across runs — the "same photograph, same frame, forever" rule is unenforceable on fixtures.
