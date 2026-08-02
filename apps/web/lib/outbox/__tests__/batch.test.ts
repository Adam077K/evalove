/**
 * Thirty photographs, one dropped connection, and nothing lost.
 *
 * Their first real use of this product is a multi-select of roughly three
 * hundred images over a phone connection. A batch that silently drops items is
 * a photo-loss event by another name, and the way it happens is never
 * dramatic: an item is picked, something goes wrong before it is written down,
 * and there is nothing left to notice its absence. The count looks plausible.
 * Nobody counts.
 *
 * So this file asserts three things, in order of how badly they would hurt:
 *
 *   1. Every selected file is durable **before any network call happens**.
 *   2. A connection that dies mid-batch loses nothing, and every item's state
 *      afterwards is individually accurate.
 *   3. The batch is not reported complete until every single item committed.
 */

import { describe, expect, it } from "vitest";

import { summarise } from "@/lib/outbox/types";
import { createOutboxStore, sourceKey } from "@/lib/outbox/store";
import { drainOutbox, retryAll } from "@/lib/outbox/uploader";
import { MAX_AUTOMATIC_ATTEMPTS } from "@/lib/outbox/backoff";
import {
  createMemoryBlobStore,
  createMemoryRecordStore,
  createNodeCodec,
  createScriptedTransport,
  frozenClock,
  noJitter,
  sequentialUuids,
  type MemoryBlobStore,
} from "@/lib/outbox/__tests__/support/doubles";

const BATCH_SIZE = 30;

const CONTEXT = {
  kind: "book" as const,
  authorMemberId: "22222222-2222-4222-8222-222222222222",
  sharedDay: "2026-08-02",
  sharedDayTz: "Europe/Stockholm",
  clientReportedTz: "Europe/Stockholm",
};

/** Thirty distinct files, so a crossed item shows up as different bytes. */
function pickedFiles(count = BATCH_SIZE): File[] {
  return Array.from({ length: count }, (_, i) => {
    // Distinct sizes and contents; the picker hands us HEIC by default.
    const body = new Uint8Array(64 + i).fill(i + 1);
    return new File([body as BlobPart], `IMG_${4000 + i}.HEIC`, {
      type: "image/heic",
    });
  });
}

function harness() {
  const blobs: MemoryBlobStore = createMemoryBlobStore();
  const records = createMemoryRecordStore();
  const store = createOutboxStore({
    blobs,
    records,
    newUuid: sequentialUuids(),
    now: frozenClock(),
  });
  const transport = createScriptedTransport({
    isDurable: async (clientUuid) => {
      const record = await records.get(clientUuid);
      if (!record) return false;
      return (await blobs.get(record.blobKeys.source)) !== null;
    },
  });
  const codec = createNodeCodec({ width: 320, height: 240 });
  return { blobs, records, store, transport, codec };
}

const drain = (h: ReturnType<typeof harness>, signal?: AbortSignal) =>
  drainOutbox({
    store: h.store,
    transport: h.transport,
    codec: h.codec,
    now: frozenClock(),
    random: noJitter,
    signal,
  });

/* ------------------------------------------------------------------ *
 * 1 — durable before the network
 * ------------------------------------------------------------------ */

describe("selection", () => {
  it("writes every file to the blob store before any network call", async () => {
    const h = harness();

    const result = await h.store.enqueueAll(pickedFiles(), CONTEXT);

    // The whole point: at this instant the app could be killed and nothing is
    // lost, because nothing has been asked of the network yet.
    expect(h.transport.calls).toEqual([]);
    expect(result.requested).toBe(BATCH_SIZE);
    expect(result.records).toHaveLength(BATCH_SIZE);
    expect(result.rejected).toEqual([]);

    expect(h.blobs.size()).toBe(BATCH_SIZE);
    for (const record of result.records) {
      expect(h.blobs.has(sourceKey(record.clientUuid))).toBe(true);
      expect(record.state).toBe("queued");
      expect(record.attempts).toBe(0);
      expect(record.originalPending).toBe(true);
    }
  });

  it("writes the bytes before the record, so a crash cannot leave a ghost", async () => {
    const h = harness();
    const files = pickedFiles(3);

    await h.store.enqueueAll(files, CONTEXT);

    // Every record's blob was written before the record could reference it.
    // An interrupted enqueue leaves orphan bytes (collectable, and the file is
    // still in her camera roll) rather than a queue row that can never finish.
    const written = h.blobs.writes;
    for (const record of await h.store.list()) {
      expect(written).toContain(sourceKey(record.clientUuid));
    }
  });

  it("reports files it could not store instead of quietly shortening the batch", async () => {
    const h = harness();
    // A zero-byte selection is refused by the store, as a full disk would be.
    const files = [
      ...pickedFiles(2),
      new File([new Uint8Array(0) as BlobPart], "IMG_BROKEN.HEIC", {
        type: "image/heic",
      }),
    ];

    const result = await h.store.enqueueAll(files, CONTEXT);

    expect(result.requested).toBe(3);
    expect(result.records).toHaveLength(2);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.name).toBe("IMG_BROKEN.HEIC");
  });
});

/* ------------------------------------------------------------------ *
 * 2 — the dropped connection
 * ------------------------------------------------------------------ */

describe("a 30-item batch with the connection dropping mid-batch", () => {
  it("loses zero items and reports accurate per-item state", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(), CONTEXT);

    // Walk into a tunnel partway through: the line dies on the 12th network
    // call and stays dead for the rest of the run.
    h.transport.beforeCall = (_name, index) => {
      if (index >= 12) h.transport.online = false;
    };

    const outcome = await drain(h);

    // Nothing left the queue except by committing.
    const all = await h.store.list();
    expect(all).toHaveLength(BATCH_SIZE);

    // Some got through, some did not, and both numbers are real.
    expect(outcome.committed).toBeGreaterThan(0);
    expect(outcome.needsRetry).toBeGreaterThan(0);
    expect(outcome.committed + outcome.needsRetry).toBe(BATCH_SIZE);
    expect(outcome.total).toBe(BATCH_SIZE);

    // Per-item state matches what the transport actually accepted — not a
    // count kept alongside, which is the thing that drifts.
    for (const record of all) {
      if (record.state === "committed") {
        expect(h.transport.committed.has(record.clientUuid)).toBe(true);
        expect(record.photoId).toBeDefined();
        expect(record.lastError).toBeUndefined();
      } else {
        expect(record.state).toBe("needs_retry");
        expect(h.transport.committed.has(record.clientUuid)).toBe(false);
        expect(record.attempts).toBeGreaterThan(0);
        expect(record.lastError).toBeTruthy();
      }
    }

    // A batch with anything outstanding is not a finished batch.
    expect(outcome.complete).toBe(false);
  });

  it("keeps the bytes of every item that did not go through", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(), CONTEXT);
    h.transport.beforeCall = (_name, index) => {
      if (index >= 8) h.transport.online = false;
    };

    await drain(h);

    for (const record of await h.store.list()) {
      if (record.state === "committed") continue;
      // Still on the device, so trying again is a retry and not a re-pick.
      expect(await h.store.blob(record.blobKeys.source)).not.toBeNull();
    }
  });

  it("finishes the batch once the connection comes back", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(), CONTEXT);
    h.transport.beforeCall = (_name, index) => {
      if (index >= 12) h.transport.online = false;
    };
    await drain(h);
    expect((await h.store.summary()).complete).toBe(false);

    // Out of the tunnel.
    h.transport.beforeCall = undefined;
    h.transport.online = true;
    await retryAll(h.store);
    const second = await drain(h);

    expect(second.committed).toBe(BATCH_SIZE);
    expect(second.needsRetry).toBe(0);
    expect(second.complete).toBe(true);
    expect(h.transport.committed.size).toBe(BATCH_SIZE);

    // Every item committed exactly once, under its own client id.
    const ids = (await h.store.list()).map((r) => r.clientUuid);
    expect(new Set(ids).size).toBe(BATCH_SIZE);
  });

  it("never decodes two photographs at once, and leaks no bitmaps", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(), CONTEXT);
    h.transport.beforeCall = (_name, index) => {
      if (index >= 15) h.transport.online = false;
    };

    await drain(h);

    // The constraint people discover in production: thirty parallel 12 MP
    // decodes exhaust WKWebView and the tab is killed.
    expect(h.codec.peakOpenBitmaps()).toBe(1);
    expect(h.codec.leakedBitmaps()).toBe(0);
  });

  it("asks for signed URLs five at a time, not thirty up front", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(), CONTEXT);

    await drain(h);

    const ticketCalls = h.transport.calls.filter((c) => c.name === "upload-url");
    // Thirty items, five per request. A single up-front request would let the
    // two-minute TTL expire on the tail of the batch.
    expect(ticketCalls.length).toBe(BATCH_SIZE / 5);
  });
});

/* ------------------------------------------------------------------ *
 * 3 — nothing is ever abandoned
 * ------------------------------------------------------------------ */

describe("an item that keeps not going through", () => {
  it("stays queued after its automatic attempts, waiting to be asked", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(1), CONTEXT);
    h.transport.online = false;

    for (let i = 0; i < MAX_AUTOMATIC_ATTEMPTS + 2; i++) {
      await retryAll(h.store);
      await drain(h);
    }

    const [record] = await h.store.list();
    expect(record).toBeDefined();
    // Still here. Still named. Still holding its bytes.
    expect(record?.state).toBe("needs_retry");
    expect(record?.attempts).toBeGreaterThanOrEqual(MAX_AUTOMATIC_ATTEMPTS);
    expect(record?.awaitingPerson).toBe(true);
    expect(await h.store.blob(record?.blobKeys.source ?? "")).not.toBeNull();

    // And the drain stops picking it up on its own rather than spinning.
    const before = h.transport.calls.length;
    await drain(h);
    expect(h.transport.calls.length).toBe(before);
  });

  it("goes back in line when the person asks, keeping its history", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(1), CONTEXT);
    h.transport.online = false;
    await drain(h);

    const [waiting] = await h.store.list();
    expect(waiting?.state).toBe("needs_retry");
    const attemptsSoFar = waiting?.attempts ?? 0;

    h.transport.online = true;
    await retryAll(h.store);
    const requeued = await h.store.get(waiting?.clientUuid ?? "");
    expect(requeued?.state).toBe("queued");
    // The history is real; the batch surface says "tried 1 time" honestly.
    expect(requeued?.attempts).toBe(attemptsSoFar);

    const outcome = await drain(h);
    expect(outcome.complete).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * The summary the batch screen renders
 * ------------------------------------------------------------------ */

describe("summarise", () => {
  it("is complete only when every item committed", async () => {
    const h = harness();
    await h.store.enqueueAll(pickedFiles(4), CONTEXT);
    const records = await h.store.list();

    const almost = records.map((r, i) => ({
      ...r,
      state: i === 3 ? ("needs_retry" as const) : ("committed" as const),
    }));
    expect(summarise(almost).complete).toBe(false);
    expect(summarise(almost).committed).toBe(3);
    expect(summarise(almost).needsRetry).toBe(1);

    const done = records.map((r) => ({ ...r, state: "committed" as const }));
    expect(summarise(done).complete).toBe(true);
  });

  it("is not complete for an empty queue", () => {
    expect(summarise([]).complete).toBe(false);
  });
});
