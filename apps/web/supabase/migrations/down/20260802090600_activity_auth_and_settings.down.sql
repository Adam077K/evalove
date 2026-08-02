-- =============================================================================
-- DOWN for migration 07 of 11 — activity_state, activity_log, auth_attempts,
--                               purge_audit, app_settings
--
-- Run the down migrations in REVERSE order (11 -> 01).
--
-- WARNING, in descending order of how much it hurts:
--
--   purge_audit    is the one that cannot be reconstructed from anything. It is
--                  the only record that a piece of content was permanently
--                  deleted, who asked, and whether the bytes are actually gone
--                  from both tiers. The content it describes is already gone by
--                  definition, so there is nothing left to re-derive it from.
--                  EXPORT THIS TABLE BEFORE RUNNING THIS FILE.
--
--   activity_state carries hand-written notes and ratings. The activity library
--                  itself is build-time content and comes back on its own; our
--                  opinions about it do not.
--
--   activity_log   is the history of things actually done together. Not
--                  regenerable.
--
--   app_settings   is regenerable by whoever set the settings.
--
--   auth_attempts  is genuinely disposable — it is a 30-day rolling window used
--                  by the rate limiter, and dropping it costs at most a short
--                  period during which nothing is throttled.
--
-- Dropping a table drops the sequence its bigserial column owns, and drops every
-- index created above alongside it. Nothing references these five tables, so no
-- order is required among them; they are listed in reverse creation order for
-- readability only.
-- =============================================================================

drop table if exists public.app_settings;
drop table if exists public.purge_audit;
drop table if exists public.auth_attempts;
drop table if exists public.activity_log;
drop table if exists public.activity_state;
