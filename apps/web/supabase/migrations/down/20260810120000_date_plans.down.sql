-- =============================================================================
-- DOWN for date_plans
--
-- WARNING: this destroys every date either of them ever proposed to the other,
-- and every answer. There is no derived copy — the photographs a date left
-- behind survive in `photos` (they are joined by `shared_day`, not by a foreign
-- key), but the record that those photographs came from a date one of them
-- asked for and the other said yes to lives in this table and nowhere else.
--
-- Nothing references public.date_plans, so this drops cleanly on its own and
-- does not need to run in any particular order relative to the eleven original
-- downs. Its indexes and its RLS setting go with the table.
-- =============================================================================

drop table if exists public.date_plans;
