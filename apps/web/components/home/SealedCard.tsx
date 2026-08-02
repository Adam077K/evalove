"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mail, MailOpen, Send } from "lucide-react";
import { memberById, partnerOf } from "@/lib/fixtures/members";
import { LEFT_KIND_LABEL, leftFor } from "@/lib/fixtures/left";
import { localTime } from "@/lib/time";
import { useViewer } from "@/lib/viewer";

/**
 * The sealed shelf — what the other one left.
 *
 * Sealed things are opaque on purpose: who, roughly when, what kind.
 * Never a preview. Opening breaks the seal in place — the card turns
 * from violet glass into the note itself, in the author's own colour.
 *
 * Fixture note: the wired app fetches the body on open; here one
 * line stands in so the opened state is real, not lorem.
 */

const FIXTURE_NOTE =
  "The coffee place drew a heart in the foam this morning. Adam almost photographed it, then decided Eva should get the better version on Saturday.";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

export function SealedCard() {
  const { member } = useViewer();
  const partner = partnerOf(member);
  const waiting = leftFor(member.id);
  const [opened, setOpened] = useState(false);

  const item = waiting[0];

  /* Empty shelf — designed, and an invitation. */
  if (!item) {
    return (
      <section aria-label="Left for later" className="card rounded-[1.75rem] p-5">
        <div className="flex items-center gap-4">
          <span className="well flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-mute">
            <Mail size={20} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="type-card text-ink">Nothing sealed right now</h2>
            <p className="type-caption mt-0.5 text-mute">
              When {partner.displayName} leaves something, it waits here.
            </p>
          </div>
        </div>
        <Link
          href="/send"
          className="press mt-4 inline-flex items-center gap-2 rounded-full bg-us-soft px-4 py-2 text-us-deep"
        >
          <Send size={15} strokeWidth={2} />
          <span className="type-label">Leave something for {partner.displayName}</span>
        </Link>
      </section>
    );
  }

  const from = memberById(item.fromMemberId);
  const fromIsAdam = from.slug === "adam";
  const their = fromIsAdam ? "his" : "her";
  const inkClass = fromIsAdam ? "text-adam-deep" : "text-eva-deep";
  const when = `${localTime(item.leftAt, from.homeTimezone)} ${their} time`;

  return (
    <section aria-label="Left for later">
      <AnimatePresence mode="wait" initial={false}>
        {!opened ? (
          <motion.button
            key="sealed"
            type="button"
            onClick={() => setOpened(true)}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={SPRING}
            className="press relative block w-full overflow-hidden rounded-[1.75rem] p-5 text-left text-on-accent shadow-glow-us"
            style={{ background: "var(--grad-us)" }}
          >
            {/* a slow light sweep across the seal */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)",
                animation: "shimmer 3.4s var(--ease-io) infinite",
              }}
            />
            <div className="relative flex items-center gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
                }}
              >
                <Mail size={20} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <h2 className="type-card">
                  {from.displayName} left {LEFT_KIND_LABEL[item.kind]} for{" "}
                  {member.displayName}
                </h2>
                <p className="type-caption mt-0.5 opacity-80">
                  sealed · left at {when}
                </p>
              </div>
              <span className="type-label ml-auto shrink-0 rounded-full bg-white/20 px-3.5 py-1.5">
                Open
              </span>
            </div>
          </motion.button>
        ) : (
          <motion.figure
            key="opened"
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={SPRING}
            className="card rounded-[1.75rem] p-5"
          >
            <div className="flex items-center gap-2.5">
              <MailOpen size={17} strokeWidth={1.9} className={inkClass} />
              <figcaption className={`type-label ${inkClass}`}>
                {from.displayName}, {when}
              </figcaption>
            </div>
            <blockquote
              className="mt-3 text-ink"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "1.0625rem",
                lineHeight: 1.5,
                fontVariationSettings: '"opsz" 30, "SOFT" 70',
              }}
            >
              {FIXTURE_NOTE}
            </blockquote>
          </motion.figure>
        )}
      </AnimatePresence>
    </section>
  );
}
