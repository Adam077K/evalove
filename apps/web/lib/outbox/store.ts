/**
 * The queue itself: blobs in OPFS, records in IndexedDB, one object in front.
 *
 * `enqueueAll` is the most important function in this directory and it does
 * something unglamorous: it writes every selected file to disk before anything
 * touches the network. From that instant, closing the app, walking into a
 * tunnel or having iOS kill the tab costs nothing. Everything after it is
 * recoverable work.
 *
 * The write order within an item is blob, then record — and that is the
 * opposite of what looks natural. A record written first, interrupted before
 * its blob, is an item the batch screen shows forever and can never finish. A
 * blob written first, interrupted before its record, is a few orphaned bytes
 * that the sweep collects, and a file still sitting in her camera roll. So
 * `enqueueAll` reports how many it was handed against how many it queued, and
 * the caller says so plainly rather than quietly presenting a short batch as a
 * whole one.
 */

import type {
  IanaTimeZone,
  IsoDate,
  PhotoKind,
  Uuid,
} from "@/lib/types";
import type { BlobStore } from "@/lib/outbox/blobs";
import type { RecordStore } from "@/lib/outbox/records";
import {
  summarise,
  type BlobKeys,
  type OutboxRecord,
  type OutboxSummary,
} from "@/lib/outbox/types";

export interface EnqueueContext {
  kind: PhotoKind;
  authorMemberId: Uuid;
  /** Resolved at pick time, so a queue drained days later still files it right. */
  sharedDay: IsoDate;
  sharedDayTz: IanaTimeZone;
  clientReportedTz: IanaTimeZone;
  caption?: string;
}

export interface EnqueueResult {
  /** How many files the picker handed us. */
  requested: number;
  /** The ones now durable on the device. */
  records: OutboxRecord[];
  /**
   * The ones that never made it to disk, with a reason.
   *
   * Reported rather than swallowed. A batch of thirty that queued twenty-nine
   * must not read as a batch of twenty-nine.
   */
  rejected: { name: string; reason: string }[];
}

export interface OutboxStoreOptions {
  blobs: BlobStore;
  records: RecordStore;
  newUuid?: () => Uuid;
  now?: () => Date;
}

export function sourceKey(clientUuid: Uuid): string {
  return `${clientUuid}.source`;
}
export function displayKey(clientUuid: Uuid): string {
  return `${clientUuid}.display`;
}
export function thumbKey(clientUuid: Uuid): string {
  return `${clientUuid}.thumb`;
}

function defaultUuid(): Uuid {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  throw new Error("crypto.randomUUID is unavailable; cannot mint a client id.");
}

export interface OutboxStore {
  enqueueAll(
    files: readonly File[] | readonly Blob[],
    context: EnqueueContext,
  ): Promise<EnqueueResult>;
  list(): Promise<OutboxRecord[]>;
  pending(): Promise<OutboxRecord[]>;
  get(clientUuid: Uuid): Promise<OutboxRecord | null>;
  update(
    clientUuid: Uuid,
    patch: Partial<Omit<OutboxRecord, "clientUuid">>,
  ): Promise<OutboxRecord>;
  summary(): Promise<OutboxSummary>;
  blob(key: string): Promise<Blob | null>;
  putBlob(key: string, data: Blob): Promise<void>;
  /**
   * Drop an item's bytes and its record.
   *
   * Only ever called after a 2xx from the commit endpoint, and only for the
   * derivatives — the source stays until its deferred wifi-only upload has
   * also landed.
   */
  release(clientUuid: Uuid, options?: { keepSource?: boolean }): Promise<void>;
}

export function createOutboxStore(options: OutboxStoreOptions): OutboxStore {
  const { blobs, records } = options;
  const newUuid = options.newUuid ?? defaultUuid;
  const now = options.now ?? (() => new Date());

  const store: OutboxStore = {
    async enqueueAll(files, context) {
      const queued: OutboxRecord[] = [];
      const rejected: { name: string; reason: string }[] = [];

      for (const file of files) {
        const clientUuid = newUuid();
        const keys: BlobKeys = { source: sourceKey(clientUuid) };
        const name =
          file instanceof File && file.name ? file.name : `image-${clientUuid}`;

        try {
          // Bytes to disk first. Until this resolves, nothing is promised.
          await blobs.put(keys.source, file);
        } catch (error) {
          rejected.push({
            name,
            reason:
              error instanceof Error
                ? error.message
                : "The device would not store it.",
          });
          continue;
        }

        const timestamp = now().toISOString();
        const record: OutboxRecord = {
          clientUuid,
          state: "queued",
          attempts: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          kind: context.kind,
          authorMemberId: context.authorMemberId,
          sharedDay: context.sharedDay,
          sharedDayTz: context.sharedDayTz,
          clientReportedTz: context.clientReportedTz,
          caption: context.caption,
          blobKeys: keys,
          awaitingPerson: false,
          originalPending: true,
        };

        try {
          await records.put(record);
        } catch (error) {
          await blobs.delete(keys.source);
          rejected.push({
            name,
            reason:
              error instanceof Error
                ? error.message
                : "The device would not record it.",
          });
          continue;
        }

        queued.push(record);
      }

      return { requested: files.length, records: queued, rejected };
    },

    list: () => records.all(),
    pending: () => records.pending(),
    get: (clientUuid) => records.get(clientUuid),

    async update(clientUuid, patch) {
      const existing = await records.get(clientUuid);
      if (!existing) {
        throw new Error(
          `No queued item ${clientUuid}; refusing to write a record that was never enqueued.`,
        );
      }
      const next: OutboxRecord = {
        ...existing,
        ...patch,
        clientUuid,
        updatedAt: now().toISOString(),
      };
      await records.put(next);
      return next;
    },

    async summary() {
      return summarise(await records.all());
    },

    blob: (key) => blobs.get(key),
    putBlob: (key, data) => blobs.put(key, data),

    async release(clientUuid, releaseOptions) {
      const record = await records.get(clientUuid);
      if (!record) return;
      const { display, thumb, source } = record.blobKeys;
      if (display) await blobs.delete(display);
      if (thumb) await blobs.delete(thumb);
      if (!releaseOptions?.keepSource) {
        await blobs.delete(source);
        await records.delete(clientUuid);
      }
    },
  };

  return store;
}
