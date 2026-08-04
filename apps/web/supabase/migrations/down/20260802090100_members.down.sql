-- =============================================================================
-- DOWN for migration 02 of 11 — members
--
-- WARNING: this drops the two member rows along with the table. Every photo,
-- vault item, date and turn references members(id), so this will raise a
-- dependency error unless those tables are already gone. Run downs in reverse
-- order (11 -> 01).
-- =============================================================================

drop table if exists public.members;
