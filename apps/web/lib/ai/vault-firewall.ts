/**
 * The vault boundary. HL-4 of `docs/04-features/AI-PARTNER-SPEC.md`.
 *
 * `vault_items` content can never enter a prompt. Not the captions, not the
 * ids, not the storage paths, not the count, not the fact that the vault holds
 * anything at all. This is a security gate and it is not waivable by a prompt
 * change or a config flag.
 *
 * There are three layers here and they are independent on purpose.
 *
 *   1. ALLOWLIST. Grounding is a discriminated union keyed on `kind`, and no
 *      variant of it can hold a vault item. A vault item cannot be represented
 *      in the type the assembler accepts.
 *
 *   2. STRUCTURAL TRIPWIRE. `VaultItem` and `Photo` are nearly the same shape
 *      — same author field, same shared day, same caption, same checksum. The
 *      difference is that a photo has a `kind` and a thumbnail path and a
 *      vault item deliberately has neither. That near-identity is the realistic
 *      accident: somebody passes the wrong array into a function whose
 *      parameter is `readonly Photo[]`, TypeScript is satisfied because of a
 *      cast three files away, and intimate captions go out over the wire.
 *      `assertVaultFree` recognises the shape and throws. A type cast cannot
 *      get past a runtime shape check.
 *
 *   3. TEXT TRIPWIRE. Every assembled prompt is scanned for the storage path
 *      vault bytes live under, and for the table name, immediately before the
 *      call. This is the last line: it catches a leak that arrived through a
 *      free-text field nobody thought of.
 *
 * All three throw. None of them redacts, sanitises, or drops a field and
 * carries on — a partial send is still a send, and a silent redaction teaches
 * the next developer that passing vault data here is survivable. The only
 * correct behaviour on a boundary violation is to not make the call.
 *
 * EVERY SCHEMA FACT IN THIS FILE IS IMPORTED, NOT RESTATED. This file once
 * carried its own `"vault/"` literal while the schema wrote `v/{id}/...`, so
 * layer 3 and half of layer 2 could not fire on a real vault item and nothing
 * said so — the boundary held only because the shape check happened to be
 * independent of the path check. A silently inert defence-in-depth layer is
 * worse than an absent one: it reads as covered. Constants now come from
 * `lib/schema.ts` and a drift test compares that file to the migrations.
 */

import {
  ALL_RELATIONS,
  RELATIONS,
  VAULT_OBJECT_PATH_ANYWHERE,
  VAULT_PATH_PREFIX,
  isVaultStoragePath,
} from "@/lib/schema";

import type { RelationName } from "@/lib/schema";

/**
 * Thrown when vault content reaches, or is about to reach, a prompt.
 *
 * Carries the reason and never the offending value. A boundary error ends up
 * in a log, and the whole point of the boundary is that this content does not
 * go into logs either.
 */
export class VaultBoundaryError extends Error {
  override readonly name = "VaultBoundaryError";

  constructor(reason: string) {
    super(
      `Vault boundary violation: ${reason}. Nothing was sent. ` +
        `Echo has no access to the pocket by construction — see HL-4 in ` +
        `docs/04-features/AI-PARTNER-SPEC.md. If a feature genuinely needs this, ` +
        `it needs a founder decision and a new spec, not a change here.`,
    );
  }
}

/**
 * The storage prefix vault bytes live under: `v/`, from `lib/schema.ts`.
 *
 * Re-exported under the firewall's own name so the error messages below can
 * say what they matched, and imported rather than written out so it cannot
 * drift from the migration again.
 */
const VAULT_STORAGE_PREFIX = VAULT_PATH_PREFIX;

/** The table name, so a query string or a column reference is caught too. */
const VAULT_TABLE = RELATIONS.vaultItems;

/**
 * Field names that exist on `VaultItem` and are meaningful to the check.
 *
 * `storagePathThumb` and `kind` are the two fields a `Photo` has and a
 * `VaultItem` deliberately does not — the absence of both, next to the
 * presence of the media fields, is the signature.
 */
function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * Whether a value has the shape of a vault item.
 *
 * Deliberately generous. A false positive here costs a developer one confused
 * minute and a clear error message; a false negative costs this couple their
 * privacy. Anything media-shaped that is missing the two fields a photo always
 * carries is treated as vault content, as is anything whose storage path sits
 * under the vault root, whatever else it claims to be.
 */
export function isVaultShaped(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  const display = record["storagePathDisplay"];
  if (typeof display === "string" && isVaultStoragePath(display)) {
    return true;
  }

  // A media record — author, a shared day, a display path — that carries
  // neither `kind` nor a thumbnail path is a `VaultItem`. A `Photo` always has
  // both; the vault type omits the thumbnail on purpose, because thumbnails
  // leak (see the comment on `VaultItem` in lib/types.ts).
  const looksLikeMedia =
    hasOwn(record, "storagePathDisplay") &&
    hasOwn(record, "authorMemberId") &&
    hasOwn(record, "sharedDay");

  return looksLikeMedia && !hasOwn(record, "kind") && !hasOwn(record, "storagePathThumb");
}

/**
 * Refuse to proceed if any of `records` is vault-shaped.
 *
 * Called at the one choke point where records become prompt text. Iterates
 * everything rather than short-circuiting the scan itself, so the error names
 * the position — one bad element in a list of forty is otherwise a long
 * afternoon.
 */
export function assertVaultFree(records: readonly unknown[]): void {
  for (const [index, record] of records.entries()) {
    if (isVaultShaped(record)) {
      throw new VaultBoundaryError(
        `grounding record at index ${index} has the shape of a vault item ` +
          `(no 'kind', no thumbnail path, or a storage path under '${VAULT_STORAGE_PREFIX}')`,
      );
    }
  }
}

/**
 * Refuse to proceed if assembled prompt text mentions the vault.
 *
 * The last check before the wire, and the only one that operates on the exact
 * bytes that would be sent. It looks for the storage root and the table name,
 * both of which are structural identifiers rather than anybody's content — so
 * this function never has to be handed a caption in order to protect one.
 */
export function assertPromptVaultFree(text: string): void {
  const haystack = text.toLowerCase();

  if (VAULT_OBJECT_PATH_ANYWHERE.test(text)) {
    throw new VaultBoundaryError(
      `the assembled prompt contains a '${VAULT_STORAGE_PREFIX}' storage path`,
    );
  }
  if (haystack.includes(VAULT_TABLE)) {
    throw new VaultBoundaryError(
      `the assembled prompt references the '${VAULT_TABLE}' table`,
    );
  }
}

/**
 * Relations Echo's grounding may ever be read from.
 *
 * An allowlist rather than a denylist, because a denylist is only correct
 * until the next migration adds a table nobody remembered to deny. Exported so
 * the data layer and its test read the same list, and so adding a relation is
 * a visible diff in a file that says why.
 *
 * Every entry is a `RELATIONS` member rather than a string literal. The
 * original list contained `"shared_days"`, which is not a relation — the view
 * is `v_shared_days` (migration 09). That entry was two faults at once: a
 * legitimate read from the view would have been refused, and a dead string sat
 * on a security allowlist looking like coverage. `RelationName` makes the
 * misspelling a type error, and the drift test makes an entry that no longer
 * exists in the schema a test failure.
 */
export const GROUNDING_TABLE_ALLOWLIST: readonly RelationName[] = [
  RELATIONS.members,
  RELATIONS.photos,
  RELATIONS.bookEntries,
  RELATIONS.dates,
  RELATIONS.dateTurns,
  RELATIONS.sharedDays,
  RELATIONS.activityState,
];

/**
 * Refuse to read from a table that is not on the allowlist.
 *
 * @throws {VaultBoundaryError} for `vault_items` specifically, and for
 * anything else not on the list — the boundary is "only these", not "not that
 * one".
 */
export function assertGroundingTable(table: string): void {
  if (!(GROUNDING_TABLE_ALLOWLIST as readonly string[]).includes(table)) {
    throw new VaultBoundaryError(
      `'${table}' is not on the grounding allowlist ` +
        `(${GROUNDING_TABLE_ALLOWLIST.join(", ")})`,
    );
  }
}

/**
 * The allowlist, checked against the schema at module scope.
 *
 * Not a test — a load-time assertion, because an allowlist naming a relation
 * that does not exist is the failure this file just had, and it should not be
 * possible to import the firewall in that state. Costs one array scan of
 * thirteen strings, once.
 */
for (const table of GROUNDING_TABLE_ALLOWLIST) {
  if (!ALL_RELATIONS.includes(table)) {
    throw new VaultBoundaryError(
      `'${table}' is on the grounding allowlist but is not a relation in ` +
        `lib/schema.ts — the allowlist and the schema have drifted`,
    );
  }
}
