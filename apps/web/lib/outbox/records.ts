/**
 * The queryable half of the queue: small records in IndexedDB.
 *
 * Blobs go to OPFS (`blobs.ts`); what is pending, how many attempts it has
 * had and what state it is in goes here, because that is the part something
 * has to be able to *ask questions about*. "Show me everything not yet
 * committed, oldest first" is an index lookup here and a directory scan plus
 * hundreds of file reads there.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { Uuid } from "@/lib/types";
import type { OutboxRecord } from "@/lib/outbox/types";

/** The interface the queue codes against. Swappable for tests. */
export interface RecordStore {
  putMany(records: readonly OutboxRecord[]): Promise<void>;
  put(record: OutboxRecord): Promise<void>;
  get(clientUuid: Uuid): Promise<OutboxRecord | null>;
  all(): Promise<OutboxRecord[]>;
  /** Everything not yet committed, oldest first. */
  pending(): Promise<OutboxRecord[]>;
  delete(clientUuid: Uuid): Promise<void>;
}

const DB_NAME = "eva-adam-outbox";
const DB_VERSION = 1;
const STORE = "records";

interface OutboxDb extends DBSchema {
  [STORE]: {
    key: string;
    value: OutboxRecord;
    indexes: { byCreatedAt: string; byState: string };
  };
}

let database: Promise<IDBPDatabase<OutboxDb>> | null = null;

function db(): Promise<IDBPDatabase<OutboxDb>> {
  database ??= openDB<OutboxDb>(DB_NAME, DB_VERSION, {
    upgrade(instance) {
      const store = instance.createObjectStore(STORE, { keyPath: "clientUuid" });
      store.createIndex("byCreatedAt", "createdAt");
      store.createIndex("byState", "state");
    },
  });
  return database;
}

function oldestFirst(a: OutboxRecord, b: OutboxRecord): number {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

export function createIndexedDbRecordStore(): RecordStore {
  return {
    async putMany(records) {
      // One transaction for the whole selection. Thirty separate transactions
      // is thirty separate chances to be interrupted holding half a batch.
      const instance = await db();
      const tx = instance.transaction(STORE, "readwrite");
      await Promise.all(records.map((record) => tx.store.put(record)));
      await tx.done;
    },

    async put(record) {
      await (await db()).put(STORE, record);
    },

    async get(clientUuid) {
      return (await (await db()).get(STORE, clientUuid)) ?? null;
    },

    async all() {
      return (await (await db()).getAll(STORE)).sort(oldestFirst);
    },

    async pending() {
      const everything = await (await db()).getAll(STORE);
      return everything.filter((r) => r.state !== "committed").sort(oldestFirst);
    },

    async delete(clientUuid) {
      await (await db()).delete(STORE, clientUuid);
    },
  };
}
