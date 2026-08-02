/**
 * The TypeScript mirror of the things the SQL owns.
 *
 * Storage path grammar and relation names live here and nowhere else.
 *
 * WHY THIS FILE EXISTS. `lib/ai/vault-firewall.ts` shipped with
 * `VAULT_STORAGE_PREFIX = "vault/"` while the schema had always written vault
 * bytes to `v/{id}/display.jpg` (migration 04, and migration 11's prefix
 * guard, which rejects anything outside `p/<uuid>/` or `v/<uuid>/`). Neither
 * side was wrong about its own file. They were wrong about each other, because
 * each spelled the path out independently and nothing compared the two. The
 * result was a defence-in-depth layer that could never fire — the worst kind of
 * bug, because it reports success by staying quiet.
 *
 * So: one declaration, imported by everything, and a drift test
 * (`lib/__tests__/schema-drift.test.ts`) that reads the migration files off
 * disk and fails if this file and the SQL stop agreeing. The constant is not
 * the fix. The constant plus the test is the fix; a shared constant that is
 * still hand-copied from the SQL is the same bug with one fewer copy.
 *
 * Nothing here is a preference. Every value in this file is a restatement of
 * something a migration already enforces, and the only correct way to change
 * one is to change the migration and let the drift test tell you what else
 * moved.
 */

/* ------------------------------------------------------------------ *
 * The media bucket
 * ------------------------------------------------------------------ */

/**
 * The single private storage bucket.
 *
 * One bucket, not two — migration 11 argues it at length: two buckets means
 * two `public` booleans and the one that matters is the one nobody re-reads.
 */
export const MEDIA_BUCKET = "media" as const;

/** Ordinary content — a row in `public.photos`. */
export const PHOTO_PATH_PREFIX = "p/" as const;

/**
 * Vault content — a row in `public.vault_items`.
 *
 * `v/` is not a naming convention. The service worker decides what it may
 * cache inside `fetch`, from the request URL, before any response exists; a
 * path prefix is the only property of a private object knowable at that
 * instant. The prefix IS the exclusion mechanism, which is why migration 11
 * enforces it with a trigger rather than trusting it.
 */
export const VAULT_PATH_PREFIX = "v/" as const;

/**
 * The uuid segment, as the SQL trigger spells it.
 *
 * Lower-case hex in the source, matched case-insensitively — a uuid rendered
 * in upper case is the same uuid, and migration 11 uses `!~*` for exactly that
 * reason. Kept as a string so the composed patterns below and the drift test
 * can both read it.
 */
export const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Every legal object name in `media`.
 *
 * Character-for-character the trigger's regex in migration 11. The drift test
 * extracts that literal from the SQL and compares it to this one.
 */
export const MEDIA_OBJECT_PATH = new RegExp(
  `^(p|v)/${UUID_PATTERN}/.+$`,
  "i",
);

/** A vault object name, anchored. For a field that is known to be a path. */
export const VAULT_OBJECT_PATH = new RegExp(
  `^${VAULT_PATH_PREFIX}${UUID_PATTERN}/.+$`,
  "i",
);

/**
 * A vault object name appearing anywhere inside free text.
 *
 * Used by the prompt scan, where the haystack is prose rather than a path.
 * The uuid is required: scanning assembled prose for a bare `v/` would fire on
 * "TV/radio" and on half the ways a person writes a fraction, and a boundary
 * that cries wolf is a boundary somebody eventually deletes.
 *
 * The leading `(^|[^0-9a-z])` stops `.../rev/<uuid>/...` from matching while
 * still catching a path that follows a space, a slash, a quote or a bracket.
 */
export const VAULT_OBJECT_PATH_ANYWHERE = new RegExp(
  `(^|[^0-9a-z])${VAULT_PATH_PREFIX}${UUID_PATTERN}/`,
  "i",
);

/** `v/{id}/display.jpg` — the only derivative a vault item ever has. */
export function vaultDisplayPath(vaultItemId: string): string {
  return `${VAULT_PATH_PREFIX}${vaultItemId}/display.jpg`;
}

export function photoDisplayPath(photoId: string): string {
  return `${PHOTO_PATH_PREFIX}${photoId}/display.jpg`;
}

export function photoThumbPath(photoId: string): string {
  return `${PHOTO_PATH_PREFIX}${photoId}/thumb.jpg`;
}

export function photoOriginalPath(photoId: string): string {
  return `${PHOTO_PATH_PREFIX}${photoId}/original.jpg`;
}

/**
 * Whether a storage path points into the vault.
 *
 * Deliberately looser than `VAULT_OBJECT_PATH`: a prefix match, not a full
 * grammar match. A malformed path under `v/` is still a path under `v/`, and
 * on this boundary the generous answer is the correct one — a false positive
 * costs a developer a confused minute and a clear error, a false negative
 * costs this couple their privacy.
 */
export function isVaultStoragePath(value: string): boolean {
  return value.trimStart().toLowerCase().startsWith(VAULT_PATH_PREFIX);
}

/* ------------------------------------------------------------------ *
 * Relations
 * ------------------------------------------------------------------ */

/**
 * Every relation in `public`, by the name PostgreSQL knows it by.
 *
 * The two views are prefixed `v_` in the schema and that prefix is part of
 * their name. `shared_days` is not a relation and never was; the firewall's
 * grounding allowlist named it anyway, which would have rejected a legitimate
 * read from `v_shared_days` while carrying a dead string that matched nothing.
 * Same failure as the storage prefix, one file over.
 */
export const RELATIONS = {
  members: "members",
  photos: "photos",
  vaultItems: "vault_items",
  dates: "dates",
  dateTurns: "date_turns",
  bookEntries: "book_entries",
  activityState: "activity_state",
  activityLog: "activity_log",
  authAttempts: "auth_attempts",
  purgeAudit: "purge_audit",
  appSettings: "app_settings",
  /** View, migration 09. */
  sharedDays: "v_shared_days",
  /** View, migration 09. */
  daysTogether: "v_days_together",
} as const;

export type RelationName = (typeof RELATIONS)[keyof typeof RELATIONS];

/** Every relation name, for membership checks and for the drift test. */
export const ALL_RELATIONS: readonly RelationName[] = Object.values(RELATIONS);
