-- =============================================================================
-- Eva & Adam — migration 03 of 14 — photos
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   The founder confirmed from the Supabase dashboard on 2026-08-04 that
--   tables exist in project oqiyzzpcsdlqqcjlpmix. Nobody has verified which
--   of these migrations are applied, or whether the live schema matches this
--   file exactly — that check has not been done. Verify against the live
--   schema before running anything here.
--
-- Down: ./down/20260802090200_photos.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.1
-- =============================================================================

-- THERE IS DELIBERATELY NO SENSITIVITY COLUMN ON THIS TABLE.
--
-- Not a boolean, not an enum, not a nullable flag, not a tag array. If a row is
-- in this table, it is not private. Private content lives in vault_items, which
-- is a physically separate table with its own storage prefix, its own routes and
-- its own repository module (LDR §5.5).
--
-- The reason is a bug we are refusing to make possible. A `where not private`
-- that someone forgets once — in a new endpoint, in an export, in a debug query,
-- in a migration script written at 1am — is the precise bug this shape exists to
-- prevent. With separation, no query written against `photos` can return a vault
-- item, whether or not its author remembered to filter. There is no filter to
-- forget, because there is nothing here to filter out.
--
-- Do not add a sensitivity column to this table. If a future feature seems to
-- need one, that feature needs a third table, not a flag.

create table if not exists public.photos (
  id                    uuid primary key,          -- supplied by the app, not defaulted; see note below
  client_uuid           text not null unique,      -- client-generated, stable across retries: the idempotency key
  kind                  public.photo_kind not null,
  author_member_id      uuid not null references public.members(id),
  attribution_source    text not null default 'self_declared'
                          check (attribution_source in ('self_declared', 'authenticated')),

  -- The day model (LDR §3). These three columns together make shared_day
  -- reproducible forever: the label can be re-derived years from now, independent
  -- of who posted it or where either person lives by then.
  shared_day            date not null,
  shared_day_tz         text not null,   -- IANA identifier, the authority for the day boundary
  client_reported_tz    text,            -- what the device claimed. Advisory only, never authoritative.

  taken_at              timestamptz,     -- EXIF capture time, when the file carried one
  caption               text,

  storage_path_display  text not null,   -- p/{id}/display.jpg
  storage_path_thumb    text not null,   -- p/{id}/thumb.jpg
  storage_path_original text,
  original_location     text not null default 'none'
                          check (original_location in ('none', 'supabase', 'r2', 'purged')),

  width  int not null check (width  > 0),
  height int not null check (height > 0),
  bytes  int not null check (bytes  > 0),
  mime   text not null check (mime = 'image/jpeg'),
  color_space text not null default 'srgb' check (color_space in ('srgb', 'display-p3')),
  checksum_sha256 text not null,
  exif_stripped   boolean not null default true,

  created_at         timestamptz not null default now(),
  deleted_at         timestamptz,   -- soft delete: hidden from the UI, bytes still present
  purge_requested_at timestamptz,   -- a hard delete of the bytes was asked for
  purged_at          timestamptz    -- the bytes are gone
);

-- `id` has no default on purpose. The app generates it client-side so the same
-- value can name the storage paths (p/{id}/display.jpg) before the row exists,
-- and so an upload retried from the offline outbox lands on the same row.

-- -----------------------------------------------------------------------------
-- Indexes (LDR §2.1, verbatim)
-- -----------------------------------------------------------------------------

create index if not exists photos_shared_day_idx
  on public.photos (shared_day desc)
  where deleted_at is null;

create index if not exists photos_kind_created_idx
  on public.photos (kind, created_at desc)
  where deleted_at is null;

-- Also serves the photos.author_member_id foreign key: author_member_id is the
-- leading column, so the planner can use this index for the FK's lookups.
create index if not exists photos_author_day_idx
  on public.photos (author_member_id, shared_day)
  where deleted_at is null;

create index if not exists photos_purge_queue_idx
  on public.photos (purge_requested_at)
  where purged_at is null;

-- One daily photo each per shared day (CPO: "one photo each, paired on a spread").
--
-- A re-post SOFT-DELETES the prior row, which is what keeps this index satisfied.
-- The replacement then reads as "use this one instead" rather than as an error
-- thrown in somebody's face — the constraint exists to keep the spread coherent,
-- not to tell either of them they already had their turn.
--
-- `kind = 'book'` rows are excluded: a photo bound into the book is not the daily.
create unique index if not exists photos_one_daily_per_member_per_day
  on public.photos (author_member_id, shared_day)
  where kind = 'daily' and deleted_at is null;
