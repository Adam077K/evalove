-- =============================================================================
-- DOWN for migration 11 of 11 — the `media` storage bucket
--
-- Run the down migrations in REVERSE order (11 -> 01). This is the FIRST one to
-- run, because nothing else in the set depends on it and it depends on nothing
-- in `public`.
--
-- THIS FILE DELETES A BUCKET, WHICH IS TO SAY IT CAN DELETE PHOTOGRAPHS.
--
-- It is written so that it cannot do that by accident. If the bucket still
-- holds objects, the block at the foot refuses and tells you how many — it does
-- NOT cascade. Reversing a schema change should never be the thing that
-- destroys content, and a `delete ... cascade` here would make "roll back the
-- last migration" and "delete every photo we have" the same keystroke.
--
-- If you genuinely want the bytes gone, that is a purge, not a rollback: it
-- goes through the purge path, it is recorded in public.purge_audit
-- (migration 07), and it is somebody's explicit decision. Come back here after.
-- =============================================================================

-- The guard first, so the bucket can be emptied by hand afterwards without the
-- trigger objecting to whatever a cleanup script is doing.

drop trigger if exists media_objects_prefix_guard on storage.objects;

drop function if exists public.enforce_media_object_prefix();

-- Refuse to delete a bucket that still holds anything.

do $mig$
begin
  if exists (select 1 from storage.objects where bucket_id = 'media') then
    raise exception
      'the media bucket still holds % object(s); refusing to delete it',
      (select count(*) from storage.objects where bucket_id = 'media')
      using
        errcode = '2BP01',   -- dependent_objects_still_exist
        hint =
          'This rollback will not destroy content. Empty the bucket deliberately '
          'first — through the purge path, which writes public.purge_audit — and '
          'then re-run this file. If you are rolling back a failed first apply '
          'and the objects are test uploads, delete them explicitly and the '
          'refusal will clear.';
  end if;
end
$mig$;

delete from storage.buckets where id = 'media';

-- storage.objects itself is left exactly as Supabase ships it: RLS on, and
-- whatever policies the platform installed. This migration never changed that,
-- so this file does not either.
