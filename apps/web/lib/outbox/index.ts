/**
 * The offline outbox.
 *
 * Every selected photograph is written to the device before a single network
 * call happens. After that, closing the app, losing signal or having iOS kill
 * the tab costs nothing — the queue picks up where it stopped.
 *
 * ```ts
 * const store = createOutboxStore({
 *   blobs: createOpfsBlobStore(),
 *   records: createIndexedDbRecordStore(),
 * });
 *
 * // Durable from this line onward.
 * const { requested, records, rejected } = await store.enqueueAll(files, context);
 *
 * await drainOutbox({ store, transport: createHttpTransport(), codec: createBrowserCodec() });
 * ```
 *
 * ---
 *
 * ## There is no background sync, and the UI must say so
 *
 * iOS does not implement Background Sync and a closed PWA does not run. A
 * queued photograph goes out **the next time the app is opened**, and nothing
 * in this directory can change that.
 *
 * Any surface that shows a queued item must say this in words —
 * `NO_BACKGROUND_SYNC_NOTICE` in `lib/photo/network.ts` is the sentence.
 * Implying that uploads continue in the background would be a lie she only
 * discovers days later, wondering why he never saw the photographs.
 *
 * ## Nothing here is ever dropped
 *
 * There is no terminal state. An item that did not go through is
 * `needs_retry`, which means waiting. After five automatic attempts it stays
 * in the queue with `awaitingPerson: true` and holds its bytes; the person
 * decides when to give up, not the code. A batch is never reported complete
 * unless every single item committed.
 */

export {
  createOutboxStore,
  sourceKey,
  displayKey,
  thumbKey,
} from "@/lib/outbox/store";
export type {
  OutboxStore,
  OutboxStoreOptions,
  EnqueueContext,
  EnqueueResult,
} from "@/lib/outbox/store";

export { createOpfsBlobStore, requestPersistentStorage, NoDurableStorageError } from "@/lib/outbox/blobs";
export type { BlobStore } from "@/lib/outbox/blobs";

export { createIndexedDbRecordStore } from "@/lib/outbox/records";
export type { RecordStore } from "@/lib/outbox/records";

export { createHttpTransport, TransportError, TICKET_CHUNK_SIZE } from "@/lib/outbox/transport";
export type {
  UploadTransport,
  UploadTicket,
  CommitPhotoInput,
} from "@/lib/outbox/transport";

export { drainOutbox, retryNow, retryAll, UPLOAD_CONCURRENCY } from "@/lib/outbox/uploader";
export type { DrainOptions, DrainOutcome } from "@/lib/outbox/uploader";

export { uploadDeferredOriginals } from "@/lib/outbox/originals";
export type {
  OriginalTransport,
  OriginalsOptions,
  OriginalsOutcome,
} from "@/lib/outbox/originals";

export {
  backoffDelayMs,
  isAwaitingPerson,
  isEligible,
  nextAttemptAt,
  MAX_AUTOMATIC_ATTEMPTS,
} from "@/lib/outbox/backoff";

export { summarise } from "@/lib/outbox/types";
export type {
  OutboxRecord,
  OutboxSummary,
  PreparedFacts,
  BlobKeys,
} from "@/lib/outbox/types";
