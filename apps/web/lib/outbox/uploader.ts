/**
 * Draining the queue.
 *
 * Two stages with different concurrency, for two different reasons.
 *
 * **Decoding is sequential.** A 12 MP HEIC holds tens of megabytes decoded.
 * Thirty of those at once exhausts WKWebView's memory and the tab is killed —
 * which, from her side, is the app disappearing in the middle of uploading her
 * photographs. So the producer loop prepares exactly one at a time and
 * `close()`s the bitmap before it moves on.
 *
 * **Uploading runs two at a time.** At ~350 KB per object, more parallelism
 * does not make a phone connection faster; it multiplies the number of
 * requests in flight when the connection drops, so a single tunnel takes out
 * six items instead of two.
 *
 * The two stages are pipelined: the moment an item is prepared it is handed to
 * the upload pool and the producer starts on the next one. Prepared bytes live
 * in OPFS, not in memory, so the pipeline's depth costs disk rather than RAM.
 *
 * Nothing in this file can lose an item. Every path out of an attempt either
 * commits it or writes it back to the queue with a higher attempt count.
 */

import type { PhotoKind, Uuid } from "@/lib/types";
import { preparePhoto } from "@/lib/photo/prepare";
import type { ImageCodec } from "@/lib/photo/types";
import { isAwaitingPerson, isEligible, nextAttemptAt } from "@/lib/outbox/backoff";
import { displayKey, thumbKey, type OutboxStore } from "@/lib/outbox/store";
import {
  TICKET_CHUNK_SIZE,
  TransportError,
  type UploadTicket,
  type UploadTransport,
} from "@/lib/outbox/transport";
import type { OutboxRecord, OutboxSummary } from "@/lib/outbox/types";

/** Simultaneous PUT/commit sequences. Two, and the reason is in the header. */
export const UPLOAD_CONCURRENCY = 2;

export interface DrainOptions {
  store: OutboxStore;
  transport: UploadTransport;
  codec: ImageCodec;
  /** Notified after every state change, for the batch surface. */
  onChange?: (record: OutboxRecord) => void;
  now?: () => Date;
  random?: () => number;
  /** Lets the caller stop between items — a tab going away, a person leaving. */
  signal?: AbortSignal;
}

export interface DrainOutcome extends OutboxSummary {
  /** Items this run attempted. */
  attempted: number;
}

/* ------------------------------------------------------------------ *
 * Just-in-time signed URLs
 * ------------------------------------------------------------------ */

/**
 * Hands out upload slots five at a time.
 *
 * The URLs carry a two-minute TTL. Requesting thirty of them up front means
 * the last twenty expire before their turn — a bug that only shows up on a
 * slow connection with a big batch, which is precisely the run that matters.
 */
class TicketAllocator {
  private readonly buffer: UploadTicket[] = [];
  private issued = 0;

  constructor(
    private readonly transport: UploadTransport,
    private readonly kind: PhotoKind,
    /** How many items this run expects to upload, for sizing the last chunk. */
    private readonly expected: number,
  ) {}

  async take(): Promise<UploadTicket> {
    if (this.buffer.length === 0) {
      // Sized from tickets already handed out, not from how far the producer
      // has run ahead. Those two numbers diverge as soon as uploads overlap
      // preparation, and sizing on the wrong one fragments the tail of the
      // batch into extra round trips on the worst connection of the run.
      const outstanding = this.expected - this.issued;
      const want = Math.max(1, Math.min(TICKET_CHUNK_SIZE, outstanding));
      this.buffer.push(
        ...(await this.transport.requestUploadUrls({
          kind: this.kind,
          count: want,
        })),
      );
    }
    const ticket = this.buffer.shift();
    if (!ticket) {
      throw new TransportError("No upload slot was returned.");
    }
    this.issued++;
    return ticket;
  }
}

/* ------------------------------------------------------------------ *
 * A bounded pool that never rejects
 * ------------------------------------------------------------------ */

class TaskPool {
  private readonly active = new Set<Promise<void>>();

  constructor(private readonly limit: number) {}

  async spawn(task: () => Promise<void>): Promise<void> {
    while (this.active.size >= this.limit) await Promise.race(this.active);
    let handle: Promise<void>;
    // Tasks swallow their own errors, so `race` can never reject and a single
    // difficult photograph cannot take the rest of the batch down with it.
    handle = task().finally(() => {
      this.active.delete(handle);
    });
    this.active.add(handle);
  }

  async settle(): Promise<void> {
    while (this.active.size > 0) await Promise.race(this.active);
  }
}

/* ------------------------------------------------------------------ *
 * The drain
 * ------------------------------------------------------------------ */

function describe(error: unknown): string {
  if (error instanceof TransportError) {
    return error.status
      ? `The server answered ${error.status}.`
      : "The connection dropped partway through.";
  }
  if (error instanceof Error) return error.message;
  return "Something interrupted it.";
}

export async function drainOutbox(options: DrainOptions): Promise<DrainOutcome> {
  const { store, transport, codec, onChange } = options;
  const now = options.now ?? (() => new Date());
  const random = options.random ?? Math.random;

  const setback = async (record: OutboxRecord, error: unknown) => {
    const attempts = record.attempts + 1;
    const retryable = !(error instanceof TransportError) || error.retryable;
    const spent = isAwaitingPerson(attempts) || !retryable;
    const updated = await store.update(record.clientUuid, {
      // Never a terminal state. `needs_retry` means waiting, and the person
      // decides when to stop, not this function.
      state: "needs_retry",
      attempts,
      lastError: describe(error),
      awaitingPerson: spent,
      nextAttemptAt: spent ? undefined : nextAttemptAt(attempts, now(), random),
    });
    onChange?.(updated);
  };

  const advance = async (
    record: OutboxRecord,
    patch: Partial<Omit<OutboxRecord, "clientUuid">>,
  ): Promise<OutboxRecord> => {
    const updated = await store.update(record.clientUuid, patch);
    onChange?.(updated);
    return updated;
  };

  const queue = (await store.pending()).filter((record) =>
    isEligible(record, now()),
  );

  const pool = new TaskPool(UPLOAD_CONCURRENCY);
  const allocator = new TicketAllocator(
    transport,
    queue[0]?.kind ?? "daily",
    queue.length,
  );

  let attempted = 0;

  for (const queued of queue) {
    if (options.signal?.aborted) break;
    attempted++;

    /* --- Stage one: prepare. One at a time, always. ------------------- */
    let record = queued;
    if (!record.prepared) {
      try {
        record = await advance(record, { state: "processing" });
        const source = await store.blob(record.blobKeys.source);
        if (!source) {
          throw new Error(
            "The bytes for this photograph are no longer on the device. Pick it again.",
          );
        }
        const prepared = await preparePhoto(source, {
          clientUuid: record.clientUuid,
          codec,
        });

        const keys = {
          ...record.blobKeys,
          display: displayKey(record.clientUuid),
          thumb: thumbKey(record.clientUuid),
        };
        await store.putBlob(
          keys.display,
          new Blob([prepared.display.bytes as BlobPart], { type: "image/jpeg" }),
        );
        await store.putBlob(
          keys.thumb,
          new Blob([prepared.thumb.bytes as BlobPart], { type: "image/jpeg" }),
        );

        record = await advance(record, {
          blobKeys: keys,
          prepared: {
            width: prepared.display.width,
            height: prepared.display.height,
            bytes: prepared.display.byteLength,
            colorSpace: prepared.colorSpace,
            checksumSha256: prepared.display.checksumSha256,
            thumbChecksumSha256: prepared.thumb.checksumSha256,
            takenAt: prepared.takenAt,
            sourceHadGps: prepared.sourceHadGps,
          },
        });
      } catch (error) {
        await setback(record, error);
        continue;
      }
    }

    /* --- Stage two: upload. Two at a time. ---------------------------- */
    const ready = record;
    await pool.spawn(async () => {
      try {
        const inFlight = await advance(ready, { state: "uploading" });
        const facts = inFlight.prepared;
        if (!facts) throw new Error("This item was not prepared.");

        const display = await store.blob(inFlight.blobKeys.display ?? "");
        const thumb = await store.blob(inFlight.blobKeys.thumb ?? "");
        if (!display || !thumb) {
          throw new Error(
            "The processed bytes are no longer on the device. It will be prepared again.",
          );
        }

        // A fresh ticket per attempt: the previous attempt's URLs have a
        // two-minute life and a retry is, by definition, later than that.
        const ticket = await allocator.take();
        await transport.putObject(ticket.urls.display, display, "image/jpeg");
        await transport.putObject(ticket.urls.thumb, thumb, "image/jpeg");

        await transport.commitPhoto({
          clientUuid: inFlight.clientUuid,
          photoId: ticket.photoId,
          kind: inFlight.kind,
          author: inFlight.authorMemberId,
          clientTz: inFlight.clientReportedTz,
          sharedDay: inFlight.sharedDay,
          sharedDayTz: inFlight.sharedDayTz,
          takenAt: facts.takenAt,
          caption: inFlight.caption,
          width: facts.width,
          height: facts.height,
          bytes: facts.bytes,
          colorSpace: facts.colorSpace,
          checksumSha256: facts.checksumSha256,
        });

        // Only now. The 2xx is the only thing that clears an item.
        const committed = await advance(inFlight, {
          state: "committed",
          photoId: ticket.photoId,
          lastError: undefined,
          awaitingPerson: false,
          nextAttemptAt: undefined,
        });
        // Derivatives go; the source stays for its deferred wifi-only upload.
        await store.release(committed.clientUuid, { keepSource: true });
      } catch (error) {
        await setback(ready, error);
      }
    });
  }

  await pool.settle();

  const summary = await store.summary();
  return { ...summary, attempted };
}

/**
 * Put an item back in line after the person asked for it.
 *
 * Clears `awaitingPerson` and the wait, and leaves the attempt count alone —
 * the history is real and the batch surface uses it to say "tried 5 times".
 */
export async function retryNow(
  store: OutboxStore,
  clientUuid: Uuid,
): Promise<OutboxRecord> {
  return store.update(clientUuid, {
    state: "queued",
    awaitingPerson: false,
    nextAttemptAt: undefined,
  });
}

/** Put every waiting item back in line. The explicit retry-all. */
export async function retryAll(store: OutboxStore): Promise<OutboxRecord[]> {
  const waiting = (await store.pending()).filter(
    (record) => record.state === "needs_retry",
  );
  const out: OutboxRecord[] = [];
  for (const record of waiting) out.push(await retryNow(store, record.clientUuid));
  return out;
}
