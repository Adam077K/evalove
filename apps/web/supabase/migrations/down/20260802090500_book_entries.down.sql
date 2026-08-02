-- =============================================================================
-- DOWN for migration 06 of 14 — book_entries
--
-- WARNING: this destroys the book's ordering and every hand-written caption and
-- date_label on it. The photos and dates survive — they live in their own tables
-- — but the curation does not, and the curation is the part nobody can regenerate.
--
-- Run downs in reverse order (14 -> 01).
-- =============================================================================

drop table if exists public.book_entries;
