-- =============================================================================
-- Eva & Adam — migration 02 of 11 — members
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   The founder confirmed from the Supabase dashboard on 2026-08-04 that
--   tables exist in project oqiyzzpcsdlqqcjlpmix. Nobody has verified which
--   of these migrations are applied, or whether the live schema matches this
--   file exactly — that check has not been done. Verify against the live
--   schema before running anything here.
--
-- Down: ./down/20260802090100_members.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.1
-- =============================================================================

-- Exactly two rows, forever. Slugs are NAMES, not 'a'/'b'.
--
-- The library's couple.a / couple.b ordering puts Adam first; the product name
-- puts Eva first. Those two orderings disagree, so an index-style slug is exactly
-- how a wrong-attribution bug gets written. The check constraint below makes the
-- database refuse to hold any slug other than the two names.
create table if not exists public.members (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug in ('eva', 'adam')),
  display_name  text not null,
  home_timezone text not null,   -- IANA identifier. eva: America/New_York · adam: Asia/Jerusalem
  created_at    timestamptz not null default now()
);

-- ADDITION BEYOND LDR §2.1 — see README "Deliberate additions", item A1.
--
-- home_timezone is an IANA identifier and never a numeric offset (LDR §2, first
-- line). This is a SHAPE check, not a tzdata check: an identifier must begin with
-- a letter, which rejects '+02:00', '120', '02:00' and '-0500' while accepting
-- 'America/New_York', 'Asia/Jerusalem', 'UTC' and 'Etc/GMT+3'.
--
-- Deliberately loose. Checking against real tzdata is the golden tests' job
-- (P1-T6): tzdata changes under a running database, and a constraint that
-- encodes a snapshot of it would eventually reject a zone that became valid.
--
-- photos.shared_day_tz and vault_items.shared_day_tz need no equivalent check.
-- The shared_day trigger (migration 08) evaluates `ts at time zone tz` on every
-- write, and PostgreSQL raises on an unrecognised zone — so those two columns are
-- validated against actual tzdata on every row, which is stronger than a regex.
do $mig$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'members_home_timezone_is_iana'
      and conrelid = 'public.members'::regclass
  ) then
    alter table public.members
      add constraint members_home_timezone_is_iana
      check (home_timezone ~ '^[A-Za-z][A-Za-z0-9_+/-]*$');
  end if;
end
$mig$;
