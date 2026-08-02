/**
 * Where the margin's grounding actually comes from.
 *
 * This is the composition layer: it reads the app's current data sources and
 * hands `context.ts` a list of grounding records. It is deliberately the only
 * file in `lib/ai/` that knows which store the data lives in, so that when the
 * Supabase read layer lands, one file changes and nothing else does.
 *
 * Today those sources are the `lib/fixtures/` records — the same ones the
 * `/today` spread renders — plus `docs/10-activity-library/library.json`,
 * which is real content and is read from disk rather than restated. The
 * fixtures are the app's current truth, not a placeholder invented here: the
 * database read layer is on another branch and this feature does not own it.
 *
 * `lib/fixtures/vault.ts` is not imported. Not filtered out, not read and
 * discarded — never imported at all, so there is no line in this file where
 * somebody could later decide to include "just the captions".
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { BOOK_ENTRIES, DATE_PAGE_DAYS, SHARED_DAYS } from "@/lib/fixtures/book";
import { DATE_TURNS } from "@/lib/fixtures/dates";
import { MEMBERS } from "@/lib/fixtures/members";
import { PHOTOS } from "@/lib/fixtures/photos";

import { parseActivityLibrary, selectActivities } from "./activity-library";
import {
  clockGrounding,
  groundingFromActivities,
  groundingFromBookEntries,
  groundingFromDateTurns,
  groundingFromPhotos,
} from "./context";

import type { BookEntry, IsoDate, Photo } from "@/lib/types";
import type { WindowId } from "@/lib/shared-day";
import type { ActivityLibrary } from "./activity-library";
import type { Grounding, MarginSituation, SharedDayGrounding } from "./types";

/* ------------------------------------------------------------------ *
 * The activity library, from disk
 * ------------------------------------------------------------------ */

const LIBRARY_RELATIVE_PATH = join(
  "docs",
  "10-activity-library",
  "library.json",
);

/**
 * Walk up from the working directory looking for the library.
 *
 * The file lives at the repository root and the app runs from `apps/web`, but
 * tests, scripts and the eval runner all start from somewhere else. Walking up
 * is four lines and removes an entire class of "works on my machine" from a
 * path that would otherwise be relative to whoever called first.
 */
function findLibraryFile(from: string = process.cwd()): string | null {
  let dir = resolve(from);
  for (;;) {
    const candidate = join(dir, LIBRARY_RELATIVE_PATH);
    try {
      readFileSync(candidate, "utf8");
      return candidate;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  }
}

let cachedLibrary: ActivityLibrary | null = null;

/**
 * The 98 records, parsed once.
 *
 * Returns `null` when the file cannot be found. That is a real outcome rather
 * than an error to throw: the activity library is optional grounding — the
 * margin's core job is their own words — and taking the whole feature down
 * because a content file moved would be the wrong trade. The absence is
 * logged as a structured line so it is visible rather than silent.
 */
export function activityLibrary(): ActivityLibrary | null {
  if (cachedLibrary !== null) return cachedLibrary;

  const path = findLibraryFile();
  if (path === null) {
    console.log(
      JSON.stringify({
        event: "margin_library_missing",
        feature: "margin",
        looked_for: LIBRARY_RELATIVE_PATH,
      }),
    );
    return null;
  }

  cachedLibrary = parseActivityLibrary(
    JSON.parse(readFileSync(path, "utf8")) as unknown,
  );
  return cachedLibrary;
}

/* ------------------------------------------------------------------ *
 * Their words
 * ------------------------------------------------------------------ */

/** Newest last, so truncation from the front drops the oldest. */
function byDayAscending<T extends { sharedDay: IsoDate }>(
  items: readonly T[],
): readonly T[] {
  return [...items].sort((a, b) => a.sharedDay.localeCompare(b.sharedDay));
}

/**
 * The shared day a book page files under.
 *
 * A photo page takes the day of its photo; a date page takes the day recorded
 * in `DATE_PAGE_DAYS`. A page whose day cannot be resolved is dropped rather
 * than given a guessed date — HL-8 says every claim about their history
 * carries the day it was written, and a page with an invented date is exactly
 * the confabulation that rule exists to stop.
 */
function bookEntryDay(entry: BookEntry, photos: readonly Photo[]): IsoDate {
  if ("photoId" in entry && entry.photoId !== undefined) {
    return photos.find((p) => p.id === entry.photoId)?.sharedDay ?? "";
  }
  if ("dateId" in entry && entry.dateId !== undefined) {
    return DATE_PAGE_DAYS[entry.dateId] ?? "";
  }
  return "";
}

/**
 * Completion facts, with no arithmetic on them.
 *
 * A shared day is complete or it is not. There is no count here, no run, no
 * total and no "since" — D2 and D3 put the whole arithmetic-of-separation
 * register out of the product, and a prompt that hands the model a tally is a
 * prompt that will get one back.
 */
function sharedDayGrounding(): readonly SharedDayGrounding[] {
  return SHARED_DAYS.filter((day) => day.bothPosted).map((day) => ({
    kind: "shared-day",
    sharedDay: day.date,
    provenance: `the book, ${day.date}`,
    text: `Eva and Adam both posted on ${day.date}.`,
  }));
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

export interface GroundingOptions {
  /** How many of their own writings to include. Newest kept. */
  writtenLimit?: number;
  /** How many activity records to include, if any window fits. */
  activityLimit?: number;
  /** The window to filter activities by. Defaults to the situation's. */
  window?: WindowId | null;
}

/**
 * Everything the margin is permitted to know for one turn.
 *
 * Clock first and never dropped; then their words, newest kept; then the
 * library. The order matches the order `renderPrompt` writes them in, so that
 * what the budget trims is what the model would have seen last.
 */
export function groundingFor(
  situation: MarginSituation,
  options: GroundingOptions = {},
): readonly Grounding[] {
  const { writtenLimit = 24, activityLimit = 3, window = null } = options;

  const photos = Object.values(PHOTOS);
  const roster = MEMBERS;

  const captions = groundingFromPhotos(photos, roster);
  const pages = groundingFromBookEntries(BOOK_ENTRIES, (entry) =>
    bookEntryDay(entry, photos),
  ).filter((page) => page.sharedDay !== "");
  const turns = groundingFromDateTurns(
    Object.values(DATE_TURNS).flat(),
    // A turn files under the day the session's page files under when there is
    // one; otherwise under the author's own local date at the moment they
    // wrote it, which is the same rule the rest of the product uses.
    (turn) => DATE_PAGE_DAYS[turn.dateId] ?? turn.createdAt.slice(0, 10),
    roster,
  );

  const written = byDayAscending([
    ...captions,
    ...pages,
    ...turns,
    ...sharedDayGrounding(),
  ]).slice(-writtenLimit);

  const library = activityLibrary();
  const activities =
    library === null || activityLimit <= 0
      ? []
      : groundingFromActivities(
          selectActivities(library, { window, limit: activityLimit }),
        );

  return [...clockGrounding(situation), ...written, ...activities];
}
