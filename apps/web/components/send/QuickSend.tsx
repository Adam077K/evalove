"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ImagePlus, RefreshCw, Send, X } from "lucide-react";
import { PillButton } from "@/components/ui/PillButton";
import { partnerOf } from "@/lib/fixtures/members";
import { useViewer } from "@/lib/viewer";
import { createBrowserCodec } from "@/lib/photo/codec";
import type { ImageCodec } from "@/lib/photo/types";
import { resolveTz, sharedDayOf } from "@/lib/shared-day";
import {
  createHttpTransport,
  createIndexedDbRecordStore,
  createOpfsBlobStore,
  createOutboxStore,
  createSerialQueue,
  drainOutbox,
  retryNow,
  type OutboxRecord,
  type OutboxStore,
  type SerialQueue,
  type UploadTransport,
} from "@/lib/outbox";

/**
 * The quick-send composer and its outbox.
 *
 * The outbox is persistent per-item state, never a toast: an item is on its
 * way, delivered, or waiting to be tried again — and trying again is a
 * button, not an apology. State here is the same durable OPFS/IndexedDB queue
 * the daily photo pipeline uses (`lib/outbox`) — this file invents no notion
 * of "sent" of its own.
 *
 * A NOTE ON TEXT-ONLY SENDS. There is no table this product's schema for a
 * message that is not a photograph — `photos` is the only place a `POST
 * /api/photos` commit can land, and it always carries bytes. So a note here
 * is always a *caption on a photograph*, never sent alone. That is a real,
 * visible narrowing from the mock this file used to hold (which allowed
 * text-only sends) and it is deliberate: faking a persisted text-only send
 * would be exactly the kind of thing this project exists to stop building.
 * Adding a free-standing message needs its own table and is a product
 * decision for whoever owns that call, not something to invent here.
 */

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

export function QuickSend() {
  const { member } = useViewer();
  const partner = partnerOf(member);

  const [note, setNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [records, setRecords] = useState<OutboxRecord[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Constructed once, lazily. None of these touch OPFS/IndexedDB/fetch at
     construction time — only when a method on them is actually called — so
     building them eagerly here is safe even on the server-rendered pass. */
  const client = useRef<{
    store: OutboxStore;
    transport: UploadTransport;
    codec: ImageCodec;
  } | null>(null);
  const getClient = () => {
    client.current ??= {
      store: createOutboxStore({
        blobs: createOpfsBlobStore(),
        records: createIndexedDbRecordStore(),
      }),
      transport: createHttpTransport(),
      codec: createBrowserCodec(),
    };
    return client.current;
  };

  const refresh = async () => {
    setRecords(await getClient().store.list());
  };

  /*
   * `drain()` is fired from three independent places below — the mount
   * effect, `send()` and `retry()` — and none of them wait for another to
   * finish. Two overlapping runs of `drainOutbox` both read the same pending
   * item, each takes its OWN upload ticket, and each PUTs the bytes to a
   * different storage path under a different `photoId`. The commit
   * endpoint's idempotency on `clientUuid` means only one of the two rows is
   * ever written — the other call's uploaded bytes are then an orphaned
   * object nothing points at and nothing is allowed to delete.
   *
   * `drainQueue` fixes this by construction rather than by coordinating the
   * two runs: every call to `drain()` is enqueued behind whatever the
   * previous call was doing, so a burst of calls becomes a strict sequence.
   * By the time a later call's own `drainOutbox` reads `store.pending()`,
   * the earlier call has already committed the item, and there is nothing
   * left for it to do. See `lib/outbox/serial.ts`.
   */
  const drainQueue = useRef<SerialQueue | null>(null);
  const drain = (): Promise<void> => {
    drainQueue.current ??= createSerialQueue();
    return drainQueue.current(async () => {
      const { store, transport, codec } = getClient();
      await drainOutbox({ store, transport, codec, onChange: () => void refresh() });
      await refresh();
    });
  };

  /* On open: pick up wherever the queue left off. iOS has no Background
     Sync (`lib/outbox/index.ts`), so opening the app again IS the retry
     mechanism — this effect is that mechanism, not an optimisation. */
  useEffect(() => {
    void refresh().then(() => drain());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once, on mount
  }, []);

  /* Object URLs are revoked when replaced or on unmount. */
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const pickPhoto = (f: File | undefined) => {
    if (!f) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(f);
    setPhotoUrl(URL.createObjectURL(f));
    setSendError(null);
  };

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(null);
    setPhotoUrl(null);
  };

  const send = async () => {
    if (!photoFile || sending) return;
    setSending(true);
    setSendError(null);
    try {
      // Durable the moment this resolves — before any network call. Closing
      // the app, losing signal, or iOS killing the tab costs nothing from
      // this instant on. See `lib/outbox/store.ts` for the full guarantee.
      const clientReportedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const sharedDayTz = resolveTz(clientReportedTz, member.homeTimezone);
      const caption = note.trim();

      const result = await getClient().store.enqueueAll([photoFile], {
        kind: "book",
        authorMemberId: member.id,
        sharedDay: sharedDayOf(new Date(), sharedDayTz),
        sharedDayTz,
        clientReportedTz,
        ...(caption !== "" ? { caption } : {}),
      });

      // Only clear the composer for what actually made it to disk. A file
      // the device refused to store stays picked, so nothing is silently
      // lost — the same rule `enqueueAll` itself follows.
      if (result.rejected.length === 0) {
        setNote("");
        clearPhoto();
      } else {
        // Reported, not swallowed — the same rule as a thrown exception
        // below, applied to the failure `enqueueAll` already caught for us.
        setSendError(
          result.rejected[0]?.reason ??
            "The device would not store the photograph. Nothing was sent.",
        );
      }

      await refresh();
      void drain();
    } catch (error) {
      // `enqueueAll` catches a per-file storage failure and reports it via
      // `rejected`, above — but not every failure on this path is a per-file
      // one (`crypto.randomUUID` missing, an OPFS directory handle that
      // throws before the per-file loop even starts). Uncaught, this used to
      // leave the button silently re-enabled with nothing queued and nothing
      // said. Whatever it is, it is shown rather than lost.
      setSendError(
        error instanceof Error
          ? error.message
          : "That didn't go through. Try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const retry = async (clientUuid: string) => {
    await retryNow(getClient().store, clientUuid);
    await refresh();
    void drain();
  };

  const items = [...records].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );

  return (
    <div>
      <header className="mb-7">
        <p className="type-micro text-mute">lighter than the daily photo</p>
        <h1 className="type-hero mt-1.5 text-ink">
          Something small, for {partner.displayName}
        </h1>
      </header>

      {/* The composer. */}
      <section aria-label="Compose" className="card rounded-[1.25rem] p-5">
        {photoUrl ? (
          <div className="relative overflow-hidden rounded-[0.875rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img
              src={photoUrl}
              alt="The photograph about to be sent"
              className="block max-h-72 w-full object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              aria-label="Remove the photograph"
              className="press pill-ink absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="press well flex w-full flex-col items-center justify-center gap-2 rounded-[0.875rem] border-2 border-dashed border-line py-10 text-mute"
          >
            <ImagePlus size={24} strokeWidth={1.6} />
            <span className="type-label">Add a photograph</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="A line to go with it"
          aria-label="A short note"
          className="type-body well mt-3 w-full resize-none rounded-[0.625rem] px-4 py-3 text-ink outline-none placeholder:text-mute"
        />
        {!photoUrl && note.trim() !== "" ? (
          <p className="type-caption mt-2 text-mute">
            Add a photograph — a note travels with one, not alone yet.
          </p>
        ) : null}

        <PillButton
          onClick={() => void send()}
          disabled={!photoFile || sending}
          className="mt-4 w-full"
        >
          <Send size={17} strokeWidth={2} />
          Send to {partner.displayName}
        </PillButton>
        {sendError ? (
          <p role="alert" className="type-caption mt-2 text-center text-danger">
            {sendError}
          </p>
        ) : null}
      </section>

      {/* The outbox. */}
      <section aria-label="Sent today" className="mt-8">
        <h2 className="type-micro mb-3 text-mute">Sent today</h2>
        {items.length === 0 ? (
          <p className="type-caption card rounded-[0.875rem] px-5 py-6 text-center text-mute">
            Nothing yet today. The first small thing changes the shape of
            {" "}{partner.displayName}&rsquo;s afternoon.
          </p>
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {items.map((record) => (
                <motion.li
                  key={record.clientUuid}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING}
                  className="card flex items-center gap-3.5 rounded-[0.875rem] px-4 py-3.5"
                >
                  <StateDot state={record.state} />
                  <div className="min-w-0 flex-1">
                    <p className="type-body truncate text-ink">{summaryOf(record)}</p>
                    <p
                      className={`type-caption mt-0.5 ${
                        record.state === "needs_retry" ? "text-danger" : "text-mute"
                      }`}
                    >
                      {detailOf(record, partner.displayName)}
                    </p>
                  </div>
                  {record.state === "needs_retry" ? (
                    <button
                      type="button"
                      onClick={() => void retry(record.clientUuid)}
                      className="press pill-quiet type-label flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2"
                    >
                      <RefreshCw size={14} strokeWidth={2.1} />
                      Try again
                    </button>
                  ) : null}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}

function StateDot({ state }: { state: OutboxRecord["state"] }) {
  if (state === "committed") {
    return (
      <span className="well flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink">
        <Check size={15} strokeWidth={2.4} />
      </span>
    );
  }
  if (state === "needs_retry") {
    return (
      <span className="well flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-danger">
        <RefreshCw size={14} strokeWidth={2.1} />
      </span>
    );
  }
  /* queued / processing / uploading. A neutral dot: this reports the state of
     a delivery, not who made the thing, so it is not an authorship mark. */
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
      <span
        className="absolute h-1.5 w-1.5 rounded-full bg-mute"
        style={{ animation: "breathe 1.6s var(--ease-io) infinite" }}
        aria-hidden="true"
      />
      <span className="h-1.5 w-1.5 rounded-full bg-mute" />
    </span>
  );
}

function summaryOf(record: OutboxRecord): string {
  return record.caption
    ? `a photograph and a line — "${truncate(record.caption)}"`
    : "a photograph";
}

function detailOf(record: OutboxRecord, partnerName: string): string {
  switch (record.state) {
    case "committed":
      return `with ${partnerName}`;
    case "needs_retry":
      return record.lastError ?? "It didn't go through.";
    default:
      return "on its way";
  }
}

function truncate(s: string): string {
  const t = s.trim();
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}
