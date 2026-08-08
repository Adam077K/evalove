"use client";

import type { CSSProperties } from "react";
import { BookText, HelpCircle, MessagesSquare } from "lucide-react";
import type { DateKind, DateSession, DateTurn } from "@/lib/types";
import { seededIn } from "@/components/book/compose";
import {
  DATE_TURNS,
  PAIRED_OPEN,
  STORY_OPEN,
  TWENTY_QUESTIONS_OPEN,
  dateTitle,
  nextWriter,
} from "@/lib/fixtures/dates";

/**
 * The hosted dates — games the app itself runs, resumable forever.
 * Each card says whose turn it is in that person's colour. A session
 * that goes quiet simply fades — `faded` is the most human way for a
 * date to end, and nothing here calls it anything worse.
 *
 * Three identical-width, identical-radius, identical-elevation cards
 * in a uniform `space-y-3` list was the exact defect §4 diagnoses:
 * "the eye finds that rhythm on the second element and stops
 * reading." These are functional session cards, not photographs, so
 * the fix stays inside §4's own vocabulary rather than reaching for
 * the Book's mount library — a slight seeded rotation (notes' own
 * range, −5°…+5°, since a card of type is closer to a note than a
 * photograph), one card leading larger while the other two follow
 * smaller (§4 move #2, unequal pairs), and a varied top gap instead
 * of one repeated `space-y` figure (§4 move #5). Seeded from
 * `session.id`, never index, so the list never re-rolls if a session
 * is added or removed.
 */

const KIND_ICON: Record<DateKind, typeof BookText> = {
  story: BookText,
  twenty_questions: HelpCircle,
  paired_question: MessagesSquare,
};

const OPEN_SESSIONS: DateSession[] = [
  STORY_OPEN,
  TWENTY_QUESTIONS_OPEN,
  PAIRED_OPEN,
];

export function HostedDates() {
  return (
    <section aria-labelledby="hosted-title">
      <h2 id="hosted-title" className="type-micro mb-4 text-mute">
        Open between them
      </h2>
      <ul>
        {OPEN_SESSIONS.map((s, i) => (
          <SessionCard
            key={s.id}
            session={s}
            turns={DATE_TURNS[s.id] ?? []}
            leading={i === 0}
          />
        ))}
      </ul>
    </section>
  );
}

function SessionCard({
  session,
  turns,
  leading,
}: {
  session: DateSession;
  turns: DateTurn[];
  leading: boolean;
}) {
  const Icon = KIND_ICON[session.kind];
  const writer = nextWriter(session, turns);
  /* No ink on this chip.
     Whose turn it is next is an intention, and the mark attaches to
     artefacts: a thing that exists and that someone made. This was
     the strongest surviving argument for spending the ink on
     something unauthored, which is exactly why it goes — accept a
     pending turn and every element *about* a person becomes eligible,
     and a mark becomes a label one defensible step at a time. */
  const last = turns[turns.length - 1];

  const rotate = seededIn(`${session.id}:rot`, -2.4, 2.4);
  const topGap = Math.round(seededIn(`${session.id}:gap`, 10, 22));
  const indent = seededIn(`${session.id}:in`, 0, 1) < 0.5;

  const style: CSSProperties = {
    marginTop: topGap,
    transform: `rotate(${rotate.toFixed(2)}deg)`,
    marginLeft: leading ? 0 : indent ? "0.75rem" : 0,
    marginRight: leading ? 0 : indent ? 0 : "0.75rem",
  };

  return (
    <li style={style} className="first:mt-0">
      <div
        className={`card rounded-[1.125rem] ${leading ? "p-5" : "p-4"}`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex shrink-0 items-center justify-center well rounded-full text-ink ${
              leading ? "h-11 w-11" : "h-9 w-9"
            }`}
          >
            <Icon size={leading ? 18 : 16} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={leading ? "type-title text-ink" : "type-card text-ink"}>
              {dateTitle(session)}
            </h3>
            {last ? (
              <p className="type-caption mt-0.5 truncate text-mute">
                &ldquo;{last.body}&rdquo;
              </p>
            ) : (
              <p className="type-caption mt-0.5 text-mute">
                Nothing written yet — the first line is free.
              </p>
            )}
          </div>
          {writer ? (
            <span className="type-label pill-quiet shrink-0 rounded-full px-3 py-1.5">
              {writer.displayName} writes next
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
