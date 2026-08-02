-- =============================================================================
-- Eva & Adam — migration 05 of 14 — dates and date_turns
--
--   !! NEVER APPLIED. This file has not been run against any database. !!
--
-- Down: ./down/20260802090400_dates_and_date_turns.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.1, §3A
-- =============================================================================

-- One engine, three kinds of hosted date.
--
-- VOCABULARY, ENFORCED BY CI: the past tense of "to fail", of "to abandon" and of
-- "to expire" do not appear anywhere in this codebase — not as enum values, not
-- as column names, not in comments. A date that stops is 'faded', and 'faded' is
-- DERIVED FROM INACTIVITY AT READ TIME. No job writes it. There is no scheduled
-- task in this schema that can reach into a row and decide something of theirs
-- has run out. Going quiet is the most common and most human way for a date to
-- end, and the data model treats it as an ending rather than as a verdict.

create table if not exists public.dates (
  id            uuid primary key default gen_random_uuid(),
  kind          public.date_kind   not null,
  status        public.date_status not null default 'open',
  started_by    uuid not null references public.members(id),

  -- Hidden state for the asymmetric kinds (the word in a guessing game, the
  -- secret answer). NEVER selected by the ordinary session query. Only
  -- lib/data/dates.ts returns it, and only to secret_holder_id.
  --
  -- Kept as a column rather than a side table because the pairing constraint
  -- below is what makes "a secret always has exactly one holder" a fact the
  -- database enforces, rather than an invariant a repository is trusted to keep.
  secret            jsonb,
  secret_holder_id  uuid references public.members(id),

  config        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  finished_at   timestamptz,

  -- A secret with no holder is unreadable by anyone; a holder with no secret is a
  -- privilege over nothing. Both are bugs, so neither is representable.
  constraint dates_secret_pairing check ((secret is null) = (secret_holder_id is null))
);

-- LDR §2.1 writes this constraint without a name. It is named here so that a
-- violation reports `dates_secret_pairing` instead of `dates_check`, which is the
-- difference between a legible error and a five-minute hunt. Same predicate.

create index if not exists dates_status_idx
  on public.dates (status, created_at desc);


-- -----------------------------------------------------------------------------
-- date_turns — APPEND-ONLY. A turn is never edited and never deleted.
--
-- There is no deleted_at, no updated_at and no edited_at, and that is the point:
-- what either of them actually said stands. The table has no soft-delete column
-- to reach for, so "quietly rewrite what I said an hour ago" is not a thing the
-- schema can express.
-- -----------------------------------------------------------------------------

create table if not exists public.date_turns (
  id         uuid primary key default gen_random_uuid(),
  date_id    uuid not null references public.dates(id),
  member_id  uuid not null references public.members(id),
  seq        int  not null,
  turn_kind  text not null default 'turn' check (turn_kind in ('turn', 'guess', 'reveal')),
  body       text not null,
  created_at timestamptz not null default now(),

  -- Monotonic within a session, starting at 1. The unique constraint is what
  -- makes a double-submit from a flaky connection collide instead of duplicating.
  unique (date_id, seq)
);

-- Serves both the ordinary "last N turns of this session" read and the date_id
-- foreign key, since date_id leads.
create index if not exists date_turns_date_seq_idx
  on public.date_turns (date_id, seq desc);
