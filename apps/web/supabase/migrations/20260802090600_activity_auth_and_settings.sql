-- =============================================================================
-- Eva & Adam — migration 07 of 11 — activity_state, activity_log,
--                                   auth_attempts, purge_audit, app_settings
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   The founder confirmed from the Supabase dashboard on 2026-08-04 that
--   tables exist in project oqiyzzpcsdlqqcjlpmix. Nobody has verified which
--   of these migrations are applied, or whether the live schema matches this
--   file exactly — that check has not been done. Verify against the live
--   schema before running anything here.
--   See ./README.md for what applying it means and who signs it off.
--
-- Down: ./down/20260802090600_activity_auth_and_settings.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.1
-- Depends on: members (02)
-- =============================================================================

-- NUMBERING NOTE (historical). Migrations 01-06 originally carried a header
-- reading "of 14", a count from a superseded plan that split these five tables
-- across three files and placed the shared_day trigger at position 10.
-- Migration 02's comment "the shared_day trigger (migration 10)" was the same
-- leftover. The earlier run left both as-is, reasoning that editing files
-- already in the founder's sign-off pile to fix a cross-reference was a worse
-- trade than documenting the correction once, here and in ./README.md.
--
-- Corrected 2026-08-04 (see ./README.md and .claude/memory/DECISIONS.md):
-- every header now reads "of 11", and migration 02 now says "migration 08".
-- This note stays as the record of why they once disagreed.

-- WHAT IS IN THIS FILE. The five tables the LDR §2.1 block lists after
-- date_turns. They share a migration because none of them is referenced by any
-- other table and none of them references any other table except members: they
-- are leaves, they can be created in any order, and splitting them across five
-- files would buy nothing except five more things for the founder to read.


-- -----------------------------------------------------------------------------
-- activity_state — our state against an entry in the curated activity library.
-- -----------------------------------------------------------------------------

-- activity_id IS A TEXT KEY INTO THE STATIC LIBRARY, AND HAS NO FOREIGN KEY.
--
-- That is deliberate (LDR §4.1) and it is what keeps the library replaceable.
-- The library ships as build-time content, not as rows; a new revision of it can
-- be dropped in wholesale, and this table survives the swap with its ratings and
-- its notes intact. A foreign key would invert that: the library would become the
-- thing that cannot change without a migration, and re-publishing it would either
-- cascade our own notes away or refuse to apply at all.
--
-- The cost is real and accepted: an activity_id can outlive the entry it names,
-- and a state row can end up pointing at nothing. library_version records which
-- revision the state was recorded against, so an orphan is legible rather than
-- mysterious, and the read path resolves a missing entry by simply not showing it.

create table if not exists public.activity_state (
  activity_id     text primary key,
  status          text not null default 'none'
                    check (status in ('none', 'saved', 'done', 'hidden')),
  rating          smallint check (rating between 1 and 5),
  times_done      int not null default 0,
  last_done_at    timestamptz,
  notes           text,

  -- Version of the activity library this state was recorded against. See above.
  library_version text not null,
  updated_at      timestamptz not null default now()
);

-- 'hidden' is the fourth status on purpose: it is how either of them says "not
-- for us" without deleting the row and without the other one being shown a
-- verdict. Nothing in this schema removes an activity from the library; the
-- library is content, and content is not ours to delete from a user action.


-- -----------------------------------------------------------------------------
-- activity_log — append-only record of an activity actually happening.
-- -----------------------------------------------------------------------------

-- Separate from activity_state because they answer different questions.
-- activity_state answers "how do we feel about this one"; activity_log answers
-- "when did we do it". One is current opinion and gets overwritten; the other is
-- history and never does. Collapsing them into times_done alone would keep the
-- count and throw away every occasion behind it.

create table if not exists public.activity_log (
  -- NOTE FOR REVIEW, not a change: LDR §2.1 specifies `bigserial` here and on the
  -- two tables below. `bigint generated always as identity` is the modern spelling
  -- and would be the choice in a greenfield file. The LDR spelling is reproduced
  -- verbatim rather than quietly modernised, because a migration that improves on
  -- its own specification is how a schema and its document start to disagree.
  -- The two behave identically for every insert this app makes; the only
  -- difference is that bigserial also permits an explicit id, which nothing does.
  -- Flagged to the CEO in the P1-T2 return as a one-line follow-up if wanted.
  id          bigserial primary key,

  activity_id text not null,          -- same text key, same absence of a FK, same reason

  -- Nullable: some activities are a thing the two of them did, not a thing one of
  -- them did, and there is no honest member to record for those.
  member_id   uuid references public.members(id),

  occurred_at timestamptz not null default now(),
  window_id   text,                   -- 'w1'..'w9', the shared-time windows of LDR §3
  note        text
);

create index if not exists activity_log_activity_idx
  on public.activity_log (activity_id, occurred_at desc);

-- ADDITION BEYOND LDR §2.1 — see README "Deliberate additions", item A2.
-- activity_log.member_id is a foreign key with no index of its own. PostgreSQL
-- does not index the referencing side of a FK automatically, so without this a
-- delete of a members row would sequentially scan this table. Nothing deletes a
-- members row today, which is exactly why the missing index would go unnoticed
-- until the one day something does.
create index if not exists activity_log_member_idx
  on public.activity_log (member_id)
  where member_id is not null;


-- -----------------------------------------------------------------------------
-- auth_attempts — every attempt to unlock the session or the vault.
-- -----------------------------------------------------------------------------

-- Two scopes, one table. 'session' is the front door; 'vault' is the passphrase
-- in front of the private table. They are recorded together so that a rate
-- limiter reads one place, and separated by `scope` so that pressure on the vault
-- can be seen on its own rather than buried in ordinary sign-ins.
--
-- `ok` is the outcome: true when the secret matched, false when it did not. There
-- is deliberately no reason code and no attempt counter column. Everything the
-- rate limiter needs is derivable from (ip, scope, at) plus `ok`, and a reason
-- code on an unsuccessful attempt is a hint about which half was wrong.

create table if not exists public.auth_attempts (
  id         bigserial primary key,   -- see the bigserial note on activity_log

  -- inet, not text. The type rejects a malformed address at write time, and it
  -- compares correctly: text ordering puts '10.0.0.9' after '10.0.0.10'.
  -- Nullable, because an attempt can arrive without a resolvable client address
  -- and losing the attempt would be worse than losing the address.
  ip         inet,
  user_agent text,

  scope      text not null default 'session'
               check (scope in ('session', 'vault')),
  ok         boolean not null,
  at         timestamptz not null default now()
);

-- The rate-limiter read: "how many attempts from this address, most recent
-- first". ip leads, at descends — the exact shape of the query.
create index if not exists auth_attempts_ip_at_idx
  on public.auth_attempts (ip, at desc);

-- The retention read: "every row older than thirty days". Retention is a
-- deletion by age performed by whatever runs it (LDR §2.1 annotates this index
-- "30-day retention"); no row in this table carries a lifetime of its own, and
-- nothing here is marked stale in place. The rows are simply deleted when they
-- are old, and until then they are all equally real.
create index if not exists auth_attempts_at_idx
  on public.auth_attempts (at desc);


-- -----------------------------------------------------------------------------
-- purge_audit — append-only, and it OUTLIVES the content it describes.
-- -----------------------------------------------------------------------------

-- THIS TABLE DID NOT EXIST BEFORE THIS MIGRATION.
--
-- The P1-T2 brief recorded it as already created by migration 06. It was not:
-- migration 06 creates book_entries only, and the single prior mention of
-- purge_audit in this directory is a sentence inside the vault_items down
-- migration telling an operator to check it first. That sentence was pointing at
-- a table that had never been written. It exists as of this file.
--
-- WHY THERE IS NO FOREIGN KEY ON item_id. The whole purpose of a row here is to
-- outlive the photo or vault item it refers to. A FK would make the audit trail
-- vanish at exactly the moment it becomes the only remaining evidence that the
-- content ever existed and that its removal was asked for, by whom, and when it
-- actually completed. item_table records which table the id came from, checked
-- to the two tables that can hold purgeable bytes.
--
-- The three timestamps are separate because a purge is not atomic: the request,
-- the removal from Supabase storage, and the removal from the R2 tier happen at
-- different moments and either of the last two can be pending while the other is
-- done. A single "purged_at" would have to lie about one of them.

create table if not exists public.purge_audit (
  id                 bigserial primary key,   -- see the bigserial note on activity_log
  item_id            uuid not null,
  item_table         text not null
                       check (item_table in ('photos', 'vault_items')),

  requested_at       timestamptz not null,
  supabase_purged_at timestamptz,
  r2_purged_at       timestamptz,

  -- Member slug, self-declared. Recorded as text rather than as a FK to members
  -- for the same reason as item_id: this row has to still make sense after
  -- anything else has been removed. It is also honest about what it is — nobody
  -- proved who asked, and a uuid FK would dress a self-declaration up as identity.
  requested_by       text not null,
  ip                 inet
);

-- ADDITION BEYOND LDR §2.1 — see README "Deliberate additions", item A3.
-- The one real read against this table is "what happened to this specific item",
-- and it is asked precisely when someone is trying to establish whether bytes are
-- actually gone. Answering it with a sequential scan is acceptable today and
-- embarrassing later; the index costs one B-tree on an append-only table that
-- gains a row only when something is deleted for good.
create index if not exists purge_audit_item_idx
  on public.purge_audit (item_table, item_id);

-- The operator read: "what is still outstanding". Partial, so the index holds
-- only the rows that are actually pending in one tier or the other.
create index if not exists purge_audit_outstanding_idx
  on public.purge_audit (requested_at)
  where supabase_purged_at is null or r2_purged_at is null;


-- -----------------------------------------------------------------------------
-- app_settings — one row per setting, jsonb value.
-- -----------------------------------------------------------------------------

-- A deliberately boring key-value table. It exists so that a setting can be added
-- without a migration, which is the right trade for things like a feature flag or
-- a copy string, and the wrong trade for anything another table needs to join to.
-- Nothing in this schema references app_settings, and nothing should start.
--
-- `key` and `value` are both non-reserved in PostgreSQL, so neither needs
-- quoting. They are left unquoted on purpose: a quoted mixed-case identifier is
-- the other way this table could have become annoying.

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
