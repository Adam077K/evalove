"use client";

import { BookText, HelpCircle, MessagesSquare } from "lucide-react";
import type { DateKind, DateSession, DateTurn } from "@/lib/types";
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
      <ul className="space-y-3">
        {OPEN_SESSIONS.map((s) => (
          <SessionCard key={s.id} session={s} turns={DATE_TURNS[s.id] ?? []} />
        ))}
      </ul>
    </section>
  );
}

function SessionCard({
  session,
  turns,
}: {
  session: DateSession;
  turns: DateTurn[];
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

  return (
    <li className="card rounded-[1.125rem] p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center well rounded-full text-ink">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="type-card text-ink">{dateTitle(session)}</h3>
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
    </li>
  );
}
