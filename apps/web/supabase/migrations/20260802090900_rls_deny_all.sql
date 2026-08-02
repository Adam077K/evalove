-- =============================================================================
-- Eva & Adam — migration 10 of 11 — row-level security, deny-all, every table
--
--   !! NEVER APPLIED. This file has not been run against any database. !!
--   See ./README.md for what applying it means and who signs it off.
--
-- Down: ./down/20260802090900_rls_deny_all.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.5
-- Depends on: every table — migrations 02, 03, 04, 05, 06, 07
-- =============================================================================

-- RLS ENABLED ON EVERY TABLE. ZERO POLICIES. DENY-ALL.
--
-- That combination is not an unfinished job. In PostgreSQL, a table with RLS
-- enabled and no policies returns no rows to anyone who is subject to RLS, and
-- accepts no writes from them either. Deny-all is the whole configuration, it is
-- stated in LDR §2.5, and it is what should be here at the end of Phase 1.
--
-- WHY THIS IS NOT A PROBLEM FOR THE RUNNING APP. No client in Phase 1 holds a
-- Supabase key of any kind. Every read and write goes through the Next.js server
-- using the service role, and the service role bypasses RLS. Nothing the two of
-- them can do in the browser touches PostgreSQL directly, so nothing they can do
-- is denied. Turning this on changes the behaviour of the application by
-- precisely nothing, today.
--
-- WHY IT IS WORTH DOING ANYWAY. Because the anon key is a public string. It ships
-- in JavaScript by design, it gets pasted into issues, it survives in build
-- artefacts and browser caches, and treating its exposure as an incident rather
-- than as a Tuesday is not a plan. With deny-all in place, that key grants
-- nothing: not a photo, not a caption, not a vault item, not the count of days.
-- Without it, the same key is a full read of two people's private life.
--
-- This is defence in depth in its literal sense — the application's own access
-- control is not what is being distrusted here; the possibility of a second path
-- to the database existing at all is.
--
-- WHAT PHASE 2 DOES. Adds policies keyed on auth.uid(), and nothing else. No
-- column changes, no table changes, no data migration. The tables are already
-- shaped for it: every row that belongs to a person carries author_member_id or
-- member_id, so a policy has something to key on the day one is wanted. That is
-- why this file can be a one-line-per-table change and still be the finished
-- posture rather than a placeholder.
--
-- VIEWS ARE NOT COVERED HERE, AND DO NOT NEED TO BE. A view cannot have RLS of
-- its own. Both views in migration 09 are declared `security_invoker = on`, which
-- makes them evaluate the underlying tables as the CALLER — so the deny-all below
-- reaches through them automatically. Had they been left at the PostgreSQL
-- default, they would execute as their owner, bypass everything on this page, and
-- serve every shared day to anyone holding the anon key. Any future view over
-- these tables must set security_invoker; there is no other way to keep this
-- migration true.
--
-- `alter table ... enable row level security` is idempotent: enabling it on a
-- table that already has it is a no-op, not an error. The whole file re-runs
-- cleanly.


-- -----------------------------------------------------------------------------
-- Every table in `public`, listed one per line, on purpose.
-- -----------------------------------------------------------------------------
--
-- A loop over the catalogue would be shorter and would have been the clever way
-- to write this. It is spelled out instead because this file is a founder
-- sign-off document before it is code, and "every table" is a claim that should
-- be checkable by reading eleven lines rather than by trusting a query. The
-- guard at the foot of the file is what makes the claim true even so.

alter table public.members        enable row level security;
alter table public.photos         enable row level security;
alter table public.vault_items    enable row level security;
alter table public.dates          enable row level security;
alter table public.date_turns     enable row level security;
alter table public.book_entries   enable row level security;
alter table public.activity_state enable row level security;
alter table public.activity_log   enable row level security;
alter table public.auth_attempts  enable row level security;
alter table public.purge_audit    enable row level security;
alter table public.app_settings   enable row level security;

-- No `create policy` statement appears in this file, and that absence is the
-- configuration. Do not add one here to "make things work" — if something has
-- stopped working, it is talking to PostgreSQL without the service role, and the
-- fix is in that caller.
--
-- Nor is `force row level security` used. Forcing would apply RLS to the table
-- owner as well, which buys nothing while every legitimate caller is the service
-- role, and would complicate ordinary maintenance from the SQL editor.


-- -----------------------------------------------------------------------------
-- Self-check: this migration refuses to finish if it missed a table.
-- -----------------------------------------------------------------------------
--
-- The list above is hand-maintained, which means it can go stale — a table added
-- by a later migration would sit in `public` with RLS off and nothing would say
-- so. This block closes that gap permanently: it asks the catalogue rather than
-- the list, and raises with the names of any offenders, so the omission surfaces
-- as a refusal to migrate instead of as a quiet hole.
--
-- Named dollar tag, no DECLARE section, matching migration 01.

do $mig$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')     -- ordinary and partitioned tables
      and not c.relrowsecurity
  ) then
    raise exception
      'RLS deny-all is incomplete: these public tables still have RLS off: %',
      (
        select string_agg(c.relname, ', ' order by c.relname)
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind in ('r', 'p')
          and not c.relrowsecurity
      )
      using
        errcode = '42501',   -- insufficient_privilege: this is a security refusal
        hint =
          'Add the missing table to migration 10 (or to the migration that '
          'created it) with: alter table public.<name> enable row level security;';
  end if;
end
$mig$;


-- -----------------------------------------------------------------------------
-- How to verify the posture by hand, after applying.
-- -----------------------------------------------------------------------------
--
-- Every table shows true, no exceptions:
--
--   select c.relname, c.relrowsecurity
--     from pg_class c
--     join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind in ('r', 'p')
--    order by c.relname;
--
-- Policy count is zero for the whole of Phase 1. The first row this returns is
-- the day Phase 2 started, and it should be a deliberate day:
--
--   select schemaname, tablename, policyname from pg_policies
--    where schemaname = 'public';
--
-- Both views report security_invoker. Anything false here reopens the hole this
-- migration closes:
--
--   select c.relname, c.reloptions
--     from pg_class c
--     join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'v'
--    order by c.relname;
--
-- The end-to-end check, and the only one that really settles it: connect with the
-- ANON key and select from public.photos and from public.v_shared_days. Both must
-- return zero rows. If either returns anything at all, stop and find out why
-- before this database is given anything real to hold.
