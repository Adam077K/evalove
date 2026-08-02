---
title: Creative Lens 3 — The Medium
owner: creative-technologist
date: 2026-08-02
revision: 2 — absorbs the founder's vocabulary decision (DATES, hosted in the app, genuinely played)
status: ideation (not a spec, not a plan)
scope: what an installed iOS PWA can actually do for two people seven hours apart
companions: docs/03-system-design/LDR-APP-ARCHITECTURE.md · docs/04-features/LDR-APP-DESIGN-DIRECTION.md
---

# The Medium

*Everything below was checked against a support table on 2026-08-02. Every claim is marked `supported` / `partial` / `unsupported-on-iOS` with where I checked. Where I could not verify something from a compat table — because it is runtime behaviour, not an API — I say so rather than guessing.*

**Revision 2 note.** The founder has decided the things they do together are **dates**, and that the app genuinely hosts them rather than suggesting them. That is not a rename — it changes what the capability audit is for. A capability that adds polish is worth a line; a capability that makes an *occasion possible that otherwise wouldn't be* is worth a section. §2, §3, §4 and §6 are new and carry most of the weight.

---

## 0. The premise, and the two things it actually buys

No App Store review, no privacy policy, no scale, no other users. The usual reason a product ships 5% of the platform is that the other 95% needs a permission prompt, a policy page, or a support burden that two hundred thousand users make expensive. Two users make all three free.

But that is not the interesting constraint. Two facts shape this product more than the permission story:

**One: a backgrounded iOS PWA is not asleep, it is off.** No background sync, no scheduled notification, no timer, no sensor, no location, no microphone. That is more design-shaping than anything else on this page, and it points where the design already went: this is an object you pick up, not a service that runs. The app cannot watch them. It can only be *present when opened* and *leave things*.

**Two: the seven-hour gap makes asynchronous the default and synchronous the luxury.** Most date formats in the world assume both people are present. Here, both present is a four-hour window once a day, and one asleep is the normal condition. A date that requires simultaneity is a date they can attempt on a fifth of the clock. **The platform is unusually good at the async shape and unusually bad at the live one** — no background execution means nothing can expire, nag, or run down a clock while you sleep, which is exactly the property an async date wants and exactly the property a live one can't have.

Third, from the research: her commute is the hardest window — underground, no signal, hands busy, can't look at a screen. Three of those four are solved by caching. The fourth is not a caching problem. It's an **audio** problem, and the app currently has no sound in it at all. That remains the largest unexploited surface in the product, and dates make it larger.

---

## 1. Capability table

Verified 2026-08-02. iOS Safari current release at time of checking: **26.5**.

### Supported — usable today

| Capability | iOS PWA support | Checked | What it makes possible |
|---|---|---|---|
| **Media Session API** | ✅ iOS 15+ | [caniuse.com/mdn-api_mediasession](https://caniuse.com/mdn-api_mediasession) | **The single most date-enabling API on the list.** Lock-screen artwork and AirPods stem control — a date she runs from her pocket on the subway. Without it, audio needs an unlocked screen in her hand. |
| **`navigator.audioSession`** | ✅ iOS 16.4+ | [BCD `api/AudioSession.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/AudioSession.json) | WebKit-only, and almost nothing uses it. Declares the audio session `type` (`playback`, `ambient`, `transient`, `play-and-record`), which governs ducking, the silent switch, and background behaviour. **This is the knob that makes lock-screen audio behave.** |
| **Web Audio API** | ✅ iOS 6+ | [caniuse.com/audio-api](https://caniuse.com/audio-api) | Waveform rendering, page sound, layered ambience. `AudioContext` starts suspended until a user gesture — WebKit behaviour, not in the compat table. |
| **MediaRecorder** | ✅ iOS 14.5+ (12–14.4 behind a flag) | [caniuse.com/mediarecorder](https://caniuse.com/mediarecorder) | Voice recorded **fully offline** — no network to capture. She can leave him something from the tunnel. Requires the app foregrounded (§5). |
| **getUserMedia (camera + mic)** | ✅ iOS 11+; broken in installed PWAs until **13.4**, working since | [caniuse.com/stream](https://caniuse.com/stream) | The camera as a date *input* rather than a photo source — #12. Live capture is the only way to enforce "right now." |
| **Screen Wake Lock** | ✅ iOS 16.4+ | [caniuse.com/wake-lock](https://caniuse.com/wake-lock) | Any date where they look without touching. Without it a live date dies at the screen timeout. |
| **Service Workers** | ✅ iOS 11.3+ | [caniuse.com/serviceworkers](https://caniuse.com/serviceworkers) | The offline date. |
| **IndexedDB** | ✅ iOS 10+ (clean from 15) | [caniuse.com/indexeddb](https://caniuse.com/indexeddb) | Durable move queue. Her turn survives a killed app in a tunnel. |
| **OPFS (`storage.getDirectory`)** | ✅ iOS 15.2+ | [caniuse.com/mdn-api_storagemanager_getdirectory](https://caniuse.com/mdn-api_storagemanager_getdirectory) | A real filesystem for the archive. Better than IndexedDB for hundreds of MB of photo and audio blobs. |
| **`navigator.storage.persist()`** | ✅ iOS 15.2+ | [caniuse.com/mdn-api_storagemanager_persist](https://caniuse.com/mdn-api_storagemanager_persist) | **Correction to the architecture doc** — the home-screen eviction exemption is not the only lever. |
| **SpeechSynthesis (TTS)** | ✅ iOS 7+ | [caniuse.com/speech-synthesis](https://caniuse.com/speech-synthesis) | Structural narration only — dates, page counts. Never their words (#22). |
| **Web Push + Notification** | ✅ iOS 16.4+, **installed only** | [BCD `api/PushManager.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/PushManager.json) — *"Notifications are supported in web apps saved to the home screen."* · [BCD `api/Notification.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Notification.json) — *"The parent `Notification` interface is undefined unless the page is a web app saved to the home screen. The app's manifest must have a non-default `display` value."* | The one notification (§6). Requires a user gesture to request. |
| **Declarative Web Push** | ✅ iOS 18.4+ | [webkit.org/blog/16535](https://webkit.org/blog/16535/meet-declarative-web-push/) | Push with **no service worker and no JS execution**. Structurally cannot be silent, cannot track. |
| **Badging API (`setAppBadge`)** | ✅ iOS 16.4+ | [caniuse.com/mdn-api_navigator_setappbadge](https://caniuse.com/mdn-api_navigator_setappbadge) | **The correct signal for a waiting turn.** No sound, no banner, vanishes when looked at. |
| **DeviceOrientation / Motion (relative)** | ✅ iOS 4.2+; `requestPermission()` iOS 14.5+ | [caniuse.com/deviceorientation](https://caniuse.com/deviceorientation) · [BCD `api/DeviceOrientationEvent.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/DeviceOrientationEvent.json) | Tilt as a date input. Only while foregrounded (§5). Costs a permission prompt. **Absolute/compass is a different story — see partial.** |
| **Pointer Events** | ✅ iOS 13.2+ | [caniuse.com/pointer](https://caniuse.com/pointer) | Every touch-driven date. Unglamorous and load-bearing. |
| **View Transitions (same-document)** | ✅ iOS 18.0+ | [caniuse.com/view-transitions](https://caniuse.com/view-transitions) | A date opens *out of* a page rather than in a modal. Keeps it in the book. |
| **CSS `animation-timeline`** (scroll-driven) | ✅ **iOS 26.0+** | [caniuse.com/mdn-css_properties_animation-timeline](https://caniuse.com/mdn-css_properties_animation-timeline) | Newest useful thing on the platform. Could carry the riffle with **zero JS** — #24, and design risk P1. |
| **WebRTC (`RTCPeerConnection`)** | ✅ iOS 11+ | [caniuse.com/rtcpeerconnection](https://caniuse.com/rtcpeerconnection) | Possible for live dates, and **the wrong choice** — #26. |
| **BroadcastChannel** | ✅ iOS 15.4+ | [caniuse.com/broadcastchannel](https://caniuse.com/broadcastchannel) | Same-device tabs only. **Useless for two phones** — listed so nobody proposes it for presence. |
| **Web Share (`navigator.share`)** | ✅ iOS 12.2+ | [caniuse.com/web-share](https://caniuse.com/web-share) | Export a printed book out through the iOS share sheet. |
| **WebAuthn / passkeys** | ✅ iOS 14.5+ | [caniuse.com/webauthn](https://caniuse.com/webauthn) | Face ID as a second factor on a shared password. Addresses architecture §6.4 directly. |
| **`prefers-reduced-motion`** | ✅ iOS 10.3+ | [caniuse.com/prefers-reduced-motion](https://caniuse.com/prefers-reduced-motion) | Already in the design doc. Correct. |
| **`backdrop-filter`** | ✅ iOS 9+ | [caniuse.com/css-backdrop-filter](https://caniuse.com/css-backdrop-filter) | Supported and **deliberately unused** — the design bans faux materials, rightly. |

### Partial — real, but verify on a device before committing

| Capability | Status | Checked | Caveat |
|---|---|---|---|
| **Absolute / compass orientation** | ◐ Standard routes **dead**; only a non-standard property remains | [BCD `api/DeviceOrientationEvent.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/DeviceOrientationEvent.json): `absolute` is `safari_ios: false` · [caniuse `deviceorientationabsolute`](https://caniuse.com/mdn-api_window_deviceorientationabsolute_event): not supported 3.2–26.5 | Both standardised paths to a compass heading are **explicitly unsupported on iOS**. The only route left is `webkitCompassHeading`, a non-standard WebKit property BCD does not track at all — so I cannot verify it and neither can anyone else from a table. Any date needing a bearing (#13) must be prototyped on a device first. **Relative tilt is solid; absolute is not.** |
| **SpeechRecognition** | ◐ iOS 14.1+, `webkit`-prefixed | [caniuse.com/speech-recognition](https://caniuse.com/speech-recognition) (partial at every iOS version) · [BCD `api/SpeechRecognition.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/SpeechRecognition.json) (`safari_ios: "mirror"` → Safari 14.1, webkit-prefixed) | Standalone-mode behaviour unverified. **But the format it was wanted for is dead for a better reason — §10.** |
| **`navigator.share({ files })`** | ◐ Needs a check | [caniuse.com/web-share](https://caniuse.com/web-share) carried no file-sharing note | Plain `navigator.share` confirmed; file sharing specifically unverified. Gate the PDF export (#27) on a five-minute device test. |
| **`setAppBadge()` with no argument** | ◐ API confirmed, rendering unconfirmed | [caniuse.com/mdn-api_navigator_setappbadge](https://caniuse.com/mdn-api_navigator_setappbadge) | Whether a no-arg call renders a **dot** rather than a number on iOS is a rendering detail I did not verify. It matters — a number is a counter, and counters are cut. |
| **Audio continuing while backgrounded** | ◐ Behaviour, not an API | No compat table covers this | An `<audio>` element with Media Session metadata generally keeps playing on iOS when the screen locks; a bare `AudioContext` graph gets suspended. **Consequence: anything meant to survive backgrounding must be a real media element, not Web Audio** — and should declare `navigator.audioSession.type = 'playback'`. The commute date depends on this. Test first. |
| **Push subscription lifetime on iOS** | ◐ Unverified | — | Treat re-subscription as routine, not an error. |

### Unsupported on iOS — proof in §10

Vibration/haptics · Ambient Light Sensor · Battery Status · Background Sync · Periodic Background Sync · Notification Triggers · absolute device orientation · Web Bluetooth · Web NFC · File System Access API · **Web Share Target** · manifest `shortcuts` · `ScreenOrientation.lock()` · `beforeinstallprompt`.

---

## 2. The five shapes a date can have

Before any date idea, the taxonomy — because the platform treats these very differently and the gap makes the distribution lopsided.

| Shape | When it works | What the platform demands | Share of the clock |
|---|---|---|---|
| **A — Live, both looking** | W1 (IL 05:00–09:00 ↔ NYC 22:00–02:00), W5 | Realtime transport, Wake Lock on both, low latency | ~4 h/day |
| **B — Live, asymmetric** — one looks, one listens | She's walking or commuting, he's at a desk | Media Session on her side, screen on his | Rare, and underserved everywhere |
| **C — Turn-based across the gap** | Always | Durable server state, offline move queue, **no timers** | **The default. Most dates belong here.** |
| **D — Leave-behind** — complete on arrival, nothing owed | Always, and best at the sleep boundary | Storage and one notification | The emotional core of the product |
| **E — Solo, becomes shared** | Her desk at lunch, silent, one hand | Nothing. No permission, no network, no audio. | The one nobody designs for |

Two observations that should drive the date library.

**Shape C is the default and the platform is unusually good at it.** Because iOS gives a PWA no background execution, a turn-based date *cannot* run a clock, expire, or nudge while you sleep — even if someone wanted it to. The limitation and the founder's anti-obligation instinct point the same way. A turn-based date here is structurally incapable of becoming a task.

**Shape E deserves a hard requirement.** At least one date must need *nothing* — no audio (she's at a desk), no network (she's underground), no permission prompt, no other person present. Not as a fallback but as a design target, because it is the only shape available in her worst window.

### The date manifest

Each date should declare what it needs, as data:

```
requires_network      · requires_both_present · requires_audio_out
requires_audio_in     · requires_camera       · requires_permission
playable_one_handed   · playable_screen_off
```

The cover already knows what time it is in both cities and draws a conclusion from it (Design-Lead §5.2). This is the same conclusion, sharpened: on the subway it offers only `requires_network: false, requires_both_present: false, playable_screen_off: true`. At her desk it offers `requires_audio_out: false, playable_one_handed: true`. **The app stops suggesting things that cannot happen** — the existing thesis, applied to capability rather than only to the clock. Eight booleans, and the cheapest large improvement available.

---

## 3. Capabilities that make a date possible that otherwise wouldn't be

Not polish. Occasions that do not exist without a specific API.

**Media Session (iOS 15+) + `navigator.audioSession` (iOS 16.4+) → the pocket date.** Without Media Session, any audio date needs an unlocked screen in her hand, which on a packed subway is most of the problem. With it, the date lives on her lock screen with page artwork and runs from an AirPod stem: play, pause, skip, back. `audioSession.type = 'playback'` is what tells iOS this is media rather than a UI blip, governing ducking and the silent switch. Together they turn forty minutes underground from the window the product can't serve into the one it serves best. **Neither API is used by anything in this category, and the second is barely used by anything at all.**

**MediaRecorder (iOS 14.5+) with no network → the date recorded underground.** Capture needs no connection. Her half of an audio date can be made in a tunnel and queued. Only interesting *combined* with the outbox that already exists for photos — same idempotency key, same flush-on-visible.

**getUserMedia (iOS 11+, PWA-working since 13.4) → the date where "now" is enforceable.** The OS photo picker cannot tell a photo taken this minute from one taken last year. A live camera can. That is the whole difference between a scavenger date and an upload — and it is a rare case where a platform limitation pushes toward the better design, since Web Share Target's absence (§10) already rules out the share-from-Photos route.

**Wake Lock (iOS 16.4+) → any live date at all.** A synchronous date dies at the screen timeout. Trivially small API, completely load-bearing for shape A.

**IndexedDB + service worker (iOS 11.3+/15+) → the date that works with no signal.** No commercial async game does this; they all show a spinner underground. Her move should be playable and durable in a tunnel and sync when she surfaces.

**View Transitions (iOS 18+) → the date that isn't a modal.** A date can open *out of* the page it was tipped into and close back into it. Without it, a date is a screen covering the book, which is the fastest way to break the object.

**Absolute orientation → nothing, on iOS.** In this section precisely because it looks like it should enable a date and doesn't. See #13 and §10.

---

## 4. The shape of an async date — begins, idles for hours, resumes

The lead asked which platform features support this gracefully. The honest answer is that the *absence* of features supports it, and one existing architectural decision does the rest.

**Nothing may be written on a timer.** The architecture already made this call for the shared day (§3.4: *"Completion is a pure function of the rows plus `now()`… nothing is written on a timer, so there is no cron, no Inngest, and no drift"*). Dates should reuse it exactly: **a date's state is a pure function of its moves plus `now()`.** No expiry job, no turn clock, no scheduled evaluation. Not just cheaper — the only correct choice, because a date that silently expired while she slept is the worst thing this product could do, and there is no background execution to expire it with anyway.

**A date must reconstruct from cold, from a row.** Seven hours pass; the app is killed; iOS reclaims everything. Whatever is on screen when she opens it comes entirely from durable state. No in-memory session, no ephemeral handle, no resume token. Practically: a row plus an ordered move list, and the client is a pure renderer of it.

**Every move is idempotent, on the pattern already chosen.** The photo pipeline's `client_uuid` key applies unchanged. She plays in the tunnel, it queues, the flush fires twice on reconnect, one move lands.

**Ordering needs one constraint photos don't.** Photos use last-write-wins because the conflict rate is ~zero. Turn state has a real ordering requirement, so moves need a monotonic sequence with a unique constraint on `(date_id, seq)`. Collisions are only possible inside W1, when both are awake — the loser re-queues against the new head. Cheap and correct.

**A date must be readable when it isn't your turn.** Not a blocked screen, not *"waiting for Eva…"*. You can open it, see everything that happened, and turn back to it. That is a book property, and it is what stops a date feeling like a queue.

**And here is what only this app can do with the idle:** in every other turn-based product, waiting is dead time and the UI says "waiting." Here the waiting *is the other person being asleep*, and the app already knows that to the minute. So the idle state is not a spinner — it is Design-Lead's existing line, verbatim: *"{{HER_NAME}}'s asleep. It's 3:40 in the morning there."* The wait becomes information about her rather than a blocked state. Nothing new is built; a component that already exists is pointed at a new surface. **This is the strongest argument for hosting dates in this app rather than any other app, and it costs nothing.**

### Where a date lives in the book

An unfinished date is a **dog-eared page**. Not a lobby, not an "active dates" list, not a badge with a number.

A date is tipped into the book where it happened, dated. While it's unfinished the corner is folded; when it's done the corner lies flat and it stays as a page you can turn back to. The fold *is* the index — the fore-edge and the riffle already navigate it, and a dog-ear is a bookmark rather than a rebuke. This matters more than it sounds: **a list of unfinished dates is a task list, and a task list is precisely what the founder is trying to avoid.** The metaphor was already on Design-Lead's naming shortlist as *"the most literal expression of the core emotional act"* — it turns out to have a function.

---

## 5. The cut that matters most: a backgrounded PWA is off

The brief asks what the app knows from how the phone is held — face-down on a nightstand, picked up at 5 a.m., in a pocket. The answer is **nothing**, and it needs saying plainly because several attractive date ideas die on it.

Motion and orientation events fire only while the page is running and foregrounded. If the phone is face-down, the screen is off and the app is not executing — "the app knows it's face-down" is false by construction. Same for the pocket, same for 5 a.m. No background execution, no wake-on-event, no timer.

**The consequence for dates is specific and sharp: playback survives a locked screen, capture does not.** A media element keeps playing when she pockets the phone; MediaRecorder, getUserMedia, SpeechRecognition and every sensor stop the moment the screen locks. So a pocket date can only be **listen-only**. She hears; she doesn't answer until she takes the phone out. Which is, conveniently, the shape the seven-hour gap already imposed.

What survives: **`visibilitychange` — the app knows when it was opened, and that is all it should know.** Which is the correct amount. An object you pick up doesn't know what you did before you picked it up.

---

## 6. The one notification — interrogated

The lead flagged this as the difference between the app feeling like a gift and feeling like a task list. It is, and the naive version fails.

The platform first. Push requires an installed app on iOS 16.4+, from a user gesture ([BCD](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Notification.json): *"The parent `Notification` interface is undefined unless the page is a web app saved to the home screen"*). There are **no scheduled local notifications on any platform** (§10), so every notification is a deliberate server-side act — one cron job, which the CTO's nightly GitHub Action already provides at zero cost. Nothing fires unless someone decided it should.

### The proposed text, tested

*"Eva started something for you."*

It passes the obvious test — the subject is Eva, not you. But read it again. **"Started" means unfinished, and "for you" means yours to finish.** That is a claim on your time dressed as a gift. Compare: *"Eva left you something"* is complete, owes nothing, and can sit unopened for three days without decay.

So the wording is not the control. Two things are.

**First: the notification must match the shape of the thing.** A leave-behind (shape D) is complete — say "left." A turn-based date (shape C) is genuinely unfinished, and the honest move is to send that push **only when the date opens, never on a turn within it.** *Someone thought of you and started something* is news. *Your move* is not news, it is admin — and a ten-turn date sending ten pushes across five days is a task list no matter how warmly each is worded.

**Second, and this is the real rule: one notification per thing, ever. Never a second.** A single "Eva started something" that is never followed up is a gift. The identical words followed three days later by a reminder are a task. The whole difference lives in the follow-up that doesn't happen.

### The policy, entire

1. **The subject is always the other person.** If the subject is "you," it does not ship. This kills every reminder, every "your turn," every streak warning, every "she's waiting."
2. **One per thing, ever.** No second notification about the same date, photo, or leave-behind, at any interval, for any reason.
3. **Push on opening, badge on turns.** The first move of a new date earns one push. Every subsequent turn sets `setAppBadge()` and nothing else — silent, no banner, sits on the home-screen icon, gone when looked at. Dates create many turns; this is what stops that becoming many interruptions.
4. **Timed to the recipient's morning, never to the sender's action.** He writes at 3 a.m. his time; the push waits. **Content is never delayed — only the tap on the shoulder is.** If she opens the app at 2 a.m. it is already there. The app must never hide something it has.
5. **At most one a day, and only if something genuinely unseen exists.** A notification that fires on a schedule regardless is a habit-forming device, and habit-forming devices are obligation machines.
6. **Never during their night.** Design-Lead §6 already forbids it; the app knows both zones exactly, so this is arithmetic, not judgement.

### One privacy consequence, easy to miss

**Push payloads render on a locked screen and pass through Apple's push service.** For a product whose top-ranked risk is intimate content exposure (architecture R2), the payload must carry no content — no caption, no photo, no date name. *"Eva left something"* and nothing more; the app fetches the real thing after unlock. This is also why Declarative Web Push (iOS 18.4+) is the right transport on principle as well as convenience: it executes no JavaScript, so the notification channel is provably not a data channel, and its payload is a declared, inspectable JSON object rather than arbitrary code.

Naming the date in the push would also spoil it. The security argument and the tonal argument agree, which is usually a sign the rule is right.

---

## 7. Ideas, ranked

Ranked by *value × certainty × cheapness*. Each is checked against "can it live inside a book?"

### Tier 1 — build these

| # | Idea | Shape | Support |
|---|---|---|---|
| **1** | **The commute record.** A date shaped like an album side: his voice, her AirPods, screen off, phone pocketed, no signal. Media Session for stem control and lock-screen art, `audioSession.type='playback'`, cached audio. | B/D | ✅ / ◐ backgrounding |
| **2** | **Turns produce badges, not notifications.** The structural answer to "dates create many turns." Push on opening only. | — | ✅ / ◐ dot rendering |
| **3** | **The idle state is the clock, not a spinner.** *"Eva's asleep. It's 3:40 in the morning there."* Reuses an existing component; the single best reason to host dates here. | C | ✅ |
| **4** | **Unfinished dates are dog-eared pages, not a list.** The fold is the index. Avoids a task-list UI entirely. | C | ✅ |
| **5** | **Every date declares its requirements** (§2). The cover knows the clock; now it knows what's possible. | all | ✅ |
| **6** | **Co-reading — the ribbons go live.** When both are on the same leaf, his page turn turns hers. No join button; co-presence is the trigger, so it can never create an obligation. | A | ✅ Realtime |
| **7** | **Date state is a pure function of moves + `now()`.** No timers, no expiry, no turn clock — reusing the architecture's own shared-day decision. | C | ✅ |
| **8** | **Offline-playable turns.** Her move works in the tunnel and queues on the existing outbox with the existing idempotency key. | C/E | ✅ |
| **9** | **The one notification** (§6), payload carrying no content. | D | ✅ iOS 16.4+ |
| **10** | **`persist()` + OPFS** for the archive. Two levers instead of one; a real filesystem instead of a key-value store. | — | ✅ iOS 15.2+ |
| **11** | **No read telemetry, ever.** A fully cached book means the server never learns which page she looked at, when, or how long. Not a feature — a property to protect. | — | ✅ (by omission) |
| **12** | **The now-camera date.** He names a thing; she photographs it *live*, camera roll disabled. getUserMedia is what makes "now" enforceable — the OS picker cannot. | C | ✅ iOS 13.4+ in PWA |

### Tier 2 — strong, cheap, next

| # | Idea | Shape | Support |
|---|---|---|---|
| **13** | **The look-up.** Both point their phones; the bearing between Tel Aviv and New York is a constant, so the only live input is the compass — **zero location data, ever.** Lovely, and resting on an unverifiable non-standard property. Prototype before planning. | C | ◐ `webkitCompassHeading` only |
| **14** | **The sleep side.** He assembles it; she plays it as she falls asleep. Designed to be unfinished — you are not meant to hear the end. Nobody builds media meant to be missed. | D | ✅ / ◐ backgrounding |
| **15** | **Voice notes pressed into pages.** 20 s cap, recorded offline, waveform drawn as a single hairline — no player chrome. | D | ✅ MediaRecorder |
| **16** | **Ambient room recordings.** Twenty seconds of his kitchen at 6 a.m. Not a message — a *room*. He chooses to record it, which is what separates it from surveillance. | D | ✅ |
| **17** | **The simultaneous one.** A date that only exists while both are present and cannot be caught up on. Scarcity without FOMO, because it never announces itself — it is simply on the cover when both ribbons are live, and gone when one leaves. | A | ✅ Realtime + Wake Lock |
| **18** | **Lock-screen artwork is the page she's on.** `MediaSession.metadata.artwork` during a pocket date. Her lock screen becomes their book. | B | ✅ iOS 15+ |
| **19** | **The silent date.** One hand, no sound, no network, no permission. Her desk at lunch. The capability that enables it is the *absence* of requirements — which is why it needs to be a stated target, not an afterthought. | E | ✅ |
| **20** | **Extend the outbox to audio and text.** Voice and captions queue exactly like photos do. | C/D | ✅ |
| **21** | **Paper tint follows their solar altitude.** Chroma-only shift, luminance locked, so contrast never moves. | — | ✅ CSS `color-mix` |
| **22** | **TTS for structure only, never for their words.** A robot voice reading his love note is the worst thing this app could produce. Synthesis may say *"Tuesday, the fourth of August"* and nothing either of them wrote. | — | ✅ |
| **23** | **Face ID over the shared password.** WebAuthn addresses the architecture's own stated worst case (§6.4). The realistic attacker holds an unlocked phone; a platform authenticator is the right countermeasure. | — | ✅ iOS 14.5+ |

### Tier 3 — real, mind the cost

| # | Idea | Support |
|---|---|---|
| **24** | **Scroll-driven CSS page turn / riffle.** `animation-timeline` gives native momentum and interruptibility with no rAF loop — exactly what design risk **P1** fears. Needs a JS fallback for iOS 18–25, so an enhancement rather than a foundation. | ✅ **iOS 26.0+ only** |
| **25** | **The moon page.** The only celestial object both cities see identically — same phase, same night, no offset. Closed-form math, ~1 KB, offline, correct forever. An almanac page at the back. | ✅ (arithmetic) |
| **26** | **Use Supabase Realtime for live dates, not WebRTC.** WebRTC needs signalling anyway, so the server isn't avoided; Frankfurt is ~50 ms from Tel Aviv and ~85 ms from NYC, comfortably inside the threshold where a synced turn still reads as shared. | ✅ |
| **27** | **Export the book as a printable PDF** through the iOS share sheet. Client-side generation keeps intimate photos off any server. | ◐ `share({files})` |
| **28** | **Tilt-driven sheen.** Real specular response as the phone moves — the "real object" claim paid with a sensor instead of a texture. Costs a permission prompt on an app whose whole tone is *not asking*. | ✅ w/ permission |
| **29** | **The overlap band.** Hours per day when the sun is up in *both* cities — generous in June, thin in December. A physically true shared fact. | ✅ |
| **30** | **The handoff.** Once a day the terminator passes between them: his sunset, her afternoon. The moment the day is handed over. | ✅ |
| **31** | **Wake Lock during any live date or read-aloud.** Small, load-bearing. | ✅ iOS 16.4+ |
| **32** | **"The whole book is in your pocket"** instead of a sync progress bar. Same mechanism, opposite framing — *142 of 210* invites "what's missing?" | ✅ |
| **33** | **Declarative Web Push by choice.** No JS execution means the notification path is provably not a data channel. | ✅ iOS 18.4+ |
| **34** | **The other person's page-turn sound during co-reading.** Charming, and also the fastest way to make co-reading feel surveilled. Ship muted, or not at all. | ✅ |

### Cut — would feel like monitoring

Each is technically easy, which is why each needs an explicit no.

- **Location sharing.** Geolocation is fully supported on iOS — that is exactly why. *"She's five minutes from home"* is a tracking product. Note #13 deliberately achieves its effect with **zero** location data.
- **Read receipts with timestamps.** Design-Lead's *pressed flat* is a state, not a timestamp — it says *this was seen*, never *seen at 3:47 a.m.*
- **"Last active N minutes ago."** The ribbon shows *where*, never *when*. Where is presence; when is surveillance.
- **Typing indicators**, and their date equivalent: *"Eva is playing right now."*
- **Always-on ambient microphone.** Wrong, and impossible — a backgrounded PWA gets no mic. A double no.
- **App-open counts, session length, and time-to-respond on a date.** *Time-to-respond is the dangerous one*, because dates make it trivial to compute and it would quietly become a scoreboard for who cares more.
- **Any notification whose subject is the recipient's inaction.**
- **Turn timers, date expiry, "expires in 24 h."** Impossible to run and wrong to want.

---

## 8. Top 3

### 1. The commute record — a date that runs from her pocket

Her commute is the hardest window in the research, and three of its four constraints — underground, no signal, hands busy — are already solved by the cache the CTO planned. The fourth, *can't look at a screen*, is not a caching problem. It is an audio problem, and there is currently no sound anywhere in this product.

She has AirPods. The book is already on her phone. Three verified APIs make it a date rather than a playlist: an `<audio>` element playing his cached recordings in order; the **Media Session API** (iOS 15+) attaching page artwork to her lock screen with real transport controls, so she moves through it with an AirPod stem and never takes the phone out; and **`navigator.audioSession`** (iOS 16.4+) — a WebKit-only API that almost nothing uses — declaring `type = 'playback'` so iOS treats it as media rather than a UI blip. Forty minutes underground stops being the window the product cannot serve and becomes the one it serves best.

The sharp constraint improves the format rather than damaging it: **playback survives a locked screen, capture does not.** She can listen pocketed; she cannot answer until she takes the phone out. So the date is *he asks, she listens hands-free, she answers later* — the shape the seven-hour gap imposed anyway. One honest dependency: whether audio survives backgrounding in an installed PWA is runtime behaviour no compat table covers. It is the standard path and generally works, but it must be tested on a real device, and it dictates the implementation — media element, not Web Audio graph.

### 2. Turns produce badges; only the opening produces a notification

The smallest idea here, and the one most likely to decide whether the app feels like a gift or a task list.

Hosting real dates creates a stream of events — his move, her move, his move — and the reflex is to notify on each. Ten turns over five days is ten interruptions, and no amount of warm wording survives that; it becomes a queue with a nice voice. The fix is structural rather than tonal. **One push when a date opens, because someone thinking of you and starting something is genuinely news. Every turn after that sets `setAppBadge()` and nothing else** — no sound, no banner, a mark on the home-screen icon that vanishes when she looks. And **one notification per thing, ever**: the difference between a gift and a task is entirely in the follow-up that never comes.

Two supporting rules fall out. The push is timed to the recipient's morning rather than the sender's action, while the *content* is never delayed — if she opens the app at 2 a.m. it is already there, because an app that hides what it has is lying. And the payload carries no content at all: lock screens are visible and push services store what passes through them, so *"Eva left something"* is the entire message and the app fetches the real thing after unlock. Naming the date would also spoil it. The privacy argument and the tonal argument agree.

### 3. The waiting is the clock

In every turn-based product in existence the idle state is dead time and the interface says so: *waiting for your opponent*, a greyed board, a spinner. Here the waiting is not dead. It is Eva being asleep, and the app already knows that to the minute in both cities.

So a date that is not your turn does not show a blocked screen. It shows Design-Lead's existing line, unchanged: *"Eva's asleep. It's 3:40 in the morning there."* The hours between his move and hers stop being a gap in the date and become the reason the date has the shape it does. This costs nothing — the clock is built, the line is written, the timezone work is the CTO's flagship module — and it is the clearest answer to why these two should play inside this app rather than any of the thousand async apps that already exist. Every one of those would tell them they are waiting. This one can tell them where the other person is.

It settles a design question by itself, too. A date that isn't your turn must be **readable** — openable, complete, turn-back-to-able. Not a locked board. That is a book property, and it keeps a date from feeling like a queue even before the notification rules do their work.

---

## 9. Two corrections to the architecture doc

**Storage persistence has a second lever.** §7.4 says Safari evicts site data after ~7 days without interaction and that home-screen web apps are exempt — accurate. But `navigator.storage.persist()` is supported on iOS Safari **15.2+** ([caniuse](https://caniuse.com/mdn-api_storagemanager_persist)), so the app can also request persistence explicitly. For a cache whose failure mode is *"the book is silently empty on the subway"* (R7) — and now *"the date she was midway through is gone"* — two independent mechanisms beat one. The doc already applies exactly this reasoning to private-content caching.

**OPFS is available; File System Access is not.** These get conflated. The File System Access API is unsupported on iOS at every version ([caniuse](https://caniuse.com/native-filesystem-api)), but the **Origin Private File System** — `navigator.storage.getDirectory()` — ships from iOS **15.2+** ([caniuse](https://caniuse.com/mdn-api_storagemanager_getdirectory)). That is a real filesystem, origin-scoped and invisible to the user, and it handles hundreds of megabytes of photo and audio blobs better than IndexedDB. Audio makes this more pressing than it was: dates add a second large-blob class.

---

## 10. Impossible on iOS — and here's the proof

So nobody re-litigates it. All checked 2026-08-02 against iOS Safari through **26.5**.

| Capability | Status | Proof | What dies with it |
|---|---|---|---|
| **Vibration API / haptics** | ❌ Not supported, **3.2 – 26.5** | [caniuse.com/vibration](https://caniuse.com/vibration) | Confirms Design-Lead's P5 independently. **For dates this is a second loss:** no tactile feedback on a move, no buzz when it's your turn, no rumble in any physical date. The 40 ms paper sound is the only substitute the platform offers. |
| **Notification Triggers** (scheduled local notifications) | ❌ Not supported anywhere | `showTrigger` is **absent from** [BCD `api/Notification.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Notification.json) entirely; the MDN `Notification.showTrigger` page returns **404** — removed. A Chromium origin trial that never shipped. | **You cannot schedule a date.** No "our date is at 8 p.m. and the app will remind us." Every reminder is a server push from a cron job. Also: no turn timer, no expiry, nothing that fires on its own. |
| **Background Sync** | ❌ Not supported, **3.2 – 26.5** | [caniuse.com/background-sync](https://caniuse.com/background-sync) | Confirms architecture §7.4. A queued move uploads when the app is **next opened**, never before. Must be said in words — "waiting to send," not a silent spinner. |
| **Periodic Background Sync** | ❌ Not supported | Same source; Chromium-only | No pre-dawn warm-up before her commute. The audio for a pocket date must be cached while the app is open the night before — so the warm-up has to be greedy about audio, not lazy. |
| **Absolute / compass orientation** | ❌ Standard routes dead | [BCD `api/DeviceOrientationEvent.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/DeviceOrientationEvent.json): `absolute` → `safari_ios: false` · [caniuse `deviceorientationabsolute`](https://caniuse.com/mdn-api_window_deviceorientationabsolute_event): not supported 3.2 – 26.5 | Any date needing a real-world bearing rests entirely on `webkitCompassHeading`, a non-standard WebKit property BCD does not track. **Relative tilt is solid; absolute is not.** Prototype #13 before planning it. |
| **Ambient Light Sensor** | ❌ Not supported, **3.2 – 26.5**; `safari: false` in BCD | [caniuse.com/ambient-light](https://caniuse.com/ambient-light) · [BCD `api/AmbientLightSensor.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/AmbientLightSensor.json) | The app cannot know the room is dark. It computes the *sun* exactly and can never see the *lamp*. No date that reacts to the light in the room. |
| **Battery Status API** | ❌ Not supported, **3.2 – 26.5** | [caniuse.com/battery-status](https://caniuse.com/battery-status) | No "her phone is dying" tenderness, and no way to back off audio caching on low battery — so the warm-up must be conservative by default. |
| **Web Share Target** | ❌ `safari: false`; iOS mirrors | [BCD `manifests/webapp/share_target.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/manifests/webapp/share_target.json) | **The painful one.** She cannot share a photo *from* the iOS Photos app *into* this app. The natural gesture — "I just took this, send it to our book" — does not exist. Every photo is added by opening the app and picking from the roll, which must therefore be one tap from launch. It also makes the in-app camera (#12) the better route rather than a compromise. |
| **Manifest `shortcuts`** | ❌ `safari_ios: false` (desktop Safari 17.4 only) | [BCD `manifests/webapp/shortcuts.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/manifests/webapp/shortcuts.json) | No long-press home-screen menu — no jump straight to a waiting date or to the camera. |
| **Web Bluetooth** | ❌ No native support | [caniuse.com/web-bluetooth](https://caniuse.com/web-bluetooth) — *"Safari on iOS and iPadOS has no native support."* A third-party Safari extension polyfills it, which is not shippable here. | No paired physical object, no lamp that lights when the other opens the app, no physical date controller. |
| **Web NFC** | ❌ Not supported, **3.2 – 26.5** | [caniuse.com/webnfc](https://caniuse.com/webnfc) | No tap-a-tag-to-start-a-date. Chromium/Android only. |
| **File System Access API** | ❌ Not supported, **3.2 – 26.5** | [caniuse.com/native-filesystem-api](https://caniuse.com/native-filesystem-api) | No "save the archive to iCloud Drive." **Not the same as OPFS**, which *is* supported — §9. |
| **`ScreenOrientation.lock()`** | ❌ Not supported, **3.2 – 26.5** | [caniuse.com/mdn-api_screenorientation_lock](https://caniuse.com/mdn-api_screenorientation_lock) | A date cannot force portrait or landscape. Every date works in both, or is designed for one and tolerates the other. |
| **`beforeinstallprompt`** | ❌ Not supported | Architecture §7.4, consistent with the above | No custom install button. An overlay pointing at Share → Add to Home Screen is the only mechanism — and install is now doubly required, since dates need push and storage. |
| **Any background execution** | ❌ | Consequence of Background Sync + Notification Triggers + no background contexts | No sensors, no location, no mic, no timers while closed. **Playback survives a locked screen; capture does not** (§5). |

### The spoken-word date with no screen — dead twice over

The brief named this format specifically, so it deserves a straight answer.

**Technically:** SpeechRecognition is marked *partial* at every iOS version from 14.1 ([caniuse](https://caniuse.com/speech-recognition)), it is `webkit`-prefixed, and I could not verify its behaviour in standalone display mode. But that is the smaller problem. **Recognition requires the app foregrounded with the screen on** — the moment the phone goes in her pocket, no JavaScript runs. "Spoken word date with no screen" describes precisely the state in which the API cannot function. It is not a support gap; it is a category error.

**Socially:** even with the screen on and the app open, she is on a packed subway. Talking aloud to her phone is not available to her regardless of what WebKit supports.

**So the commute date must be listen-only** — a firm design constraint rather than a disappointment, and the same constraint the seven-hour gap already imposed, arriving from a second direction. For anywhere she *can* talk, the iOS keyboard's own dictation button handles voice input with zero code, better accuracy, and no permission prompt of ours. Building a speech-to-text path would be re-implementing an OS feature worse.

---

## 11. What I'd hand to CTO tomorrow

1. **Device-test four things** before anything is planned around them: audio surviving backgrounding in an installed PWA (the commute date depends on it); `navigator.audioSession` with `type='playback'`; `navigator.share({ files })`; and `setAppBadge()` with no argument rendering as a dot rather than a number. Under an hour on a real iPhone settles all four.
2. **Prototype `webkitCompassHeading` before planning any date that needs a bearing.** Both standard routes are confirmed dead on iOS and the remaining one is untracked by BCD.
3. **Adopt the date state model in §4** — pure function of moves plus `now()`, reconstructible from a row, idempotent moves on the existing `client_uuid` pattern, unique `(date_id, seq)`. A direct reuse of the shared-day decision the architecture already made, so it is cheap to adopt now and expensive to retrofit.
4. **Add the date manifest (§2)** — eight booleans that let the cover stop suggesting things that cannot happen right now.
5. **Write the notification policy into the spec now** (§6), before anyone builds a notification. Six rules, and rule 3 — push on opening, badge on turns — is the one that decides whether hosted dates feel like a gift or a queue.
6. **Fold in the two corrections** (§9). Both harden R7, and audio makes the storage question more pressing than it was.
7. **Note `animation-timeline` (iOS 26.0+)** against design risk P1.
8. **Treat Web Share Target's absence as a design input, not a footnote.** It determines how photos get in, and it makes the in-app camera the better route rather than a compromise.

---

```json
{
  "status": "complete",
  "ideas_generated": 34,
  "top_3": [
    "The commute record — a date that runs from her pocket: Media Session + navigator.audioSession + cached audio turn her offline subway commute from the window the product cannot serve into the one it serves best, screen-off and stem-controlled",
    "Turns produce badges, only the opening produces a notification — the structural answer to hosted dates creating a stream of events; one push per date ever, every turn after it a silent home-screen dot, and the payload carries no content because lock screens are visible",
    "The waiting is the clock — a date that is not your turn shows 'Eva's asleep, it's 3:40 in the morning there' instead of a spinner; the idle hours become information about her rather than a blocked state, reusing components that already exist"
  ],
  "best_ios_supported_idea": "Media Session API (iOS 15+) paired with navigator.audioSession (iOS 16.4+, WebKit-only and almost unused) driving a pocket date from cached audio — lock-screen artwork, AirPods stem control, no signal, screen locked; the largest unexploited surface in the product, since it currently has no sound in it at all",
  "ruled_out_by_ios": [
    "Vibration API / haptics — caniuse.com/vibration, not supported 3.2-26.5; for dates a double loss (no move feedback, no turn buzz) — confirms Design-Lead P5",
    "Notification Triggers / scheduled local notifications — showTrigger absent from BCD api/Notification.json, MDN page 404s; you cannot schedule a date, and no turn timer or expiry can ever fire on its own",
    "Background Sync — caniuse.com/background-sync; a queued move uploads only when the app is next opened",
    "Periodic Background Sync — Chromium-only; no pre-dawn cache warm-up before her commute, so audio caching must be greedy the night before",
    "Absolute / compass orientation — BCD DeviceOrientationEvent.absolute is safari_ios:false and deviceorientationabsolute is unsupported 3.2-26.5; only the non-standard untracked webkitCompassHeading remains, so any bearing-based date must be prototyped first",
    "Ambient Light Sensor — caniuse.com/ambient-light + BCD safari:false; the app can compute the sun but never see the lamp",
    "Battery Status API — caniuse.com/battery-status, not supported 3.2-26.5",
    "Web Share Target — BCD manifests/webapp/share_target.json safari:false; cannot share a photo from the iOS Photos app into the app, the single most painful loss",
    "Manifest shortcuts — BCD safari_ios:false; no long-press jump to a waiting date or the camera",
    "Web Bluetooth — caniuse.com/web-bluetooth, no native support; no physical date controller or paired object",
    "Web NFC — caniuse.com/webnfc, not supported 3.2-26.5",
    "File System Access API — caniuse.com/native-filesystem-api (but OPFS IS supported from iOS 15.2, do not conflate)",
    "ScreenOrientation.lock() — caniuse.com/mdn-api_screenorientation_lock; a date cannot force an orientation",
    "beforeinstallprompt — no custom install button on iOS",
    "All background execution — playback survives a locked screen, capture does not; MediaRecorder, getUserMedia, SpeechRecognition and every sensor stop the moment the screen locks, so a pocket date is listen-only",
    "The spoken-word date with no screen — dead twice: SpeechRecognition is partial and webkit-prefixed with standalone behaviour unverified, but more fundamentally it needs the app foregrounded with the screen on, which is the exact state 'no screen' excludes; and she cannot talk aloud on a packed subway regardless"
  ],
  "deliverable": "/Users/adamks/VibeCoding/evalove/.worktrees/ceo-1-1785631504/docs/04-features/ideation/CREATIVE-MEDIUM.md"
}
```
