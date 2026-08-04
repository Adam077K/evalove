-- =============================================================================
-- DOWN for migration 04 of 11 — vault_items
--
-- WARNING: THIS DESTROYS EVERY VAULT ROW. The bytes under v/{id}/ in Supabase
-- Storage are NOT touched and will be orphaned with no row naming them. For this
-- table in particular, orphaned bytes with no index into them is a worse state
-- than either "present and tracked" or "gone": purge the objects FIRST, confirm
-- via purge_audit, and only then run this.
--
-- Run downs in reverse order (11 -> 01).
-- =============================================================================

drop table if exists public.vault_items;
