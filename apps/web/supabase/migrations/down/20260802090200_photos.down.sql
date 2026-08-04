-- =============================================================================
-- DOWN for migration 03 of 11 — photos
--
-- WARNING: THIS DESTROYS EVERY PHOTO ROW. The bytes in Supabase Storage under
-- p/{id}/ are NOT touched by this file and will be orphaned — no row will remain
-- that names them. Reconcile storage separately before or after running this.
--
-- book_entries.photo_id references this table, so this will raise a dependency
-- error unless book_entries is already gone. Run downs in reverse order (11 -> 01).
--
-- Dropping the table drops its indexes with it; they are listed here only so the
-- reversal is legible.
--   photos_shared_day_idx
--   photos_kind_created_idx
--   photos_author_day_idx
--   photos_purge_queue_idx
--   photos_one_daily_per_member_per_day
-- =============================================================================

drop table if exists public.photos;
