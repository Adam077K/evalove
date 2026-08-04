"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { memberById } from "@/lib/fixtures/members";
import { LEFT_KIND_LABEL, leftFor } from "@/lib/fixtures/left";
import { partnerPresence } from "@/lib/shared-day";
import { localTime } from "@/lib/time";
import { useViewer } from "@/lib/viewer";
import { Mounted, Taped } from "@/components/materials";

/**
 * The sealed thing on the table — what the other one left while you
 * slept.
 *
 * This is the sealed-to-opened ceremony, the signature interaction of
 * the product. It had zero import sites after the v7 rebuild and
 * looked like dead code; it was unreachable, not unwanted. It is now
 * an object on Today's paper table: a folded note, taped down, that
 * opens into the sender's own hand.
 *
 * THE SEAL FIRES ONLY ON GENUINE SLEEP (law §0, non-negotiable).
 * Never a manufactured timer, never a global reveal clock. The gate
 * here is the recipient's own inferred presence at the instant the
 * thing was left: if you were genuinely asleep when it was sealed,
 * you meet it sealed and open it yourself. If you were awake when it
 * was left, there is no seal to break — it lies open on the table
 * from the start. Both branches render the same opened note; only
 * the ceremony is conditional.
 *
 * NOTHING WAITING → NOTHING RENDERS. The previous empty state ("When
 * Adam leaves something, it waits here" + a Leave-something button)
 * violated two behavioural rules at once: it was a slot shaped like
 * an absence, and it solicited composing. Both are structural
 * violations now (§0: composing is never solicited; no slot, no
 * prepared place). An empty shelf is not a designed state — it is
 * nothing.
 *
 * Sealed things stay opaque on purpose: who, roughly when, what
 * kind. Never a preview.
 *
 * The motion is unchanged from the original, because it is the whole
 * point of the component: `mode="popLayout"` lets the seal keep
 * animating on top while the note takes its place underneath, so for
 * ~300ms both exist and you watch one become the other. The seal
 * recedes on Vaul's measured curve; the note arrives on this app's
 * own 300/30 spring — markedly stiffer than motion's default, which
 * is right for a thing made of paper. Do not reset it. The whole
 * gesture lands around 500ms: drawer-class, because opening
 * something someone sealed for you is a drawer-class event.
 *
 * Reduced motion: full removal, the Sonner-shipped behaviour. The
 * swap is instant.
 *
 * Fixture note: the wired app fetches the body on open; one line
 * stands in so the opened state is real, not lorem.
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
  const waiting = leftFor(member.id);
  const [opened, setOpened] = useState(false);
  const reduced = useReducedMotion();

  const item = waiting[0];

  /* Nothing waiting: nothing on the table. No shelf, no invitation. */
  if (!item) return null;

  /* The genuine-sleep gate. Was the recipient asleep, by their own
     clock, at the instant this was sealed? Inference only — nothing
     reports being awake, and `partnerPresence` reads a wall clock,
     not a device. `unknown` does not seal: the ceremony must never
     be more confident than the truth. */
  const sealedWhileAsleep =
    partnerPresence(member.slug, new Date(item.leftAt)).presence === "asleep";

  const from = memberById(item.fromMemberId);
  const fromIsAdam = from.slug === "adam";
  const their = fromIsAdam ? "his" : "her";
  const hand = fromIsAdam ? "font-adam text-[19px]" : "font-eva text-[23px]";
  const when = `${localTime(item.leftAt, from.homeTimezone)} ${their} time`;

  const showSealed = sealedWhileAsleep && !opened;

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
        {showSealed ? (
          <motion.button
            key="sealed"
            type="button"
            onClick={() => setOpened(true)}
            exit={
              reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6 }
            }
            transition={reduced ? { duration: 0 } : RECEDE}
            className="press block w-max text-left"
          >
            {/* The sealed note: white stock, taped down across one
                corner — the classic fastening, and it stays off the
                words (a perpendicular strip crossing the top edge ran
                straight through "a note" in the first capture). Opaque
                on purpose — who, roughly when, what kind. Never a
                preview. */}
            <Mounted id={item.id} context="note" elevation={3}>
              <Taped variant="washi-terracotta" placement="top-left" angle={-3}>
                <div className="bg-surface px-5 pb-4 pt-5">
                  <p className="type-body text-ink">
                    {from.displayName} left {LEFT_KIND_LABEL[item.kind]}
                  </p>
                  <p className="type-micro mt-1 normal-case text-mute">
                    sealed · {when}
                  </p>
                  <p className="type-micro mt-3 normal-case text-ink underline underline-offset-4">
                    open
                  </p>
                </div>
              </Taped>
            </Mounted>
          </motion.button>
        ) : (
          <motion.figure key="opened" {...enter} className="w-max">
            {/* Open, the note is his writing on the paper — their
                hand, per the register table, never the app's voice. */}
            <Mounted id={`${item.id}:open`} context="note" elevation={3}>
              <div className="bg-surface px-5 pb-5 pt-4">
                <figcaption className="type-micro normal-case text-mute">
                  {from.displayName} · {when}
                </figcaption>
                <blockquote
                  className={`${hand} mt-3 max-w-[16rem] leading-snug text-ink`}
                >
                  {FIXTURE_NOTE}
                </blockquote>
              </div>
            </Mounted>
          </motion.figure>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
