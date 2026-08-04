-- =============================================================================
-- Eva & Adam — migration 04 of 11 — vault_items
--
--   !! APPLICATION STATUS UNKNOWN. Do not assume this file is unapplied. !!
--   The founder confirmed from the Supabase dashboard on 2026-08-04 that
--   tables exist in project oqiyzzpcsdlqqcjlpmix. Nobody has verified which
--   of these migrations are applied, or whether the live schema matches this
--   file exactly — that check has not been done. Verify against the live
--   schema before running anything here.
--
-- Down: ./down/20260802090300_vault_items.down.sql
-- Source of truth: docs/03-system-design/LDR-APP-ARCHITECTURE.md §2.1, §5.5
-- =============================================================================

-- Physically separate from photos: own table, own storage prefix (v/), own
-- routes, own repository module. That separation — not a flag — is the whole
-- privacy mechanism. See the header of migration 03.

-- THERE IS NO THUMBNAIL PATH ON THIS TABLE, AND NO THUMBNAIL IS EVER GENERATED.
--
-- storage_path_display is the only derivative. This is not an omission to be
-- tidied up later:
--
--   A thumbnail that does not exist cannot leak into a grid, a share sheet, a
--   notification preview, a link unfurl, an OS-level file picker, or a cache
--   that outlives the item it came from.
--
-- Every one of those leaks is a leak of a *preview*, and a preview of this
-- content is still the content. Vault items are opened one at a time, at full
-- display size, behind the passphrase — never pre-rendered into a grid.
--
-- Do not add storage_path_thumb here. The matching TypeScript interface
-- (apps/web/lib/types.ts, VaultItem) carries the same instruction.

create table if not exists public.vault_items (
  id                   uuid primary key,       -- app-supplied, same reasoning as photos.id
  client_uuid          text not null unique,   -- idempotency key
  author_member_id     uuid not null references public.members(id),

  shared_day           date not null,
  shared_day_tz        text not null,          -- IANA identifier
  taken_at             timestamptz,
  caption              text,

  storage_path_display text not null,          -- v/{id}/display.jpg — display variant ONLY

  width  int not null,
  height int not null,
  bytes  int not null,
  mime   text not null check (mime = 'image/jpeg'),
  checksum_sha256 text not null,
  exif_stripped   boolean not null default true,

  created_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  purge_requested_at timestamptz,
  purged_at          timestamptz
);

-- NOTE FOR REVIEW, not a change: LDR §2.1 gives photos.width/height/bytes a
-- `> 0` check and gives vault_items' equivalents none. That asymmetry is
-- reproduced here verbatim rather than quietly corrected, because correcting a
-- spec inside a migration is how a schema and its document drift apart. Flagged
-- to the CEO in the P1-T2 return; if it is an oversight, it is a one-line
-- follow-up migration.

create index if not exists vault_items_created_idx
  on public.vault_items (created_at desc)
  where deleted_at is null;

-- There is deliberately no index on shared_day here. The vault is not browsed by
-- day and has no daily-spread query; adding one would only invite a UI that
-- groups vault items into a calendar grid, which is the grid this table exists
-- to not have.
