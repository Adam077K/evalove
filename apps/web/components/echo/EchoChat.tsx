"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, AudioLines } from "lucide-react";
import { partnerOf } from "@/lib/fixtures/members";
import { partnerPresence, type PresenceGuess } from "@/lib/shared-day";
import { useViewer } from "@/lib/viewer";

/**
 * Echo — a conversation with the record the two of them have kept,
 * not with the other one. Hard line 1 of `AI-PARTNER-SPEC.md`: this
 * must never be mistakable for the real person, so nothing on this
 * surface is addressed to Eva or Adam and nothing is spoken as them.
 * You ask *about* the partner; an echo answers, and what an echo
 * returns is what was actually said.
 *
 * That distinction runs through every string here. Quoting the
 * record is the whole feature. Predicting the person is Framing B,
 * which the spec rejects outright — so no copy on this surface may
 * suggest the thing knows what the other one *would* say.
 *
 * Bubbles: the viewer speaks in their own colour, the echo answers in
 * the partner's — the colour is a citation, not a voice. The header
 * carries the partner's live presence, because the hours when they're
 * asleep are the hours this surface is for.
 *
 * Until the model lands the echo holds the question and says so — a
 * designed limitation, not a fake answer.
 */

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

/**
 * Presence, said in full. The clock belongs to the real person; the
 * reassurance is about the record, never about a stand-in for them.
 */
function presenceLine(
  name: string,
  their: string,
  guess: PresenceGuess,
): string {
  switch (guess) {
    case "asleep":
      return `${name} is asleep right now — ${their} words are still here`;
    case "working":
      return `${name} is at work — ${their} words are still here`;
    case "awake":
      return `${name} is awake now`;
    case "unknown":
      return "no clock to read";
  }
}

interface Bubble {
  id: number;
  from: "viewer" | "echo";
  body: string;
}

export function EchoChat() {
  const { member } = useViewer();
  const partner = partnerOf(member);
  const partnerIsAdam = partner.slug === "adam";
  const their = partnerIsAdam ? "his" : "her";

  const [presence, setPresence] = useState<PresenceGuess | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const read = () => setPresence(partnerPresence(partner.slug).presence);
    read();
    const t = setInterval(read, 60_000);
    return () => clearInterval(t);
  }, [partner.slug]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, thinking]);

  const send = () => {
    const body = draft.trim();
    if (body === "" || thinking) return;
    setDraft("");
    setBubbles((b) => [...b, { id: nextId.current++, from: "viewer", body }]);
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setBubbles((b) => [
        ...b,
        {
          id: nextId.current++,
          from: "echo",
          body: `Echo isn't wired to the record yet — the book, the captions, the dates are all still on the other side of that. Until they're joined up it holds the question rather than inventing an answer, so nothing asked here is lost.`,
        },
      ]);
    }, 1100);
  };

  const prompts = [
    `What window is ${partner.displayName} in right now?`,
    `What did ${partner.displayName} post this week?`,
    "Find us something for Saturday",
  ];

  const partnerGrad = partnerIsAdam ? "var(--grad-adam)" : "var(--grad-eva)";
  const partnerSoft = partnerIsAdam ? "bg-adam-soft" : "bg-eva-soft";
  const partnerInk = partnerIsAdam ? "text-adam-deep" : "text-eva-deep";
  const viewerGrad = partnerIsAdam ? "var(--grad-eva)" : "var(--grad-adam)";
  const dot = partnerIsAdam ? "bg-adam" : "bg-eva";

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col">
      <header className="flex items-center gap-4">
        {/* The partner's colour, deliberately not the partner's
            initial: a monogram in a chat header is an avatar, and an
            avatar is the impersonation this surface may not make. */}
        <span
          aria-hidden="true"
          className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full text-on-accent shadow-e2"
          style={{ background: partnerGrad }}
        >
          <AudioLines size={22} strokeWidth={1.9} />
        </span>
        <div>
          <h1 className="type-title text-ink">Echo</h1>
          <p className="type-caption mt-0.5 flex items-center gap-1.5 text-mute">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span
                className={`absolute inset-0 rounded-full ${dot}`}
                style={{ animation: "breathe 3.2s var(--ease-io) infinite" }}
              />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
            </span>
            {presence === null
              ? "reading the clock…"
              : presenceLine(partner.displayName, their, presence)}
          </p>
        </div>
      </header>

      {/* The conversation. */}
      <div className="flex-1 pt-6">
        {bubbles.length === 0 ? (
          <div className="flex flex-col items-center px-4 pt-10 text-center">
            <span
              aria-hidden="true"
              className="h-20 w-20 rounded-full opacity-80 blur-[2px]"
              style={{
                background: partnerGrad,
                animation: "breathe 4.5s var(--ease-io) infinite",
              }}
            />
            <h2 className="type-title mt-6 text-ink">
              Everything {partner.displayName} has already said
            </h2>
            <p className="type-body measure mt-2 text-mute">
              Echo reads back what the two of them have kept here — the book,
              the captions, the dates, the windows. It will quote{" "}
              {partner.displayName} word for word. It will never guess what{" "}
              {partner.displayName} would say. Ask it at four in the morning;
              it stays up.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft(p)}
                  className={`press type-label rounded-full px-4 py-2 ${partnerSoft} ${partnerInk}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-3 pb-4">
            <AnimatePresence initial={false}>
              {bubbles.map((b) => (
                <motion.li
                  key={b.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING}
                  className={`flex ${b.from === "viewer" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`type-body max-w-[80%] rounded-[1.375rem] px-4 py-2.5 ${
                      b.from === "viewer"
                        ? "rounded-br-md text-on-accent"
                        : "card rounded-bl-md text-ink"
                    }`}
                    style={
                      b.from === "viewer" ? { background: viewerGrad } : undefined
                    }
                  >
                    {b.body}
                  </p>
                </motion.li>
              ))}
              {thinking ? (
                <motion.li
                  key="thinking"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING}
                  className="flex justify-start"
                  aria-label="Echo is looking through the record"
                >
                  <span className="card flex items-center gap-1.5 rounded-[1.375rem] rounded-bl-md px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${dot}`}
                        style={{
                          animation: "breathe 1.2s var(--ease-io) infinite",
                          animationDelay: `${i * 0.18}s`,
                        }}
                      />
                    ))}
                  </span>
                </motion.li>
              ) : null}
            </AnimatePresence>
            <div ref={endRef} />
          </ul>
        )}
      </div>

      {/* The composer — parked one rem above the dock's footprint
          (see DOCK_FOOTPRINT in components/chrome/Dock.tsx), so the
          home indicator pushes it up rather than under the glass. */}
      <form
        className="glass-strong sticky bottom-[calc(5rem+max(1rem,env(safe-area-inset-bottom)))] mt-4 flex items-center gap-2 rounded-full p-1.5 pl-5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask about ${partner.displayName}`}
          aria-label={`Ask Echo about ${partner.displayName}`}
          className="type-body min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-mute"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={draft.trim() === "" || thinking}
          className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-accent disabled:opacity-40"
          style={{ background: partnerGrad }}
        >
          <ArrowUp size={19} strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
