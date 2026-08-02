# App Compatibility — What Actually Works Across Israel and the US

*The technical substrate the rest of the library assumes. Sources: T1 (SharePlay + region locks, 20 apps) and T6 (split-day audit, 10 couple apps). Verified 2026-08-02.*

---

## Part 1 — The headline findings

**Netflix cannot be shared.** Netflix's own Help Center states an extra household member 'must be
activated in the same country where the account owner created it'. A shared Israel/US account is not
possible. Netflix also has no SharePlay support and its DRM blocks FaceTime screen-mirroring. Co-watching
Netflix means two separate regional subscriptions plus the Teleparty browser extension, plus checking
the title exists in both catalogs first. This is the single biggest cross-border friction found anywhere
in the research.

**Disney+ got better, quietly.** GroupWatch — which explicitly required both viewers to be in the same
country — was discontinued globally on 18 September 2023. SharePlay replaced it and carries no such
restriction. This app went from unusable-for-you to usable.

**Hulu is a trap.** It carries a genuine SharePlay badge, so it looks compatible. It is US-only with no
legitimate subscription path from Israel. Technically supported, practically unusable.

**No couple app documents what happens to 'today' when you are 7 hours apart.** Eight of the ten
examined publish nothing about split-day behaviour. This is a blind spot across the entire product
category, not a flaw in one app.

---

## Part 2 — SharePlay capability map (20 apps)

| App | Type | SharePlay | Both must subscribe | Region notes |
|---|---|---|---|---|
| Apple TV app | video | **yes** | yes | Apple TV+ confirmed live in Israel with Hebrew subtitle support; individual purchased/rented titles and channel bundles can still vary by App Store region. |
| Disney+ | video | **yes** | yes | Live in Israel since June 2022. Old 'GroupWatch' feature (same-country-only) was discontinued globally on Sept 18, 2023, replaced functionally by SharePlay. Per-title catalog can still differ by region. |
| Max (HBO Max) | video | **yes** | yes | SharePlay expanded globally to all ad-free subscribers in 2024. Max itself launched as a paid service in Israel in January 2026. Whether the IL and US Max catalogs match was not independently confirmed. |
| Hulu | video | **yes** | yes | Hulu is a US-only service with no legitimate subscription path from Israel — SharePlay support is technically real but practically unusable for this couple's Israel-based partner. |
| Netflix | video | no | yes | No SharePlay badge on its own App Store listing; DRM also blocks FaceTime screen-mirroring. Household/extra-member sharing explicitly requires the same country as the account owner per Netflix's own Help Center — a shared IL/US account is not possible. |
| Prime Video | video | *unknown* | unknown | No SharePlay badge found on its own App Store listing when checked directly, despite some third-party blog claims of support. The old 'Watch Party' feature was quietly removed around 2024. Treated as unconfirmed/likely-unsupported rather than assumed. |
| Plex | video | no | no | Uses its own proprietary 'Watch Together' feature, not Apple SharePlay. Removed from Plex's redesigned mobile/TV apps as of Feb 2025; remains on the Plex web app only 'for the foreseeable future' per a Plex spokesperson. |
| Spotify | music | **yes** | no | Confirmed to work across different countries per Spotify's own SharePlay documentation. Music catalogs differ by region (roughly 15-40% less content in some markets per industry reporting) but mainstream content is largely consistent. |
| Apple Music | music | **yes** | no | Only the SESSION HOST needs an active Apple Music subscription per Apple's own guide; the other participant can join without paying. Catalog differences between Israeli and US Apple Music were not independently checked. |
| Apple Podcasts | podcast | *unknown* | no | Apple's general SharePlay documentation lists Podcasts among 'Listen and Play Together' options in the FaceTime SharePlay menu, but the Apple Podcasts App Store listing shows no explicit SharePlay badge and live-sync mechanics for podcasts specifically could not be independently confirmed this session. |
| ESPN | sports | *unknown* | yes | A support.espn.com article titled 'Apple SharePlay on ESPN' exists per search results but returned HTTP 403 on every direct fetch attempt this session and could not be independently opened/verified. |
| Twitch | live-streaming | **yes** | no | Free to use, each partner uses their own account; no country restriction found. Up to 32 viewers per SharePlay session per Twitch's original 2021 announcement. |
| Teleparty | video-sync-tool (not SharePlay) | no | yes | Actively maintained as of July 2026 per its own public changelog (v5.7.3, supports 9 services including Netflix, Disney+, Max). Desktop/browser-only, no mobile app. Each partner still needs their own regional subscription and the title must exist in both catalogs. |
| Scener | video-sync-tool (not SharePlay) | no | yes | Chrome extension listing shows an update as recent as July 2026; supports Netflix, Disney+, Max, Hulu, YouTube. Not independently verified beyond the Chrome Web Store listing summary found via search. |
| Kast | video-sync-tool (not SharePlay) | no | n/a | SHUT DOWN. Do not recommend. Confirmed via multiple 'Kast alternative' roundup pages. |
| Metastream | video-sync-tool (not SharePlay) | no | n/a | No longer actively maintained as of 2026 per multiple third-party alternative-tool roundups; its own official status page was not independently opened this session. |
| Syncplay | local-file-sync-tool (not SharePlay) | no | no | Described as actively maintained and 'the gold standard' for local file sync by third-party roundups; Syncplay's own official site (syncplay.pl) was not independently opened this session, so this is lower-confidence than the App Store-verified entries above. |
| GamePigeon | games (iMessage, not FaceTime SharePlay) | no | no | Operates entirely over iMessage, a mechanically different surface from FaceTime SharePlay. Recorded here only for the capability map, per the packet's instruction — this belongs to T3's territory, not T1's activity list. |
| Chess.com | games | no | no | No SharePlay badge on its App Store listing; correspondence/turn-based play doesn't need real-time SharePlay sync anyway. Recorded for the capability map only — belongs to T3. |
| Paramount+ | video | *unknown* | yes | A WebSearch snippet claimed SharePlay support, but the App Store listing fetch returned HTTP 404 this session and could not be independently verified. |

### Dead or dying — do not recommend

- **Kast** — shut down.
- **Metastream** — no longer actively maintained as of 2026.
- **Plex Watch Together** — removed from Plex's redesigned mobile and TV apps in Feb 2025; web app only, 'for the foreseeable future'.
- **Prime Video Watch Party** — quietly removed around 2024. Prime Video's SharePlay status is contested and unconfirmed.

### Still alive as of July 2026

- **Teleparty** — v5.7.3, changelog current, 9 services. Desktop/browser only, no mobile.
- **Scener** — Chrome extension updated July 2026.

---

## Part 3 — Split-day audit: which couple apps survive a 7-hour gap

*The question: when 'today's question' arrives, whose today is it? An app that assumes both partners share a calendar day will misbehave for this couple every single day.*

| Product | Handles split day | Evidence |
|---|---|---|
| Paired | *unknown* | App Store listing and marketing describe a 'daily question' with an in-app answer/unlock format, but no help article, FAQ, or store listing found during this research documents whether the day boundary is per-device local time, a shared UTC day, or anchored to one partner. No user reviews surfaced describing a specific split-day failure for this app. |
| Agapé (Daily Agapé) | *unknown* | Marketing emphasizes a single daily question answerable independently in under a minute, which is inherently more tolerant of a split day than a live-sync feature would be, but no published documentation confirms the actual reset mechanism. |
| Longwalks: Journal Together | *unknown (structurally low-risk)* | Core mechanic is asynchronous journaling with dated entries rather than a single shared 'today,' which structurally sidesteps most split-day failure modes even without explicit documentation of its internal date-stamping. |
| Lovewick | *unknown (structurally low-risk)* | Cards are drawn on-demand from themed decks rather than delivered as a single synced daily card, reducing (not eliminating) split-day risk. No explicit documentation found on internal reset logic. |
| Coral: Couples & Relationship | *unknown* | Built around 'daily prompts' (confirmed live and updated, v3.1.0, March 26 2026 per App Store), but no help documentation on reset timing was found. |
| Evergreen: Relationship Growth | *unknown* | Daily-question format confirmed via official site and App Store listing; no documentation on timezone/reset handling found. |
| Gottman Card Decks | **YES** | No daily-streak or 'today's question' mechanic at all — it's a browsable card-deck library (14 decks, 1,000+ cards) picked on demand, so there is structurally no split-day concept to break. This is a T5-owned protocol source, but T6 owns this product-layer entry per the ownership rule. |
| Cupla (Shared Couples Calendar) | **YES** | A shared calendar/date-planner, not a daily-question app; calendar apps are timezone-aware by design (each event carries an explicit timezone), so the split-day failure mode affecting streak apps doesn't apply to its core function. |
| Relish | *unknown* | Public update history shows no visible update since May 25, 2023 per third-party tracking, suggesting frozen development; unclear whether the app is maintained enough for this to matter. Flagged for general product-health concern independent of the timezone question. |
| Lasting | *unknown* | Still active in 2026 (Talkspace-owned), delivers short daily Gottman-based exercises, but no documentation found on reset/timezone mechanics. |

### How to read this

**Only two products provably survive**, and both do so by having no daily-reset mechanic at all:
**Gottman Card Decks** (a browsable library you pick from) and **Cupla** (a shared calendar, which is
timezone-aware by design because every event carries an explicit timezone).

**Two more are structurally low-risk** because they are asynchronous by nature rather than by design:
**Longwalks** (dated journal entries read later) and **Lovewick** (cards drawn on demand, not delivered
as a synced daily card).

**Six are genuinely unknown**: Paired, Agapé, Coral, Evergreen, Lasting, Relish. None publishes anything
on reset timing.

**Practical advice:** treat any daily-streak feature as unverified until you have tested it. On day one,
check whether you both see the same question at the same moment, and whether a streak survives a day
where only one of you was inside the shared calendar date. If it breaks, it will break daily.

**Separately: Relish shows no update since 25 May 2023** per third-party tracking, suggesting frozen
development. That is a product-health concern independent of the timezone question.

