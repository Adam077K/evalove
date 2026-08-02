-- =============================================================================
-- Eva & Adam — DEVELOPMENT SEED. LOCAL STACK ONLY.
--
--   !! NOT VERIFIED. This file has never been executed. !!
--   The machine it was written on has no container runtime, so `supabase start`
--   could not be run. See ./migrations/README.md, "The verification that did
--   not happen".
--
-- Run automatically by `supabase db reset` (see config.toml, [db.seed]).
-- Run by hand with:
--     psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f seed.sql
--
-- THIS FILE MUST NEVER BE RUN AGAINST THE HOSTED PROJECT. It writes rows
-- claiming to be Eva and Adam. Nothing in a database can tell a seeded photo
-- from a real one afterwards except the `seed-` prefix on client_uuid, and a
-- couple who found nine invented days in their book would be right to stop
-- trusting the rest of it. The guard at the top is the mechanical half of that
-- promise; not typing a production connection string is the other half.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Refuse to run against a database holding anything this seed did not write.
-- -----------------------------------------------------------------------------
--
-- A hostname check would be better and is not available: `supabase db reset`
-- gives this file no arguments and no environment, and a hosted Supabase
-- database is also called `postgres` on also-port-5432, so there is nothing in
-- the connection to test. What CAN be tested is the content, and content is
-- actually the thing worth protecting.
--
-- Every row this file writes carries a `seed-` client_uuid or a slug it owns.
-- Anything else in photos, vault_items or date_turns is somebody's real
-- content, so its presence is a refusal. The check is deliberately wider than
-- "is this production": it also stops a seed from landing on top of a local
-- database somebody has been using by hand all afternoon.

do $seed$
begin
  if exists (select 1 from public.photos where client_uuid not like 'seed-%')
     or exists (select 1 from public.vault_items)
     or exists (select 1 from public.date_turns)
  then
    raise exception
      'refusing to seed: this database already holds content the dev seed did not write'
      using
        errcode = '42501',
        hint =
          'seed.sql writes rows that claim to be Eva and Adam and is for a '
          'local stack only. If this is your laptop and you want a clean start, '
          'run `supabase db reset`, which drops the database before seeding. If '
          'this is anything else, you are pointed at the wrong database.';
  end if;
end
$seed$;


-- -----------------------------------------------------------------------------
-- The two members. Exactly two, forever (migration 02).
-- -----------------------------------------------------------------------------
--
-- Fixed uuids rather than gen_random_uuid(), so that a reset produces the same
-- ids every time and a hard-coded id in a test or a bookmarked Studio URL keeps
-- working across resets. They are obviously synthetic on sight, which is the
-- point: nobody will mistake 1111...  for a real row.
--
-- The zones are the real ones and they are the reason this seed is interesting.
-- America/New_York and Asia/Jerusalem are seven hours apart in August, so a
-- single instant is routinely a different calendar day for each of them. That
-- is the whole subject of the shared-day model, and a seed that put both of
-- them in one zone would exercise none of it.

insert into public.members (id, slug, display_name, home_timezone, created_at)
values
  ('11111111-1111-4111-8111-111111111111', 'eva',  'Eva',  'America/New_York', timestamptz '2026-07-20 12:00:00+00'),
  ('22222222-2222-4222-8222-222222222222', 'adam', 'Adam', 'Asia/Jerusalem',   timestamptz '2026-07-20 12:00:00+00')
on conflict do nothing;


-- -----------------------------------------------------------------------------
-- Nine photos across five shared days.
-- -----------------------------------------------------------------------------
--
-- HOW shared_day IS PRODUCED HERE, AND WHY IT IS NOT WRITTEN OUT.
--
-- Migration 08 installs a BEFORE INSERT trigger that rejects any row whose
-- shared_day disagrees with shared_day_of(created_at, shared_day_tz). A seed
-- with hand-typed day labels would therefore be a set of nine arithmetic
-- problems, and getting one wrong — an hour either side of midnight, a DST
-- boundary misremembered — would fail the insert with a timezone error that
-- reads like a bug in the schema rather than a typo in the fixture.
--
-- So the labels are not typed. Each row is authored as a WALL-CLOCK TIME IN THE
-- AUTHOR'S OWN ZONE, which is how a human actually describes when they took a
-- photo; `wall at time zone tz` turns that into the instant, and
-- public.shared_day_of turns the instant back into the label using the same
-- function the trigger checks against. The two cannot disagree, because they
-- are the same call.
--
-- No numeric offset appears anywhere below, per migration 08.
--
-- WHAT THE FIXTURE IS SHAPED TO SHOW:
--
--   2026-07-29  both posted, ordinary day.
--   2026-07-30  Eva posted, then replaced it. The first row is soft-deleted,
--               which is how a re-post works (migration 03) and is what keeps
--               the one-daily-per-member unique index satisfied.
--   2026-07-31  only Eva posted. The day is absent from v_days_together and
--               present in v_shared_days — a day is not a verdict.
--   2026-08-01  Adam's post is at 00:30 in Jerusalem, which is still the
--               afternoon of 2026-07-31 in New York. His shared_day is
--               2026-08-01 because the label is resolved in the AUTHOR'S zone.
--               This row is the whole reason the seed is worth having: it is
--               the case that a single-timezone fixture cannot produce and that
--               a wrong day model gets wrong.
--   2026-07-26  a `book` photo, which is not a daily and is excluded from both
--               views.
--
-- Expected afterwards: v_shared_days has 4 rows, v_days_together has 3.
-- Those two numbers differing by exactly one, on the day only Eva posted, is
-- the fixture working.
--
-- THERE ARE NO VAULT ITEMS IN THIS SEED, ON PURPOSE. Inventing sample private
-- content is a bad habit to start: it puts placeholder intimacy in a fixture
-- that gets pasted into screenshots, demos and bug reports. The vault's schema
-- is exercised by the golden tests; it does not need a fixture with a caption.

with raw (n, slug, wall, tz, kind, caption, w, h, bytes, is_deleted) as (
  values
    (1, 'eva',  timestamp '2026-07-29 08:12:00', 'America/New_York', 'daily',
       'the light in the kitchen before anyone else was up', 1536, 2048, 412003, false),
    (2, 'adam', timestamp '2026-07-29 21:40:00', 'Asia/Jerusalem',   'daily',
       'walked to the end of the street and back', 2048, 1536, 508117, false),

    (3, 'eva',  timestamp '2026-07-30 19:03:00', 'America/New_York', 'daily',
       'blurry, sorry', 1536, 2048, 388240, true),
    (4, 'eva',  timestamp '2026-07-30 19:55:00', 'America/New_York', 'daily',
       'better one. same window.', 1536, 2048, 447901, false),
    (5, 'adam', timestamp '2026-07-30 08:20:00', 'Asia/Jerusalem',   'daily',
       'coffee, third attempt', 2048, 1536, 465330, false),

    (6, 'eva',  timestamp '2026-07-31 13:47:00', 'America/New_York', 'daily',
       'the tree on the corner finally went over', 1536, 2048, 502884, false),

    (7, 'adam', timestamp '2026-08-01 00:30:00', 'Asia/Jerusalem',   'daily',
       'could not sleep. it is already tomorrow here.', 2048, 1536, 391077, false),
    (8, 'eva',  timestamp '2026-08-01 09:15:00', 'America/New_York', 'daily',
       'good morning to you specifically', 1536, 2048, 423650, false),

    (9, 'eva',  timestamp '2026-07-26 16:00:00', 'America/New_York', 'book',
       'the night of the storm', 2048, 1536, 611204, false)
),
resolved as (
  select
    r.*,
    -- The instant. `timestamp at time zone text` resolves a wall-clock reading
    -- in a named IANA zone, DST included, with no offset anywhere.
    (r.wall at time zone r.tz) as created_at,
    -- Deterministic, obviously-synthetic uuid: 5eed0001-…-000000000001, etc.
    -- Every character is valid hex; `5eed` is only there so that a stray seed
    -- row is recognisable at a glance in a query result six months from now.
    ('5eed0001-0000-4000-8000-' || lpad(r.n::text, 12, '0'))::uuid as pid
  from raw r
)
insert into public.photos (
  id, client_uuid, kind, author_member_id, attribution_source,
  shared_day, shared_day_tz, client_reported_tz,
  taken_at, caption,
  storage_path_display, storage_path_thumb, original_location,
  width, height, bytes, mime, color_space, checksum_sha256, exif_stripped,
  created_at, deleted_at
)
select
  s.pid,
  'seed-' || lpad(s.n::text, 2, '0'),
  s.kind::public.photo_kind,
  m.id,
  -- Phase 1 has no authenticated identity: every attribution is self-declared,
  -- and the seed says so rather than dressing itself up as the stronger value.
  'self_declared',

  -- The label, from the same function the trigger validates against.
  public.shared_day_of(s.created_at, s.tz),
  s.tz,
  -- The device agreed with the author's home zone on every one of these. It is
  -- advisory either way (migration 03) and is populated only so the column is
  -- not uniformly null in development.
  s.tz,

  s.created_at - interval '20 minutes',   -- EXIF capture, shortly before upload
  s.caption,

  -- The p/ prefix, matching migration 11's guard. These paths name no real
  -- object: the seed writes rows, not bytes, so an <img> against a signed URL
  -- for one of them will 404. That is the honest shape of a schema fixture —
  -- see ./migrations/README.md, "What the seed does not give you".
  'p/' || s.pid || '/display.jpg',
  'p/' || s.pid || '/thumb.jpg',
  'none',

  s.w, s.h, s.bytes, 'image/jpeg', 'srgb',
  -- sha256() is built in from PostgreSQL 11 and needs no extension, so this
  -- does not care which schema pgcrypto landed in. Deterministic per row.
  encode(sha256(convert_to('seed-photo-' || s.n::text, 'UTF8')), 'hex'),
  true,

  s.created_at,
  case when s.is_deleted then s.created_at + interval '52 minutes' end
from resolved s
join public.members m on m.slug = s.slug
on conflict do nothing;


-- -----------------------------------------------------------------------------
-- Say what landed, so a reset is legible without a follow-up query.
-- -----------------------------------------------------------------------------
--
-- The two view counts are the assertion worth reading. If days_together ever
-- equals shared_days here, the 2026-07-31 row stopped being a day only Eva
-- posted on, or v_days_together started filtering deleted_at — which migration
-- 09 spends fifty lines explaining must never happen.

do $seed$
begin
  raise notice 'dev seed: % members, % photos (% live daily), % shared days, % days together',
    (select count(*) from public.members),
    (select count(*) from public.photos),
    (select count(*) from public.photos where kind = 'daily' and deleted_at is null),
    (select count(*) from public.v_shared_days),
    (select count(*) from public.v_days_together);
end
$seed$;
