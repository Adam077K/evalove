# apps/web/supabase/migrations

This directory holds the full Postgres schema for Eva & Adam as twelve SQL migration files, plus their reverses in `./down/`. Read this before applying, reversing, or reasoning about any of them — several already point here by name.

## What applying a migration means here

Every file in this directory is DDL: `create table`, `create type`, `create index`, `create function`, `create trigger`, `create policy`. Applying one changes the *shape* of a database — it does not, by itself, write or destroy a single row of content. Every migration has a matching file in `./down/`, and on an empty project the full forward-then-back round trip is designed to leave nothing behind. (A few down files, once real content exists, destroy data with no other copy — read a down file's own warnings before running it against a project holding real photographs.)

**The irreversible event in this system is the first real photograph committing to `photos` or `vault_items` — not the schema landing.** A schema with no rows in it can be dropped and recreated for free. A schema holding even one of Eva and Adam's own photographs cannot.

## Who signs off

Applying these migrations to a live (non-local) Supabase project is **Irreversible tier**, per `.claude/memory/DECISIONS.md`, "2026-08-02 — T2 authors the migration but does not apply it": T2 (database-engineer) was scoped to author these files and a down-migration, and explicitly *not* to run them — founder sign-off recorded before it runs was the gate. See also the 2026-08-04 correction entry in the same file, which is the reason this README exists at all.

No agent should apply, alter, or reverse any file in this directory against a live project without the founder's explicit, current sign-off. A sign-off given in the past is not evidence of a sign-off now — see "Known state" below.

## How to find out what is actually applied

**No agent in this environment can query the live schema directly.** The local Supabase CLI's access token is invalid, and there are no `.env*` files in this repository carrying real credentials — they live in Vercel, outside every agent's reach. Do not try to route around this. If a legitimate read-only path is added later, record it here.

Two honest routes exist today:

1. **Ask the founder.** From the Supabase dashboard they can answer "which migrations are applied" and "does the live schema match these files" in about one line. This is the fast path, and the one that produced the "Known state" section below.
2. **Manually dispatch `.github/workflows/nightly-archive.yml`.** Its secrets never leave GitHub Actions, so this doesn't expose credentials to an agent — but **on success it performs a real export of live data and a real upload to Eva's R2 bucket.** It is not a read-only schema check. It needs the founder's yes first, same as any other run of that job. Manual-run steps: `docs/03-system-design/RUNBOOK-nightly-archive.md` §4.

## Known state as of 2026-08-04

The founder confirmed, directly from the Supabase dashboard, that **tables exist** in project `oqiyzzpcsdlqqcjlpmix`.

**Which of the twelve migrations below are applied, and whether the live schema matches these files exactly, is unverified.** Nobody has checked. Do not round this up to "the schema is current," and do not round it down to "nothing has been applied" — both are guesses this README exists to stop. State it in exactly these terms until someone actually checks: tables exist; the rest is unknown.

Background, for whoever reads this next: on 2026-08-04, two agents independently read the migration headers' (now-corrected) `NEVER APPLIED` claim plus the 2026-08-02 DECISIONS.md entry above, concluded the schema had never been applied, and escalated an Irreversible-tier sign-off request to the founder over a stale comment. That incident is what this README and the header correction both respond to.

## seed.sql must never run against the hosted project

`../seed.sql` writes rows that claim to be Eva and Adam, guarded by a check that refuses to run against a database already holding real content — but that guard is a safety net, not a plan. It is a **local development fixture only**. Do not run it, or `supabase db reset` (which runs it automatically — see `../config.toml`, `[db.seed]`), against any hosted project.

## The verification that did not happen

Every file in this directory — the twelve migrations, their twelve down files, `../seed.sql`, and `../config.toml` — was authored on a machine with no container runtime. `supabase start`, `supabase db reset`, and `psql` were never available, so **none of this SQL has ever been executed anywhere, local or hosted, by the agent that wrote it.** It was written correct by reasoning about PostgreSQL and the Supabase CLI, not by running it and watching it pass.

This is a separate fact from "Known state" above. Tables existing in the live project (founder-confirmed) says nothing about whether *this exact SQL* is what created them, or whether it would run cleanly today if it hasn't already. Before trusting this SQL against anything real, run it first against a local stack with a working container runtime, or have someone who can.

## What the seed does not give you

`../seed.sql` writes rows to `photos`, not bytes to storage. Its `storage_path_display` and `storage_path_thumb` columns point at object paths like `p/5eed0001-.../display.jpg` that name no real object — nothing was ever uploaded. An `<img>` tag against a signed URL for one of these will 404. The seed exercises the *schema* (the day model, the views, the constraints); it does not give you anything to look at. That's by design, not an oversight — see the seed file's own header.

## If the prefix guard cannot be installed

Migration 11 creates a trigger on `storage.objects` — a table it does not own — to enforce the `p/`/`v/` prefix split that keeps vault content out of the ordinary photo path. `create trigger` on a table owned by `supabase_storage_admin` needs the `TRIGGER` privilege, which the migration role normally has — but **this specific statement has never been run, so its privilege requirements are unverified, not confirmed.**

If applying migration 11 raises `42501` (insufficient privilege) on that `create trigger` statement: **stop. Do not delete or comment out the guard to make the migration succeed.** That trigger is the only mechanism enforcing the private/public storage split described in `LDR-APP-ARCHITECTURE.md` §5.5 — removing it to get past an error would silently remove the boundary it exists to guarantee. Ask the founder or whoever administers the Supabase project to grant the needed privilege (or apply this one statement as a role that already has it), then re-run.

## Deliberate additions

Three places in this schema add something beyond the flat SQL block in `LDR-APP-ARCHITECTURE.md` §2.1. Each is marked in its file with a comment pointing here.

**A1 — `members.home_timezone` shape check** (migration 02). A check constraint requiring `home_timezone` to begin with a letter, rejecting values like `+02:00` or `-0500`. This is a shape check, not a real-timezone check — it enforces LDR §2's "no numeric UTC offset" rule at the column level without hard-coding tzdata, which changes independently of the schema.

**A2 — `activity_log_member_idx`** (migration 07). An index on `activity_log.member_id`. PostgreSQL does not automatically index the referencing side of a foreign key, so without this, a delete of a `members` row would force a sequential scan of this table. Nothing deletes a `members` row today; the index exists so that stays true without anyone noticing the cost of removing it.

**A3 — `purge_audit_item_idx` and `purge_audit_outstanding_idx`** (migration 07). Two indexes on `purge_audit` supporting its two real read patterns: "what happened to this specific item" and "what purges are still outstanding." Both are cheap on an append-only table that only grows when something is actually deleted for good.

## The twelve migrations, in order

| # | File | Creates |
|---|------|---------|
| 01 | `20260802090000_extensions_and_enums.sql` | `pgcrypto`, `photo_kind`, `date_kind`, `date_status` |
| 02 | `20260802090100_members.sql` | `members` |
| 03 | `20260802090200_photos.sql` | `photos` |
| 04 | `20260802090300_vault_items.sql` | `vault_items` |
| 05 | `20260802090400_dates_and_date_turns.sql` | `dates`, `date_turns` |
| 06 | `20260802090500_book_entries.sql` | `book_entries` |
| 07 | `20260802090600_activity_auth_and_settings.sql` | `activity_state`, `activity_log`, `auth_attempts`, `purge_audit`, `app_settings` |
| 08 | `20260802090700_shared_day_function_and_triggers.sql` | `shared_day_of()` and its validation triggers |
| 09 | `20260802090800_views_shared_days_and_days_together.sql` | `v_shared_days`, `v_days_together` |
| 10 | `20260802090900_rls_deny_all.sql` | RLS enabled, zero policies, every table |
| 11 | `20260802091000_storage_media_bucket.sql` | the private `media` storage bucket + prefix-enforcement trigger |
| 12 | `20260807120000_photos_author_optional.sql` | `photos.author_member_id` becomes optional (2026-08-07 founder decision: unsigned photographs are shared, not authored) |

Each has a matching down-migration in `./down/`, reversed in the same numeric order (12 → 01).
