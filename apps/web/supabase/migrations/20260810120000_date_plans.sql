-- =============================================================================
-- Eva & Adam — date_plans — a date one of them proposes and the other agrees to
--
--   !! IRREVERSIBLE TIER — DO NOT RUN WITHOUT FOUNDER SIGN-OFF !!
--
--   !! APPLICATION STATUS UNKNOWN for every other file in this directory. !!
--   This one has never been applied anywhere — not local, not hosted. Nobody
--   has run it and no agent can: live database access is blocked, correctly.
--   Apply it by hand from the Supabase dashboard or CLI after reading
--   ./README.md, which says who signs this off and why the check cannot be
--   done from here.
--
-- Down: ./down/20260810120000_date_plans.down.sql
-- Depends on: migration 02 (public.members). Nothing else.
-- =============================================================================

-- WHY A NEW TABLE RATHER THAN A COLUMN ON `dates`.
--
-- `public.dates` (migration 05) models a turn-taking GAME the app itself runs:
-- a story written a line each, twenty questions, the paired question. Its whole
-- shape is an append-only `date_turns` ledger with a monotonic `seq`, and it has
-- no column for a proposal, for an acceptance, or for a time either of them
-- agreed on — because none of those things happen in a game that is resumable
-- forever and has no clock in it.
--
-- A date they GO ON is a different object. It is proposed by one of them, agreed
-- to by the other, it sits at a real instant inside a window where both are
-- awake, and afterwards it is over. Bolting `status = 'proposed'` and a
-- `starts_at` onto `dates` would have given every hosted game four columns that
-- can never be anything but null, and would have made "whose turn is it" and
-- "has she said yes" the same question. They are not the same question.
--
-- The two are related at read time and nowhere else: a proposed date whose kind
-- happens to be one the app hosts can open a `dates` row when it starts. No
-- foreign key expresses that, deliberately — a game outlives the date that
-- opened it, and a date that never opens a game is still a date.

-- THE VAULT BOUNDARY IS STRUCTURAL, NOT POLICY.
--
-- There is no column in this table that can hold a reference to
-- `public.vault_items`, and no foreign key from this table reaches one by any
-- path: it points only at `public.members`. A vault item cannot be attached to a
-- date, bound into a date's page, or named by one — not because something checks
-- for it, but because nothing here can hold the reference. Any future column on
-- this table must preserve that.

-- Refuse early and legibly rather than failing on a foreign key three statements
-- down. Named dollar tag, no DECLARE section, matching migration 01.
do $mig$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'members' and c.relkind = 'r'
  ) then
    raise exception
      'date_plans needs public.members, which is not present in this database'
      using
        errcode = '42P01',   -- undefined_table
        hint = 'Apply 20260802090100_members.sql first, then re-run this file.';
  end if;
end
$mig$;


create table if not exists public.date_plans (
  id           uuid primary key default gen_random_uuid(),

  -- Which of the seven kinds. A slug from `lib/dates/kinds.ts`, e.g.
  -- 'same-film' or 'an-hour-with-an-end'.
  --
  -- A SHAPE CHECK, NOT A LIST. The seven live in TypeScript because they are
  -- content — a title, a line, and the reason that kind survives seven hours of
  -- distance — and content changes on a founder's afternoon. Listing them here
  -- would make writing an eighth kind an Irreversible-tier migration applied by
  -- hand from a dashboard, which is a tax on the part of this product that
  -- should be cheapest to change. The database enforces the shape; the API
  -- refuses a slug that is not in the catalogue (`lib/data/dates.ts`), which is
  -- the layer that can actually see the catalogue.
  kind         text not null
               check (kind ~ '^[a-z][a-z0-9-]{0,62}[a-z0-9]$'),

  proposed_by  uuid not null references public.members(id),

  -- 'proposed'  — one of them has asked. Nobody has answered.
  -- 'agreed'    — the other one said yes. This is now a thing that is going to
  --               happen at `starts_at`.
  -- 'declined'  — the other one said not this one. An ordinary answer, and the
  --               only one that is not a yes. Nothing is deleted.
  -- 'happened'  — it happened. The photographs on `shared_day` are its page.
  --
  -- There is no status here for a date that was agreed and then quietly did not
  -- happen, and there is no job that could write one. Same rule as migration
  -- 05: nothing in this schema reaches into a row and decides something of
  -- theirs has run out. A date that was agreed and never marked stays agreed.
  status       text not null default 'proposed'
               check (status in ('proposed', 'agreed', 'declined', 'happened')),

  -- The shared day it sits in, and the window inside that day.
  --
  -- Both are stored, not derived from `starts_at`, because they are what was
  -- actually agreed: "the long overlap on Friday" survives a later correction
  -- to tzdata, and an instant recomputed from a changed rule would silently
  -- move a date they had already said yes to. `starts_at` is the instant that
  -- pair resolved to at the moment of proposing (`lib/date-windows`), kept so
  -- that ordering and "is it now" never re-run the zone maths.
  shared_day   date not null,
  window_id    text not null
               check (window_id in ('w1','w2','w3','w4','w5','w6','w7','w8','w9')),
  starts_at    timestamptz not null,

  -- What the proposer wrote with it, if anything. Not required: most of these
  -- are one tap, and a field that must be filled turns asking into homework.
  note         text check (char_length(note) <= 280),

  answered_by  uuid references public.members(id),
  answered_at  timestamptz,
  happened_at  timestamptz,

  created_at   timestamptz not null default now(),

  -- An answer with no answerer, or an answerer with no answer, is a half-written
  -- row. Neither is representable.
  constraint date_plans_answer_pairing
    check ((answered_by is null) = (answered_at is null)),

  -- 'proposed' means exactly "nobody has answered yet", and every other status
  -- means exactly "somebody has". Written as an equality so it constrains both
  -- directions: an answered row cannot still read 'proposed', and an 'agreed'
  -- or 'declined' row cannot exist without the answer that made it one.
  constraint date_plans_status_matches_answer
    check ((status = 'proposed') = (answered_at is null)),

  -- Same shape for the ending: 'happened' is the only status that carries an
  -- instant, and it always carries one. Combined with the constraint above,
  -- 'happened' also implies an answer — which is right, because a date nobody
  -- agreed to did not happen, it just occurred to someone.
  constraint date_plans_happened_pairing
    check ((status = 'happened') = (happened_at is not null))
);


-- One live plan per kind, per slot.
--
-- A double tap on a flaky connection collides here instead of proposing the
-- same evening twice — the same job `date_turns.unique (date_id, seq)` does for
-- a turn. Partial on purpose: a declined proposal does not block asking again
-- later, and a date that already happened does not stop them doing it again on
-- the same day next month.
create unique index if not exists date_plans_live_slot_idx
  on public.date_plans (kind, shared_day, window_id)
  where status in ('proposed', 'agreed');

-- The two reads this table exists for: "what is between them right now",
-- soonest first, and "which date left the photographs on this day".
create index if not exists date_plans_status_starts_idx
  on public.date_plans (status, starts_at);

create index if not exists date_plans_shared_day_idx
  on public.date_plans (shared_day, starts_at);

-- NO INDEX ON proposed_by OR answered_by, and that is a decision rather than an
-- omission. Migration 07 indexes `activity_log.member_id` (addition A2) because
-- deleting a members row would otherwise scan a table that grows without bound.
-- This one does not grow without bound: it holds one row per date two people
-- propose to each other, so a sequential scan of the whole table is cheaper than
-- reading an index. Revisit if that ever stops being true.


-- Row-level security: enabled, zero policies, deny-all — migration 10's posture,
-- applied here so that this table does not silently become the one hole in it.
-- Migration 10's self-check reads the catalogue rather than its own list and
-- raises if any public table has RLS off, so leaving this line out would make
-- that migration refuse to finish. See its header for why deny-all is the whole
-- configuration and not an unfinished job.
alter table public.date_plans enable row level security;


-- -----------------------------------------------------------------------------
-- How a date links to the photographs it left behind.
-- -----------------------------------------------------------------------------
--
-- There is no join table and no `photo_id` column. The link is `shared_day`, in
-- both directions:
--
--   the date  → the day:   select this row's shared_day
--   the day   → the date:  select * from public.date_plans
--                           where shared_day = $1 and status = 'happened'
--
-- and the photographs are the ordinary read every other surface already does:
--
--   select * from public.photos
--    where shared_day = $1 and deleted_at is null and purged_at is null
--
-- No foreign key expresses this and none can: `photos.shared_day` is not unique
-- and must not be — the whole point of a shared day is that it holds both of
-- them, several times over. Writing a `date_plans.photo_id` instead would have
-- forced a choice of which single photograph "is" the date, on a day that may
-- hold six, and would have to be rewritten every time either of them posts
-- another one. The day is the page. That is already how the Book reads.
--
-- The 31-hour shared day is what makes this exact rather than approximate: every
-- one of the nine windows sits inside the opening zone's local day, which is the
-- first 24 hours of the shared day, so a date placed in any window and the
-- photographs it produced are filed under the same name for both of them.
