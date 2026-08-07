-- =============================================================================
-- DOWN for migration 12 of 12 — photos.author_member_id becomes optional
--
-- Run the down migrations in REVERSE order (12 -> 01).
--
-- STOP AND READ BEFORE RUNNING THIS AGAINST A PROJECT HOLDING REAL CONTENT.
-- Migration 12 exists to let a photo have `author_member_id is null`. If any
-- row already has one when this file runs, `set not null` below fails outright
-- (PostgreSQL refuses to add a NOT NULL constraint while a NULL is present) —
-- so this rollback cannot silently corrupt data, but it also cannot silently
-- succeed. Reassign or remove every unsigned row's `author_member_id` first,
-- or decide those rows should not exist, before running this file.
--
-- To find out whether that is true right now:
--
--   select count(*) from public.photos where author_member_id is null;
--
-- A non-zero count means this file will error, on purpose, at the first
-- statement below.
-- =============================================================================

-- Drop the CHECK first — dropping the NOT NULL it exists to reinforce while
-- the CHECK is still in place is legal (the CHECK only fires on `kind =
-- 'daily'`), but leaving both directions half-done, even briefly, is not the
-- shape a rollback should leave behind.
alter table public.photos
  drop constraint if exists photos_daily_requires_author;

alter table public.photos
  alter column author_member_id set not null;

-- `photos_author_day_idx` was never altered by migration 12 and needs no
-- reversal here.
