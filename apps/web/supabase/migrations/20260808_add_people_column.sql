-- =============================================================================
-- Eva & Adam — add `people` classification to photos
--
--   !! IRREVERSIBLE TIER — DO NOT RUN WITHOUT FOUNDER REVIEW !!
--
--   Apply manually via the Supabase dashboard or CLI.
--   Write the migration SQL to the live schema only after verifying the
--   current schema matches 20260802090200_photos.sql.
--
--   Until this migration is applied, `lib/people-index.ts` serves the same
--   classification as a static lookup keyed by the deterministic photo id.
--   Once this migration is applied, `lib/people-index.ts` becomes a
--   generation-time cross-check rather than the runtime source of truth.
--
-- Purpose:
--   The resurfacing rule (lib/resurface.ts) uses `people` to prefer couple
--   photographs (both Eva and Adam in frame) over photographs that contain
--   neither of them.  Without this column the static index in
--   `lib/people-index.ts` bridges the gap; with it, the classification
--   travels with every photo row through the API and can be filtered
--   server-side.
--
-- Values (from `tools/ingest/catalog/`:
--   "both"    — both Eva and Adam are visibly present.
--   "unclear" — the subjects are not clearly identifiable as the couple.
--   "neither" — confirmed: neither Eva nor Adam is in the frame.
--
-- =============================================================================

alter table public.photos
  add column if not exists people text
    check (people in ('both', 'unclear', 'neither'));

-- No NOT NULL constraint intentionally: photos uploaded through the normal
-- /send flow have no catalogue classification at upload time.  NULL is read
-- the same as 'unclear' by callers (see lib/people-index.ts `peoplePriority`).

-- Backfill the 52 photographs that were ingested from the founding archive.
-- Each row is identified by the deterministic photo id derived from filename
-- (SHA-256, salt "eva-adam-photo-ingest/photo-id") — the same ids computed
-- by `tools/ingest/scripts/gen-people-index.mjs`.

update public.photos set people = 'both'    where id = '920a6628-55e8-400d-e3bf-13f6fcbc4c31'; -- 24:7:26-10.HEIC
update public.photos set people = 'both'    where id = '7df36495-cec4-59a9-4856-75a8eee82308'; -- 24:7:26-16.HEIC
update public.photos set people = 'both'    where id = '25e1acff-4891-5b20-b4c8-28fc196e01f5'; -- 24:7:26-17.HEIC
update public.photos set people = 'both'    where id = '0ad8bccf-104f-8be0-4bd7-a3b52ed0f723'; -- 24:7:26-18.JPG
update public.photos set people = 'both'    where id = '93c31c0a-dbde-589b-ae63-1880b7955e2e'; -- 24:7:26-20.HEIC
update public.photos set people = 'both'    where id = '47a51f29-50e3-a817-41d9-a7729db992a8'; -- 24:7:26-4.JPG
update public.photos set people = 'both'    where id = 'aa1d6050-0088-394b-a01e-d705a884a8b1'; -- 24:7:26-8.JPG
update public.photos set people = 'both'    where id = 'd55324a8-a57d-3675-c9db-af092109717e'; -- 24:7:26-9.HEIC
update public.photos set people = 'both'    where id = '1748f7d6-727f-306d-337e-4a13219e34b7'; -- 24:7:26.HEIC
update public.photos set people = 'both'    where id = 'e379972e-557f-e0ca-fbb1-ce1bdeffb1ea'; -- 24:7:26.JPG

update public.photos set people = 'neither' where id = 'b8079a44-a096-541d-a737-7a0832b33a11'; -- 24:7:26-19.JPG
update public.photos set people = 'neither' where id = '87217ed9-3672-f1e7-e02a-5d32a4376ef3'; -- 25:7:26-10.jpg
update public.photos set people = 'neither' where id = '5e265ab5-936f-3d17-2e12-888e512b6fb2'; -- 25:7:26-4.HEIC
update public.photos set people = 'neither' where id = '0220759a-e805-3e3d-3879-da50c5c525e7'; -- 27:7:26-1.HEIC
update public.photos set people = 'neither' where id = 'c6d3a8fc-d0d8-8fe8-61fb-effdfd50c69a'; -- 27:7:26-2.HEIC
update public.photos set people = 'neither' where id = '6b74ae75-a0e3-95a1-5c25-2af4ad4cd75f'; -- 3:8:26-1.JPG
update public.photos set people = 'neither' where id = '872c2783-b0d5-02f6-eb4b-9c66a4fdac24'; -- 3:8:26-2.JPG
update public.photos set people = 'neither' where id = 'a0c87b46-060e-28ce-8a7b-f09c458f4cb1'; -- 6:8:26-1.JPG
update public.photos set people = 'neither' where id = 'bd2c8cc1-df71-5e6f-5928-e9e2495ee51a'; -- 6:8:26-2.HEIC
update public.photos set people = 'neither' where id = 'c17d9413-edb1-2fea-ecff-ffcabfe95b10'; -- 6:8:26-3.JPG
update public.photos set people = 'neither' where id = 'd5dd9b8a-bbc9-f618-162f-3351d120215e'; -- 6:8:26-4.JPG
update public.photos set people = 'neither' where id = '7018f36c-babe-611c-c49c-c2b0621449e5'; -- 6:8:26-6.JPG
update public.photos set people = 'neither' where id = '95a3e2d2-9d02-ec9e-de7a-e43a9bf99dc9'; -- 7:8:26-1.JPG

-- Remaining 29 photos receive 'unclear' (the column default for new uploads is
-- NULL which callers treat identically, but an explicit value is cleaner).
update public.photos set people = 'unclear'
  where people is null
    and id in (
      '08f0ccd4-6460-c7fa-e242-3fd05f10d8a1', -- 16:7:26.JPG
      'd40e2e56-8c03-c045-f7d8-e96ec4c9b59c', -- 18:7:26-1.JPG
      '31e1abef-11be-3b65-1d6b-408720c41b56', -- 24:7:26-11.HEIC
      '45c512a6-3816-cae2-876f-c4d568bf982e', -- 24:7:26-12.HEIC
      '9a3817c3-4c3f-62ba-78e9-c8756f9cfdb2', -- 24:7:26-13.HEIC
      '3d3e315f-cab2-e48b-d73b-9f85f87b92db', -- 24:7:26-14.HEIC
      '2c8b941d-2c0d-8643-9783-65a18422c807', -- 24:7:26-15.HEIC
      '4f9c2db8-83f9-a6f5-605e-a1afa33d6cef', -- 24:7:26-21.HEIC
      '6b5c7c40-ee11-52fc-2971-1ee4801214af', -- 24:7:26-22.heic
      'ba6c9d34-fd6e-e984-a7cc-ddee18b3ab7b', -- 24:7:26-3.HEIC
      'df359283-f73e-a3e5-d962-85f75fc102d1', -- 24:7:26-5.JPG
      'f4c9d8ba-ace6-e262-4b34-b9a58db46ce3', -- 24:7:26-6.PNG
      'b269706e-95f1-3601-f9fd-b19c62c34441', -- 24:7:26-7.JPG
      '2edeb031-a980-a45d-2e43-330928d46cdf', -- 25:7:26-1.HEIC
      '0a837b1a-ea7f-475e-33da-99f88f82ffb1', -- 25:7:26-2.HEIC
      'fd4f579b-1520-1a5d-a486-456eb8217dc7', -- 25:7:26-3.JPG
      '67d28961-c353-ed78-ff76-11c3fc13b606', -- 28:7:26-6.MOV
      'c542f6bc-fa1f-2084-a077-fb052f8a3a90', -- 30:7:26-1.JPG
      '94f234e8-2bff-928e-6f1c-4b30f65b158f', -- 30:7:26.JPG
      'e37cb25f-8b31-9b74-eabb-868d96b4e4c4', -- 31:7:26-1.JPG
      'c500aad5-45ec-f4e8-2e21-949dc89ca32d', -- 31:7:26-4.JPG (three young men, party — not the couple)
      '244598e8-7090-d016-5af7-af229e3b2edc', -- 31:7:26-5.HEIC
      '3013448d-7797-43cf-7460-302b11ea9c83', -- 1:8:26-1.MOV
      '1881b412-deb3-fc77-86a7-cda382f8480f', -- 1:8:26-2.HEIC
      'ce6d8acb-6b8c-602f-820c-6b03d8c75fe7', -- 1:8:26-3.MP4
      '4cac8905-6492-fcb8-7629-3389741b1854', -- 2:8:26-1.HEIC
      '931ee32e-3a06-8a7e-7c97-63b2c29386ba', -- 3:8:26-3.JPG
      'b269d313-17ef-34d2-4ed6-82c24e534444', -- 3:8:26-6.HEIC
      '7301af9e-4221-7ab5-3eec-6258de4f87bb'  -- 6:8:26-5.JPG
    );
