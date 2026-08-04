-- =============================================================================
-- DOWN for migration 05 of 11 — dates and date_turns
--
-- WARNING: date_turns is append-only by design, and this drops all of it. Every
-- turn either of them ever took in a story, a twenty-questions round or a paired
-- question is in that table and nowhere else. There is no derived copy.
--
-- book_entries.date_id references dates, so dates cannot be dropped until
-- book_entries is gone. Run downs in reverse order (11 -> 01).
-- =============================================================================

drop table if exists public.date_turns;
drop table if exists public.dates;
