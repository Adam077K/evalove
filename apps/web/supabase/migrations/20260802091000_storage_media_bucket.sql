-- =============================================================================
-- Eva & Adam — migration 11 of 12 — the `media` storage bucket
--
--   !! NEVER APPLIED. This file has not been run against any database. !!
--   See ./README.md for what applying it means and who signs it off.
--
-- Down: ./down/20260802091000_storage_media_bucket.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §5.5
-- Depends on: the `storage` schema, which Supabase creates before user
--             migrations run. It does NOT depend on any table in `public`.
-- =============================================================================

-- ONE BUCKET, PRIVATE, WITH TWO PREFIXES THAT MEAN DIFFERENT THINGS.
--
--   p/{photoId}/display.jpg     ordinary  — a photo row in public.photos
--   p/{photoId}/thumb.jpg       ordinary
--   p/{photoId}/original.jpg    ordinary  — when the original is still held
--   v/{vaultItemId}/display.jpg vault     — a row in public.vault_items
--
-- WHY ONE BUCKET AND NOT TWO. Two buckets would look safer and would be worse.
-- A second bucket is a second set of settings, a second public/private flag, a
-- second CORS list and a second thing to get wrong — and the flag that matters
-- is the one nobody re-reads six months later. One bucket means there is
-- exactly one `public` boolean in this system, it is false, and the assertion
-- at the foot of this file re-checks it on every run.
--
-- WHY THE SPLIT IS A PATH PREFIX AND NOT A HEADER, A FLAG, OR A FOLDER
-- CONVENTION NOBODY ENFORCES.
--
-- The service worker has to decide what it is allowed to cache, and it makes
-- that decision inside `fetch`, from the request URL, before any response
-- exists. At that moment it has a URL and nothing else — no row, no header, no
-- session, no database. A header cannot help: the header arrives with the
-- response, which is to say after the worker has already decided whether it is
-- caching. A column cannot help: the worker cannot query PostgreSQL.
--
-- A path prefix is the only property of a private object that is knowable at
-- the one instant the exclusion has to be made. `v/` is therefore not a naming
-- convention — it is the mechanism. `url.pathname.includes('/v/')` is the whole
-- exclusion, it is one line, and it cannot be defeated by a response the worker
-- has not received yet.
--
-- Which makes a vault item written under `p/` a cache leak, not a tidiness
-- problem: it would be indistinguishable from a photo to the only code that has
-- to tell them apart. The trigger below is what makes that unrepresentable
-- rather than merely discouraged. It is the same argument as migration 03's
-- missing sensitivity column, one layer down: there is no filter to forget,
-- because a wrongly-placed object cannot be written in the first place.


-- -----------------------------------------------------------------------------
-- The bucket.
-- -----------------------------------------------------------------------------
--
-- `public = false` IS THE ONE SETTING THIS FILE EXISTS TO GET RIGHT.
--
-- A public Supabase bucket serves every object in it to anyone who can guess or
-- obtain the URL, with no key, no session and no RLS — including the whole of
-- `v/`. There is no per-object override and no partial version of this: the
-- boolean is bucket-wide. Every read in this product goes through a signed URL
-- minted by the Next.js server, which is what `public = false` requires and
-- what Phase 1 already does.
--
-- `on conflict do update` rather than `do nothing`, on purpose. `do nothing`
-- would make this migration silently accept a pre-existing PUBLIC bucket named
-- `media` — the exact state it is here to prevent — and report success. The
-- update makes re-running this file a repair rather than a no-op.
--
-- allowed_mime_types is `image/jpeg` alone. That is not a new decision: both
-- public.photos and public.vault_items already carry `check (mime =
-- 'image/jpeg')` (migrations 03 and 04). This restates the settled rule at the
-- storage layer so the two cannot drift — an object the row could not describe
-- is an object the bucket will not hold.
--
-- file_size_limit is 25 MiB, and it IS a new number. Nothing in the LDR fixes
-- it. It is sized for the largest of the three variants (an unstripped original
-- off a modern phone) with room to spare, and it is deliberately finite so that
-- a runaway client cannot fill the bucket with one request. Change it here if
-- it ever bites; it is the one value in this file with no deeper argument
-- behind it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 26214400, array['image/jpeg'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- NO POLICIES ON storage.objects ARE CREATED BY THIS FILE, AND THAT ABSENCE IS
-- THE CONFIGURATION — exactly as in migration 10.
--
-- Supabase ships `storage.objects` with RLS already enabled. With no policy
-- naming this bucket, anon and authenticated get nothing from it: no list, no
-- download, no upload. The service role bypasses RLS, and the service role is
-- the only thing that touches storage in Phase 1. So the posture here matches
-- the posture in `public` — deny everyone, and let the server be the only door.
--
-- Do not add a policy here to make an upload work from the browser. If an
-- upload needs one, the upload is going direct to storage instead of through
-- the server, and THAT is the finding.


-- -----------------------------------------------------------------------------
-- The prefix guard.
-- -----------------------------------------------------------------------------
--
-- Rejects any object in `media` whose name is not `p/<uuid>/<something>` or
-- `v/<uuid>/<something>`. Other buckets are not this trigger's business and are
-- returned untouched on the first line.
--
-- The uuid segment is checked as a uuid, not merely as "some text", because the
-- prefix rule and the id rule are the same rule: a path is supposed to name a
-- row, and `p/thumbs/x.jpg` names nothing. Migrations 03 and 04 give both
-- tables an app-supplied `id` with no default precisely so the path can be
-- built before the row exists; this is the other half of that arrangement.
--
-- KNOWN AND ACCEPTED: creating a folder in the Studio UI writes a zero-byte
-- object called `.emptyFolderPlaceholder`, and this trigger will refuse it. The
-- refusal is correct. Folders in this bucket are an artefact of object names,
-- there is nothing for a human to organise by hand, and a placeholder sitting
-- at `p/.emptyFolderPlaceholder` would be the first object in the bucket that
-- does not name a row.
--
-- `set search_path = ''` with every reference schema-qualified, matching
-- migration 08. The function lives in `public`, not in `storage`: `public` is
-- ours, and creating a function in Supabase's storage schema is asking for a
-- fight with a future storage-service upgrade.

create or replace function public.enforce_media_object_prefix()
returns trigger
language plpgsql
set search_path = ''
as $trg$
begin
  if new.bucket_id is distinct from 'media' then
    return new;
  end if;

  -- `!~*` — case-insensitive, because a uuid rendered in upper case is still
  -- the same uuid and rejecting it would be a riddle rather than a guard.
  if new.name !~*
     '^(p|v)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+$'
  then
    raise exception
      'object name % is not a valid path in the media bucket', new.name
      using
        errcode = '23514',   -- check_violation: this is a constraint, told as one
        hint =
          'Every object in `media` must be p/<photo uuid>/<file> for ordinary '
          'content or v/<vault item uuid>/<file> for vault content. The p//v '
          'split is what lets the service worker exclude private content by '
          'path, so an object outside it is a cache leak and not a naming '
          'nit. Vault items go under v/ and nowhere else.';
  end if;

  return new;
end
$trg$;

comment on function public.enforce_media_object_prefix() is
  'Rejects any storage.objects row in the `media` bucket outside p/<uuid>/ or '
  'v/<uuid>/. The prefix split is the service worker''s only means of excluding '
  'private content, so it is enforced here rather than trusted. LDR §5.5.';

-- `update of name, bucket_id` narrows the update case to the two columns that
-- can move an object across the split. A metadata touch on an existing object
-- does not re-run the check, for the same reason migration 08 narrows its own
-- update clause: re-judging old rows on unrelated writes turns history into
-- something that can start failing.
--
-- drop-then-create, matching migration 08: unambiguously idempotent on every
-- PostgreSQL version.
--
-- THIS IS THE ONE STATEMENT IN THE WHOLE MIGRATION SET WHOSE PRIVILEGES WE
-- COULD NOT VERIFY. `create trigger` on storage.objects needs the TRIGGER
-- privilege on a table owned by `supabase_storage_admin`. The migration role
-- normally has it, and creating POLICIES on this table from a migration is
-- routine and documented by Supabase — but a trigger is rarer, and this was
-- authored on a machine with no way to run it. If this line raises 42501 on
-- first apply, read ./README.md, "If the prefix guard cannot be installed". Do
-- not respond by deleting the guard.

drop trigger if exists media_objects_prefix_guard on storage.objects;
create trigger media_objects_prefix_guard
  before insert or update of name, bucket_id
  on storage.objects
  for each row
  execute function public.enforce_media_object_prefix();


-- -----------------------------------------------------------------------------
-- Self-check: this migration refuses to finish if the bucket is public.
-- -----------------------------------------------------------------------------
--
-- The insert above already sets `public = false`, so this can only fire if
-- something else in the same transaction changed it, or if a future edit to
-- this file breaks the upsert. It costs one catalogue read and it makes "the
-- bucket is private" a fact the migration proves rather than a line it wrote.
-- Same shape, and the same reasoning, as the guard at the foot of migration 10.

do $mig$
begin
  if exists (
    select 1 from storage.buckets where id = 'media' and public
  ) then
    raise exception
      'the media bucket is public; every vault item in it would be world-readable'
      using
        errcode = '42501',   -- insufficient_privilege: this is a security refusal
        hint =
          'Set storage.buckets.public = false for id = ''media''. A public '
          'bucket serves every object to anyone with the URL, with no key and '
          'no RLS, including everything under v/.';
  end if;

  if not exists (select 1 from storage.buckets where id = 'media') then
    raise exception 'the media bucket was not created'
      using errcode = '42501';
  end if;
end
$mig$;


-- -----------------------------------------------------------------------------
-- How to verify this by hand, after applying.
-- -----------------------------------------------------------------------------
--
-- The bucket is private and JPEG-only:
--
--   select id, public, file_size_limit, allowed_mime_types
--     from storage.buckets where id = 'media';
--
-- The guard is installed and enabled ('O' means enabled — origin):
--
--   select tgname, tgenabled from pg_trigger
--    where tgrelid = 'storage.objects'::regclass and not tgisinternal;
--
-- Nothing lives outside the two prefixes. Must always be zero rows:
--
--   select name from storage.objects
--    where bucket_id = 'media'
--      and name !~* '^(p|v)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+$';
--
-- And the negative test, which is the one worth actually running — this must
-- FAIL with 23514 rather than insert a row:
--
--   insert into storage.objects (bucket_id, name) values ('media', 'v/nope.jpg');
