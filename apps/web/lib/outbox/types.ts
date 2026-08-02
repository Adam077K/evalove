/**
 * The durable record of a photograph that has been chosen but not yet landed.
 *
 * `OutboxItem` in `lib/types.ts` is the shape the batch surface renders. This
 * extends it with everything the queue needs to finish the job after the app
 * has been closed, the signal has gone, or the tab has been killed by iOS for
 * using too much memory — none of which are edge cases on the first run.
 *
 * The states are the ones in `lib/types.ts` and there is deliberately no
 * terminal one. An item that did not go through is `needs_retry`, which means
 * waiting, not finished. Nothing in this directory can remove an item from the
 * queue except a 2xx from the commit endpoint.
 */

import type {
  ColorSpace,
  IanaTimeZone,
  IsoDate,
  IsoDateTime,
  OutboxItem,
  PhotoKind,
  Sha256Hex,
  Uuid,
} from "@/lib/types";

/** Where a variant's bytes are parked in OPFS. */
export interface BlobKeys {
  /** The picked file, untouched. Kept for the deferred wifi-only upload. */
  source: string;
  /** Written once the re-encode has run and the guard has passed it. */
  display?: string;
  thumb?: string;
}

/** What `POST /api/photos` needs, assembled while still on the device. */
export interface PreparedFacts {
  width: number;
  height: number;
  bytes: number;
  colorSpace: ColorSpace;
  checksumSha256: Sha256Hex;
  thumbChecksumSha256: Sha256Hex;
  takenAt?: IsoDateTime;
  /** True when the source carried GPS and the re-encode removed it. */
  sourceHadGps: boolean;
}

export interface OutboxRecord extends OutboxItem {
  kind: PhotoKind;
  /** Author as declared at pick time. Attribution is `self_declared`. */
  authorMemberId: Uuid;
  /** Resolved at pick time so a queue drained days later still files it right. */
  sharedDay: IsoDate;
  sharedDayTz: IanaTimeZone;
  clientReportedTz: IanaTimeZone;
  caption?: string;

  blobKeys: BlobKeys;
  /** Allocated by the server on the first `upload-url` call. */
  photoId?: Uuid;
  prepared?: PreparedFacts;

  /**
   * Earliest instant the drain may try this item again.
   *
   * Absent means "try now". Set from the backoff schedule after an attempt
   * that did not go through.
   */
  nextAttemptAt?: IsoDateTime;

  /**
   * True once the item has spent its automatic attempts.
   *
   * It stays in the queue and stays `needs_retry`. The only thing this changes
   * is that the drain stops picking it up on its own — the person decides when
   * to press Try again, which is the whole difference between a queue and a
   * thing that quietly gives up.
   */
  awaitingPerson: boolean;

  /** The untouched original is still on the device, waiting for wifi. */
  originalPending: boolean;

  updatedAt: IsoDateTime;
}

/** A batch, summarised for the surface she can open. */
export interface OutboxSummary {
  total: number;
  committed: number;
  inFlight: number;
  needsRetry: number;
  awaitingPerson: number;
  /** True only when every single item committed. */
  complete: boolean;
  /** Originals still held back for wifi. */
  originalsPending: number;
}

export function summarise(records: readonly OutboxRecord[]): OutboxSummary {
  let committed = 0;
  let inFlight = 0;
  let needsRetry = 0;
  let awaitingPerson = 0;
  let originalsPending = 0;

  for (const record of records) {
    if (record.state === "committed") committed++;
    else if (record.state === "needs_retry") needsRetry++;
    else inFlight++;
    if (record.awaitingPerson) awaitingPerson++;
    if (record.originalPending) originalsPending++;
  }

  return {
    total: records.length,
    committed,
    inFlight,
    needsRetry,
    awaitingPerson,
    // Never "done" on a majority. A batch of thirty with one waiting is a
    // batch of thirty that is not finished, and saying otherwise is how a
    // photograph gets lost without anyone noticing.
    complete: records.length > 0 && committed === records.length,
    originalsPending,
  };
}
