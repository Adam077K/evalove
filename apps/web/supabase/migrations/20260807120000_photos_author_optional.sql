-- =============================================================================
-- Eva & Adam — migration 12 of 12 — photos.author_member_id becomes optional
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   See ./README.md for what applying a migration in this directory means and
--   who signs it off. As of this file's authoring (2026-08-07) it has the same
--   status every migration in this directory has: written and reasoned about,
--   never executed against anything, local or hosted.
--
-- Down: ./down/20260807120000_photos_author_optional.down.sql
-- Depends on: migration 03 (photos)
-- Founder decision this implements (verbatim, 2026-08-07): "Let the Book hold
--   them unsigned — treat these as shared, not authored; they belong to the
--   day rather than to a person." Covers photographs nobody could confidently
--   attribute to Eva or Adam (a "cannot tell" read) and photographs a third
--   party took of them together — 28 of the founder's first 51 real
--   photographs, most from an evening they spent physically side by side.
-- =============================================================================

-- WHAT THIS CHANGES, IN ONE SENTENCE. `photos.author_member_id` drops its
-- `not null`. Nothing else about the column changes: it is still a foreign
-- key into `public.members(id)` when it IS set, so an unsigned photo is a row
-- with `author_member_id is null`, never a row pointing at a fabricated or
-- placeholder member. There is no third "unsigned" member row, and there
-- must never be one — that would turn "nobody signed this" into a lie about
-- who did.

-- WHY THIS IS SAFE FOR THE ONE UNIQUENESS RULE THAT TOUCHES THIS COLUMN.
-- `photos_one_daily_per_member_per_day` (migration 03) is a partial unique
-- index on `(author_member_id, shared_day) where kind = 'daily' and
-- deleted_at is null`. PostgreSQL unique indexes never treat two NULLs as
-- equal, so this index would not, on its own, stop two different unsigned
-- `daily` rows from landing on the same day. The CHECK constraint added
-- below closes that gap at its root instead: an unsigned photo cannot be
-- `kind = 'daily'` at all. "Daily" means "the one shared card for a day,
-- posted by a person" — a concept that has no meaning without a person to
-- post it. Unsigned rows are `kind = 'book'` only, which is also the only
-- kind the ingest tool that produced them ever writes (see
-- tools/ingest/load.ts).

-- WHY THIS DOES NOT TOUCH THE DAY MODEL. `lib/shared-day/` is untouchable —
-- nothing here alters it, and nothing needs to. The pairing logic that reads
-- `photos` for Today (`todaySnapshot` in apps/web/lib/data/photos.ts) and for
-- the Book's kept days (`toSharedDay` in apps/web/lib/data/archive.ts) both
-- key off a resolved *slug*, not off this column directly, and an unsigned
-- photo simply never resolves to `"eva"` or `"adam"` — it is not close to
-- either total, by construction, not by a filter someone has to remember to
-- add. The CHECK constraint below is what makes that true for `kind =
-- 'daily'` at the one layer no application code can route around.

alter table public.photos
  alter column author_member_id drop not null;

-- Belt to that suspenders: enforced in the database, not only in
-- `commitPhoto` (apps/web/lib/data/photos.ts), which now also refuses a
-- `kind: "daily"` commit with no author before this constraint would ever be
-- reached.
alter table public.photos
  add constraint photos_daily_requires_author
  check (kind <> 'daily' or author_member_id is not null);

-- `photos_author_day_idx` (migration 03) needs no change. A leading-column
-- btree index on `(author_member_id, shared_day)` indexes NULLs like any
-- other value; it still serves the foreign key's lookups for every signed
-- row and simply groups unsigned rows together under NULL, which nothing
-- queries for on purpose.
