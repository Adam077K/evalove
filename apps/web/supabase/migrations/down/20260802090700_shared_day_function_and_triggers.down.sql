-- =============================================================================
-- DOWN for migration 08 of 11 — shared_day_of() and its validation triggers
--
-- Run the down migrations in REVERSE order (11 -> 01).
--
-- WARNING — THIS DOWN MIGRATION DESTROYS NO DATA AND IS STILL THE MOST DANGEROUS
-- ONE IN THE SET.
--
-- Everything else here can be re-derived, re-imported or re-entered. This file
-- removes the only mechanism that stops a wrong shared_day from being written,
-- and a wrong shared_day is permanent, silent and unauditable: nothing downstream
-- raises, no count looks odd, the photo is simply filed under the wrong day of
-- their lives, forever.
--
-- Rows written while these triggers are absent are NOT retroactively checked when
-- the triggers come back. Migration 08 fires on insert and on updates of the
-- three input columns only, so re-applying it validates future writes and says
-- nothing about the gap. Audit the gap yourself with the two queries at the foot
-- of the up migration before considering the rollback finished.
--
-- If the reason for running this is "a legitimate write is being rejected": that
-- is the trigger doing its job, and the row is the thing to look at. Dropping the
-- check to get the write through converts a caught bug into an uncaught one.
--
-- Drop order: the triggers first, then the function they call, then the function
-- that one calls. Dropping public.shared_day_of before the trigger function would
-- raise a dependency error, which is correct behaviour and not a problem to work
-- around with CASCADE. There is no `cascade` anywhere in this file on purpose.
-- =============================================================================

drop trigger if exists vault_items_shared_day_matches_tz on public.vault_items;
drop trigger if exists photos_shared_day_matches_tz      on public.photos;

drop function if exists public.enforce_shared_day_matches_tz();

-- shared_day_of is dropped last. Note that migration 09's views do not call it —
-- they group on the stored column — so nothing else in this schema depends on it.
drop function if exists public.shared_day_of(timestamptz, text);
