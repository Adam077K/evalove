-- =============================================================================
-- Eva & Adam — migration ground-truth verification
--
-- WHAT THIS IS. A single read-only script that Adam pastes into the Supabase
-- SQL editor (or runs with psql) to establish, for each of the 14 migration
-- files in apps/web/supabase/migrations/, whether the object(s) that migration
-- creates are present in the live database.
--
-- WHAT IT IS NOT. This does not apply, reverse, or alter anything. Every
-- statement here is a SELECT or COPY of catalogue data. If the Supabase SQL
-- editor shows a green "Success" for a SELECT and then a row count in the
-- result pane, the query ran.
--
-- HOW TO READ THE RESULTS.
--   verdict = 'APPLIED'           — every primary indicator is present
--   verdict = 'NOT APPLIED'       — the primary indicator is absent
--   verdict = 'PARTIAL'           — some indicators present, some not
--   verdict = 'CHECK MANUALLY'    — cannot distinguish from here (storage)
--
-- ANTI-TRAP: CANARY IS REQUIRED.
-- An empty result set is indistinguishable from a correctly empty one unless
-- you prove the query ran against something you know exists. The canary block
-- at the top of Step 1 establishes that. Do NOT skip it.
--
-- Authored by: supabase-cleaner agent, 2026-08-10
-- Branch: chore/migration-truth
-- Adam reviews and runs; no agent runs this.
-- =============================================================================


-- =============================================================================
-- STEP 0 — CANARY
-- Proves this session can reach pg_catalog. Every PostgreSQL has pg_namespace
-- with a 'public' row. If this returns zero rows, stop — the session is broken.
-- =============================================================================

SELECT
  'CANARY' AS check_name,
  CASE
    WHEN count(*) > 0 THEN 'PASS — session can read pg_catalog'
    ELSE 'FAIL — cannot read pg_catalog; abort'
  END AS result
FROM pg_catalog.pg_namespace
WHERE nspname = 'public';

-- You must see exactly one row with result = 'PASS ...' before continuing.


-- =============================================================================
-- STEP 1 — PER-MIGRATION VERDICT TABLE
-- One row per migration file. Paste and run the whole block.
-- =============================================================================

WITH

-- --------------------------------------------------------------------------
-- helpers: look up objects we will check many times
-- --------------------------------------------------------------------------
tables AS (
  SELECT relname AS tname
  FROM   pg_class c
  JOIN   pg_namespace n ON n.oid = c.relnamespace
  WHERE  n.nspname = 'public'
    AND  c.relkind = 'r'
),
enum_types AS (
  SELECT typname AS ename
  FROM   pg_type t
  JOIN   pg_namespace n ON n.oid = t.typnamespace
  WHERE  n.nspname = 'public'
    AND  t.typtype = 'e'
),
views AS (
  SELECT relname AS vname
  FROM   pg_class c
  JOIN   pg_namespace n ON n.oid = c.relnamespace
  WHERE  n.nspname = 'public'
    AND  c.relkind = 'v'
),
functions AS (
  SELECT p.proname AS fname, pg_get_function_identity_arguments(p.oid) AS fargs
  FROM   pg_proc p
  JOIN   pg_namespace n ON n.oid = p.pronamespace
  WHERE  n.nspname = 'public'
),
constraints_pg AS (
  SELECT conname, conrelid::regclass::text AS tname
  FROM   pg_constraint
  WHERE  connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
),
columns_pg AS (
  SELECT table_name, column_name, is_nullable
  FROM   information_schema.columns
  WHERE  table_schema = 'public'
),
rls_state AS (
  SELECT relname, relrowsecurity
  FROM   pg_class c
  JOIN   pg_namespace n ON n.oid = c.relnamespace
  WHERE  n.nspname = 'public'
    AND  c.relkind = 'r'
),

-- --------------------------------------------------------------------------
-- migration 01: extensions_and_enums
-- Indicators: pgcrypto, photo_kind, date_kind, date_status
-- --------------------------------------------------------------------------
m01 AS (
  SELECT
    '20260802090000_extensions_and_enums.sql'   AS migration_file,
    EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto')
                                                AS pgcrypto_ok,
    EXISTS (SELECT 1 FROM enum_types WHERE ename = 'photo_kind')
                                                AS photo_kind_ok,
    EXISTS (SELECT 1 FROM enum_types WHERE ename = 'date_kind')
                                                AS date_kind_ok,
    EXISTS (SELECT 1 FROM enum_types WHERE ename = 'date_status')
                                                AS date_status_ok
),

-- --------------------------------------------------------------------------
-- migration 02: members
-- Indicator: public.members table + members_home_timezone_is_iana constraint
-- --------------------------------------------------------------------------
m02 AS (
  SELECT
    '20260802090100_members.sql'                AS migration_file,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'members')
                                                AS members_ok,
    EXISTS (SELECT 1 FROM constraints_pg
            WHERE conname = 'members_home_timezone_is_iana')
                                                AS iana_constraint_ok
),

-- --------------------------------------------------------------------------
-- migration 03: photos
-- Indicator: public.photos table + required columns
-- --------------------------------------------------------------------------
m03 AS (
  SELECT
    '20260802090200_photos.sql'                 AS migration_file,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'photos')
                                                AS photos_ok,
    EXISTS (SELECT 1 FROM columns_pg
            WHERE table_name = 'photos' AND column_name = 'client_uuid')
                                                AS client_uuid_col_ok,
    EXISTS (SELECT 1 FROM columns_pg
            WHERE table_name = 'photos' AND column_name = 'storage_path_display')
                                                AS display_col_ok,
    EXISTS (SELECT 1 FROM columns_pg
            WHERE table_name = 'photos' AND column_name = 'storage_path_thumb')
                                                AS thumb_col_ok,
    EXISTS (SELECT 1 FROM columns_pg
            WHERE table_name = 'photos' AND column_name = 'exif_stripped')
                                                AS exif_col_ok
),

-- --------------------------------------------------------------------------
-- migration 04: vault_items
-- Indicator: public.vault_items table + no storage_path_thumb (intentional absence)
-- --------------------------------------------------------------------------
m04 AS (
  SELECT
    '20260802090300_vault_items.sql'            AS migration_file,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'vault_items')
                                                AS vault_items_ok,
    NOT EXISTS (SELECT 1 FROM columns_pg
                WHERE table_name = 'vault_items'
                  AND column_name = 'storage_path_thumb')
                                                AS no_thumb_col_correct
),

-- --------------------------------------------------------------------------
-- migration 05: dates and date_turns
-- Indicator: both tables exist
-- --------------------------------------------------------------------------
m05 AS (
  SELECT
    '20260802090400_dates_and_date_turns.sql'   AS migration_file,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'dates')
                                                AS dates_ok,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'date_turns')
                                                AS date_turns_ok,
    EXISTS (SELECT 1 FROM constraints_pg
            WHERE conname = 'dates_secret_pairing')
                                                AS secret_pairing_ok
),

-- --------------------------------------------------------------------------
-- migration 06: book_entries
-- Indicator: table + XOR constraint
-- --------------------------------------------------------------------------
m06 AS (
  SELECT
    '20260802090500_book_entries.sql'           AS migration_file,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'book_entries')
                                                AS book_entries_ok,
    EXISTS (SELECT 1 FROM constraints_pg
            WHERE conname = 'book_entry_is_photo_xor_date')
                                                AS xor_constraint_ok
),

-- --------------------------------------------------------------------------
-- migration 07: activity_state, activity_log, auth_attempts, purge_audit, app_settings
-- Indicator: all five tables
-- --------------------------------------------------------------------------
m07 AS (
  SELECT
    '20260802090600_activity_auth_and_settings.sql' AS migration_file,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'activity_state')
                                                AS activity_state_ok,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'activity_log')
                                                AS activity_log_ok,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'auth_attempts')
                                                AS auth_attempts_ok,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'purge_audit')
                                                AS purge_audit_ok,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'app_settings')
                                                AS app_settings_ok
),

-- --------------------------------------------------------------------------
-- migration 08: shared_day_of() function + triggers
-- Indicator: function exists, triggers exist
-- --------------------------------------------------------------------------
m08 AS (
  SELECT
    '20260802090700_shared_day_function_and_triggers.sql' AS migration_file,
    EXISTS (SELECT 1 FROM functions
            WHERE fname = 'shared_day_of'
              -- pg_get_function_identity_arguments uses format_type() internally,
              -- which returns the canonical SQL name 'timestamp with time zone'
              -- for the timestamptz alias — so '%timestamptz%' would never match.
              -- '%timestamp%' catches both the canonical and alias forms safely.
              AND fargs LIKE '%timestamp%')
                                                AS fn_shared_day_ok,
    EXISTS (SELECT 1 FROM functions
            WHERE fname = 'enforce_shared_day_matches_tz')
                                                AS fn_trigger_ok,
    EXISTS (SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relname = 'photos'
              AND t.tgname = 'photos_shared_day_matches_tz'
              AND NOT t.tgisinternal)
                                                AS photos_trigger_ok,
    EXISTS (SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relname = 'vault_items'
              AND t.tgname = 'vault_items_shared_day_matches_tz'
              AND NOT t.tgisinternal)
                                                AS vault_trigger_ok
),

-- --------------------------------------------------------------------------
-- migration 09: v_shared_days, v_days_together (both security_invoker)
-- --------------------------------------------------------------------------
m09 AS (
  SELECT
    '20260802090800_views_shared_days_and_days_together.sql' AS migration_file,
    EXISTS (SELECT 1 FROM views WHERE vname = 'v_shared_days')
                                                AS v_shared_days_ok,
    EXISTS (SELECT 1 FROM views WHERE vname = 'v_days_together')
                                                AS v_days_together_ok,
    -- Check security_invoker on both views. reloptions contains
    -- 'security_invoker=on' when set.
    EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = 'v_shared_days'
        AND c.relkind = 'v'
        AND 'security_invoker=on' = ANY(c.reloptions)
    )                                           AS v_shared_days_security_invoker,
    EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = 'v_days_together'
        AND c.relkind = 'v'
        AND 'security_invoker=on' = ANY(c.reloptions)
    )                                           AS v_days_together_security_invoker
),

-- --------------------------------------------------------------------------
-- migration 10: RLS enabled on every table (deny-all, zero policies)
-- --------------------------------------------------------------------------
m10 AS (
  SELECT
    '20260802090900_rls_deny_all.sql'           AS migration_file,
    (SELECT bool_and(relrowsecurity)
     FROM rls_state
     WHERE tname IN ('members','photos','vault_items','dates','date_turns',
                     'book_entries','activity_state','activity_log',
                     'auth_attempts','purge_audit','app_settings'))
                                                AS all_core_tables_rls_on,
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') = 0
                                                AS zero_policies
),

-- --------------------------------------------------------------------------
-- migration 11: media storage bucket (read via storage schema)
-- NOTE: storage.buckets lives in the storage schema, not public.
-- The check below is safe — it is a SELECT, not DDL.
-- --------------------------------------------------------------------------
m11 AS (
  SELECT
    '20260802091000_storage_media_bucket.sql'   AS migration_file,
    EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media' AND NOT public)
                                                AS media_bucket_private,
    EXISTS (SELECT 1 FROM storage.buckets
            WHERE id = 'media' AND file_size_limit = 26214400)
                                                AS correct_size_limit,
    -- The prefix guard trigger lives on storage.objects, checked below.
    EXISTS (SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'objects'
              AND n.nspname = 'storage'
              AND t.tgname = 'media_objects_prefix_guard'
              AND NOT t.tgisinternal)
                                                AS prefix_guard_ok,
    -- The trigger function lives in public:
    EXISTS (SELECT 1 FROM functions
            WHERE fname = 'enforce_media_object_prefix')
                                                AS prefix_fn_ok
),

-- --------------------------------------------------------------------------
-- migration 12: photos.author_member_id becomes optional (2026-08-07)
-- Indicator: the column is now nullable + photos_daily_requires_author constraint
-- --------------------------------------------------------------------------
m12 AS (
  SELECT
    '20260807120000_photos_author_optional.sql' AS migration_file,
    EXISTS (SELECT 1 FROM columns_pg
            WHERE table_name = 'photos'
              AND column_name = 'author_member_id'
              AND is_nullable = 'YES')
                                                AS author_nullable_ok,
    EXISTS (SELECT 1 FROM constraints_pg
            WHERE conname = 'photos_daily_requires_author')
                                                AS daily_requires_author_ok
),

-- --------------------------------------------------------------------------
-- migration 13: add `people` column to photos (2026-08-08)
-- Explicitly stated as never applied in README.
-- Indicator: photos.people column exists
-- --------------------------------------------------------------------------
m13 AS (
  SELECT
    '20260808_add_people_column.sql'            AS migration_file,
    EXISTS (SELECT 1 FROM columns_pg
            WHERE table_name = 'photos'
              AND column_name = 'people')
                                                AS people_col_ok
),

-- --------------------------------------------------------------------------
-- migration 14: date_plans table (2026-08-10)
-- Explicitly stated as never applied in README.
-- Indicator: date_plans table + RLS on it
-- --------------------------------------------------------------------------
m14 AS (
  SELECT
    '20260810120000_date_plans.sql'             AS migration_file,
    EXISTS (SELECT 1 FROM tables WHERE tname = 'date_plans')
                                                AS date_plans_ok,
    EXISTS (SELECT 1 FROM rls_state
            WHERE tname = 'date_plans' AND relrowsecurity)
                                                AS date_plans_rls_ok,
    -- Vault boundary: no FK from date_plans to vault_items.
    -- This should always be true (by construction); verifying it explicitly.
    NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class ref ON ref.oid = c.confrelid
      JOIN pg_namespace ns ON ns.oid = src.relnamespace
      WHERE ns.nspname = 'public'
        AND src.relname = 'date_plans'
        AND ref.relname = 'vault_items'
        AND c.contype = 'f'
    )                                           AS vault_boundary_intact
)

-- --------------------------------------------------------------------------
-- FINAL RESULT: one row per migration, with verdict
-- --------------------------------------------------------------------------
SELECT
  migration_file,
  CASE
    WHEN migration_file = '20260802090000_extensions_and_enums.sql' THEN
      CASE WHEN pgcrypto_ok AND photo_kind_ok AND date_kind_ok AND date_status_ok
           THEN 'APPLIED'
           WHEN NOT pgcrypto_ok AND NOT photo_kind_ok AND NOT date_kind_ok AND NOT date_status_ok
           THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090100_members.sql' THEN
      CASE WHEN members_ok AND iana_constraint_ok THEN 'APPLIED'
           WHEN NOT members_ok               THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090200_photos.sql' THEN
      CASE WHEN photos_ok AND client_uuid_col_ok AND display_col_ok
                AND thumb_col_ok AND exif_col_ok
           THEN 'APPLIED'
           WHEN NOT photos_ok               THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090300_vault_items.sql' THEN
      CASE WHEN vault_items_ok AND no_thumb_col_correct THEN 'APPLIED'
           WHEN NOT vault_items_ok          THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090400_dates_and_date_turns.sql' THEN
      CASE WHEN dates_ok AND date_turns_ok AND secret_pairing_ok
           THEN 'APPLIED'
           WHEN NOT dates_ok AND NOT date_turns_ok THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090500_book_entries.sql' THEN
      CASE WHEN book_entries_ok AND xor_constraint_ok THEN 'APPLIED'
           WHEN NOT book_entries_ok         THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090600_activity_auth_and_settings.sql' THEN
      CASE WHEN activity_state_ok AND activity_log_ok AND auth_attempts_ok
                AND purge_audit_ok AND app_settings_ok
           THEN 'APPLIED'
           WHEN NOT activity_state_ok AND NOT activity_log_ok
                AND NOT auth_attempts_ok AND NOT purge_audit_ok
                AND NOT app_settings_ok
           THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090700_shared_day_function_and_triggers.sql' THEN
      CASE WHEN fn_shared_day_ok AND fn_trigger_ok
                AND photos_trigger_ok AND vault_trigger_ok
           THEN 'APPLIED'
           WHEN NOT fn_shared_day_ok AND NOT fn_trigger_ok
                AND NOT photos_trigger_ok AND NOT vault_trigger_ok
           THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090800_views_shared_days_and_days_together.sql' THEN
      CASE WHEN v_shared_days_ok AND v_days_together_ok
                AND v_shared_days_security_invoker AND v_days_together_security_invoker
           THEN 'APPLIED'
           WHEN NOT v_shared_days_ok AND NOT v_days_together_ok
           THEN 'NOT APPLIED'
           WHEN v_shared_days_ok AND NOT v_shared_days_security_invoker
             OR v_days_together_ok AND NOT v_days_together_security_invoker
           THEN 'PARTIAL (views exist but security_invoker missing — security hole)'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802090900_rls_deny_all.sql' THEN
      CASE WHEN all_core_tables_rls_on AND zero_policies THEN 'APPLIED'
           WHEN NOT all_core_tables_rls_on              THEN 'NOT APPLIED (or PARTIAL)'
           WHEN all_core_tables_rls_on AND NOT zero_policies
           THEN 'PARTIAL (RLS on, but policies exist — Phase 2 may have started)'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260802091000_storage_media_bucket.sql' THEN
      CASE WHEN media_bucket_private AND correct_size_limit
                AND prefix_guard_ok AND prefix_fn_ok
           THEN 'APPLIED'
           WHEN NOT media_bucket_private AND NOT correct_size_limit
                AND NOT prefix_guard_ok AND NOT prefix_fn_ok
           THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260807120000_photos_author_optional.sql' THEN
      CASE WHEN author_nullable_ok AND daily_requires_author_ok THEN 'APPLIED'
           WHEN NOT author_nullable_ok      THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
    WHEN migration_file = '20260808_add_people_column.sql' THEN
      CASE WHEN people_col_ok  THEN 'APPLIED'
           ELSE 'NOT APPLIED'
      END
    WHEN migration_file = '20260810120000_date_plans.sql' THEN
      CASE WHEN date_plans_ok AND date_plans_rls_ok THEN 'APPLIED'
           WHEN NOT date_plans_ok          THEN 'NOT APPLIED'
           ELSE 'PARTIAL'
      END
  END                                           AS verdict,
  -- Detail columns follow for manual inspection when verdict is surprising
  ''                                            AS detail_separator
FROM (
  SELECT migration_file,
         pgcrypto_ok, photo_kind_ok, date_kind_ok, date_status_ok,
         NULL::bool AS members_ok, NULL::bool AS iana_constraint_ok,
         NULL::bool AS photos_ok, NULL::bool AS client_uuid_col_ok,
         NULL::bool AS display_col_ok, NULL::bool AS thumb_col_ok, NULL::bool AS exif_col_ok,
         NULL::bool AS vault_items_ok, NULL::bool AS no_thumb_col_correct,
         NULL::bool AS dates_ok, NULL::bool AS date_turns_ok, NULL::bool AS secret_pairing_ok,
         NULL::bool AS book_entries_ok, NULL::bool AS xor_constraint_ok,
         NULL::bool AS activity_state_ok, NULL::bool AS activity_log_ok,
         NULL::bool AS auth_attempts_ok, NULL::bool AS purge_audit_ok, NULL::bool AS app_settings_ok,
         NULL::bool AS fn_shared_day_ok, NULL::bool AS fn_trigger_ok,
         NULL::bool AS photos_trigger_ok, NULL::bool AS vault_trigger_ok,
         NULL::bool AS v_shared_days_ok, NULL::bool AS v_days_together_ok,
         NULL::bool AS v_shared_days_security_invoker, NULL::bool AS v_days_together_security_invoker,
         NULL::bool AS all_core_tables_rls_on, NULL::bool AS zero_policies,
         NULL::bool AS media_bucket_private, NULL::bool AS correct_size_limit,
         NULL::bool AS prefix_guard_ok, NULL::bool AS prefix_fn_ok,
         NULL::bool AS author_nullable_ok, NULL::bool AS daily_requires_author_ok,
         NULL::bool AS people_col_ok,
         NULL::bool AS date_plans_ok, NULL::bool AS date_plans_rls_ok,
         NULL::bool AS vault_boundary_intact
  FROM m01
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         members_ok, iana_constraint_ok,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m02
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         photos_ok, client_uuid_col_ok, display_col_ok, thumb_col_ok, exif_col_ok,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m03
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         vault_items_ok, no_thumb_col_correct,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m04
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         dates_ok, date_turns_ok, secret_pairing_ok,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m05
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         book_entries_ok, xor_constraint_ok,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m06
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         activity_state_ok, activity_log_ok, auth_attempts_ok, purge_audit_ok, app_settings_ok,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m07
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         fn_shared_day_ok, fn_trigger_ok, photos_trigger_ok, vault_trigger_ok,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m08
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         v_shared_days_ok, v_days_together_ok,
         v_shared_days_security_invoker, v_days_together_security_invoker,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m09
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         all_core_tables_rls_on, zero_policies,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m10
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         media_bucket_private, correct_size_limit, prefix_guard_ok, prefix_fn_ok,
         NULL,NULL,
         NULL,
         NULL,NULL,NULL
  FROM m11
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         author_nullable_ok, daily_requires_author_ok,
         NULL,
         NULL,NULL,NULL
  FROM m12
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         people_col_ok,
         NULL,NULL,NULL
  FROM m13
  UNION ALL
  SELECT migration_file,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,NULL,NULL,NULL,
         NULL,NULL,
         NULL,
         date_plans_ok, date_plans_rls_ok, vault_boundary_intact
  FROM m14
) combined;


-- =============================================================================
-- STEP 2 — RLS STATE: every public table, showing row-security flag
-- =============================================================================

SELECT
  c.relname                                     AS table_name,
  c.relrowsecurity                              AS rls_enabled,
  (SELECT count(*) FROM pg_policy p
   WHERE p.polrelid = c.oid)                    AS policy_count,
  CASE
    WHEN c.relrowsecurity AND
         (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) = 0
    THEN 'DENY-ALL (correct for Phase 1)'
    WHEN NOT c.relrowsecurity
    THEN 'RLS OFF — security gap'
    ELSE 'RLS ON, ' ||
         (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid)::text
         || ' polic(ies)'
  END                                           AS rls_verdict
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;


-- =============================================================================
-- STEP 3 — VAULT BOUNDARY CHECK
-- No FK from any table to vault_items (except vault_items itself via author_member_id → members).
-- book_entries must not reference vault_items.
-- =============================================================================

SELECT
  src.relname                                   AS from_table,
  ref.relname                                   AS to_table,
  c.conname                                     AS fk_name,
  CASE WHEN ref.relname = 'vault_items' AND src.relname <> 'vault_items'
       THEN 'VAULT BOUNDARY BREACH'
       ELSE 'ok'
  END                                           AS vault_verdict
FROM pg_constraint c
JOIN pg_class src ON src.oid = c.conrelid
JOIN pg_class ref ON ref.oid = c.confrelid
JOIN pg_namespace ns ON ns.oid = src.relnamespace
WHERE ns.nspname = 'public'
  AND c.contype = 'f'
ORDER BY from_table, to_table;

-- Expected: no row where vault_verdict = 'VAULT BOUNDARY BREACH'.
-- vault_items.author_member_id → members is correct and will appear; it points
-- FROM vault_items, not TO it.


-- =============================================================================
-- STEP 4 — DRIFT CHECK: public tables not declared in any migration
-- =============================================================================

SELECT relname AS unexpected_table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND relname NOT IN (
    'members', 'photos', 'vault_items', 'dates', 'date_turns',
    'book_entries', 'activity_state', 'activity_log', 'auth_attempts',
    'purge_audit', 'app_settings', 'date_plans'
  )
ORDER BY relname;

-- Expected: zero rows. Any row here is a table in the live database that no
-- migration in this directory explains.


-- =============================================================================
-- STEP 5 — VIEW SECURITY_INVOKER CHECK
-- Both views must have security_invoker=on or the RLS deny-all is bypassed.
-- =============================================================================

SELECT
  c.relname                                     AS view_name,
  c.reloptions                                  AS options,
  CASE
    WHEN 'security_invoker=on' = ANY(c.reloptions)
    THEN 'CORRECT — security_invoker=on'
    ELSE 'SECURITY HOLE — missing security_invoker=on; anon key can read this view'
  END                                           AS security_verdict
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
ORDER BY c.relname;


-- =============================================================================
-- STEP 6 — STORAGE BUCKET STATE
-- =============================================================================

SELECT
  id,
  public                                        AS is_public,
  file_size_limit,
  allowed_mime_types,
  CASE
    WHEN id = 'media' AND NOT public AND file_size_limit = 26214400
      AND allowed_mime_types = ARRAY['image/jpeg']
    THEN 'CORRECT — private, 25 MiB, JPEG only'
    WHEN id = 'media' AND public
    THEN 'DANGER — media bucket is PUBLIC; vault content is world-readable'
    ELSE 'CHECK MANUALLY'
  END                                           AS bucket_verdict
FROM storage.buckets
WHERE id = 'media';
