/**
 * Eva & Adam — reads against `public.members`.
 *
 * There are exactly two rows in this table and there will never be a third.
 * That is what makes the cache below safe: the mapping from slug to id is
 * fixed for the lifetime of the database, so it is read once per process and
 * then remembered.
 *
 * Slugs are `eva` and `adam`. Never `a`/`b`, never `1`/`2`, never an index into
 * an array. An index-style slug is exactly how a wrong-attribution bug gets
 * written: the array is reordered for a display reason, and now the wrong
 * person's name is on the photo. The slug is the name.
 */

import { db } from "@/lib/data/client";
import type { Member, MemberSlug, Uuid } from "@/lib/types";

/** Both rows, keyed by slug. Populated once, then reused. */
let cache: Readonly<Record<MemberSlug, Member>> | undefined;

/** The shape the SQL returns. */
interface MemberRow {
  id: string;
  slug: string;
  display_name: string;
  home_timezone: string;
  created_at: string;
}

/**
 * Both members, by slug.
 *
 * Throws if either row is missing. A database with fewer than two members is
 * not a degraded state this app can serve around — every screen is about the
 * two of them — so it is better to fail at the first read with a sentence that
 * names the problem than to render a page with a blank where a person goes.
 */
export async function membersBySlug(): Promise<
  Readonly<Record<MemberSlug, Member>>
> {
  if (cache) return cache;

  const { data, error } = await db()
    .from("members")
    .select("id, slug, display_name, home_timezone, created_at");

  if (error) {
    throw new Error(`members.select failed: ${error.message}`);
  }

  const rows = (data ?? []) as MemberRow[];
  const bySlug = new Map<string, Member>();
  for (const row of rows) {
    if (row.slug !== "eva" && row.slug !== "adam") continue;
    bySlug.set(row.slug, {
      id: row.id,
      slug: row.slug,
      displayName: row.display_name,
      homeTimezone: row.home_timezone,
      createdAt: row.created_at,
    });
  }

  const eva = bySlug.get("eva");
  const adam = bySlug.get("adam");
  if (!eva || !adam) {
    throw new Error(
      "public.members is missing a row. Both 'eva' and 'adam' must exist; " +
        `found: ${[...bySlug.keys()].join(", ") || "nothing"}. Run apps/web/supabase/seed.sql.`,
    );
  }

  cache = Object.freeze({ eva, adam });
  return cache;
}

/** The id behind a slug. */
export async function memberIdBySlug(slug: MemberSlug): Promise<Uuid> {
  return (await membersBySlug())[slug].id;
}

/**
 * Drop the memoised rows. Tests only.
 *
 * Nothing in the app calls this — the two rows do not change while the process
 * is alive.
 */
export function __resetMembersForTests(): void {
  cache = undefined;
}
