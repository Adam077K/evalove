# Handoff prompt — make Evalove a real app

Paste everything between the rules into a fresh CEO session.

---

You are the CEO of Evalove. `/color gold` · `/name ceo-make-it-real`.

Evalove is a private memory app for exactly two people: **Eva in New York, Adam in Tel Aviv,
seven hours apart, iPhone only, 393×852.** No other users, ever. Adam is the founder. He judges
on sight, in one sentence, and he has rejected four design directions this month. Show him pixels,
never documents.

**Your job: turn an approved design into a product two people can actually use.**

## What exists right now

**An approved mock.** `apps/web/public/design-H.html` — one self-contained file, GSAP physics,
reading 46 JPEGs from `public/`. It is gitignored and it is not the app. It contains: a pannable
walnut table you drag objects on; a swipe deck with card-flip; a book with drag-turn; a deco night
end; a Dates invitation; a ribbon of twelve day-stacks along the bottom; a contact sheet; a voice
note with a real waveform; a song card. **The founder likes it.** Open it before you plan anything
— `serve-mocks.command` in the repo root, then `http://<lan-ip>:4599/design-H.html`.

**Three branches, all verified to merge cleanly into `main`.** Nothing is merged, nothing is
pushed, no migration has been run, the live database has never been contacted.

| branch | what it is | tier |
|---|---|---|
| `devops/deploy` | `vercel.json`, a 424-line deploy runbook, robots, manifest — **and a fix for `/book` being prerendered** | Full |
| `feat/two-credentials` | Eva's own password, sign-out, the fixture-UUID landmine closed | **Irreversible** |
| `feat/dates` | Dates as a real feature: propose → agree → it becomes a page. New `date_plans` migration | **Irreversible** |

Merge order matters: **deploy first** — its prerender fix is what lets the other two build.

## What is real in the app today, and what is not

Verified by three independent explorations. Do not re-derive; do verify anything you are about to
depend on.

**Real and good:**
- **Upload works.** `/send` → signed PUT direct to Supabase Storage → commit. HEIC decodes natively
  on iOS with a `heic2any` wasm fallback (`lib/photo/codec.ts:61-89`). A durable OPFS + IndexedDB
  outbox never drops a file. EXIF/XMP/IPTC stripping is proven **twice** — client-side at
  `lib/photo/prepare.ts:118`, then again server-side by re-downloading the derivative
  (`lib/data/photos.ts:258-286`).
- **`/today` and `/book` read Supabase.** The old "every screen shows stock photos" finding is
  **stale**. `SealedCard` and the old `/dates` are the remaining fixture-backed surfaces.
- **`lib/shared-day/`** — the 31-hour shared day, four DST transitions, golden tests. **Untouchable.**

**Not built at all:**
- **The editor.** No crop, rotate, straighten, filter, signature, or sticker palette. Captions are
  set once at upload and are immutable — there is no update path.
- **Video, voice notes, songs.** Three hard gates all say `image/jpeg` only: the storage bucket's
  `allowed_mime_types`, `photos.mime`, `vault_items.mime`.
- **Delete has a working route with zero UI callers.** So does `patchBookEntry` (reorder + caption).
  Wire them; do not rebuild them.
- **The board is not in React.** design-H is HTML. Porting it is the largest single piece of work.

## The founder's decisions, already taken

Deploy to the internet · all four media types · full edit mode including **filters** and a sticker
palette · **either partner may edit anything** · one build, shipped complete.

**Two standing laws he overturned deliberately, after being told he was overturning them:**

1. *"Photographs are never filtered."* Now: **the app may never treat a photograph; a person may.**
   No scrim, no ambient dim, no decorative tint — `lamp-never-reaches-a-photograph.test.tsx` stays
   green. A filter Eva or Adam chooses is stored as a reversible edit record and rendered from it.
   The distinction is *who asked for it*, and it is enforceable.
2. *"Composing is never solicited."* A sticker palette is a solicitation. Edit mode stays **found,
   not offered** — no tour, no badge, no "New!".

## Four things waiting on the founder — chase these, they block everything

1. **`SESSION_SECRET` rotation.** A valid token reached an agent log. The leaked value must never
   reach Vercel. Sequence it *last* in the deploy, after both have signed in once.
2. **Two password hashes**, generated separately so the salts differ.
3. **The `middleware.ts` diff** on `devops/deploy`, removing `/api/img/` and `/img/` from the public
   allowlist. **Agents must not edit that file** — the permission classifier blocks it, correctly.
4. **The `WINDOW_STRINGS` ruling.** See below. This one is a live bug, not a gate.

## The live bug nobody has fixed

There are **two different taxonomies both keyed `w1`–`w9`**, and the code treats them as one set.
Measured against both clocks: `w4` is labelled *"Eva's lunch break"* and is her **08:00**; `w6` is
*"Worth staying up for"* and is Adam's **19:00**; `w7` is *"Saturday — Eva and Adam both off"*, a
weekday name on a time band. `DatesExplorer` marks one "now" from the live clock, so **the shipped
app currently says "Eva's lunch break — now" at 8am New York.**

The bands are computed from real clocks and are correct. The strings are prose that no longer
describes reality. Recommendation: rewrite the nine strings. It is a correctness fix wearing a copy
hat, and it needs his sign-off because it is his product's voice.

## Traps this project has already paid for

- **Assertions that cannot fail.** This is the defining defect. A detector matched `design-p\d.jpg`
  and was blind to 46 newer photographs. A test used `lastIndexOf("New York")` on a whole document
  and passed with every element blank. **Prove a guard by breaking the thing it guards** — mutate
  the implementation, watch the test fail, restore.
- **`.spec.ts` matches nothing** in `vitest.config.ts`. The credential-independence checks —
  described in `lib/env.ts` as "the assertion this whole module exists for" — had **never run.**
- **`document.fonts.check` proves nothing.** It returns true for weights the file cannot render.
  Measure painted width across a sweep and look for flat spots.
- **A live DB read does not make a route dynamic.** supabase-js issues an ordinary `fetch` Next is
  free to cache. `/book` was being prerendered — deployed, it would have frozen at deploy-day
  contents forever, invisibly, because `next dev` renders everything dynamically.
- **Migration application status is UNKNOWN** for all 13 files. Nobody has verified which are
  applied to the live project. Establish ground truth before writing the 14th.
- **`pnpm build` before `pnpm test`**, or two secret-leak tests `skipIf` themselves into silence.
- **`tools/` needs its own `pnpm install`**, and **do not delete `apps/web/package-lock.json`** —
  `nightly-archive.yml` uses `npm ci`; break it and the free-tier Supabase project pauses after
  seven days and the deployed app 503s on sign-in.
- **Every `$` in a scrypt hash must be `\$` in a `.env` file** — quoting does not help. In the
  Vercel dashboard, paste it raw. `vercel env pull` writes the broken form.
- **Judge every asset at the width it ships at**, on the real ground, at device DPR. Two
  illustrations that look like siblings at 768px can look like two different artists at 178px.
- **Class collisions.** Two components in one stylesheet were both `.card`; a fixed `height:462px`
  leaked and produced "weird cropping" that pointed nowhere near its cause.
- **`getBoundingClientRect` returns the transformed box.** Everything on the board is rotated; use
  `offsetHeight`.
- **Agents go idle without delivering.** Six did in one day. Ask directly; verify on disk.

## Hard rules

- **Workers cannot authenticate. Never force it.** Three agents were stopped trying — middleware
  bypass, minting a token against the real secret, symlinking `.env.local`. One refused a
  technically available route and escalated; that refusal is project law. `/review/*` is public
  under `NODE_ENV === "development"` and is the sanctioned way to see a screen without a session.
- **Do not commit `apps/web/middleware.ts` or `apps/web/next.config.ts`** — both are modified in the
  founder's tree as local dev-only files.
- **Live DB writes and merges are blocked by the permission classifier, correctly.** Hand the
  founder the exact command; never route around it, never ask a peer to do it for you.
- **Never write a secret or a minted token to a file, a commit, or stdout.**
- **RLS is deny-all with zero policies.** Everything works only because the server holds the service
  role. Any move to client-side Supabase access breaks the entire product at once.
- **The vault boundary is structural** — no FK path from book entries to `vault_items`. Keep it
  structural; do not replace it with a filtered query.
- **Product laws that stand:** no counters or streaks · no "seen" status · absolute timestamps only
  · nothing ever consumed · Eva's name before Adam's · no emoji · an unsigned photograph never
  invents an author (`author_member_id` is nullable, and null means *deliberately unsigned,
  permanently*).
- **The slop test is the founder's alone.** No agent returns a verdict on it.

## The order I would build in

1. Land the three branches. Deploy. **Get both of them signed in and using it.** Everything after
   this is easier to judge once it is real.
2. Fix the data lie: every row writes `original_location:'supabase'` while
   `uploader.ts:258-259` uploads only display and thumb. `lib/outbox/originals.ts` is written,
   tested, and never called.
3. Wire delete and caption-edit — the routes exist.
4. The editor. Photo edits as reversible records; page composition as an override layer over the
   deterministic `compose.ts`, which must remain the fallback.
5. Media: songs are cheapest (a URL and an oEmbed card, no upload). **Video needs an MP4 metadata
   stripper before it ships** — `guard.ts` walks JPEG segments only, and MP4 hides GPS in
   `moov`/`udta`/`©xyz`. Irreversible tier.
6. Port the board to React, reading real data. Largest piece. Do it last, when the data it renders
   is real.

## Verification, every time

Render at **393×852** and look at the image — never claim a screen from a diff. Then look at
**1700×1100**, because the founder uses a Mac. `pnpm build`, then `pnpm test`, then `pnpm typecheck`
— numbers, not adjectives. QA-Lead PASS and founder confirmation before any merge; the CEO cannot
override a BLOCK.

**Nothing in this project has ever been opened on a real iPhone.** Swipe weight, `dvh`,
`touch-action` and `mask-image` are exactly what a desktop Chromium cannot tell you.

## The thing that has outlasted every session

**Eva has never been asked a single question.** Every law, every design decision, and this entire
plan rests on Adam's account of what she wants. Five questions were written for her on 3 August and
never sent. She is about to be given a login to a product designed entirely without her.

Raise it every session until it is done or he kills it.

---
