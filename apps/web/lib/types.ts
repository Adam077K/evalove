/**
 * Eva & Adam — shared type contract.
 *
 * This file is the single contract between the design track and the backend
 * track. Both sides import from here. It is APPEND-ONLY: add new members and
 * new types freely, but do not rename or remove an existing one without a
 * co-ordinated change on both tracks.
 *
 * Two vocabulary rules are enforced by CI:
 *
 *   1. Three words from the standard state-machine vocabulary are banned from
 *      this file — the past tense of "to fail", of "to abandon", and of "to
 *      expire" — as a type name, a member name, a string literal value, or a
 *      comment. A date session that ran out of energy is `faded`. An outbox
 *      item that did not go through is `needs_retry`. Nothing here judges us.
 *   2. No field anywhere stores a numeric UTC offset. Time zones are IANA
 *      identifier strings only (`'Europe/Stockholm'`, never `+02:00`, never
 *      `120`). Offsets are a lossy snapshot; IANA ids survive DST and law
 *      changes. `Intl` on the client plus Postgres tzdata on the server cover
 *      every conversion we need, which is why there is no timezone library.
 */

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

/** UUID v4, lowercase, hyphenated. */
export type Uuid = string;

/** Calendar date, ISO 8601 `YYYY-MM-DD`. No time, no zone. */
export type IsoDate = string;

/** Instant, ISO 8601 / RFC 3339 with a `Z` suffix. Always stored in UTC. */
export type IsoDateTime = string;

/**
 * IANA time zone identifier, e.g. `'Europe/Stockholm'`, `'America/New_York'`.
 * Never a numeric offset. See vocabulary rule 2 above.
 */
export type IanaTimeZone = string;

/** Lowercase hex SHA-256 digest, 64 characters. */
export type Sha256Hex = string;

/* ------------------------------------------------------------------ *
 * Members
 * ------------------------------------------------------------------ */

/** There are exactly two people in this product, forever. */
export type MemberSlug = "eva" | "adam";

export interface Member {
  id: Uuid;
  slug: MemberSlug;
  displayName: string;
  homeTimezone: IanaTimeZone;
  createdAt: IsoDateTime;
}

/* ------------------------------------------------------------------ *
 * Photos
 * ------------------------------------------------------------------ */

/** `daily` = the once-a-day shared photo. `book` = a photo bound into the book. */
export type PhotoKind = "daily" | "book";

/**
 * How confident we are about who authored a piece of content.
 *
 * `self_declared` means "whoever was holding the phone tapped a name". It is
 * not proof. `authenticated` means the author was established by the session.
 */
export type AttributionSource = "self_declared" | "authenticated";

/** Where the untouched original bytes currently live, if anywhere. */
export type OriginalLocation = "none" | "supabase" | "r2" | "purged";

/** Rendering intent of the stored derivative. */
export type ColorSpace = "srgb" | "display-p3";

/** Every stored derivative is baseline JPEG. No other output format ships. */
export type ImageMime = "image/jpeg";

export interface Photo {
  id: Uuid;
  /** Client-generated id, stable across retries. The idempotency key. */
  clientUuid: Uuid;
  kind: PhotoKind;
  authorMemberId: Uuid;
  attributionSource: AttributionSource;

  /** The shared calendar day this photo belongs to. */
  sharedDay: IsoDate;
  /** The zone `sharedDay` was resolved in — the authority for the day boundary. */
  sharedDayTz: IanaTimeZone;
  /** What the uploading device claimed its zone was. Advisory only. */
  clientReportedTz?: IanaTimeZone;

  /** Capture time from EXIF, when the file carried one. */
  takenAt?: IsoDateTime;
  caption?: string;

  storagePathDisplay: string;
  storagePathThumb: string;
  storagePathOriginal?: string;
  originalLocation: OriginalLocation;

  width: number;
  height: number;
  bytes: number;
  mime: ImageMime;
  colorSpace: ColorSpace;
  checksumSha256: Sha256Hex;
  /** True once EXIF (including GPS) has been stripped from every derivative. */
  exifStripped: boolean;

  createdAt: IsoDateTime;
  /** Soft delete: hidden from the UI, bytes still present. */
  deletedAt?: IsoDateTime;
  /** A hard-delete of the bytes was asked for at this instant. */
  purgeRequestedAt?: IsoDateTime;
  /** The bytes are gone as of this instant. */
  purgedAt?: IsoDateTime;
}

/* ------------------------------------------------------------------ *
 * Vault
 * ------------------------------------------------------------------ */

/**
 * A vault item deliberately has NO thumbnail path.
 *
 * Thumbnails leak. A grid of tiny previews is still a grid of previews, and a
 * cached thumb can outlive the item it came from. Vault items are opened one
 * at a time, at full display size, behind the passphrase — never pre-rendered.
 * Do not add `storagePathThumb` here.
 */
export interface VaultItem {
  id: Uuid;
  clientUuid: Uuid;
  authorMemberId: Uuid;

  sharedDay: IsoDate;
  sharedDayTz: IanaTimeZone;
  takenAt?: IsoDateTime;
  caption?: string;

  storagePathDisplay: string;

  width: number;
  height: number;
  bytes: number;
  mime: ImageMime;
  checksumSha256: Sha256Hex;
  exifStripped: boolean;

  createdAt: IsoDateTime;
  deletedAt?: IsoDateTime;
  purgeRequestedAt?: IsoDateTime;
  purgedAt?: IsoDateTime;
}

/* ------------------------------------------------------------------ *
 * The book
 * ------------------------------------------------------------------ */

interface BookEntryBase {
  id: Uuid;
  /** Ordering within the book. Sparse integers, re-spaced on reorder. */
  position: number;
  caption?: string;
  /** Human-written label for the spread, e.g. "the night of the storm". */
  dateLabel?: string;
  createdAt: IsoDateTime;
  deletedAt?: IsoDateTime;
}

/** A book entry that points at a photo. Carries no `dateId`. */
export interface BookEntryPhoto extends BookEntryBase {
  photoId: Uuid;
  dateId?: never;
}

/** A book entry that points at a date session. Carries no `photoId`. */
export interface BookEntryDate extends BookEntryBase {
  dateId: Uuid;
  photoId?: never;
}

/**
 * Exactly one of `photoId` / `dateId` is set — never both, never neither.
 *
 * Modelled as a discriminated union rather than two optional fields so the
 * compiler rejects the impossible states instead of leaving them to a runtime
 * check nobody writes. Narrow with `'photoId' in entry`.
 */
export type BookEntry = BookEntryPhoto | BookEntryDate;

/* ------------------------------------------------------------------ *
 * Shared days
 * ------------------------------------------------------------------ */

export interface SharedDay {
  date: IsoDate;
  evaPosted: boolean;
  adamPosted: boolean;
  /** Derived: `evaPosted && adamPosted`. The day "closes" when this is true. */
  bothPosted: boolean;
  photoCount: number;
  firstPostAt?: IsoDateTime;
  lastPostAt?: IsoDateTime;
}

/** The headline number: how many days there have been, together. */
export interface DaysTogether {
  count: number;
}

/* ------------------------------------------------------------------ *
 * Dates (the activity kind, not the calendar kind)
 * ------------------------------------------------------------------ */

export type DateKind = "story" | "twenty_questions" | "paired_question";

/**
 * `open`     — in progress, either of us can take the next turn.
 * `finished` — played to its natural end.
 * `faded`    — went quiet and stopped mattering. Not a failure state; the most
 *              common and most human way for a date session to end.
 */
export type DateStatus = "open" | "finished" | "faded";

/** Free-form per-kind settings. Each `DateKind` narrows this in its own module. */
export type DateConfig = Record<string, unknown>;

export interface DateSession {
  id: Uuid;
  kind: DateKind;
  status: DateStatus;
  /** Member id of whoever opened the session. */
  startedBy: Uuid;

  /**
   * The hidden value for kinds that have one (the word in a guessing game, the
   * secret answer). Typed `unknown` on purpose: every read site must narrow it,
   * and no generic serializer can accidentally render it.
   */
  secret?: unknown;
  /** Which member is allowed to see `secret`. */
  secretHolderId?: Uuid;

  config: DateConfig;
  createdAt: IsoDateTime;
  finishedAt?: IsoDateTime;
}

/**
 * `turn`   — an ordinary move.
 * `guess`  — an attempt at the secret.
 * `reveal` — the secret being shown.
 */
export type DateTurnKind = "turn" | "guess" | "reveal";

export interface DateTurn {
  id: Uuid;
  dateId: Uuid;
  memberId: Uuid;
  /** Monotonic within a session, starting at 1. */
  seq: number;
  turnKind: DateTurnKind;
  body: string;
  createdAt: IsoDateTime;
}

/* ------------------------------------------------------------------ *
 * Activity index
 * ------------------------------------------------------------------ */

export type ActivityCostTier = "free" | "cheap" | "paid";

export type ActivitySharePlay = "yes" | "no" | "unknown";

/** 1 = fully public, 5 = only-us. */
export type IntimacyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * `verified`             — we checked the claim against a primary source.
 * `plausible-unverified` — it reads true and nothing contradicts it, but no
 *                          source was confirmed. Surfaced honestly in the UI.
 */
export type VerificationTier = "verified" | "plausible-unverified";

/** A row in the curated activity library. Content, not user state. */
export interface ActivityIndexEntry {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  costTier: ActivityCostTier;
  /** True when the cost depends on something (a subscription, a season, a city). */
  costConditional: boolean;
  costNote: string;
  shareplay: ActivitySharePlay;
  screenFree: boolean;
  intimacyLevel: IntimacyLevel;
  /** Which time windows this fits, e.g. `['weeknight', 'long-distance']`. */
  windowFit: string[];
  tier: string;
  verificationTier: VerificationTier;
}

export type ActivityStatus = "none" | "saved" | "done" | "hidden";

export type ActivityRating = 1 | 2 | 3 | 4 | 5;

/** Our state against a library entry. Splitting this from the entry keeps the
 * library replaceable: bump `libraryVersion` and state survives. */
export interface ActivityState {
  activityId: string;
  status: ActivityStatus;
  rating?: ActivityRating;
  timesDone: number;
  lastDoneAt?: IsoDateTime;
  notes?: string;
  /** Version of the activity library this state was recorded against. */
  libraryVersion: string;
  updatedAt: IsoDateTime;
}

/* ------------------------------------------------------------------ *
 * Identity & session
 * ------------------------------------------------------------------ */

/**
 * Who we believe is acting.
 *
 * `source` is part of the return type on purpose. Any caller that needs real,
 * proven identity is forced to look at it and notice that it does not have
 * any — a bare `memberId` would let that mistake pass silently.
 */
export interface Identity {
  memberId: Uuid;
  source: AttributionSource;
}

/** Signed session payload. Epoch seconds, UTC, no offsets. */
export interface Session {
  /** Session id. */
  sid: Uuid;
  /** Member id, once one has been chosen. */
  mid?: Uuid;
  /** Issued at, epoch seconds. */
  iat: number;
  /** Not valid after this instant, epoch seconds. */
  exp: number;
  /** Session schema version. Bump to invalidate every live session at once. */
  v: number;
}

/* ------------------------------------------------------------------ *
 * Offline outbox
 * ------------------------------------------------------------------ */

/**
 * `queued`      — accepted locally, not started.
 * `processing`  — being prepared (decode, resize, strip).
 * `uploading`   — bytes in flight.
 * `committed`   — the server has it; safe to drop locally.
 * `needs_retry` — did not go through. Will be picked up again. Terminal states
 *                 do not exist here on purpose: the queue keeps trying, and the
 *                 person decides when to give up, not the code.
 */
export type OutboxState =
  | "queued"
  | "processing"
  | "uploading"
  | "committed"
  | "needs_retry";

export interface OutboxItem {
  /** Same id the eventual `Photo` / `VaultItem` will carry. Idempotency key. */
  clientUuid: Uuid;
  state: OutboxState;
  attempts: number;
  /** Last error message, for the retry UI. Never shown as a dead end. */
  lastError?: string;
  createdAt: IsoDateTime;
}
