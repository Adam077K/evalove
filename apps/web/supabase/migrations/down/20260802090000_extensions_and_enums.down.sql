-- =============================================================================
-- DOWN for migration 01 of 14 — extensions and enum types
--
-- Run the down migrations in REVERSE order (14 -> 01). These types are still in
-- use by photos and dates; dropping them before those tables are gone will raise
-- a dependency error, which is the correct behaviour.
--
-- pgcrypto is intentionally NOT dropped: it is a shared, harmless extension that
-- other things on the instance may rely on, and dropping it is not a reversal of
-- anything this project did (Supabase ships it pre-installed).
-- =============================================================================

drop type if exists public.date_status;
drop type if exists public.date_kind;
drop type if exists public.photo_kind;
