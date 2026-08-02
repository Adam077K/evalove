/**
 * The book: the manifest, and editing one page.
 *
 * A book entry points at a photo or at a finished date, never both and never
 * neither. The database enforces that with a check constraint, `lib/types.ts`
 * enforces it with a discriminated union, and `toBookEntry` is the seam where
 * a row becomes one arm of that union or refuses to become anything.
 *
 * There is no foreign key from `book_entries` to `vault_items` and no
 * polymorphic discriminator that could be pointed at one. A vault item cannot
 * be bound into the book — not by policy, but because no column can hold the
 * reference. Nothing in this file needs to check for it.
 */

import type { BookEntry, Uuid } from "@/lib/types";

import { DataError } from "./errors";
import type { BookEntryPatch, DataGateway } from "./gateway";
import { toBookEntry } from "./rows";

export interface BookDeps {
  gateway: DataGateway;
}

/**
 * Every live page, in reading order.
 *
 * Ordered by `position`, which is `numeric` rather than an integer so that a
 * reorder writes exactly one row: to move a page between two others, give it a
 * value halfway between theirs. There is always a numeric between two distinct
 * numerics, so a reorder never has to renumber the book.
 *
 * (`lib/types.ts` describes `position` as "sparse integers, re-spaced on
 * reorder", which is a different and incompatible strategy. The SQL is the
 * source of truth and this module follows it; the comment in types.ts is the
 * side that needs to change. Flagged, not silently reconciled.)
 */
export async function bookManifest(deps: BookDeps): Promise<BookEntry[]> {
  const rows = await deps.gateway.listBookEntries();
  return rows.map(toBookEntry);
}

export interface PatchBookEntryInput {
  position?: number;
  /** `null` clears the caption. Omitted leaves it alone. */
  caption?: string | null;
  /** `null` clears the label. Omitted leaves it alone. */
  dateLabel?: string | null;
}

/**
 * Edit one page.
 *
 * An empty patch is refused rather than treated as a no-op. A PATCH that
 * changes nothing is almost always a client sending the wrong field name, and
 * answering 200 to it means that bug ships.
 */
export async function patchBookEntry(
  deps: BookDeps,
  entryId: Uuid,
  input: PatchBookEntryInput,
): Promise<BookEntry> {
  const patch: BookEntryPatch = {};
  if (input.position !== undefined) patch.position = input.position;
  if (input.caption !== undefined) patch.caption = input.caption;
  if (input.dateLabel !== undefined) patch.date_label = input.dateLabel;

  if (Object.keys(patch).length === 0) {
    throw new DataError("invalid", "patch changes nothing", { entryId });
  }

  const row = await deps.gateway.updateBookEntry(entryId, patch);
  if (row === null) {
    throw new DataError("not_found", "no such book entry", { entryId });
  }
  return toBookEntry(row);
}
