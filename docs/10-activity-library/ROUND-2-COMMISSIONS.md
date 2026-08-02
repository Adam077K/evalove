# Round 2 — Research Commissions

*Consolidated from all seven threads' `gaps` arrays plus the coverage matrix, 2026-08-02. Prioritised P0 → P3. Written to be picked up cold: each item states what is unknown, why it matters, where to look, and what "done" means.*

---

## Context a fresh researcher needs

Round 1 produced 98 activities for one couple — Israel (UTC+3, works Sun–Thu) and New York City (UTC−4, works Mon–Fri), 7 hours apart, FaceTime as primary channel. Activities are tagged against nine overlap windows (W1–W9); see `library.json` → `windows` for the definitions. Four categories: `live-together`, `games`, `deep-talk`, `intimacy`.

**Two environment failures shaped round 1 and both must be fixed before round 2 is worth running:**

1. **Reddit was tool-level blocked for the entire session.** All seven threads confirmed independently — `reddit.com`, `old.reddit.com`, and the Reddit JSON endpoint all failed to fetch, and `site:reddit.com` searches returned no usable permalinks across ~30 query variants. **Not one first-person community source appears anywhere in this library.** Every entry is sourced to official documentation, a store listing, a rulebook, a named clinician, or a peer-reviewed paper.
2. **The shared WebSearch budget (200 calls) was exhausted partway through.** T6 hit the cap mid-verification; **T7 had zero search available from its very first call** and did all discovery through WebFetch against guessed URLs plus DuckDuckGo's HTML endpoint.

Round 2 needs a working route to community sources — Reddit via an alternative fetch path, or a substitute (Discord LDR servers, LDR-specific forums, identifiable YouTube couples with transcripts). Without it, P0-A below cannot be completed and round 2 largely repeats round 1's shape.

---

**Window model status (settled 2026-08-02, do not re-litigate):** W1, W3, W4, W5, W7, W8, W9 are **confirmed** against the founder's account of actual behaviour. W2 is **opportunistic** — she is up at NYC 05:00–07:00 only sometimes, mostly weekends; tag it if something lands there, never plan around it. W6 is **real but rare by design** — it costs him a 1–5am wake-up. Eight of nine validated. See `library.json` → `windows[].status`.

---

## P0 — Blockers. Do these first or round 2 has the same hole round 1 has.

### P0-A · Deepen W3 — the thinnest confirmed window

**Now the top priority for round 2.** W3 (her commute, NYC 07:00–10:00 ↔ his 14:00–17:00) is confirmed real — she commutes and can talk — but it is the thinnest confirmed cell in the library at 17 entries, and the coverage is fragile in a specific way:

- `W3 × live-together` is **AMBER at 2**, and one of those two (`ldr-morning-audio-companion`) is plausible-unverified.
- `W3 × deep-talk` has 3 entries, but T6's only purpose-built one (`t6-commute-voice-question`) is also plausible-unverified — a researcher-constructed micro-ritual, not a found practice.
- Only `W3 × games` is genuinely strong (9 entries), because T4's verbal games happen to need no screen.

**A confirmed window with thin verified coverage beats a rich window with more of the same.** W4 has 36 entries and W7 has 40; W3 has 17 and its distinctive ones are the least trustworthy.

**The constraint is unusually tight and is what makes this hard:** she is mobile, hands busy, often on transit, headphones in, frequently unable to look at a screen at all, and interruptible at any moment by a crosswalk or a ticket gate. Anything requiring eyes, two hands, or an uninterrupted stretch is disqualified. Round 1 found exactly one audio-only co-consumption format (downloaded audiobook + manual 3-2-1 countdown) and it is the single best W3 entry in the library.

**Hunt specifically for:** synced or synchronisable audio formats beyond audiobooks (podcast co-listening with real playback sync — Apple Podcasts' SharePlay status is still `unknown` and is worth resolving here); spoken-word formats that tolerate a 30-second interruption; commuter-native rituals from real couples; anything in the T4 verbal-game family that has not already been captured. Also worth testing whether any of the W4 entries genuinely survive the harder W3 constraint rather than merely being short.

**Done means:** `W3 × live-together` and `W3 × deep-talk` each have at least 3 entries at `verified` tier, and the two plausible-unverified W3 entries are corroborated or replaced.

### P0-B · Verify or replace the 9 plausible-unverified entries

These are segregated in `library.json` as `verification_tier: "plausible-unverified"`. They are internally consistent and each carries a real source, but none has a documented precedent. **They are disproportionately the library's most distinctive entries** — the asymmetry-exploiting rituals that the whole design leans on. The library's most interesting claims currently rest on its weakest evidence.

| Thread | id | What it claims | Window |
|---|---|---|---|
| T2 | `t2-narrate-day-eyes-closed` | He narrates his day in loose real time while she listens with eyes closed, no reciprocity required | W1 |
| T2 | `ldr-morning-audio-companion` | One audio call spanning her getting-ready + commute, speakerphone then headphones | W2 W3 |
| T2 | `t2-guided-tour-neighbourhood` | Rear-camera walking tour of his neighbourhood while she is desk-bound | W1 W2 W4 |
| T2 | `t2-cook-same-recipe-facetime` | Both cook the same recipe in separate kitchens | W7 |
| T2 | `t2-read-recipe-aloud-while-cooking` | Only one cooks; the other reads the recipe aloud | W2 W4 |
| T6 | `t6-commute-voice-question` | Exactly one question, delivered live or as a voice note, during her commute | W3 |
| T6 | `t6-text-relay-single-question` | One standalone question texted with no expectation of a fast reply | W4 |
| T6 | `t6-bedtime-nearly-asleep-question` | One soft question at the edge of sleep; falling asleep mid-answer is success | W1 |
| T1 | `t1-syncplay-local-file-sync` | Syncplay for a locally-owned file neither service carries in both countries | W5 W7 |

**Done means:** each is either (a) corroborated by a real couple describing it, with a permalink; (b) replaced by a better-sourced practice serving the same window and energy profile; or (c) confirmed as genuinely undocumented and left flagged. Do not simply re-assert them.

**Where to look:** r/LongDistance, r/LDR, r/longdistancerelationship for the T2 and T6 entries. For `t1-syncplay-local-file-sync`, just open `syncplay.pl` directly — round 1 sourced it only to a third-party aggregator and never reached the official site.

### ~~Confirm W3 and W4 are real~~ — RESOLVED 2026-08-02

Both confirmed by the founder. W4: "she can talk most days" — it is a core daily window and its 36 entries are load-bearing, not speculative. W3: "she commutes and can talk" — real, and the audio-only hands-free entries are the only thing in the library serving that constraint.

Kept here rather than deleted because it is the round's cheapest lesson: W2 was carried as a hunt target through six mid-flight threads and cost roughly a tenth of the research budget before it was corrected. W3 and W4 were checked *before* round 2 spent anything and both held. **Confirm window assumptions against behaviour before commissioning against them.** Two five-minute questions moved a large amount of budget.

### P0-C · Collect the taste profile

Every score in `library.json` is logistics-only. The library knows how these activities fit their clock; it knows nothing about whether either of them likes board games, what they watch, or what they have already tried and burned out on. The re-rank is built and waiting (`TASTE_PROFILE` in `build_library.py`) — it needs: loved genres/hobbies/existing shared media; things already tried that went stale; anything explicitly ruled out.

---

## P1 — Purchases and blockers the couple would hit within a week

### P1-A · Israel shipping, per product

Round 1 could confirm shipping to Israel for exactly one product (Totwoo, explicit regional pricing tier). Everything else is unknown or worked around.

| Product | Status after round 1 | What to do |
|---|---|---|
| **Lovense** (any device) | UNKNOWN. Five attempts across `lovense.com/long-distance-sex-toys`, `/faq`, `/shipping-info` (404), `/shipping-policy` (404), `/faq/Shipping/` (nav only) | Contact Lovense directly, or find their checkout country list. Also still unknown: real-time-only vs. scheduled/async control, and cellular vs. wifi-only. |
| **Kiiroo** | Israel absent from their ~40-country list, but never confirmed as an explicit exclusion vs. simply unlisted | Confirm with Kiiroo directly. This currently gates the library's only real-time device entry. |
| **Qwixx / Welcome To / Railroad Ink / Rory's Story Cubes** | General "Amazon ships games to Israel" only; no per-listing confirmation | Per-ASIN check. Note Welcome To and Railroad Ink both have verified free official companion apps, which already removes the need for a second copy — Qwixx's free printable sheet is only inferred. |
| **We're Not Really Strangers Couples Edition** | Price and Israel shipping both unconfirmed; product and shipping pages returned truncated content on repeat attempts | Check at checkout. The free WNRS Long Distance Pack and the single-copy pattern are the current workarounds. |

### P1-B · Close the split-day audit — 6 unknowns, empirically testable in one day

`APP-COMPATIBILITY.md` Part 3 shows only Gottman Card Decks and Cupla provably survive a 7-hour split day, both by having no daily-reset mechanic at all. **Six apps are genuinely unknown: Paired, Agapé, Coral, Evergreen, Lasting, Relish.** No app in the category publishes anything on reset timing.

**This does not need a researcher — it needs one day of use.** Install, both answer, and observe: do you see the same question at the same moment; does a streak survive a day where only one of you was inside the shared calendar date. Report the result; it is a genuinely novel finding for the whole product category, not just for this couple.

Also: **Relish shows no update since 25 May 2023.** Confirm whether it is abandoned before recommending it at all.

### P1-C · Fill the RED and AMBER cells

| Cell | Count | Assessment |
|---|---|---|
| `W6 × games` | **0 — RED** | **Probably correctly empty.** W6 costs him a 1–5am wake-up; nothing in the games category plausibly justifies that price. Before commissioning, decide whether this cell *should* be filled. If yes, the candidates are long-form live sessions (a full 7 Wonders Duel, an extended GeoGuessr run) reframed as event-grade. Low priority. |
| `W3 × live-together` | 2 — AMBER | **Promoted to P0-A** — see above. W3 is confirmed real and is the thinnest confirmed window; do not treat this as a P1 item. |
| `W5 × intimacy` | 1 — AMBER | Structurally hard, not a sourcing gap: he is fading while she is energised. This is the desire-asymmetry problem T7 researched head-on. Worth one targeted pass on clinician-sourced guidance for the low-desire-partner-is-exhausted case specifically. |
| `W6 × intimacy` | 2 — AMBER | Both existing entries are fine. One more event-grade option would help, but W6 is rare by design. Low priority. |

---

## P2 — Verification debt

### P2-A · Technical unknowns (T1, T3)

- **Prime Video SharePlay** — contested. Third-party blogs claim support; the App Store listing carries no badge. Watch Party was removed around 2024.
- **ESPN SharePlay** — `support.espn.com` returned HTTP 403 on every attempt. A support article titled "Apple SharePlay on ESPN" exists per search results but was never opened.
- **Paramount+** — App Store listing 404'd.
- **Max Israel vs US catalog parity** — the decisive unknown for `ldr-shareplay-film-night`. SharePlay works cross-border and Max is live in Israel; whether the two libraries carry the same titles was never confirmed.
- **NYT Games friends/streak comparison** — `nytimes.com` blocked automated fetching and the search budget ran out. A strong likely W4/W8/W9 candidate if it exists. Check `help.nytimes.com/games` directly.
- **Codenames: Duet online** — dropped from the library (see `library.json` → `drops`). Reinstate only with a verified, currently-live URL implementing the Duet ruleset, not classic team-mode.
- **Board Game Arena Premium** — unclear whether Splendor Duel or 7 Wonders Duel require the $3/mo tier.
- **Heads Up! SharePlay** — confirmed only against Apple's 2021 launch-partner announcement, never re-verified for 2026.
- **Israeli App Store pricing** — confirmed for GamePigeon (₪17.90) and Paired (₪49.90/mo) only. Chess.com, Words With Friends 2, Wordfeud, GeoGuessr Pro, Heads Up!, Netflix tiers, Coral, Lovewick, Longwalks, Evergreen all unchecked.
- **"Around"** (ambient video app) — could not confirm it still operates in 2026; all sources were 2020-era. Excluded from the library rather than included stale.

### P2-B · Institute-level re-sourcing (T5)

Several primary sources were paywalled or blocked, so claims currently rest on publishers and secondary corroboration:

- **ICEEFT** (`iceeft.com`) returned 403 on every page. Hold Me Tight / EFT is sourced to Sue Johnson's publisher and a non-official secondary site instead of the institute.
- **Aron et al. 1997 full text** — 403 via academia.edu. The SAGE journal page opened (so the citation is solid), but the full methodology was never read directly.
- **The 4-minute eye-gaze closer** — provenance contested. It is **not** confirmed to be part of Aron's published 1997 procedure; secondary journalism attributes its popularisation to Mandy Len Catron's NYT essay, drawing on Kellerman et al. 1989, which used **2 minutes, not 4**. Kellerman was 403 via ScienceDirect. Worth resolving — the library currently presents a 4-minute figure whose origin is unverified.
- **Impett, Park & Muise 2024** (love languages) — SAGE page rendered navigation only; the "10 of 10 studies" claim rests on an indexed snippet plus one secondary source.
- **Media multiplexity theory** — no clean primary citation found; dropped from the framing research rather than asserted.
- **No study exists** on remote/video administration of the 36 Questions specifically. The closest evidence is the 2025 fNIRS study on video-mediated vs. face-to-face couple communication generally. Worth a proper search — it bears directly on whether the library's flagship protocol works over FaceTime at all.

### P2-C · Device privacy model (T7)

Explicitly required by the round-1 brief and **not delivered**: the app-permission and Bluetooth/cloud-relay model for connected devices. T7 could not locate the correct official App Store listings without search — two candidates were checked and correctly rejected as wrong products. Needs either working search or hand-supplied URLs for: **We-Connect** (Standard Innovation / WOW Tech), **Lovense Remote** (developer listed as HYTTO PTE. LTD. per third-party tracking, unverified), and **Kiiroo FeelConnect**.

Also open: whether iMessage notifies the sender on screenshot (three candidate pages 404'd, deliberately excluded rather than asserted), and Apple's own documentation on whether Digital Touch delivers over internet or requires Bluetooth proximity.

### P2-D · Israeli food delivery

Wolt's Israel terms were verified directly: an Israeli-issued card is required **and** the person ordering must be physically in Israel, so she cannot order food to his address. Whether 10bis, Cibus or Mishlox have different rules was never checked. Both cooking entries already route around this by having each buy their own groceries, so nothing depends on it — but a confirmed cross-border food-delivery route would unlock a genuinely good W4 activity.

---

## P3 — Scope the founder deliberately deferred

### P3-A · The async / surprise category

Care packages, letters, gifts, playlists, streaks — deselected before round 1. It remains the largest known hole. Note specifically that **W8/W9 (the asymmetric free days) are exactly where async would have been strongest**, so those two columns read thinner than they truly are: 17 and 20 entries against W4's 36 and W7's 40.

### P3-B · Hebrew and Israeli-origin sources

All seven threads searched in English. Israeli-specific activities, Hebrew-language content, and Israeli product availability are systematically under-sampled. Threads checked Israeli *availability* of American products but never *discovered* anything Israeli-origin. A Hebrew-language pass would be a genuinely different search, not a repeat.

---

## What round 2 should NOT redo

- **The SharePlay capability map** (20 apps) is solid and current. Re-verify only Prime Video, ESPN and Paramount+.
- **The verbal-games territory** (T4) is well-sourced from rulebooks and needs nothing; its only real gap is per-product Israel shipping, covered in P1-A.
- **The Gottman protocol set** is sourced directly from gottman.com and is fine. Only the EFT/Imago and Aron primary-source items need revisiting.
- **Apple's encryption architecture** (iMessage, FaceTime, iCloud Backup, Advanced Data Protection) is verified directly from Apple's own security documentation at high confidence. Do not re-derive it.
