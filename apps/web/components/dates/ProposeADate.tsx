"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import { placeWindow, sharedDaysFrom } from "@/lib/date-windows";
import { DATE_KINDS, type DateKindEntry } from "@/lib/dates/kinds";
import { windowById } from "@/lib/shared-day";
import { useViewer } from "@/lib/viewer";
import { PillButton } from "@/components/ui/PillButton";

import { clockLine, dayLine, otherThan, type MemberLite } from "./plan-copy";

import type { WindowId } from "@/lib/shared-day";
import type { IsoDate } from "@/lib/types";

/**
 * The first thing on the Dates page: asking for one.
 *
 * The founder opened this route and said "where is the date thing? I don't
 * know where are the dates". He was right — there was nothing here to do. Nine
 * buttons changed a local `useState` and every card on the screen was an inert
 * `<li>`. This is the thing that was missing, and it is deliberately the first
 * object on the paper rather than the last: a screen whose primary act is
 * below two shelves of reading is a screen whose primary act is not findable.
 *
 * WHAT IS SHOWN AND WHY. A kind, a day, a window, and both wall clocks. That
 * last part is the whole design: a date between two clocks seven hours apart
 * is not "8pm", it is "3pm for Eva and 10pm for Adam", and a proposal that
 * shows one of those is a proposal one of them has to do arithmetic on.
 *
 * WHAT IS NOT SHOWN. No count of dates proposed, agreed or had. No streak, no
 * badge, no "seen". No relative time anywhere — see `plan-copy.ts`.
 */

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34 };

/** How far ahead the day rail offers. A fortnight is more than enough. */
const DAYS_OFFERED = 14;

/** How many days with something available the rail actually shows. */
const DAY_CHIPS = 7;

/* The clock, as an external store.
 *
 * "What time is it" has a different answer on a build machine and on a phone,
 * so it cannot be read during a render that has to match on both. React's
 * shape for that is `useSyncExternalStore` with a separate server snapshot —
 * not a `setState` in an effect, which says the same thing with a cascading
 * render, and not a ref written during render. Both are lint errors here, and
 * both are right to be.
 *
 * The three callbacks are module-level so they are referentially stable, and
 * the instant is cached because `getSnapshot` runs on every render: a fresh
 * `Date` each time is a new object each time, and the store would never
 * settle.
 *
 * The cache means one instant per page load. That is deliberate — nothing on
 * this screen ticks — and its only cost is a rail that goes on offering a
 * window which closed while the phone sat on a table. `proposeDate` refuses
 * that with its own sentence, so the worst case is a legible no rather than a
 * date at the wrong hour.
 */
let clientNow: Date | null = null;
const subscribeNever = (): (() => void) => (): void => {};
const nowOnClient = (): Date => (clientNow ??= new Date());
const nowOnServer = (): null => null;

interface Slot {
  day: IsoDate;
  windowId: WindowId;
  opensAt: Date;
  closesAt: Date;
  /** The band's own label, e.g. "the long overlap". Never a clock reading. */
  label: string;
}

/**
 * Every (day, window) a kind can still be proposed for.
 *
 * `now` is null until the component mounts, and while it is null nothing is
 * filtered. Server and client must render the same markup, and "has this
 * window closed" is a question whose answer differs between a build machine
 * and a phone — so it is asked only once there is a phone to ask it on.
 */
function slotsFor(
  kind: DateKindEntry,
  today: IsoDate,
  now: Date | null,
): Slot[] {
  const found: Slot[] = [];
  for (const day of sharedDaysFrom(today, DAYS_OFFERED)) {
    for (const windowId of kind.windowFit) {
      const placed = placeWindow(day, windowId);
      if (placed === null) continue;
      if (now !== null && placed.closesAt.getTime() <= now.getTime()) continue;
      found.push({
        day,
        windowId,
        opensAt: placed.opensAt,
        closesAt: placed.closesAt,
        label: placed.label,
      });
    }
  }
  return found.sort((a, b) => a.opensAt.getTime() - b.opensAt.getTime());
}

export function ProposeADate({
  today,
  members,
}: {
  /** The shared day the viewer is living, resolved on the server. */
  today: IsoDate;
  members: readonly MemberLite[];
}) {
  const router = useRouter();
  const { member } = useViewer();

  const [kindSlug, setKindSlug] = useState<string>(DATE_KINDS[0]?.slug ?? "");
  const [preferredDay, setPreferredDay] = useState<IsoDate | null>(null);
  const [preferredWindow, setPreferredWindow] = useState<WindowId | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  /* `null` while rendering on the server, a real instant on the phone. Until
     it is a real instant nothing is filtered, so the two renders agree. */
  const now = useSyncExternalStore(subscribeNever, nowOnClient, nowOnServer);

  const kind = DATE_KINDS.find((k) => k.slug === kindSlug) ?? DATE_KINDS[0];
  const slots = useMemo(
    () => (kind === undefined ? [] : slotsFor(kind, today, now)),
    [kind, today, now],
  );

  /* Selection is derived, never synchronised. A preference that no longer
     names a real slot — because the kind changed, or because the window it
     pointed at has closed — simply loses to the soonest one, with no effect
     to keep in step and no state that can disagree with what is drawn. */
  const chosen =
    slots.find((s) => s.day === preferredDay && s.windowId === preferredWindow) ??
    slots.find((s) => s.day === preferredDay) ??
    slots[0];

  const days = [...new Set(slots.map((s) => s.day))].slice(0, DAY_CHIPS);
  const windowsOnDay = slots.filter((s) => s.day === chosen?.day);

  const partner = otherThan(members, member.slug);

  async function propose(): Promise<void> {
    if (chosen === undefined || kind === undefined || sending) return;
    setSending(true);
    setRefused(null);
    try {
      const response = await fetch("/api/dates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: kind.slug,
          sharedDay: chosen.day,
          windowId: chosen.windowId,
          ...(note.trim() === "" ? {} : { note: note.trim() }),
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setRefused(messageOf(body));
        return;
      }
      setNote("");
      // The proposal now belongs to the server-rendered list below.
      router.refresh();
    } catch {
      setRefused("that did not reach the server");
    } finally {
      setSending(false);
    }
  }

  if (kind === undefined) return null;

  return (
    <section aria-labelledby="propose-title">
      <h2 id="propose-title" className="type-micro mb-4 text-mute">
        Something to ask
      </h2>

      {/* The seven, as slips on a rail. */}
      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 md:-mx-8 md:px-8"
        style={{ scrollbarWidth: "none" }}
        role="tablist"
        aria-label="Kinds of date"
      >
        {DATE_KINDS.map((k) => {
          const active = k.slug === kind.slug;
          return (
            <button
              key={k.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setKindSlug(k.slug);
                setPreferredDay(null);
                setPreferredWindow(null);
              }}
              className={`press relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition-colors duration-200 ${
                active ? "text-on-ink" : "card text-mute"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="kind-pill"
                  transition={SPRING}
                  className="pill-ink absolute inset-0 rounded-full"
                />
              ) : null}
              <span className="type-label relative">{k.title}</span>
            </button>
          );
        })}
      </div>

      {/* The chosen kind, open. */}
      <div className="card mt-2 rounded-[1.125rem] p-5">
        <h3 className="type-title text-ink">{kind.title}</h3>
        <p className="type-caption mt-1 text-mute">{kind.line}</p>

        <p className="type-micro mt-5 text-mute">Why this one holds</p>
        <p className="type-caption mt-1.5 measure text-ink">{kind.survives}</p>

        {kind.verification === "plausible-unverified" ? (
          <p className="type-caption mt-2 text-mute">
            Nobody checked this one against a source.
          </p>
        ) : null}

        {chosen === undefined ? null : (
          <>
            <p className="type-micro mt-6 text-mute">When</p>

            {/* The days. */}
            <div
              className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-2"
              style={{ scrollbarWidth: "none" }}
              role="tablist"
              aria-label="Days"
            >
              {days.map((day) => {
                const active = day === chosen.day;
                return (
                  <button
                    key={day}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setPreferredDay(day);
                      setPreferredWindow(null);
                    }}
                    className={`press type-label shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 transition-colors duration-200 ${
                      active
                        ? "border-ink bg-ink text-on-ink"
                        : "border-line text-mute"
                    }`}
                  >
                    {dayLine(day)}
                  </button>
                );
              })}
            </div>

            {/* The hours that day holds for this kind.
                THE CHIP IS THE TWO CLOCKS, not the band's name. `w8`'s own
                label is "the closing zone alone in the evening" and `w7`'s is
                "the opening zone winds down" — accurate inside the day model
                and opaque to a person choosing an evening. The thing actually
                being chosen here is a moment, the product law for a moment is
                an absolute time, and a date between two clocks seven hours
                apart has two of them. The band's name follows below, where it
                reads as what it is. */}
            <div className="mt-2 flex flex-col gap-2">
              {windowsOnDay.map((slot) => {
                const active = slot.windowId === chosen.windowId;
                return (
                  <button
                    key={slot.windowId}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPreferredDay(slot.day);
                      setPreferredWindow(slot.windowId);
                    }}
                    className={`press type-label rounded-full border px-4 py-2.5 text-left transition-colors duration-200 ${
                      active ? "border-ink bg-ink text-on-ink" : "border-line text-mute"
                    }`}
                  >
                    {clockLine(slot.opensAt)}
                  </button>
                );
              })}
            </div>

            {/* The readback — the day, and what the app calls that stretch. */}
            <div className="well mt-4 rounded-[0.875rem] px-4 py-3">
              <p className="type-label text-ink">{dayLine(chosen.day)}</p>
              <p className="type-caption mt-0.5 text-mute">
                {windowById(chosen.windowId)?.label ?? chosen.label}, and it runs{" "}
                {kind.durationMin} minutes.
              </p>
            </div>

            <label className="type-micro mt-5 block text-mute" htmlFor="date-note">
              Say something with it
            </label>
            <input
              id="date-note"
              type="text"
              value={note}
              maxLength={280}
              onChange={(e) => setNote(e.target.value)}
              className="well type-body mt-2 w-full rounded-[0.875rem] px-4 py-3 text-ink"
            />

            {refused !== null ? (
              <p className="type-caption mt-3 text-danger">{refused}</p>
            ) : null}

            <div className="mt-5">
              <PillButton onClick={() => void propose()} disabled={sending}>
                {partner === null ? "Ask" : `Ask ${partner.displayName}`}
              </PillButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * The server's own sentence, or a plain one.
 *
 * Every refusal this route can produce is written to be read by whoever is
 * holding the phone (`lib/data/dates.ts`), so it is shown as-is. An unexpected
 * shape is not guessed at.
 */
function messageOf(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "object" &&
    (body as { error: unknown }).error !== null
  ) {
    const error = (body as { error: { message?: unknown } }).error;
    if (typeof error.message === "string") return error.message;
  }
  return "that was refused";
}
