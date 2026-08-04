---
date: 2026-08-03
agent: frontend-engineer
task: offline-last-thing (B7)
branch: feat/offline-last-thing
worktree: .worktrees/offline-last-thing
risk_tier: full
qa_verdict: pending
---

# Session: offline-last-thing (B7)

## What was built

Service worker infrastructure for "the app can show her the last thing without the network" — the third leg of PRODUCT-VISION-V2.md §6.7.

Six atomic commits on `feat/offline-last-thing` from base `ceo-3-1785631504`:

1. `sw-route-classifier.ts` + 38 vitest tests — pure functions, no browser, no serwist dependency
2. `app/sw.ts` — Serwist v9 SW with all three vault exclusion mechanisms and two sign-out purge paths
3. `next.config.ts` — wrapped with `@serwist/next` (disabled outside production)
4. `components/chrome/ServiceWorkerRegistration.tsx` — client component, registers SW, exports `purgeCaches()`
5. `app/offline/page.tsx` — offline shell, static, no personal content
6. `app/layout.tsx` — wires `ServiceWorkerRegistration` into root layout

## Verification

- `pnpm typecheck` — 0 errors
- `pnpm test` — 287 passed, 2 skipped (pre-existing skips)
- `pnpm lint` — pre-existing circular-reference error in eslint-config-next v16 / ESLint 9.39.5; confirmed on clean base branch before any changes

## Vault exclusion — all three criteria

| Criterion | Mechanism | Location |
|---|---|---|
| (a) Path rule | `isVaultPath()` imported from `sw-route-classifier.ts`; checks `url.pathname.toLowerCase().startsWith("/v/")` before any fetch | `sw.ts` runtimeCaching rule 2 |
| (b) No-store guard | `noStorePlugin.cacheWillUpdate` returns `null` when `Cache-Control: no-store` is present | Applied to all caching strategies |
| (c) Manifest exclusion | Vault items never emitted as Next.js static routes; never in build-time precache manifest | Structural — no code needed |

## Three levers documented

Header comment in `sw.ts` explicitly names and distinguishes:
- `SESSION_VERSION` — global session invalidation, does NOT purge cached bytes
- Cache purge on sign-out — per-device, via SW fetch handler on DELETE /api/session 204
- Kill switch (`KILL_SWITCH` constant) — unregister + clear on next install; the only lever that works on a device that is offline with a bad SW

## Criterion 5 (cache purge on sign-out)

Primary: SW fetch handler intercepts `DELETE /api/session`, passes to network, on 204 sweeps `caches.keys()` and deletes each. No page involvement required.

Secondary: `purgeCaches()` exported from `ServiceWorkerRegistration.tsx` — sends PURGE_CACHES postMessage then sweeps directly from page. Handles the edge case where SW was not yet installed when sign-out occurred.

## Criterion 6 (kill switch)

`KILL_SWITCH = false` at top of `sw.ts`. When set to `true` and deployed:
- Install event fires (new SW activating)
- Sweeps all caches
- Calls `self.registration.unregister()`
- No Serwist routes are set up — only the cleanup runs

## Decisions

1. **Route classifier in a separate file** — `app/sw-route-classifier.ts` exports pure functions so tests run in Node without SW globals. `sw.ts` declares SW-specific globals and imports from serwist; importing it in vitest would fail.

2. **Inline SW type declarations** — project tsconfig uses `"lib": ["dom"]`; adding `"webworker"` would conflict. Minimal `ServiceWorkerGlobalScope` augmentation declares only what `sw.ts` uses (`addEventListener`, `registration`), with event types cast inline for kill-switch path.

3. **Lint deviation** — `pnpm lint` fails with a pre-existing circular JSON error in eslint-config-next. Confirmed by running on unmodified base branch. Not introduced by this diff.

4. **Offline page added** — `app/offline/page.tsx` is not in the brief's `files_in_scope` list but is required for navigation fallback to work. Static page, no personal content, documented in header. Auto-fix under Deviation Rule 1.

5. **Sign-out purge in SW fetch handler** — "client-side" in the brief means browser-side (not server-side); the SW is browser-side. Doing the purge in the fetch handler is more reliable than the page (works even if the page is unloaded) and clears all tabs at once (cache storage is per-origin).

## Blockers

None. B5 owns `app/api/session/route.ts`; no changes were made to it. The SW purge runs on the HTTP response, not by modifying the route handler.

## Out of scope (not built, by design)

- Book warm-up ladder (B7 brief §7.2 full scope → Book track)
- 300/600-entry LRU sweeps beyond ExpirationPlugin
- Activity index precaching
- Offline progress indicator
- Web app manifest, icons, install overlay (Today/The Book track)
