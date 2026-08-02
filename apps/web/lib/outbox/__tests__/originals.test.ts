/**
 * Originals go later, and only over wi-fi.
 *
 * The two things that would hurt are opposites, so both are asserted: sending
 * 750 MB over her mobile data, and dropping the originals on the floor because
 * something decided they had had their chance.
 */

import { describe, expect, it, vi } from "vitest";

import { describeConnection, mayUploadOriginals } from "@/lib/photo/network";
import { createOutboxStore } from "@/lib/outbox/store";
import { uploadDeferredOriginals } from "@/lib/outbox/originals";
import { drainOutbox } from "@/lib/outbox/uploader";
import type { OriginalTransport } from "@/lib/outbox/originals";
import {
  createMemoryBlobStore,
  createMemoryRecordStore,
  createNodeCodec,
  createScriptedTransport,
  frozenClock,
  noJitter,
  sequentialUuids,
} from "@/lib/outbox/__tests__/support/doubles";

const CONTEXT = {
  kind: "book" as const,
  authorMemberId: "22222222-2222-4222-8222-222222222222",
  sharedDay: "2026-08-02",
  sharedDayTz: "Europe/Stockholm",
  clientReportedTz: "Europe/Stockholm",
};

function files(count: number): File[] {
  return Array.from(
    { length: count },
    (_, i) =>
      new File([new Uint8Array(96 + i).fill(i + 1) as BlobPart], `IMG_${i}.HEIC`, {
        type: "image/heic",
      }),
  );
}

function originalTransport(): OriginalTransport & { puts: number } {
  const transport = {
    puts: 0,
    async requestOriginalUrl(photoId: string) {
      return { url: `https://storage.test/${photoId}/original` };
    },
    async putObject() {
      transport.puts++;
    },
    async confirmOriginal() {},
  };
  return transport;
}

/** A committed batch with its originals still on the device. */
async function committedBatch(count: number) {
  const blobs = createMemoryBlobStore();
  const records = createMemoryRecordStore();
  const store = createOutboxStore({
    blobs,
    records,
    newUuid: sequentialUuids(),
    now: frozenClock(),
  });
  const transport = createScriptedTransport({ isDurable: async () => true });
  await store.enqueueAll(files(count), CONTEXT);
  await drainOutbox({
    store,
    transport,
    codec: createNodeCodec({ width: 160, height: 120 }),
    now: frozenClock(),
    random: noJitter,
  });
  return { store, blobs };
}

describe("deferred originals", () => {
  it("keeps the source bytes after the photograph commits", async () => {
    const { store } = await committedBatch(3);

    for (const record of await store.list()) {
      expect(record.state).toBe("committed");
      // Released at commit, and the whole wi-fi pass would be impossible.
      expect(record.originalPending).toBe(true);
      expect(await store.blob(record.blobKeys.source)).not.toBeNull();
      // The derivatives are gone — those are on the server now.
      expect(await store.blob(record.blobKeys.display ?? "")).toBeNull();
      expect(await store.blob(record.blobKeys.thumb ?? "")).toBeNull();
    }
  });

  it("sends nothing over mobile data", async () => {
    const { store } = await committedBatch(3);
    const transport = originalTransport();

    const outcome = await uploadDeferredOriginals({
      store,
      transport,
      connection: "metered",
    });

    expect(outcome.skipped).toBe(true);
    expect(outcome.uploaded).toBe(0);
    expect(transport.puts).toBe(0);
    // Still waiting, still on the device.
    expect(outcome.remaining).toBe(3);
  });

  it("sends nothing when data saver is on, whatever the connection", async () => {
    const { store } = await committedBatch(2);
    const transport = originalTransport();
    const outcome = await uploadDeferredOriginals({
      store,
      transport,
      connection: "save-data",
    });
    expect(outcome.skipped).toBe(true);
    expect(transport.puts).toBe(0);
  });

  it("holds back when it cannot tell — iOS Safari reports nothing", async () => {
    // The default has to be chosen rather than inherited: a delayed original
    // costs a day, one that ate a roaming allowance costs money.
    expect(mayUploadOriginals("unknown")).toBe(false);
    const { store } = await committedBatch(2);
    const transport = originalTransport();
    const outcome = await uploadDeferredOriginals({
      store,
      transport,
      connection: "unknown",
    });
    expect(outcome.skipped).toBe(true);
  });

  it("sends them on wi-fi and only then lets the bytes go", async () => {
    const { store } = await committedBatch(3);
    const transport = originalTransport();

    const outcome = await uploadDeferredOriginals({
      store,
      transport,
      connection: "unmetered",
    });

    expect(outcome.skipped).toBe(false);
    expect(outcome.uploaded).toBe(3);
    expect(outcome.remaining).toBe(0);
    expect(transport.puts).toBe(3);
    // Fully done: record and bytes both released.
    expect(await store.list()).toHaveLength(0);
  });

  it("can be sent anyway when the person asks", async () => {
    const { store } = await committedBatch(2);
    const transport = originalTransport();
    const outcome = await uploadDeferredOriginals({
      store,
      transport,
      connection: "metered",
      force: true,
    });
    expect(outcome.skipped).toBe(false);
    expect(outcome.uploaded).toBe(2);
  });

  it("does not lose the photograph when the original cannot be sent", async () => {
    const { store } = await committedBatch(2);
    const transport = originalTransport();
    transport.putObject = vi.fn(async () => {
      throw new Error("The connection dropped partway through.");
    });

    const outcome = await uploadDeferredOriginals({
      store,
      transport,
      connection: "unmetered",
    });

    expect(outcome.uploaded).toBe(0);
    // Still pending, still committed, still on the device for the next attempt.
    for (const record of await store.list()) {
      expect(record.state).toBe("committed");
      expect(record.originalPending).toBe(true);
      expect(await store.blob(record.blobKeys.source)).not.toBeNull();
    }
  });

  it("stops asking when the bytes have been evicted", async () => {
    const { store, blobs } = await committedBatch(1);
    const [record] = await store.list();
    expect(record).toBeDefined();

    // The browser reclaimed the origin's storage. The photograph itself is
    // safe — display and thumb are already on the server.
    await blobs.delete(record?.blobKeys.source ?? "");

    const transport = originalTransport();
    const outcome = await uploadDeferredOriginals({
      store,
      transport,
      connection: "unmetered",
    });

    // Nothing was sent, and nothing will be asked for again: retrying forever
    // against bytes that no longer exist is a spinner with no end.
    expect(transport.puts).toBe(0);
    expect(outcome.remaining).toBe(0);
    const [after] = await store.list();
    expect(after?.state).toBe("committed");
    expect(after?.originalPending).toBe(false);
  });
});

describe("describeConnection", () => {
  it("says what is happening without jargon or apology", () => {
    expect(describeConnection("metered")).toContain("waiting for wi-fi");
    expect(describeConnection("offline")).toContain("saved on this phone");
    expect(describeConnection("unmetered")).toContain("uploading");
  });
});
