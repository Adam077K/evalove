/**
 * The SQL and the TypeScript, compared.
 *
 * `lib/schema.ts` is a hand-written mirror of things the migrations own. A
 * mirror is only worth having if something notices when it stops reflecting,
 * and nothing did: the vault firewall carried `"vault/"` for the life of the
 * feature while every migration wrote `v/`, and no test, type, or lint rule
 * had any reason to object. The firewall's path check simply never fired.
 *
 * So this file does the one thing that would have caught it — it reads the
 * migration files off disk and compares the strings. It is deliberately
 * textual and deliberately brittle. If a migration is edited, this test should
 * fail, a human should look at both sides, and `lib/schema.ts` should be
 * updated on purpose. That is the whole mechanism.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ALL_RELATIONS,
  MEDIA_BUCKET,
  MEDIA_OBJECT_PATH,
  PHOTO_PATH_PREFIX,
  RELATIONS,
  VAULT_OBJECT_PATH,
  VAULT_PATH_PREFIX,
  photoDisplayPath,
  photoThumbPath,
  vaultDisplayPath,
} from "@/lib/schema";
import {
  GROUNDING_TABLE_ALLOWLIST,
  assertGroundingTable,
  assertPromptVaultFree,
  isVaultShaped,
} from "@/lib/ai/vault-firewall";
import { VAULT_ITEMS } from "@/lib/fixtures/vault";
import { PHOTOS } from "@/lib/fixtures/photos";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "supabase",
  "migrations",
);

function migrationNamed(fragment: string): string {
  const file = readdirSync(MIGRATIONS_DIR).find(
    (name) => name.endsWith(".sql") && name.includes(fragment),
  );
  if (file === undefined) {
    throw new Error(
      `no migration matching '${fragment}' in ${MIGRATIONS_DIR} — a migration ` +
        `was renamed and this test needs to be pointed at the new name`,
    );
  }
  return readFileSync(join(MIGRATIONS_DIR, file), "utf8");
}

function allForwardMigrations(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(join(MIGRATIONS_DIR, name), "utf8"))
    .join("\n");
}

/* ------------------------------------------------------------------ *
 * The storage path grammar
 * ------------------------------------------------------------------ */

describe("storage paths match the migrations", () => {
  it("MEDIA_OBJECT_PATH is character-for-character the trigger's regex", () => {
    const sql = migrationNamed("storage_media_bucket");

    // `if new.name !~* '<pattern>'` — the guard in migration 11, which is the
    // only authority on what a legal object name is.
    const match = /!~\*\s*'([^']+)'/.exec(sql);
    expect(
      match,
      "migration 11 no longer contains a `!~* '<regex>'` prefix guard",
    ).not.toBeNull();

    // `RegExp.source` escapes forward slashes because a literal would have to;
    // POSIX has no delimiter to escape. That is the only permitted difference.
    expect(match?.[1]).toBe(MEDIA_OBJECT_PATH.source.replaceAll("\\/", "/"));
  });

  it("the prefix guard is case-insensitive on both sides", () => {
    const sql = migrationNamed("storage_media_bucket");
    // `!~*` rather than `!~`: an upper-case uuid is the same uuid.
    expect(sql).toContain("!~*");
    expect(MEDIA_OBJECT_PATH.flags).toContain("i");
  });

  it("vault bytes live under the prefix vault_items documents", () => {
    const sql = migrationNamed("vault_items");

    // `storage_path_display text not null,   -- v/{id}/display.jpg — ...`
    const match = /storage_path_display[^\n]*--\s*(\S+)/.exec(sql);
    expect(
      match,
      "vault_items no longer documents the shape of storage_path_display",
    ).not.toBeNull();

    const documented = match?.[1] ?? "";
    expect(documented.startsWith(VAULT_PATH_PREFIX)).toBe(true);
    expect(documented).toBe(
      vaultDisplayPath("{id}").replace(`${VAULT_PATH_PREFIX}{id}`, "v/{id}"),
    );
  });

  it("ordinary bytes live under p/ and vault bytes under v/", () => {
    const sql = migrationNamed("storage_media_bucket");
    expect(sql).toContain(`${PHOTO_PATH_PREFIX}{photoId}/display.jpg`);
    expect(sql).toContain(`${VAULT_PATH_PREFIX}{vaultItemId}/display.jpg`);
  });

  it("the bucket is the one named in the migration", () => {
    const sql = migrationNamed("storage_media_bucket");
    expect(sql).toContain(`values ('${MEDIA_BUCKET}', '${MEDIA_BUCKET}', false`);
  });

  it("every path this codebase builds would survive the prefix guard", () => {
    const id = "4a9e77c2-5d10-4f6b-8c21-000000000001";
    for (const path of [
      vaultDisplayPath(id),
      photoDisplayPath(id),
      photoThumbPath(id),
    ]) {
      expect(MEDIA_OBJECT_PATH.test(path), path).toBe(true);
    }
  });

  it("rejects what the guard rejects", () => {
    for (const path of [
      "vault/display/v1.jpg", // the literal the firewall used to look for
      "photos/display/x.jpg",
      "p/thumbs/x.jpg", // a path that names no row
      "p/.emptyFolderPlaceholder",
      "v/not-a-uuid/display.jpg",
    ]) {
      expect(MEDIA_OBJECT_PATH.test(path), path).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

describe("fixtures obey the schema they pretend to come from", () => {
  it("every vault fixture is a legal vault object name", () => {
    expect(VAULT_ITEMS.length).toBeGreaterThan(0);
    for (const item of VAULT_ITEMS) {
      expect(VAULT_OBJECT_PATH.test(item.storagePathDisplay)).toBe(true);
      expect(item.storagePathDisplay).toBe(vaultDisplayPath(item.id));
    }
  });

  it("every photo fixture is a legal ordinary object name", () => {
    const photos = Object.values(PHOTOS);
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(MEDIA_OBJECT_PATH.test(photo.storagePathDisplay)).toBe(true);
      expect(photo.storagePathDisplay.startsWith(PHOTO_PATH_PREFIX)).toBe(true);
      expect(photo.storagePathThumb.startsWith(PHOTO_PATH_PREFIX)).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ *
 * The bug this file exists because of
 * ------------------------------------------------------------------ */

describe("the firewall's path check fires on a real vault item", () => {
  /**
   * The regression proper.
   *
   * The structural check and the path check are supposed to be independent
   * layers. This candidate defeats the structural one on purpose — it carries
   * `kind` and `storagePathThumb`, so it looks exactly like a `Photo` — and
   * leaves only the path to catch it. Under the old `"vault/"` prefix nothing
   * did, and the suite stayed green because a different layer was doing all
   * the work.
   */
  it("catches vault-pathed content that is otherwise photo-shaped", () => {
    const disguised = {
      kind: "daily",
      authorMemberId: "adam",
      sharedDay: "2026-07-30",
      storagePathDisplay: vaultDisplayPath(
        "4a9e77c2-5d10-4f6b-8c21-000000000002",
      ),
      storagePathThumb: photoThumbPath("4a9e77c2-5d10-4f6b-8c21-000000000002"),
    };

    expect(isVaultShaped(disguised)).toBe(true);
  });

  it("catches every real vault fixture", () => {
    for (const item of VAULT_ITEMS) {
      expect(isVaultShaped(item)).toBe(true);
    }
  });

  it("does not fire on a real photo fixture", () => {
    for (const photo of Object.values(PHOTOS)) {
      expect(isVaultShaped(photo)).toBe(false);
    }
  });

  it("the prompt scan catches a real vault path in free text", () => {
    const leaked = `Adam's caption: see ${vaultDisplayPath(
      "4a9e77c2-5d10-4f6b-8c21-000000000003",
    )} for the rest`;
    expect(() => {
      assertPromptVaultFree(leaked);
    }).toThrow(/storage path/);
  });

  it("the prompt scan is not so loose that ordinary prose trips it", () => {
    // `v/` alone is two of the commonest characters in English next to each
    // other. A scan that fired on these would be deleted within a month.
    for (const innocent of [
      "They watched something on TV/radio that evening.",
      "Eva wrote about the 24/7 shop on the corner.",
      "The path p/4a9e77c2-5d10-4f6b-8c21-000000000001/display.jpg is a photo.",
      "Adam said the recipe called for 1/2 a lemon.",
    ]) {
      expect(() => {
        assertPromptVaultFree(innocent);
      }, innocent).not.toThrow();
    }
  });
});

/* ------------------------------------------------------------------ *
 * Relations
 * ------------------------------------------------------------------ */

describe("relation names match the migrations", () => {
  it("every relation the migrations create is in RELATIONS", () => {
    const sql = allForwardMigrations();

    const created = new Set<string>();
    for (const m of sql.matchAll(
      /create table if not exists public\.([a-z_]+)/g,
    )) {
      if (m[1] !== undefined) created.add(m[1]);
    }
    for (const m of sql.matchAll(/create or replace view public\.([a-z_]+)/g)) {
      if (m[1] !== undefined) created.add(m[1]);
    }

    expect(created.size).toBeGreaterThan(0);
    expect([...created].sort()).toEqual([...ALL_RELATIONS].sort());
  });

  it("the two views keep their v_ prefix", () => {
    expect(RELATIONS.sharedDays).toBe("v_shared_days");
    expect(RELATIONS.daysTogether).toBe("v_days_together");
  });

  it("every entry on the grounding allowlist is a real relation", () => {
    for (const table of GROUNDING_TABLE_ALLOWLIST) {
      expect(ALL_RELATIONS, table).toContain(table);
    }
  });

  it("the allowlist accepts the shared-days view by its real name", () => {
    expect(() => {
      assertGroundingTable(RELATIONS.sharedDays);
    }).not.toThrow();
    // The name the allowlist used to carry, which matched nothing.
    expect(() => {
      assertGroundingTable("shared_days");
    }).toThrow(/not on the grounding allowlist/);
  });

  it("the vault is not on the allowlist under any name", () => {
    for (const name of [RELATIONS.vaultItems, "public.vault_items", "vault"]) {
      expect(() => {
        assertGroundingTable(name);
      }, name).toThrow(/not on the grounding allowlist/);
    }
  });
});
