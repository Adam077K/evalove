/**
 * The fixture member ids and the database's member ids are THE SAME STRINGS.
 *
 * THE BUG THIS EXISTS TO STOP COMING BACK. `lib/fixtures/members.ts` used to
 * carry `1e0a5c1e-…` and `2ad0f4b2-…` while `supabase/seed.sql` inserted
 * `1111…` and `2222…`. Two invented uuids for the same two people, and nothing
 * in the type system had a word to say about it: `Uuid` is a string, both sets
 * are well-formed uuids, and every screen reading the fixture record looked
 * exactly right. `useViewer().identity.memberId` was, for months, a member id
 * that had no row behind it — harmless only for as long as nothing wrote with
 * it, and the moment an authenticated identity reached a write it would have
 * attributed rows to a member the database has never heard of.
 *
 * WHY IT IS TESTED AGAINST seed.sql AND NOT AGAINST A CONSTANT. A constant
 * copied into this file would be a third invented pair, and the test would
 * then pin the fixture to the copy rather than to the database. So the uuids
 * are READ OUT OF `supabase/seed.sql` — the file that actually creates the
 * rows — and a change to either side breaks this.
 *
 * WHAT THIS DOES NOT CLAIM. That the deployed database matches seed.sql. Only
 * the founder can confirm that, and if the two ever diverge this test will
 * happily pass while the app attributes rows to nobody. It pins the repo to
 * itself, which is the most a test with no database can honestly do.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ADAM, EVA, MEMBERS } from "@/lib/fixtures/members";

const SEED_SQL = path.join(__dirname, "..", "..", "..", "supabase", "seed.sql");

/**
 * The `(uuid, slug)` pairs inserted into `public.members`.
 *
 * Matched off the insert's value rows rather than by counting uuids in the
 * file: `seed.sql` contains uuids for photos and days too, and a positional
 * match would silently start reading the wrong ones the day a row is added
 * above this one.
 */
function seededMemberIds(): Record<string, string> {
  const sql = fs.readFileSync(SEED_SQL, "utf8");
  const pattern =
    /\(\s*'([0-9a-f-]{36})'\s*,\s*'(eva|adam)'\s*,\s*'(?:Eva|Adam)'/gi;

  const found: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sql)) !== null) {
    found[match[2]!.toLowerCase()] = match[1]!;
  }
  return found;
}

const seeded = seededMemberIds();

describe("fixture member ids agree with the database", () => {
  it("found both rows in seed.sql (canary — the regex still matches)", () => {
    // Without this, a seed.sql reformat that breaks the pattern turns every
    // assertion below into `undefined === undefined` and the whole file passes
    // while checking nothing.
    expect(Object.keys(seeded).sort()).toEqual(["adam", "eva"]);
    expect(seeded.eva).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("Eva's fixture id is Eva's seeded id", () => {
    expect(EVA.id).toBe(seeded.eva);
  });

  it("Adam's fixture id is Adam's seeded id", () => {
    expect(ADAM.id).toBe(seeded.adam);
  });

  it("they are not the same id", () => {
    // A guard on the guard: two names resolving to one id would satisfy both
    // assertions above if seed.sql itself ever regressed that way.
    expect(EVA.id).not.toBe(ADAM.id);
  });

  it("MEMBERS is Eva then Adam, and carries the same ids", () => {
    // Eva before Adam is product law, held by this array; the ordering is
    // asserted here because `lib/fixtures/members.ts` is where it is decided
    // and several components inherit it by index.
    expect(MEMBERS.map((m) => m.slug)).toEqual(["eva", "adam"]);
    expect(MEMBERS.map((m) => m.id)).toEqual([seeded.eva, seeded.adam]);
  });
});
