/**
 * The untouched originals, sent later and only over wi-fi.
 *
 * These never block a batch and never ride on her mobile data. A 300-photo
 * backlog is roughly 750 MB of originals against roughly 115 MB of the
 * derivatives people actually look at — and the originals are not rendered
 * anywhere. Spending a cellular allowance on invisible bytes would be a choice
 * nobody made on purpose.
 *
 * Two properties matter as much as the saving:
 *
 * **The source blob is not released when the photograph commits.** `release()`
 * is called with `keepSource: true`, so the original is still on the device
 * waiting for its turn. Dropping it at commit time would make this whole pass
 * impossible and nobody would notice until the originals were already gone.
 *
 * **An original that never goes is not a lost photograph.** The display and
 * thumb are committed; the book works; the spread works. This pass is an
 * upgrade, so everything in it fails soft, and a device that never sees wi-fi
 * simply keeps its originals.
 */

import type { Uuid } from "@/lib/types";
import {
  mayUploadOriginals,
  readConnection,
  type ConnectionVerdict,
} from "@/lib/photo/network";
import type { OutboxStore } from "@/lib/outbox/store";
import { TransportError } from "@/lib/outbox/transport";
import type { OutboxRecord } from "@/lib/outbox/types";

/**
 * The one call this pass needs that the ordinary upload path does not.
 *
 * `POST /api/photos/upload-url` allocates a *new* `photoId`; an original
 * belongs to a photo that already exists. Kept as its own narrow interface so
 * the shape of the request is written down while the route is still being
 * built, rather than being guessed at inline.
 */
export interface OriginalTransport {
  requestOriginalUrl(photoId: Uuid): Promise<{ url: string }>;
  putObject(url: string, body: Blob, contentType: string): Promise<void>;
  /** Marks `photos.original_location = 'supabase'`. */
  confirmOriginal(photoId: Uuid, bytes: number): Promise<void>;
}

export interface OriginalsOptions {
  store: OutboxStore;
  transport: OriginalTransport;
  /** Overridable so a person can say "send them now" over cellular. */
  connection?: ConnectionVerdict;
  force?: boolean;
  signal?: AbortSignal;
  onChange?: (record: OutboxRecord) => void;
}

export interface OriginalsOutcome {
  /** Why we did or did not run. */
  connection: ConnectionVerdict;
  skipped: boolean;
  uploaded: number;
  /** Still waiting — for wi-fi, or for another try. */
  remaining: number;
}

/**
 * Send every original whose photograph has already committed.
 *
 * Sequential, deliberately. These are the largest objects the app moves and
 * there is no deadline on any of them; two at a time would buy nothing and
 * would compete with a foreground upload she is actually waiting for.
 */
export async function uploadDeferredOriginals(
  options: OriginalsOptions,
): Promise<OriginalsOutcome> {
  const { store, transport, onChange } = options;
  const connection = options.connection ?? readConnection();

  const waiting = (await store.list()).filter(
    (record) =>
      record.originalPending && record.state === "committed" && record.photoId,
  );

  if (!options.force && !mayUploadOriginals(connection)) {
    return {
      connection,
      skipped: true,
      uploaded: 0,
      remaining: waiting.length,
    };
  }

  let uploaded = 0;

  for (const record of waiting) {
    if (options.signal?.aborted) break;
    const photoId = record.photoId;
    if (!photoId) continue;

    try {
      const source = await store.blob(record.blobKeys.source);
      if (!source) {
        // The bytes were evicted. The photograph is safe — display and thumb
        // are on the server — so stop asking for an original that no longer
        // exists rather than retrying forever against nothing.
        const cleared = await store.update(record.clientUuid, {
          originalPending: false,
        });
        onChange?.(cleared);
        continue;
      }

      const { url } = await transport.requestOriginalUrl(photoId);
      await transport.putObject(url, source, source.type || "image/heic");
      await transport.confirmOriginal(photoId, source.size);

      const done = await store.update(record.clientUuid, {
        originalPending: false,
      });
      onChange?.(done);
      uploaded++;

      // Now, and only now, the device can let the original go.
      await store.release(record.clientUuid);
    } catch (error) {
      // Soft. The derivative is committed and the book is complete without
      // this; it will be tried again the next time we are on wi-fi.
      if (error instanceof TransportError && !error.retryable) {
        const cleared = await store.update(record.clientUuid, {
          originalPending: false,
          lastError: `The full-size original was refused: ${error.message}`,
        });
        onChange?.(cleared);
      }
      continue;
    }
  }

  const stillWaiting = (await store.list()).filter((r) => r.originalPending);

  return {
    connection,
    skipped: false,
    uploaded,
    remaining: stillWaiting.length,
  };
}
