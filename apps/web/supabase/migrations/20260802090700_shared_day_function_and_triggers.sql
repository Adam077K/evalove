-- =============================================================================
-- Eva & Adam — migration 08 of 11 — shared_day_of() and its validation triggers
--
--   !! NEVER APPLIED. This file has not been run against any database. !!
--   See ./README.md for what applying it means and who signs it off.
--
-- Down: ./down/20260802090700_shared_day_function_and_triggers.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.2, §3
-- Depends on: photos (03), vault_items (04)
-- =============================================================================

-- THIS IS THE MOST IMPORTANT FILE IN THIS MIGRATION SET.
--
-- shared_day is the one column in this schema whose silent corruption would be
-- both permanent and unauditable. Every other derived value in this product is
-- recomputable: days_together is an aggregate, `faded` is read-time, the book's
-- order is a number anyone can look at and fix. shared_day is not recomputable
-- after the fact unless the zone it was resolved in is stored beside it — and if
-- a wrong value is written, nothing downstream will ever notice. The photo will
-- simply be filed under the wrong day, forever, in a product whose entire subject
-- is which day something happened on.
--
-- So it gets computed twice, by two different pieces of software, and the write
-- is rejected if they disagree. The application computes it (TypeScript, Intl);
-- the database checks it (SQL, tzdata). The trigger below is the check.
--
-- The three columns together — shared_day, shared_day_tz, created_at — make the
-- label REPRODUCIBLE FOREVER. Years from now, with both of them living somewhere
-- neither has thought of yet, any row's day label can be re-derived from the row
-- itself. It does not depend on who posted it, on where they live now, on the
-- server's timezone setting, or on anyone remembering what the rule used to be.


-- -----------------------------------------------------------------------------
-- NO NUMERIC UTC OFFSET APPEARS ANYWHERE IN THIS FILE, AND NONE MAY BE ADDED.
-- -----------------------------------------------------------------------------
--
-- Not as a constant, not as an interval added to a timestamp, not as a signed
-- number of hours, not inside a comment as an example. `AT TIME ZONE` is used
-- here in exactly one of its two forms: the one whose right-hand side is an IANA
-- identifier string held in a column. The other form — the one that takes an
-- interval — is banned outright, because it is the same expression with the same
-- name that quietly stops tracking daylight saving.
--
-- This is not stylistic. An earlier day model anchored the shared day to a fixed
-- hour of UTC. Measured against the tz database, it disagreed with the model that
-- was adopted on 44.1% of one partner's posts — not on edge cases, not at DST
-- transitions, but on nearly half of everything she posted, every single day. A
-- stray offset in date arithmetic anywhere in this schema is exactly the
-- regression that would silently resurrect it, and it would resurrect it without
-- an error, without a test going red, and without either of them being told.


-- -----------------------------------------------------------------------------
-- shared_day_of(ts, tz) — the definition of a shared day, in one line.
-- -----------------------------------------------------------------------------
--
-- LDR §2.2 verbatim. `create or replace` rather than a catalogue guard: replacing
-- a function with an identical definition is already idempotent, and the signature
-- is fixed, so no overload can accumulate.
--
-- ON `immutable`, WHICH IS A DELIBERATE OVERSTATEMENT — read this before reusing
-- the function anywhere new:
--
--   `timestamptz AT TIME ZONE text` is marked STABLE by PostgreSQL, not
--   IMMUTABLE, and PostgreSQL is right: tzdata is a moving object, and a
--   government can redefine a zone's history retroactively. Labelling this
--   wrapper IMMUTABLE asserts something slightly stronger than the truth.
--
--   It is declared that way per LDR §2.2, and it is safe for the single use this
--   schema makes of it — a per-row check evaluated at write time, where the
--   answer is consumed immediately and never stored by the function itself.
--
--   IT MUST NOT BE USED IN AN INDEX EXPRESSION, A GENERATED COLUMN, A CHECK
--   CONSTRAINT, OR A MATERIALIZED VIEW. Every one of those persists a value
--   computed under one revision of tzdata and then trusts it under later ones.
--   That is the corruption this file exists to prevent, arriving by the back door.
--   If you need shared_day in an index, index the stored column — which is what
--   migration 03 already does.
--
-- No `set search_path` clause. The body contains no unqualified reference to any
-- object — only built-in operators and a cast — so there is nothing for a hostile
-- search_path to capture, and leaving the clause off keeps the function inlinable
-- by the planner. The trigger function below, which does call something, sets it.

create or replace function public.shared_day_of(ts timestamptz, tz text)
returns date
language sql
immutable
as $fn$ select (ts at time zone tz)::date $fn$;

comment on function public.shared_day_of(timestamptz, text) is
  'The shared-day label for an instant, resolved in an IANA zone. LDR §2.2. '
  'Never call with a numeric offset; never persist its result in an index, '
  'generated column, check constraint or materialized view.';


-- -----------------------------------------------------------------------------
-- The trigger function — rejects, never repairs.
-- -----------------------------------------------------------------------------
--
-- IT RAISES INSTEAD OF SILENTLY CORRECTING NEW.shared_day.
--
-- A BEFORE trigger could just overwrite the app's value with the computed one and
-- let the write through. That would be worse. If the application and the database
-- disagree about what day it is, one of them has a bug, and the bug is in code
-- that will keep running: an offset creeping into a date helper, a zone read from
-- the wrong member, a client-reported zone promoted to authoritative by mistake.
-- Quietly repairing the row hides that class of bug for as long as the repair
-- keeps working, and the day it stops working there is no evidence of when it
-- started. Rejecting turns a silent, permanent, unauditable data problem into a
-- loud, immediate, fixable one — which is the entire trade this file is making.
--
-- plpgsql with a NAMED dollar tag and NO DECLARE section, matching
-- migration 01: an unnamed tag is what naive SQL splitters choke on, and this
-- body contains semicolons. A trigger function cannot be `language sql` —
-- PostgreSQL will not
-- accept a SQL function returning `trigger` — so plpgsql is not a preference here.
--
-- `set search_path = ''` because this one does call another function by name. It
-- is fully schema-qualified below, and pg_catalog remains implicitly searched, so
-- the empty path costs nothing. plpgsql functions are never inlined, so unlike
-- shared_day_of there is no planner trade to weigh.

create or replace function public.enforce_shared_day_matches_tz()
returns trigger
language plpgsql
set search_path = ''
as $trg$
begin
  -- `is distinct from` rather than `<>`: neither column is nullable, but a null
  -- on either side of `<>` yields null, and a null predicate is not a rejection.
  -- The comparison that cannot be quietly skipped is the one to write.
  if new.shared_day is distinct from
     public.shared_day_of(new.created_at, new.shared_day_tz) then

    raise exception
      'shared_day % disagrees with the database: (created_at % at time zone %) is day %',
      new.shared_day,
      new.created_at,
      new.shared_day_tz,
      public.shared_day_of(new.created_at, new.shared_day_tz)
      using
        errcode = '23514',   -- check_violation: this is a constraint, told as one
        hint =
          'shared_day must equal (created_at at time zone shared_day_tz)::date, '
          'resolved in the AUTHOR''s own IANA zone. Do not adjust by a numeric '
          'offset and do not use the device-reported zone, which is advisory only.';
  end if;

  return new;
end
$trg$;

comment on function public.enforce_shared_day_matches_tz() is
  'Rejects any photos/vault_items row whose app-supplied shared_day disagrees '
  'with shared_day_of(created_at, shared_day_tz). Never repairs. LDR §2.2.';


-- -----------------------------------------------------------------------------
-- The triggers — on BOTH tables that carry a shared_day.
-- -----------------------------------------------------------------------------
--
-- BEFORE, so a disagreeing row never lands at all rather than landing and being
-- deleted a statement later.
--
-- `created_at` has a column default of now() on both tables. Defaults are applied
-- before a BEFORE ROW INSERT trigger runs, so new.created_at is populated here
-- even when the application does not send it. This is load-bearing and not
-- obvious, which is why it is written down.
--
-- WHY THE UPDATE CASE IS NARROWED TO THREE COLUMNS.
--
-- `update of shared_day, shared_day_tz, created_at` fires only when one of the
-- three inputs is being written. That is not an optimisation. Firing on every
-- update would re-validate historical rows against whatever tzdata the server
-- happens to have TODAY — so if a zone's past were ever redefined, a soft delete,
-- a purge request, or a caption edit on an old photo would be REJECTED by a check
-- about a day that was computed correctly years earlier under the rules of the
-- time. Their history would become read-only by accident, and the error message
-- would be about a timezone.
--
-- A CHECK constraint would have the same defect and a worse version of it: checks
-- are re-verified when a table is rewritten and when a dump is restored, so a
-- tzdata revision could make the database refuse to restore its own backup. That
-- is the actual reason this is a trigger and not a constraint, and it is also why
-- shared_day_of must stay out of any CHECK. What was true when it was written
-- stays written; only new inputs get judged.
--
-- `drop trigger if exists` then `create trigger`: `create or replace trigger`
-- exists from PostgreSQL 14 and Supabase is well past it, but drop-then-create is
-- unambiguously idempotent on every version and re-running it is harmless.

drop trigger if exists photos_shared_day_matches_tz on public.photos;
create trigger photos_shared_day_matches_tz
  before insert or update of shared_day, shared_day_tz, created_at
  on public.photos
  for each row
  execute function public.enforce_shared_day_matches_tz();

-- vault_items gets the identical trigger. The vault is physically separate from
-- photos in every other respect — own table, own storage prefix, own routes, own
-- repository module — and that separation is deliberate. This is the one rule
-- that is deliberately NOT separated: a vault item is still something one of them
-- did on a particular day of their own life, and it is filed by the same day
-- model as everything else. A vault item with a wrong day is as unrecoverable as
-- a photo with a wrong day, and the vault has fewer eyes on it to notice.
drop trigger if exists vault_items_shared_day_matches_tz on public.vault_items;
create trigger vault_items_shared_day_matches_tz
  before insert or update of shared_day, shared_day_tz, created_at
  on public.vault_items
  for each row
  execute function public.enforce_shared_day_matches_tz();


-- -----------------------------------------------------------------------------
-- How to verify this by hand, after the set has been applied.
-- -----------------------------------------------------------------------------
--
-- Both of these must return zero rows, always, on a healthy database. They are
-- the same predicate the trigger enforces, asked of history rather than of a
-- single write, and they are cheap enough to run whenever anyone wants comfort:
--
--   select count(*) from public.photos
--    where shared_day <> public.shared_day_of(created_at, shared_day_tz);
--
--   select count(*) from public.vault_items
--    where shared_day <> public.shared_day_of(created_at, shared_day_tz);
--
-- A non-zero count on an existing database does NOT mean the trigger is broken.
-- It means either that rows predate this migration, or that tzdata has been
-- revised beneath rows that were correct when written — which is precisely the
-- case the narrowed UPDATE clause above refuses to punish anyone for. Investigate
-- before touching a row; the stored value plus its stored zone is the evidence.
--
-- The TypeScript side of the same computation is asserted against this function
-- by the golden tests in P1-T6. PostgreSQL ships full tzdata and Intl reads the
-- platform's, so the two agree; the tests are what keeps that a fact rather than
-- an assumption.
