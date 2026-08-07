# photo-ingest — Eva & Adam

Puts the founder's 52 real photographs into the app. Two steps, two scripts:
`prepare.ts` converts and verifies; `load.ts` writes to the database. Nothing
in this tool ever modifies an original file in the source folder.

## What it produces

```
tools/ingest/output/          (gitignored — local working files)
  manifest.json                one row per media item: date, kind, derivative
                                paths, dimensions, caption seed, author: null
  authorship.tsv                the founder edits this by hand — see below
  derivatives/
    <name>-display.jpg          1600px long edge, matches apps/web's DISPLAY_SPEC
    <name>-thumb.jpg             400px long edge, matches apps/web's THUMB_SPEC
    <name>.mp4                   H.264/AAC, web-playable, metadata stripped
    <name>-poster.jpg            first frame of each video, same strip guarantees
```

## How to run

From `tools/`, after `pnpm install` (this directory needs its own — see the
CRITICAL note in the ingest session brief about `tools/` never having had
`pnpm install` run in it before this).

```sh
pnpm ingest:prepare                                    # convert + manifest + authorship sheet
pnpm ingest:prepare -- --limit 5                        # just the first 5, for a quick check
pnpm ingest:prepare -- --source <dir> --out <dir>       # override the defaults

pnpm ingest:load                                        # DRY RUN — prints the plan, writes nothing
pnpm ingest:load -- --commit                             # actually uploads + inserts
```

Or directly with `tsx` (what the `pnpm` scripts above expand to):

```sh
npx tsx ingest/prepare.ts [--source dir] [--out dir] [--limit n]
npx tsx ingest/load.ts [--out dir] [--source dir] [--limit n] [--commit]
```

Defaults: `--source` is `../Eva-app-images` relative to the repo root (the
founder's chosen 52 files, read-only); `--out` is `tools/ingest/output/`.

### Why `tsx` and not `node --experimental-strip-types` (like tools/export)

This tool reuses `apps/web/lib/photo/{exif,guard}.ts` (the EXIF/GPS-strip
verification) and `apps/web/lib/data/photos.ts` (`commitPhoto`) directly,
which import other app modules via the `@/` alias. Plain Node has no idea what
`@/` means; `tsx` reads `tools/tsconfig.json`'s `paths` mapping
(`"@/*": ["../apps/web/*"]`) and resolves it at runtime. `tools/export` never
needed this because `read.ts` deliberately avoids every `@/`-aliased app
module (see its own header).

### Environment variables (`load.ts --commit` only)

`prepare.ts` and `load.ts`'s dry run need no credentials at all. `--commit`
needs the same two Supabase values `tools/export` needs, and accepts the
app's `.env.local` names first:

| Preferred (app's `.env.local`) | Fallback |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_KEY` |

## Step 1 — `prepare.ts`

1. **Derives** each file's date from its filename (`filename.ts` — the
   `DD:MM:YY[-N].EXT` grammar, `:` separators and all) and its media kind.
   Two corrections are hard-coded from the cataloguing passes: `24:7:26-12.HEIC`
   is dropped as a byte-identical duplicate of `24:7:26-11.HEIC` (MD5
   verified); `24:7:26-21.HEIC`'s real EXIF capture date (2026-07-23) is
   recorded alongside its authoritative filename date (2026-07-24) but never
   used for filing — the founder named these by hand.
2. **Converts.** `sips` decodes HEIC (Apple's own decoder — the safe choice
   against a HEIC container's many embedded auxiliary images); `ffmpeg`
   re-encodes to the two target sizes. This re-encode is also what applies
   EXIF orientation correctly and strips all metadata in the same pass — see
   the long comment at the top of `media.ts` for the empirical proof this was
   checked against, not assumed. The three videos transcode to H.264/AAC MP4
   with a poster frame extracted through the same JPEG path.
3. **Strips and verifies.** The strip IS the re-encode (no second pass).
   Verification reuses `apps/web/lib/photo/guard.ts`'s `findMetadataEvidence`
   — the exact function `commitPhoto` runs server-side — re-reading every
   derivative off disk, not trusting the encode succeeded. `verify.ts` also
   reads each ORIGINAL file's real EXIF before conversion (never forwarded
   anywhere) so the manifest can report "GPS was present and was stripped",
   not just "no GPS found" — the same "prove it was there, prove it left"
   pairing `exif.ts`'s own header argues for.
4. **Emits `manifest.json`** — one row per surviving item (51: 48 images + 3
   videos; the one duplicate is logged in `dropped`, not silently gone).
5. **Emits `authorship.tsv`** — see below.

## Step 2 — the founder fills in `authorship.tsv`

Three-line header, then one row per photo: `file`, `date`, `subject` (so the
founder can recognise it without opening the file), `guess_author`,
`guess_reason`, and a blank `author_correction` column.

**The guess is a guess, and is explicitly one for a reason the founder stated
directly: the file format does not indicate who took a photo.** `manifest.ts`
does NOT use the catalogue's `likely_shooter` field (built from "HEIC ⇒
on_this_phone, JPG/PNG ⇒ received") to decide a guess, because that field
is itself a format-based signal — using it would be doing the exact thing the
founder said not to trust. The guess used instead: a photo with exactly one
person described in it was probably taken by the other one (the founder's own
heuristic), read off the catalogue's free-text description. Group shots,
landscapes, and photos with both people get no guess.

**`author_correction` must be filled in for every row the founder wants
loaded — a matching guess is not enough.** `load.ts` only reads
`author_correction`; a non-empty `guess_author` next to a blank
`author_correction` is treated as unresolved and skipped. This is deliberate,
not a bug: the founder said the guess mechanism is unreliable, so the loader
requires his explicit word even when the guess and his eventual answer turn
out to agree.

## Step 3 — `load.ts`

Reads `manifest.json` + `authorship.tsv`, and inserts via **the existing data
layer** — `commitPhoto` from `apps/web/lib/data/photos.ts`, completely
unmodified. `gateway.ts`/`db.ts` exist only to give that function a
`DataGateway` to run against outside the running app (same ARCH §6.3
exception `tools/export/read.ts` already uses for reads, applied here to
writes — see `db.ts`'s header).

**DRY RUN BY DEFAULT.** Without `--commit`, nothing is uploaded or inserted,
and no Supabase credentials are needed — it only reads the manifest and
authorship sheet and prints what it would do.

**What gets committed, and what doesn't:**

- Only **image** items with a **founder-confirmed author** are eligible.
- Every eligible row is inserted with `kind: "book"`, never `"daily"`.
  `"daily"` means "the one shared card for a day" and `commitPhoto` retires
  the author's prior live daily whenever a new one commits for the same day
  — inserting a backlog of many photos per day as `"daily"` would each retire
  the one before it, soft-deleting all but the last photo of every
  multi-photo day. `"book"` skips that superseding logic entirely.
- **Videos are not committed to the database.** `photos.mime` is
  `"image/jpeg"` only in the current schema — there is no video kind, no
  video mime, and no column for a poster-frame relationship. Forcing a video
  into `photos` would mean inventing schema, which this tool does not do.
  The three videos ARE fully prepared (transcoded, metadata-stripped,
  verified, posters extracted) by `prepare.ts` and sit in `manifest.json`
  ready to load the moment a schema decision is made — `load.ts` reports
  them explicitly as skipped for this reason, in both dry-run and commit mode.
- **`shared_day` is derived from the filename date, not from when this script
  runs.** `commitPhoto` computes `shared_day` from `deps.now()` — injectable
  specifically for cases like this (its own doc comment: "so a test can pin
  an instant"). `load.ts` injects
  `startOfLocalDay(item.isoDate, author.home_timezone) + 12h` per photo — noon
  local, safely clear of any DST boundary — so each row files under the date
  the founder named it with, in the author's own zone. `lib/shared-day/` is
  never modified; only its exported, already-tested functions are called.
- **Idempotent**, by a `client_uuid` deterministically derived from the source
  filename (same key on every run). Before doing any work for an item,
  `load.ts` checks `findPhotoByClientUuid`; if the row is already there,
  nothing is re-uploaded and nothing is re-inserted. Safe to re-run after
  filling in more of `authorship.tsv` — only the newly-resolved rows commit.
- Each committed photo also gets its **true original** (untouched bytes,
  whatever EXIF/GPS it had) uploaded to the private `original.jpg` storage
  path, so `commitPhoto`'s `original_location: "supabase"` is a true claim
  about what's actually in storage rather than a name with nothing behind it.
  That path is never served to a browser (`readPhotoBytes` only ever serves
  `display`/`thumb`).

## What this tool does NOT do

- **Does not place photos onto Book pages.** Committing a row to `photos`
  makes it exist; it does not create a `book_entries` row, and this tool does
  not invent one — choosing where 48 photos land on the Book's pages, and in
  what order, is a product decision for a human or a future CPO-briefed
  worker, not something an ingest script should decide unilaterally.
- **Does not decide anything about the 3 videos beyond preparing their
  files.** Whether/how video becomes part of the schema is a CTO decision.
- **Does not curate.** The founder chose all 52 files. The only files this
  tool ever omits are exact byte-identical duplicates (one, so far:
  `24:7:26-12.HEIC`).

## Tests

```sh
cd apps/web && npm run test:tools
```

Covers: the `DD:MM:YY[-N].EXT` filename grammar (including the two hard-coded
corrections and a check that no two of the 52 real filenames collide on their
derivative base name — the bug that shipped in the first draft of this tool,
caught by inspecting real output rather than trusting the file counts), the
authorship guess heuristic (including that it never uses the format-based
`likely_shooter` signal), and the `authorship.tsv` round-trip (write, then
parse a founder-edited copy back).

## Dependencies

`tsx` (installed locally in `tools/`, devDependency — see `tools/package.json`)
for `@/`-alias resolution; `@supabase/supabase-js` (already a `tools/`
dependency via `tools/export`). External tools: `sips` (macOS, ships with the
OS) and `ffmpeg`/`ffprobe` (Homebrew: `brew install ffmpeg`). `prepare.ts`
checks for all three on startup and stops with a clear message — not a
half-finished run — if any are missing.
