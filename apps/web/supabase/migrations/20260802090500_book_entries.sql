-- =============================================================================
-- Eva & Adam — migration 06 of 14 — book_entries
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   The founder confirmed from the Supabase dashboard on 2026-08-04 that
--   tables exist in project oqiyzzpcsdlqqcjlpmix. Nobody has verified which
--   of these migrations are applied, or whether the live schema matches this
--   file exactly — that check has not been done. Verify against the live
--   schema before running anything here.
--
-- Down: ./down/20260802090500_book_entries.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.1
-- Depends on: photos (03), dates (05)
-- =============================================================================

-- A page is EITHER a photo OR a finished date's artifact — never both, never
-- neither. The XOR check below makes the two impossible states unrepresentable
-- rather than merely unlikely; apps/web/lib/types.ts models the same rule as a
-- discriminated union so the compiler rejects them too.
--
-- photo_id REFERENCES public.photos ONLY. There is no foreign key to vault_items
-- and there is no polymorphic "item_table" discriminator that could be pointed at
-- one. The database itself therefore refuses to place a vault item in the book —
-- not by policy, not by a check in a route handler that a later route handler
-- forgets to copy, but because there is no column that can hold that reference.

create table if not exists public.book_entries (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid references public.photos(id),
  date_id    uuid references public.dates(id),

  -- Fractional index. A reorder writes ONE row: to move a page between two
  -- others, give it a position halfway between theirs. numeric (not int) is what
  -- makes that always possible — there is always a value between any two
  -- distinct numerics, so a reorder never has to renumber the whole book.
  --
  -- NOTE: apps/web/lib/types.ts describes this field as "Sparse integers,
  -- re-spaced on reorder", which is a different and incompatible strategy.
  -- The SQL follows the LDR. Flagged to the CEO in the P1-T2 return; one of the
  -- two comments needs to change before either side is implemented against it.
  position   numeric not null,

  caption    text,
  date_label text,     -- human-written label for the spread, e.g. "the night of the storm"
  created_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint book_entry_is_photo_xor_date
    check ((photo_id is null) <> (date_id is null))
);

-- A photo appears at most once in the live book, and so does a date. Partial on
-- deleted_at so that removing a page and re-adding the same photo later works.
create unique index if not exists book_entries_photo_idx
  on public.book_entries (photo_id)
  where deleted_at is null and photo_id is not null;

create unique index if not exists book_entries_date_idx
  on public.book_entries (date_id)
  where deleted_at is null and date_id is not null;

create index if not exists book_entries_position_idx
  on public.book_entries (position)
  where deleted_at is null;
