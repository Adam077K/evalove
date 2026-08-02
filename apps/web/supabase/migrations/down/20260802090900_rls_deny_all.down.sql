-- =============================================================================
-- DOWN for migration 10 of 11 — row-level security, deny-all
--
-- Run the down migrations in REVERSE order (11 -> 01).
--
-- STOP. THIS IS THE ONLY DOWN MIGRATION IN THE SET THAT MAKES THE DATABASE LESS
-- SAFE WHILE DESTROYING NOTHING, WHICH IS WHAT MAKES IT EASY TO RUN BY MISTAKE.
--
-- Every other rollback here announces itself: tables disappear, the book's order
-- is gone, the audit trail is gone. This one leaves every row exactly where it
-- was and quietly re-opens direct access to all of it. Running it turns the anon
-- key — a public string that ships in JavaScript — back into a full read of two
-- people's photographs, captions, vault items and private messages to each other.
--
-- There is no legitimate Phase 1 reason to run this file. Nothing in the
-- application is subject to RLS: every call goes through the Next.js server with
-- the service role, which bypasses it. So if something has stopped working and
-- this file looks like the fix, the diagnosis is wrong — something is reaching
-- PostgreSQL without the service role, and THAT is the finding. Disabling RLS
-- would hide it and leave the database open in exchange.
--
-- It exists only to make migration 10 honestly reversible, which every migration
-- in this set is required to be. Reversible is not the same as advisable.
--
-- If it is run anyway: the tables below are open to any role that can reach the
-- database from the moment each statement commits. Re-apply migration 10 as soon
-- as whatever it was is understood, and treat the anon key as exposed for the
-- duration — rotate it rather than assume the window was too short to matter.
-- =============================================================================

alter table public.app_settings   disable row level security;
alter table public.purge_audit    disable row level security;
alter table public.auth_attempts  disable row level security;
alter table public.activity_log   disable row level security;
alter table public.activity_state disable row level security;
alter table public.book_entries   disable row level security;
alter table public.date_turns     disable row level security;
alter table public.dates          disable row level security;
alter table public.vault_items    disable row level security;
alter table public.photos         disable row level security;
alter table public.members        disable row level security;

-- No policies are dropped, because migration 10 creates none. If a `drop policy`
-- ever becomes necessary here, Phase 2 has begun and this file is out of date.
