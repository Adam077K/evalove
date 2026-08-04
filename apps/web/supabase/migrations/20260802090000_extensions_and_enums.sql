-- =============================================================================
-- Eva & Adam — migration 01 of 11 — extensions and enum types
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   The founder confirmed from the Supabase dashboard on 2026-08-04 that
--   tables exist in project oqiyzzpcsdlqqcjlpmix. Nobody has verified which
--   of these migrations are applied, or whether the live schema matches this
--   file exactly — that check has not been done. Verify against the live
--   schema before running anything here.
--   See ./README.md for what applying it means and who signs it off.
--
-- Down: ./down/20260802090000_extensions_and_enums.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.1
-- =============================================================================

-- gen_random_uuid() is built in from PostgreSQL 13 onward. pgcrypto is requested
-- anyway so the dependency is written down rather than assumed, and so this file
-- still works on an instance that predates the built-in. On Supabase the
-- extension is already present, so this is a no-op.
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enum types.
--
-- PostgreSQL has no `create type ... if not exists`, so each one is guarded by a
-- catalogue lookup. The dollar tags are NAMED ($mig$, not $$) on purpose: a bare
-- $$ is what naive SQL splitters choke on, and these blocks contain semicolons.
-- No DECLARE section is used anywhere in this migration set.
-- -----------------------------------------------------------------------------

-- photo_kind: 'daily' = the once-a-day shared photo. 'book' = bound into the book.
do $mig$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'photo_kind' and n.nspname = 'public'
  ) then
    create type public.photo_kind as enum ('daily', 'book');
  end if;
end
$mig$;

-- date_kind: one engine, three kinds of hosted date (LDR §3A).
do $mig$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'date_kind' and n.nspname = 'public'
  ) then
    create type public.date_kind as enum ('story', 'twenty_questions', 'paired_question');
  end if;
end
$mig$;

-- date_status: a date that stops is 'faded'. 'faded' is derived from inactivity
-- at read time and is never written by a scheduled job. There is deliberately no
-- fourth value and no value that judges either person.
do $mig$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'date_status' and n.nspname = 'public'
  ) then
    create type public.date_status as enum ('open', 'finished', 'faded');
  end if;
end
$mig$;
