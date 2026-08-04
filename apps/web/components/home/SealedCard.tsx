"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mail, MailOpen, Send } from "lucide-react";
import { memberById, partnerOf } from "@/lib/fixtures/members";
import { LEFT_KIND_LABEL, leftFor } from "@/lib/fixtures/left";
import { localTime } from "@/lib/time";
import { useViewer } from "@/lib/viewer";

/**
 * The sealed shelf — what the other one left.
 *
 * This is the signature moment of the product, and it was already
 * built. One of them is always awake to leave something the other
 * finds hours later; opening it is where the seven-hour gap turns
 * into a gift instead of a delay. It was buried under a violet
 * gradient fill, a glow and a repeating shimmer sweep, so what you
 * saw first was the decoration rather than the thing.
 *
 * What it is now: an envelope on a desk. The author's own ink down
 * the left edge — two pixels, the only colour in the composition —
 * a closed seal, and the time it was left in *their* local hours,
 * because the whole point is that it was their morning and your
 * night.
 *
 * Sealed things stay opaque on purpose: who, roughly when, what
 * kind. Never a preview.
 *
 * The motion, which is the whole point of the component.
 *
 * It has to be an *opening*, not a card animating. The first attempt
 * was `AnimatePresence mode="wait"`, which sequences unmount then
 * mount — so the seal was gone before the note existed, nothing ever
 * receded behind anything, and there was no shared space for the note
 * to arrive into. That is the default React exit animation wearing
 * this component's comments.
 *
 * `mode="popLayout"` is the fix: the seal leaves the layout flow and
 * keeps animating on top while the note takes its place underneath,
 * so for ~300ms both exist and you watch one become the other. The
 * seal recedes — scaling back and lifting slightly, never sliding
 * away — on Vaul's measured `cubic-bezier(0.32, 0.72, 0, 1)`, and the
 * note comes forward on this app's own spring. The whole gesture
 * lands around 500ms, which is drawer-class, because opening
 * something someone sealed for you is a drawer-class event.
 *
 * `layout` on the section absorbs the height change: the opened note
 * is taller than the seal, and without it the gesture would end by
 * shoving everything below it down the page.
 *
 * The spring is 300/30, kept exactly as it was. It is markedly
 * stiffer and less bouncy than motion's own 100/10/1 default; that
 * is someone's deliberate taste and it is right for a thing made of
 * paper. Do not reset it to the library default.
 *
 * The seal is their real gap and nothing else. No countdown, no
 * timer, no global reveal clock — a fixed clock would structurally
 * privilege one partner's morning over the other's, and with seven
 * hours between them that is broken by construction. It unlocks on
 * arrival because it arrived.
 *
 * Fixture note: the wired app fetches the body on open; here one
 * line stands in so the opened state is real, not lorem.
 */

const FIXTURE_NOTE =
  "The coffee place drew a heart in the foam this morning. Eva should get the better version on Saturday, so Adam left this one unphotographed.";

/** This app's own spring. Stiffer than the library default, on purpose. */
const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

/** The seal receding. Vaul's measured curve; long enough to overlap
    the note's arrival, so the two states genuinely share the space. */
const RECEDE = { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const };

export function SealedCard() {
  const { member } = useViewer();
  const partner = partnerOf(member);
  const waiting = leftFor(member.id);
  const [opened, setOpened] = useState(false);
  const reduced = useReducedMotion();

  const item = waiting[0];

  /* Empty shelf — designed, and an invitation. */
  if (!item) {
    return (
      <section aria-label="Left for later" className="card rounded-[1.25rem] p-5">
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
          className="press pill-ink mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
        >
          <Send size={15} strokeWidth={2} />
          <span className="type-label">
            Leave something for {partner.displayName}
          </span>
        </Link>
      </section>
    );
  }

  const from = memberById(item.fromMemberId);
  const fromIsAdam = from.slug === "adam";
  const their = fromIsAdam ? "his" : "her";
  const edgeClass = fromIsAdam ? "edge-adam" : "edge-eva";
  const when = `${localTime(item.leftAt, from.homeTimezone)} ${their} time`;

  /* Reduced motion: Sonner's own shipped CSS removes transitions and
     animations outright rather than degrading them to opacity, and
     CSS alone can't reach motion/react. So the swap is instant. */
  const enter = reduced
    ? { initial: false as const, animate: {}, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.98, y: 14 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: SPRING,
      };

  return (
    <motion.section aria-label="Left for later" layout={!reduced}>
      <AnimatePresence mode="popLayout" initial={false}>
        {!opened ? (
          <motion.button
            key="sealed"
            type="button"
            onClick={() => setOpened(true)}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, y: -6 }
            }
            transition={reduced ? { duration: 0 } : RECEDE}
            className={`press card ${edgeClass} block w-full rounded-[1.25rem] p-5 text-left`}
          >
            <div className="flex items-start gap-4">
              <span className="well flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink">
                <Mail size={20} strokeWidth={1.8} />
              </span>
              {/* Two lines, one name each — never "Adam left a note
                  for Eva". Eva before Adam is a founder decision and
                  the rule is to rewrite the sentence rather than
                  reorder the names, so the recipient's line carries
                  the waiting and the sender's line carries the seal.
                  Both facts survive; neither name queues behind the
                  other. */}
              <div className="min-w-0 flex-1">
                <h2 className="type-card text-ink">
                  {from.displayName} left {LEFT_KIND_LABEL[item.kind]}
                </h2>
                <p className="type-caption mt-0.5 text-mute">
                  sealed by {from.displayName} · {when}
                </p>
                {/* On its own line, not squeezed against the text.
                    As `ml-auto` it narrowed the column until the
                    timestamp orphaned one word — "8:12 am his / time" —
                    in the most important card on the surface. */}
                <span className="type-label pill-ink mt-3 inline-block rounded-full px-3.5 py-1.5">
                  Open
                </span>
              </div>
            </div>
          </motion.button>
        ) : (
          <motion.figure
            key="opened"
            {...enter}
            className={`card ${edgeClass} rounded-[1.25rem] p-5`}
          >
            <div className="flex items-center gap-2.5 text-mute">
              <MailOpen size={17} strokeWidth={1.9} />
              <figcaption className="type-micro normal-case">
                {from.displayName} · {when}
              </figcaption>
            </div>
            <blockquote className="type-quote measure mt-3 text-ink">
              {FIXTURE_NOTE}
            </blockquote>
          </motion.figure>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
