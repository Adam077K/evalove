-- =============================================================================
-- Eva & Adam — migration 09 of 11 — v_shared_days and v_days_together
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   The founder confirmed from the Supabase dashboard on 2026-08-04 that
--   tables exist in project oqiyzzpcsdlqqcjlpmix. Nobody has verified which
--   of these migrations are applied, or whether the live schema matches this
--   file exactly — that check has not been done. Verify against the live
--   schema before running anything here.
--   See ./README.md for what applying it means and who signs it off.
--
-- Down: ./down/20260802090800_views_shared_days_and_days_together.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.3, §3.4
-- Depends on: members (02), photos (03)
-- =============================================================================

-- TWO VIEWS, AND THEY DELIBERATELY DO NOT AGREE WITH EACH OTHER.
--
-- v_shared_days is what the interface draws. v_days_together is the number they
-- are told. Those are different questions, they filter on different columns, and
-- a day can be in the second while being absent from the first. That divergence
-- is not a bug to reconcile later; it is the single most important behaviour in
-- this schema and the reason both views exist instead of one.
--
-- The short version: tidying up a photo changes what you SEE. Nothing either of
-- them can do in the app changes what they DID.
--
-- BOTH VIEWS ARE `security_invoker = on`. Read the note above v_shared_days
-- before adding a third view; getting this wrong would quietly undo migration 10.


-- -----------------------------------------------------------------------------
-- v_shared_days — the display view.
-- -----------------------------------------------------------------------------
--
-- WHY `security_invoker = on`, ON EVERY VIEW IN THIS SCHEMA, WITHOUT EXCEPTION.
--
-- A PostgreSQL view executes as its OWNER by default. That means row-level
-- security on the tables underneath is evaluated against the owner — and the
-- owner here is a superuser role that bypasses RLS entirely. Supabase's default
-- privileges also grant select on new objects in `public` to the anon role.
--
-- Put those two facts together and a plain `create view` over these tables is a
-- hole straight through migration 10: RLS would be enabled on photos with no
-- policies, correctly returning nothing to a leaked anon key — and this view
-- would hand the same key every shared day the two of them have ever had.
-- Defence in depth defeated by a convenience default, in one line nobody looks at.
--
-- `security_invoker = on` (PostgreSQL 15 and later; Supabase is well past it)
-- makes the view evaluate as the CALLER, so RLS applies exactly as it does to the
-- tables. Under migration 10's deny-all, a leaked anon key selecting from this
-- view gets zero rows, which is the whole point.
--
-- WHAT IT SHOWS. One row per shared day on which at least one daily photo is
-- currently visible, with who posted and when the day's first and last posts
-- landed. `deleted_at is null` — soft-deleted photos are gone from the interface,
-- which is what a soft delete is for.
--
-- photo_count is 1 or 2 and can never be more: the unique index in migration 03
-- allows one live daily photo per member per shared day, and members holds
-- exactly two people. So both_posted is equivalent to photo_count = 2. Both are
-- selected anyway — the boolean is what the interface actually asks for, and
-- deriving it from a count would tie the read path to that index staying exactly
-- as it is.
--
-- `create or replace view` keeps the grants that already exist on the view and is
-- safe to re-run. It cannot change the column list, though: if these columns ever
-- change, run the down migration first and then this one.

create or replace view public.v_shared_days
with (security_invoker = on)
as
select
  p.shared_day,
  bool_or(m.slug = 'eva')                                as eva_posted,
  bool_or(m.slug = 'adam')                               as adam_posted,
  bool_or(m.slug = 'eva') and bool_or(m.slug = 'adam')   as both_posted,
  count(*)                                               as photo_count,
  min(p.created_at)                                      as first_post_at,
  max(p.created_at)                                      as last_post_at
from public.photos p
join public.members m on m.id = p.author_member_id
where p.kind = 'daily'
  and p.deleted_at is null
group by p.shared_day;

-- No ORDER BY. The interface reads this newest-first, the book reads it
-- oldest-first, and an ordering baked into a view is one the planner has to
-- discard for whichever of them asked for the other. Order at the call site.

comment on view public.v_shared_days is
  'Display view: one row per shared day with at least one VISIBLE daily photo. '
  'Excludes soft-deleted rows. Not the tally — see v_days_together, which '
  'deliberately filters on a different column. LDR §2.3.';


-- -----------------------------------------------------------------------------
-- v_days_together — the tally. THE FILTER IS purged_at, NOT deleted_at.
-- -----------------------------------------------------------------------------
--
-- READ THIS BEFORE CHANGING THE `where` CLAUSE BELOW. The difference between
-- `purged_at is null` and `deleted_at is null` looks like an inconsistency with
-- the view above. It is the entire purpose of this view.
--
-- This view answers one question: on how many days did BOTH of them show up.
-- That is a fact about the past. It happened. Deleting a photo afterwards — or
-- replacing one, which the app does by soft-deleting the old row — does not make
-- it un-happen, and the number they are shown must not pretend otherwise.
--
-- Had this filtered on deleted_at, then re-posting a better photo of the same
-- day, or tidying up a blurry one from two years ago, would silently decrement
-- "days together". A DECAY PATH CREATED BY ACCIDENT, in the one number this
-- product promises can only ever go up, triggered by the most innocent action
-- either of them could take. Nobody would have chosen that; it would simply have
-- been what the code did.
--
-- purged_at is the one exception, and it is not an exception to the principle.
-- A purge is a permanent, deliberate, audited destruction of the bytes, recorded
-- in purge_audit (migration 07) and requested explicitly by one of them. A purged
-- photo is treated as never having existed, because after a purge there is
-- genuinely nothing left to have existed. That is the only door out of this view,
-- it can only be opened on purpose, and it leaves a receipt.
--
-- SO: DO NOT "FIX" THIS TO MATCH v_shared_days. They are not supposed to match.
-- If a future change makes these two views agree, that change is the bug.
--
-- Also, for the record and per LDR §3.4: there is no counter column anywhere in
-- this schema, no break job, no grace ledger, no decay timer, no consecutive-run
-- state, and no scheduled task of any kind that can mark a day lost. The number
-- is `count(*)` over an aggregate of contribution records. It is recomputable
-- from the rows at any moment, which is why it cannot be corrupted into a wrong
-- value, and nothing in the system is capable of decrementing it. A missed day is
-- simply not counted, and a day is pending — never missed — until it is over.

create or replace view public.v_days_together
with (security_invoker = on)
as
select p.shared_day
from public.photos p
join public.members m on m.id = p.author_member_id
where p.kind = 'daily'
  and p.purged_at is null          -- NOT deleted_at. See the note above.
group by p.shared_day
having bool_or(m.slug = 'eva') and bool_or(m.slug = 'adam');

comment on view public.v_days_together is
  'The tally: one row per shared day on which BOTH members posted a daily photo. '
  'Filters on purged_at, NOT deleted_at, so deleting or replacing a photo can '
  'never retroactively erase a day they both showed up for. This is deliberate — '
  'do not align it with v_shared_days. LDR §2.3, §3.4.';

-- The headline number is:
--
--   select count(*) from public.v_days_together;
--
-- There is no v_days_together_count view and no stored total. The count is cheap,
-- it is correct by construction, and having exactly one definition of it means
-- there is no second place for the two to drift apart.
