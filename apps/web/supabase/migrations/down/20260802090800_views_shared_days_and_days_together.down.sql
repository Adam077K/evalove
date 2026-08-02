-- =============================================================================
-- DOWN for migration 09 of 11 — v_shared_days and v_days_together
--
-- Run the down migrations in REVERSE order (11 -> 01).
--
-- Safe in the sense that matters: a view holds no data. Both of these are pure
-- functions of the photos and members rows, and re-applying migration 09 restores
-- them byte for byte. Nothing is lost here that the tables cannot regenerate.
--
-- What IS lost while they are absent is the definition of the tally. The number
-- "days together" exists in exactly one place in this system — the where clause
-- of v_days_together, filtering on purged_at rather than deleted_at. If anything
-- recomputes that number by hand while this view is dropped, the near-certain
-- mistake is to filter on deleted_at instead, because that is what the display
-- view does and it is the obvious thing to copy. That would produce a smaller
-- number that looks plausible and is wrong, and if it were ever written down
-- anywhere the error would outlive the workaround.
--
-- Do not reimplement the tally in application code, in a dashboard, or in a
-- one-off query while this is rolled back. Re-apply migration 09 instead.
--
-- No CASCADE. Nothing in this schema depends on either view; if a drop raises a
-- dependency error, something new has come to depend on one of them and that is
-- worth knowing before it is removed.
-- =============================================================================

drop view if exists public.v_days_together;
drop view if exists public.v_shared_days;
