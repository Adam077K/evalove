"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ImagePlus, RefreshCw, Send, X } from "lucide-react";
import { PillButton } from "@/components/ui/PillButton";
import { partnerOf } from "@/lib/fixtures/members";
import { useViewer } from "@/lib/viewer";

/**
 * The quick-send composer and its outbox.
 *
 * The outbox is persistent per-item state, never a toast: an item is
 * on its way, delivered, or waiting to be tried again — and trying
 * again is a button, not an apology. One fixture item arrives in
 * `needs_retry` so the state is real on this build.
 */

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

type SentState = "on_its_way" | "delivered" | "needs_retry";

interface SentItem {
  id: number;
  summary: string;
  state: SentState;
  detail?: string;
}

export function QuickSend() {
  const { member } = useViewer();
  const partner = partnerOf(member);

  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sent, setSent] = useState<SentItem[]>([
    {
      id: 0,
      summary: "a photograph, from earlier",
      state: "needs_retry",
      detail: "The connection dropped partway through.",
    },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  /* Object URLs are revoked when replaced or on unmount. */
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const pickPhoto = (f: File | undefined) => {
    if (!f) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(f));
  };

  const deliver = (id: number, delay: number) => {
    window.setTimeout(() => {
      setSent((items) =>
        items.map((it) =>
          it.id === id ? { ...it, state: "delivered" as const } : it,
        ),
      );
    }, delay);
  };

  const send = () => {
    const hasNote = note.trim() !== "";
    if (!hasNote && !photoUrl) return;
    const summary =
      photoUrl && hasNote
        ? `a photograph and a line — "${truncate(note)}"`
        : photoUrl
          ? "a photograph"
          : `"${truncate(note)}"`;
    const id = nextId.current++;
    setSent((items) => [{ id, summary, state: "on_its_way" as const }, ...items]);
    setNote("");
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    deliver(id, 1400);
  };

  const retry = (id: number) => {
    setSent((items) =>
      items.map((it) =>
        it.id === id
          ? { ...it, state: "on_its_way" as const, detail: undefined }
          : it,
      ),
    );
    deliver(id, 1600);
  };

  return (
    <div>
      <header className="mb-7">
        <p className="type-micro text-mute">lighter than the daily photo</p>
        <h1 className="type-hero mt-1.5 text-ink">
          Something small, for {partner.displayName}
        </h1>
      </header>

      {/* The composer. */}
      <section aria-label="Compose" className="card rounded-[1.75rem] p-5">
        {photoUrl ? (
          <div className="relative overflow-hidden rounded-[1.25rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img
              src={photoUrl}
              alt="The photograph about to be sent"
              className="block max-h-72 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(photoUrl);
                setPhotoUrl(null);
              }}
              aria-label="Remove the photograph"
              className="press absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="press well flex w-full flex-col items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-line py-10 text-mute"
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
          placeholder="A line to go with it — or instead of it"
          aria-label="A short note"
          className="type-body well mt-3 w-full resize-none rounded-[0.875rem] px-4 py-3 text-ink outline-none placeholder:text-mute focus:shadow-[0_0_0_3px_var(--us-tint)]"
        />

        <PillButton
          ink={member.slug}
          onClick={send}
          disabled={note.trim() === "" && !photoUrl}
          className="mt-4 w-full disabled:opacity-50"
        >
          <Send size={17} strokeWidth={2} />
          Send to {partner.displayName}
        </PillButton>
      </section>

      {/* The outbox. */}
      <section aria-label="Sent today" className="mt-8">
        <h2 className="type-micro mb-3 text-mute">Sent today</h2>
        {sent.length === 0 ? (
          <p className="type-caption card rounded-[1.25rem] px-5 py-6 text-center text-mute">
            Nothing yet today. The first small thing changes the shape of
            {" "}{partner.displayName}&rsquo;s afternoon.
          </p>
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {sent.map((it) => (
                <motion.li
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING}
                  className="card flex items-center gap-3.5 rounded-[1.25rem] px-4 py-3.5"
                >
                  <StateDot state={it.state} />
                  <div className="min-w-0 flex-1">
                    <p className="type-body truncate text-ink">{it.summary}</p>
                    <p
                      className={`type-caption mt-0.5 ${
                        it.state === "needs_retry" ? "text-danger" : "text-mute"
                      }`}
                    >
                      {it.state === "on_its_way"
                        ? "on its way"
                        : it.state === "delivered"
                          ? `with ${partner.displayName}`
                          : (it.detail ?? "It didn't go through.")}
                    </p>
                  </div>
                  {it.state === "needs_retry" ? (
                    <button
                      type="button"
                      onClick={() => retry(it.id)}
                      className="press type-label flex shrink-0 items-center gap-1.5 rounded-full bg-us-soft px-3.5 py-2 text-us-deep"
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

function StateDot({ state }: { state: SentState }) {
  if (state === "delivered") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-us-soft text-us-deep">
        <Check size={15} strokeWidth={2.4} />
      </span>
    );
  }
  if (state === "needs_retry") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
        <RefreshCw size={14} strokeWidth={2.1} />
      </span>
    );
  }
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
      <span
        className="absolute h-2.5 w-2.5 rounded-full bg-us"
        style={{ animation: "breathe 1.6s var(--ease-io) infinite" }}
        aria-hidden="true"
      />
      <span className="h-2.5 w-2.5 rounded-full bg-us" />
    </span>
  );
}

function truncate(s: string): string {
  const t = s.trim();
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}
