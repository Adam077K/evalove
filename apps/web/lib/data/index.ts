/**
 * The data layer's front door.
 *
 * Route handlers import from here and from nowhere deeper. `photoDeps()` and
 * `bookDeps()` are the only places the production gateway is wired to the
 * production clock, which keeps every rule in `photos.ts` reachable from a
 * test that supplies its own.
 */

import { supabaseGateway } from "./supabase-gateway";
import type { BookDeps } from "./book";
import type { PhotoDeps } from "./photos";

export { DataError, isDataError, statusOf } from "./errors";
export type { DataErrorKind } from "./errors";

export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_UPLOAD_URLS_PER_REQUEST,
  PURGE_LIMIT_PER_DAY,
  UPLOAD_URL_TTL_MS,
  commitPhoto,
  issueUploadSlots,
  listPhotos,
  purgePhoto,
  readPhotoBytes,
  softDeletePhoto,
  todaySnapshot,
} from "./photos";
export type {
  CommitPhotoInput,
  CommitPhotoResult,
  ListPhotosInput,
  ListPhotosResult,
  PhotoBytes,
  PhotoDeps,
  PhotoVariant,
  PurgeRequest,
  PurgeResult,
  SignedUpload,
  TodaySnapshot,
  UploadSlot,
  UploadTargets,
} from "./photos";

export { bookManifest, patchBookEntry } from "./book";
export type { BookDeps, PatchBookEntryInput } from "./book";

export type { DataGateway } from "./gateway";

/** Production wiring: the Supabase gateway, the real clock, real uuids. */
export function photoDeps(): PhotoDeps {
  return {
    gateway: supabaseGateway(),
    now: () => new Date(),
    newId: () => globalThis.crypto.randomUUID(),
  };
}

export function bookDeps(): BookDeps {
  return { gateway: supabaseGateway() };
}
