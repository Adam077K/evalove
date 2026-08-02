---
date: 2026-08-02
agent: R4-motion (session ceo-4-1785631505)
status: PARTIAL — see blockers below
tools_that_worked:
  - mcp__playwright__* (browser_navigate, browser_tabs, browser_take_screenshot, browser_click) — see contention note
  - WebFetch (raw.githubusercontent.com for Vaul/Sonner source)
  - WebSearch
  - Read / Grep / Bash on the local repo (source-level analysis, not live rendering)
tools_that_failed:
  - mcp__refero__* — every call (search_screens, search_styles, search_flows) returned
    `NO_SUBSCRIPTION`: "Your subscription is not active or has expired. Please visit
    https://refero.design/mcp/upgrade". BLOCKED for the entire session. Team-lead notified.
  - mcp__playwright__browser_evaluate — technically available but unusable in practice.
    This session's Playwright browser is a single shared instance across every teammate
    in the team (R1-voices, R1b-reddit, R2-churn, R3-asynchrony). R1b-reddit ran a long,
    fast loop of Reddit/Google/DuckDuckGo searches on the same browser for most of this
    session. The "current tab" pointer is global, not per-agent: their navigate() calls
    repeatedly stole focus from tabs I had just created, so any two-step sequence
    (select tab → evaluate) landed on their page instead of mine, nearly 100% of the
    time observed. `browser_take_screenshot` fired as the *immediate* next call after
    `browser_tabs {action:"new", url:...}` was reliable (confirmed by URL in every
    result); anything after that in the same or a later message was a coin flip.
    Practical effect: I could not extract live computed CSS (getComputedStyle) from
    third-party sites with any confidence, so Part 2 below leans on screenshots +
    published source code (Sonner/Vaul are open source) + documented facts, and is
    explicit everywhere about which is which.
  - mcp__claude-in-chrome__* — "Browser extension is not connected." Never available.
  - App password for https://eva-and-adam.vercel.app — single shared scrypt-hashed
    password, plaintext lives only in the founder's password manager per
    docs/03-system-design/LDR-APP-ARCHITECTURE.md. Requested from team-lead twice;
    no response by the time this file was written. Task 1 is therefore ONE observed
    screen (login) plus source-code analysis of the other six, clearly labeled as such.
products_reached:
  - eva-and-adam.vercel.app (login screen only — see blockers)
  - sonner.emilkowal.ski (live interaction: rendered a real toast)
  - vaul.emilkowal.ski (live interaction: opened a real drawer)
  - family.co (marketing site only, no live app)
  - linear.app (marketing site only, no live app)
  - arc.net (marketing site only, no live app)
  - things.app → culturedcode.com/things (marketing site only, static)
  - slowly.app (marketing site only)
  - dayoneapp.com (marketing site only)
  - retro.app (marketing site only)
  - raycast.com (marketing site only, no live app)
  - everytimezone.com (fully live, interactive — substitute reference, see Part 3)
  - Sonner/Vaul GitHub source (raw.githubusercontent.com — real shipped code, not a screenshot)
products_blocked:
  - locket.camera — redirects straight to the App Store listing; no live web app.
    Used the App Store listing's own screenshots instead (real in-app UI, staged).
  - things.app — is a native Mac/iOS app; the domain is a redirect to the marketing
    site, which has no interactive product surface to observe.
  - refero — entire tool, all three functions, see above.
  - Six of seven eva-and-adam.vercel.app fixture surfaces (home, book, today, dates,
    send, echo, pocket) — behind auth, no password available.
---

# R4 — Motion and Real Products

## Before anything else: two blockers that shaped this whole report

1. **refero is down for this account** (`NO_SUBSCRIPTION`). The brief's own words: *"Two
   previous design passes never looked at a single real product. One of them said so in
   its own document: refero and Playwright were unavailable, so its reference list was
   written from memory. Do not repeat that."* I did not repeat that — Part 3 is built
   entirely from products I actually opened in a browser or real App Store listings, not
   memory — but it is a materially worse substitute for what refero would have returned
   (dozens of pre-catalogued, high-quality real screens per query, in seconds). If refero
   gets fixed, Part 3 should be redone properly.

2. **The Playwright browser is shared across the whole team, live, for the whole
   session.** This is worth flagging as an infrastructure finding on its own, not just a
   personal obstacle: any teammate doing rapid sequential `navigate()` calls (R1b-reddit
   was running Reddit/Google/DuckDuckGo searches essentially the entire time I was
   working) will silently hijack whatever tab another agent just created, because "the
   current tab" is one global pointer, not scoped per agent. I adapted by pairing
   `tabs new` with an *immediate* screenshot (which held up), and abandoning
   `browser_evaluate` (which never held up). Every screenshot cited below was verified
   against the URL returned in that same tool call's own response — I threw out and
   redid two captures that landed on someone else's tab (an earlier login capture and an
   earlier Sonner capture, both silently replaced with Reddit/DuckDuckGo content).

---

## Part 1 — The current app, surface by surface

**One surface fully observed** (login). **Six surfaces BLOCKED** — I never got a valid
session, so `home`, `book`, `today`, `dates`, `send`, `echo`, `pocket` were never
rendered in a browser for me. Everything below for those six is **read from source
code**, not observed — I'm labeling every claim that way, and I'm not describing motion,
layout, or interaction I didn't see run.

### Login — observed live, iPhone viewport (393×852)

Screenshot: `docs/08-agents_work/research/screens/current/00-login.png`

**What's on screen:** the entire visible canvas is a soft pink→peach→lavender gradient
wash, edge to edge, top to bottom. Centered low on the screen (roughly the bottom third):
a "Password" label in small black text, a password input with a visible purple focus
ring, and a pill-shaped button reading "Come in" filled with a pink gradient. Nothing
else — no logo, no wordmark, no copy explaining what the app is.

**What happens on tap:** typing in the field enables the button (confirmed from source —
`disabled: password === "" || pending`). I did not have a valid password to observe the
success path live. Read from source (`LoginForm.tsx`): a wrong password clears the field
and shows one fixed sentence, "That's not it. Try again."; a correct one advances to a
second in-page step, "Who's this?", with two full-width pills — "Eva" first, "Adam"
second, per the founder's name-order rule — that just set an attribution cookie and
route to `/home`. I did not observe this second step; I'm reporting it from
`components/auth/LoginForm.tsx` because it's directly relevant to the interaction design,
not because I saw it.

**Motion:** read from source, not observed running — three blurred radial gradient
blobs (`components/chrome/AuroraBackdrop.tsx`) drift on independent 26s/34s/38s loops
using `var(--ease-io)`. I could not confirm this drift live (my screenshot is a single
frame), but the component exists, is mounted on this page, and — critically — is **also
mounted in `app/(app)/layout.tsx`**, meaning it is not a login-only flourish; it is the
persistent background behind all seven authenticated surfaces too.

**Grayscale test — fails outright, no ambiguity.** There is no photograph on this screen
at all, so there is nothing to "delete" — and it still isn't black on white. Concretely,
from `app/globals.css`:
- `--canvas: #faf6fb` — a tinted lilac-white, not white or bone. This is the exact token
  DESIGN-DIRECTION.md names as violation #1.
- `--aur-rose: rgba(255,130,174,.4)`, `--aur-violet: rgba(161,132,255,.34)`,
  `--aur-amber: rgba(255,179,92,.32)` — three overlapping full-saturation color washes
  animating across the whole viewport.
- The password field's focus ring is a saturated purple, not neutral.
- The button uses `background: var(--grad-eva)` (a gradient, killed by name in the design
  direction's kill list) plus `shadow-glow-eva` (`0 10px 30px -8px rgba(232,68,127,.45)`
  — a colored glow, also killed by name).

**Single worst thing about this screen:** there is no reason for a door — the one screen
every session starts at, for exactly two people who already know what app this is — to
look like a mood-board template for a meditation app. It's the founder's own "vibe-coding
AI slop" verdict rendered literally: nothing here is broken, and none of it is *for* Eva
or Adam specifically.

### The six authenticated surfaces — BLOCKED live, source-derived only

I grepped every component for the exact tokens DESIGN-DIRECTION.md kills, so the design
team has a real map of blast radius even without me getting in:

| Killed pattern | Files that use it |
|---|---|
| `AuroraBackdrop` / `aurora-layer` | `app/(app)/layout.tsx` (i.e. **every** authenticated page), `app/login/page.tsx` |
| `shadow-glow-*` | `components/ui/PillButton.tsx`, `components/home/SealedCard.tsx`, `components/home/EchoTile.tsx`, `components/chrome/Dock.tsx` |
| `.glass` / `.glass-strong` / `backdrop-blur` | `app/(app)/home/page.tsx`, `components/echo/EchoChat.tsx`, `components/chrome/Dock.tsx`, `components/send/QuickSend.tsx` |
| gradients (`--grad-eva/adam/us`, `bg-gradient-*`) | `app/(app)/home/page.tsx`, `components/ui/PillButton.tsx`, `components/home/DualClocks.tsx`, `components/home/TonightCard.tsx`, `components/home/EchoTile.tsx`, `components/home/SealedCard.tsx`, `components/dates/DatesExplorer.tsx`, `components/echo/EchoChat.tsx`, `components/chrome/Dock.tsx` |

Two components worth reading in full because they're the closest thing that exists today
to what the new design direction actually wants:

- **`components/home/SealedCard.tsx`** is already the "one leaves something, the other
  finds it" idea — a sealed card that flips to an opened note on tap, using
  `framer/motion`'s `AnimatePresence` with a real spring (`stiffness: 300, damping: 30`).
  Structurally this is close to right. Chromatically it's a textbook violation: the
  sealed state is filled `var(--grad-us)` (a violet gradient — note `--us` is a token the
  design direction deletes outright, since jointness should read from composition, not a
    third hue), has `shadow-glow-us`, and animates a diagonal light-sweep shimmer across
  itself every 3.4s.
- **`components/chrome/Dock.tsx`** has a detail worth keeping outright: the active tab's
  background is a single `motion.span` with `layoutId="dock-active"` that spring-tweens
  between destinations (`stiffness: 420, damping: 34`) — that's a real, correct
  Family/iOS-native-feeling pattern, not slop. It's just filled with `bg-us-soft` (a
  tinted violet) instead of a neutral.

One structural fact that matters for the rebuild: `app/globals.css` already defines
`--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-io: cubic-bezier(0.32, 0.72, 0, 1)`,
and `--dur-1` through `--dur-4` (150/220/320/520ms), and the global `.press` utility
already does `transform: scale(0.97)` on `:active` over `--dur-1`. This is exactly what
DESIGN-DIRECTION.md §3 says to keep ("`--ease-out`, `--ease-io`, the four durations... were
never the problem") — I can confirm from source that claim is accurate. The problem the
whole team is fixing is color and surface treatment, not the motion primitives.

**What this app feels like to use, bluntly:** based on the one screen I could actually
touch plus the pattern that repeats through every component I read, this reads as a
generic "wellness/dating app starter kit" — the aurora gradient, the glass cards, the
colored glow on every button are a *recognizable template family*, not a considered
choice for two specific people. The founder's reaction ("it looks terrible... vibe
coding AI slop") is legible directly in the CSS: the canvas itself is tinted, every
primary action glows, and the one genuinely good idea in the app (SealedCard's
open-on-tap gesture) is buried under decoration that has nothing to do with Eva or Adam.

---

## Part 2 — Motion, product by product

Legend: **MEASURED** = read directly from published source code. **OBSERVED** = I drove
it live and watched it happen, screenshot attached. **DOCUMENTED** = a public statement
by the product's own designers, not something I measured myself. **IMPRESSION** = a
static screenshot only, explicitly not a motion claim.

### Vaul (drawer) — MEASURED + OBSERVED

Source of truth: `raw.githubusercontent.com/emilkowalski/vaul/main/src/constants.ts`.

- **MEASURED:** `TRANSITIONS = { DURATION: 0.5, EASE: [0.32, 0.72, 0, 1] }` — i.e.
  **500ms, `cubic-bezier(0.32, 0.72, 0, 1)`**. This is the exact number and curve our
  `emilkowal-animations` skill specifies for drawers/sheets. Also measured:
  `VELOCITY_THRESHOLD = 0.4`, `CLOSE_THRESHOLD = 0.25` (drag fraction before a release
  commits to closing), `SCROLL_LOCK_TIMEOUT = 100`.
- **OBSERVED** (`motion-vaul-01.png` → `motion-vaul-02-open.png`): clicked "Open Drawer"
  live. The drawer rises from the bottom as a white sheet with a centered grey grab
  handle; the page behind it visibly **scales down and reveals a black bezel**, giving
  the sense of the whole screen receding into a device frame rather than just being
  covered. That recede-behind-a-dark-frame effect is Vaul's signature and is not
  mentioned anywhere in our skill.
- Interruptible: not directly confirmed (my drag-gesture tests were blocked by the same
  browser contention as the evaluate calls), but the constants file exporting a
  `CLOSE_THRESHOLD` implies the drag is sampled continuously, not fire-and-forget.
- `prefers-reduced-motion`: not confirmed live.

### Sonner (toast) — MEASURED + OBSERVED

Source of truth: `raw.githubusercontent.com/emilkowalski/sonner/main/src/styles.css`.

- **MEASURED:** the toast's own transition is `transform 400ms, opacity 400ms,
  height 400ms, box-shadow 200ms` (not eased with a named curve in that shorthand —
  plain `ease`, per the fetched file). The toaster *container* uses
  `transition: transform 400ms ease`. The **enter** keyframe (`sonner-fade-in`) is
  `opacity 0→1, scale 0.8→1` over **300ms ease**. The **swipe-dismiss** animation is
  **200ms, `ease-out`**. Close-button transform on hover: `translate(-35%, -35%)`.
- **MEASURED, and this directly contradicts our skill:** `prefers-reduced-motion` in
  Sonner's own CSS sets `transition: none !important; animation: none !important;` —
  i.e. **motion is fully removed**, not degraded to an opacity-only fade. Our skill says
  "honour `prefers-reduced-motion`, degrade to opacity, don't strip motion entirely."
  Sonner, the reference implementation our skill is explicitly derived from, does the
  opposite for toasts.
- **OBSERVED** (`motion-sonner-03-toast.png`): clicked "Render a toast" live; a white
  card with a soft neutral shadow appeared bottom-right, stacked above the trigger
  button, with the toast's own text ("Sonner — An opinionated toast component for
  React.") inside a rounded rectangle. No colored border, no glow, consistent with the
  library's own restrained default styling.

### Family (family.co) — IMPRESSION only

The marketing site (`motion-family-01.png`) is mostly static illustration and
screenshot-in-a-frame content; I could not reach the actual iOS wallet app (requires
download/account), so I have **no observed or measured motion for Family** despite it
being cited in the brief as best-in-class. I did not fabricate a motion description for
it. What I can report from the static page: rounded-square UI chips with a friendly
mascot-illustration system, a segmented "Secure / Fast" feature grid, and a phone-frame
screenshot showing a transaction-status vertical stepper (Submitted → Pending →
Completed) that's structurally close to what a "sealed → opened" status trail could look
like — but this is a layout observation, not a motion one.

### Linear — IMPRESSION, with one real catch

`motion-linear-01.png` was captured mid-render: the hero headline ("The product
development system for teams and agents") shows a visible **blurred duplicate ghosting
behind the crisp text** — I caught the page mid-entrance-animation, which is itself
evidence Linear animates its hero headline in with some kind of blur/opacity reveal on
load, but a single frame can't tell me the duration or easing, so I'm not asserting
numbers for it. **DOCUMENTED**, from Rauno Freiberg (design engineer, formerly Arc/The
Browser Company, now Vercel, closely associated with this whole design lineage) via his
published essay "Invisible Details of Interaction Design": animation duration for direct
manipulation shouldn't exceed ~200ms to read as immediate; dialogs should scale in from
~0.8, not 0→1; and low-novelty, frequent actions should get little or no extraneous
animation. These are documented principles, not something I measured off Linear's own
DOM.

### Arc / Raycast / Things — IMPRESSION only

All three marketing sites (`motion-arc-01.png`, `motion-raycast-01.png`,
`motion-things-01.png`) are static hero pages with product screenshots baked into
images; none of the actual desktop apps are reachable through a browser. No motion
claims for any of the three beyond what's visible in a single frame (Raycast: grainy
diagonal red light-streaks on black, aggressive and confident, closer to a gaming brand
than a productivity one; Arc: soft pastel gradient hero promoting "Dia" now rather than
Arc itself — Arc-the-browser is being sunset in favor of Dia, worth flagging since the
brief cites Arc as a quality bar and the company's own homepage is steering away from it).

### Locket, Slowly, Day One, Retro — IMPRESSION only, but genuinely useful as references

None of these have a meaningfully interactive web presence (Locket redirects straight to
the App Store; the rest are marketing pages). Screenshots are cited fully in Part 3,
since they're more valuable as **structural** references than motion ones.

### `prefers-reduced-motion` — only one confirmed data point

Sonner's own source (above) is the only place I could directly confirm reduced-motion
behavior, and it disagrees with our skill (full removal, not opacity-only degrade). I
could not confirm Vaul's or any other product's reduced-motion handling this session —
marking that a gap rather than guessing.

---

## Part 3 — refero substitute findings, organized by our three surfaces

refero was unavailable all session (see blocker #1). Everything below is a real product I
opened directly, or a real App Store listing's own screenshots — never invented.

### Today — "what the other one left while you slept"

- **Locket Widget** (App Store listing, `motion-locket-01.png`) — the entire product is
  built around exactly this idea: a photo the other person took lands as a **live home
  screen widget**, no app-open required. The three App-Store screenshots shown are
  themselves the pitch: "Add your best friends to your Home Screen," "Send pics to
  friends' Home Screens," "Weekly photo dumps." **Steal:** the widget-as-inbox idea —
  the thing waiting for you doesn't require opening the app at all, which is a stronger
  answer to "what does Eva do at 11pm" than any in-app screen. **Grayscale test:** fails
  — every screenshot is staged on a black phone frame with warm/amber gradient chrome —
  but the *underlying mechanic* (photo appears where you already are) survives being
  stripped of color completely; it's structural, not chromatic.
- **Day One** (`motion-dayone-01.png`) — real product screenshot shows a left-hand
  vertical date list (day number + one-line preview per entry, current day highlighted
  with a filled pill) next to the open entry, and a small numeral-in-a-circle badge
  ("5") next to "On This Day" in the sidebar, denoting five past entries on this
  calendar date. **Steal:** the date-list-plus-badge pattern is a clean, low-drama way
  to say "there's something here from before" without a guilt mechanic. **Grayscale
  test:** the marketing screenshot itself is white sidebar / white detail pane with a
  warm sunset photo providing the only saturation — this one **passes** the law as
  photographed; it's genuinely close to our target already.

### The Gap — the two-clock, two-calendar-date spine

- **everytimezone.com** (`ref-everytimezone-01.png`, fully live and interactive) — not a
  polished consumer app (dark, ad-supported, utility-grade), but structurally the single
  most relevant thing I found all session for this specific surface. Each city is a full
  horizontal row spanning several days; a single vertical "now" line cuts through every
  row at once; and — this is the important part — **the date-boundary is drawn as a
  visible seam inside each row**, where the pill-shaped date label changes from "31 July"
  to "1 August" partway across, so you can see at a glance which cities have already
  crossed into tomorrow relative to you. That's a literal, working answer to "for seven
  hours of every day they're on different calendar dates." **Steal:** the now-line
  crossing every row simultaneously, and the date label living *inside* the row rather
  than in a header, so the crossing moment is visible in place. **Grayscale test:**
  fails as-is (dark purple/near-black chrome, colored flag emoji) — but the row/now-line/
  date-seam structure is 100% colorless already; it would survive being rebuilt in ink
  on white without losing anything.
- No refero results for "world clock" / "dual timezone" iOS patterns this session — this
  is exactly the kind of gap refero would normally fill with several curated native-app
  screens; flagging that this section is thinner than it should be.

### Saturday — the one shared day off

- **Slowly** (`motion-slowly-01.png`) — real screenshot shows the core ritual as a phone
  UI: a circular "seal" icon mid-screen and a stamp-collecting metaphor for
  correspondence with real-world postal delay built in on purpose. **Steal:** the
  seal-icon-as-affordance (a specific, ownable glyph for "this is sealed, not empty") and
  the idea of *artificial* delay as a feature, not a bug — directly relevant to "make
  asynchrony feel like a gift." **Grayscale test:** fails hard — the entire hero is a
  saturated mustard-yellow field with navy line-art illustration; nothing here should be
  copied chromatically.
- **Retro** (`motion-retro-01.png`) — a single Polaroid-style photo card, drop-shadowed,
  slightly overlapping a large serif headline ("Your friends, week to week"), with a
  small chrome year-badge object above it. **Steal:** the weekly cadence framing itself
  ("week to week") is close to a Saturday-only rhythm, and the physical Polaroid-card
  object (rounded corner, white photo border, printed year + username in a fixed
  typewriter-ish caption zone) is a strong, ownable object for a single weekly artifact.
  **Grayscale test:** genuinely close to passing — headline is a large black serif on
  white, the only saturation is inside the photograph itself (a warm interior scene) and
  the "2026" chrome badge, which reads as neutral metal, not a color choice.

I found no useful voice-waveform-player or photo-first-onboarding references this
session — both were meant to come from refero and I did not have a good live-browser
substitute for either category in the time available. Flagging as a genuine gap, not
silently skipping it.

---

## Motion spec proposal

Numbers **measured** this session (Vaul source, Sonner source) are marked M. Numbers
that are **already in this codebase today** and match the skill are marked E (existing).
Everything else is my **judgement** (J), built from what I measured plus the documented
Raycast/Linear principle of keeping direct-manipulation feedback under ~200ms.

| Moment | Duration | Easing | Trigger | Basis |
|---|---|---|---|---|
| Press feedback (any tappable) | 150ms | `cubic-bezier(0.22,1,0.36,1)` (ease-out) | `:active` → `scale(0.97)` | **E** — already `app/globals.css` `.press` / `--dur-1` |
| Standard UI transition (tab switch, list item) | ≤220–320ms | `--ease-out` | route/state change | **E** — `--dur-2`/`--dur-3` already defined and match skill's "≤300ms" |
| Sheet / drawer (e.g. opening a sealed item, or Saturday's date-idea detail) | 500ms | `cubic-bezier(0.32,0.72,0,1)` | swipe-up or tap | **M** — verified byte-for-byte against Vaul's shipped `TRANSITIONS` constant |
| Toast / small confirmation | 300ms in / 200ms out (swipe-dismiss) | `ease` in, `ease-out` out | enter: mount; exit: swipe or timeout | **M** — verified against Sonner's shipped CSS |
| **Signature moment — opening something sealed while you were asleep** | 500ms open (drawer-class), content fade/settle at +100–150ms stagger | `cubic-bezier(0.32,0.72,0,1)` for the container; press-in feedback (`scale(0.97)`, 150ms) on the tap that triggers it | Tap on a sealed item | **J**, grounded in M — same duration class as Vaul's drawer (it's structurally a reveal, not a toast), because this is the single highest-craft moment in the product and 500ms is the only "slow enough to feel considered, fast enough to not feel laggy" number I can point to with real shipped-product evidence. Recommend: the seal itself doesn't just disappear — it should recede/scale down the way Vaul's background does (M, observed), giving the sense of the surface opening onto something behind it, echoing the Time-Capsule reference from the founder's own folder. |
| Drag-to-dismiss threshold (if a sealed card gets a swipe-to-open gesture) | commit at 25% of travel, 0.4 velocity | — | drag release | **M** — Vaul's `CLOSE_THRESHOLD`/`VELOCITY_THRESHOLD`, inverted for open instead of close |

---

## Where our animation skill is wrong

1. **`prefers-reduced-motion` should not be a blanket "degrade to opacity" rule.**
   Measured directly from Sonner's own shipped CSS (the reference implementation our
   skill cites by name): reduced-motion sets `transition: none !important; animation:
   none !important;` — full removal, not an opacity fallback. If the skill's rule is
   meant to be a general house style rather than a claim about what Sonner/Vaul
   themselves do, that's a legitimate design choice — but the skill currently implies
   it's following the reference implementations' own behavior, and for Sonner at least,
   it isn't. Recommend either softening the claim or stating explicitly that we're
   diverging from the reference libraries on this one point and why.
2. **Toast timing is 400ms/300ms, not ≤300ms across the board.** Sonner's own
   toast-container transition is `400ms`, and its own enter keyframe is `300ms` — both
   at the edge of or past the skill's blanket "UI transitions ≤300ms" rule. Toasts
   probably deserve their own line item rather than falling under the generic UI-transition
   ceiling, since the reference implementation itself doesn't hit that number.
3. **Everything else I could verify — the drawer number (500ms,
   `cubic-bezier(0.32,0.72,0,1)`), press `scale(0.97)`, ease-out-in/ease-in-out — held up
   exactly.** No contradiction found on those; worth stating plainly since three failed
   checks with two disagreements and one confirmation is a very different finding than a
   skill riddled with errors.
