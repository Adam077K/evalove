/**
 * Uncoordinated drains orphan storage objects.
 *
 * `QuickSend` fires `drain()` from three independent places — mount, `send()`,
 * `retry()` — and `drainOutbox` itself has no defence against two of them
 * overlapping: its first line is `store.pending()`, so two concurrent calls
 * read the same snapshot and each proceeds to take its own upload ticket for
 * the same item. This file proves both halves of that story against the real
 * `drainOutbox` and the real test doubles (`support/doubles.ts`):
 *
 *   1. Unserialised, firing two drains at once really does request two
 *      tickets for one pending item — the race is real, not hypothetical.
 *   2. Routed through `createSerialQueue`, the same two calls request exactly
 *      one — the second call's `store.pending()` runs only after the first
 *      call has already committed the item, so it finds nothing left to do.
 */

import { describe, expect, it } from "vitest";

import { encodeBaselineJpeg } from "@/lib/photo/__tests__/support/jpeg-encoder";
import type { EncodeRequest, ImageCodec } from "@/lib/photo/types";
import { createOutboxStore } from "@/lib/outbox/store";
import { drainOutbox } from "@/lib/outbox/uploader";
import { createSerialQueue } from "@/lib/outbox/serial";
import {
  createMemoryBlobStore,
  createMemoryRecordStore,
  createNodeCodec,
  createScriptedTransport,
  frozenClock,
  noJitter,
  sequentialUuids,
} from "@/lib/outbox/__tests__/support/doubles";

/**
 * A codec with none of `createNodeCodec`'s own concurrency guard.
 *
 * `createNodeCodec` deliberately throws if a second decode starts before the
 * first `close()`s — that is what `batch.test.ts` uses to prove a single
 * drain never decodes two photographs at once. Reused here it would mask the
 * exact race this file exists to demonstrate: two *separate* `drainOutbox`
 * calls, sharing one `codec` the way `QuickSend.getClient()` does, both
 * decoding the same still-pending item at once. Real `OffscreenCanvas` does
 * not throw on that, it just wastes work — so this double does not either.
 */
function permissiveCodec(width: number, height: number): ImageCodec {
  return {
    async decode(file) {
      const seed = file.size;
      const samples = new Uint8Array(width * height).fill(seed % 256);
      let closed = false;
      return {
        width,
        height,
        source: { samples, width, height } as unknown as CanvasImageSource,
        close() {
          closed = true;
          void closed;
        },
      };
    },
    async encode(request: EncodeRequest) {
      const samples = new Uint8Array(request.width * request.height).fill(1);
      return {
        bytes: encodeBaselineJpeg(samples, request.width, request.height),
        width: request.width,
        height: request.height,
        colorSpace: "srgb" as const,
      };
    },
  };
}

const CONTEXT = {
  kind: "book" as const,
  authorMemberId: "22222222-2222-4222-8222-222222222222",
  sharedDay: "2026-08-02",
  sharedDayTz: "Europe/Stockholm",
  clientReportedTz: "Europe/Stockholm",
};

function harness(codec: ImageCodec = createNodeCodec({ width: 320, height: 240 })) {
  const blobs = createMemoryBlobStore();
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
  return { blobs, records, store, transport, codec };
}

function onePickedFile(): File {
  const body = new Uint8Array(64).fill(7);
  return new File([body as BlobPart], "IMG_0001.HEIC", { type: "image/heic" });
}

const runDrain = (h: ReturnType<typeof harness>) =>
  drainOutbox({
    store: h.store,
    transport: h.transport,
    codec: h.codec,
    now: frozenClock(),
    random: noJitter,
  });

describe("two drains racing over one pending item", () => {
  it("unserialised: each asks for its own upload ticket", async () => {
    // The permissive codec, not `createNodeCodec`'s default: two real
    // `drainOutbox` calls sharing one codec instance, exactly as
    // `QuickSend.getClient()` shares one across every call to `drain()`.
    const h = harness(permissiveCodec(320, 240));
    await h.store.enqueueAll([onePickedFile()], CONTEXT);

    // The mount effect and `send()` firing in the same tick, with no
    // coordination between them — the bug as filed.
    await Promise.all([runDrain(h), runDrain(h)]);

    const ticketCalls = h.transport.calls.filter((c) => c.name === "upload-url");
    expect(ticketCalls.length).toBe(2);
  });

  it("serialised behind createSerialQueue: only one ticket is ever asked for", async () => {
    const h = harness();
    await h.store.enqueueAll([onePickedFile()], CONTEXT);

    const enqueueDrain = createSerialQueue();
    const drainOnce = () => enqueueDrain(() => runDrain(h));

    // Same race, same two nearly-simultaneous callers — now routed through
    // the queue `QuickSend.drain()` uses.
    await Promise.all([drainOnce(), drainOnce()]);

    const ticketCalls = h.transport.calls.filter((c) => c.name === "upload-url");
    expect(ticketCalls.length).toBe(1);

    // And the one item committed exactly once — no duplicate upload sitting
    // in storage under a `photoId` nothing points at.
    expect(h.transport.committed.size).toBe(1);
    const [record] = await h.store.list();
    expect(record?.state).toBe("committed");
  });

  it("still runs the second caller's work — queued, not dropped", async () => {
    const h = harness();
    await h.store.enqueueAll([onePickedFile(), onePickedFile()], {
      ...CONTEXT,
    });

    const enqueueDrain = createSerialQueue();
    const drainOnce = () => enqueueDrain(() => runDrain(h));

    // Fire it three times back to back, as mount + send + retry might.
    const [a, b, c] = await Promise.all([drainOnce(), drainOnce(), drainOnce()]);

    // Every call resolves, and the queue is fully drained by the end — the
    // serialisation delays work, it does not lose any of it.
    expect([a, b, c].every((outcome) => outcome !== undefined)).toBe(true);
    const summary = await h.store.summary();
    expect(summary.complete).toBe(true);
  });
});
