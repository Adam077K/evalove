"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { dateKind } from "@/lib/dates/kinds";
import { thumbSrc } from "@/lib/fixtures/resolve";
import { useViewer } from "@/lib/viewer";

import { clockLine, dayLine, memberOf, type MemberLite } from "./plan-copy";

import type { DatePlan, IsoDate, Photo } from "@/lib/types";

/**
 * What is actually between them: asked, agreed, and been on.
 *
 * The loop the whole feature exists for closes in the last section. A date
 * happens, it produces photographs, and those photographs are its page — so a
 * date that happened is drawn as the photographs left on its shared day, not
 * as a row with a tick against it. There is no join table making that true:
 * `date_plans.shared_day` and `photos.shared_day` are the same name, which is
 * the whole link, in both directions. See the migration's own footer.
 *
 * NOTHING HERE COUNTS. No "3 dates this month", no streak, no badge on the
 * dock, no "seen". A date that was agreed and quietly did not happen keeps
 * saying it was agreed, forever, because the alternative is this app deciding
 * something of theirs ran out.
 */

export interface DatePlanPhotos {
  /** Shared day → the photographs filed under it, newest first. */
  [day: IsoDate]: Photo[];
}

export function BetweenThem({
  proposed,
  agreed,
  happened,
  members,
  photosByDay,
}: {
  proposed: readonly DatePlan[];
  agreed: readonly DatePlan[];
  happened: readonly DatePlan[];
  members: readonly MemberLite[];
  photosByDay: DatePlanPhotos;
}) {
  /* Bare paper when there is nothing — no "nothing yet" card, no illustration
     of an empty calendar. The proposal above is the whole invitation, and a
     box telling them they have no dates is a box telling them so. */
  if (proposed.length === 0 && agreed.length === 0 && happened.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {proposed.length > 0 ? (
        <section aria-labelledby="asked-title">
          <h2 id="asked-title" className="type-micro mb-4 text-mute">
            Asked
          </h2>
          <ul className="space-y-3">
            {proposed.map((plan) => (
              <li key={plan.id}>
                <AskedCard plan={plan} members={members} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {agreed.length > 0 ? (
        <section aria-labelledby="agreed-title">
          <h2 id="agreed-title" className="type-micro mb-4 text-mute">
            Both said yes
          </h2>
          <ul className="space-y-3">
            {agreed.map((plan) => (
              <li key={plan.id}>
                <AgreedCard plan={plan} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {happened.length > 0 ? (
        <section aria-labelledby="left-title">
          <h2 id="left-title" className="type-micro mb-4 text-mute">
            What they left behind
          </h2>
          <ul className="space-y-3">
            {happened.map((plan) => (
              <li key={plan.id}>
                <HappenedCard
                  plan={plan}
                  photos={photosByDay[plan.sharedDay] ?? []}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function titleOf(plan: DatePlan): string {
  return dateKind(plan.kind)?.title ?? plan.kind;
}

function AskedCard({
  plan,
  members,
}: {
  plan: DatePlan;
  members: readonly MemberLite[];
}) {
  const { member } = useViewer();
  const proposer = memberOf(members, plan.proposedBy);
  /* Whoever did not propose it is whoever answers it. Read off the roster
     rather than off the viewer, so the sentence is the same fact on both
     phones — only the buttons differ. */
  const answerer = members.find((m) => m.id !== plan.proposedBy) ?? null;
  const viewerAnswers = answerer !== null && answerer.slug === member.slug;

  return (
    <div className="card rounded-[1.125rem] p-5">
      <p className="type-caption text-mute">
        {proposer === null ? "Asked" : `${proposer.displayName} asked`}
      </p>
      <h3 className="type-title mt-0.5 text-ink">{titleOf(plan)}</h3>

      {plan.note !== undefined ? (
        <p className="type-quote mt-2 text-ink">&ldquo;{plan.note}&rdquo;</p>
      ) : null}

      <p className="type-label mt-3 text-ink">{dayLine(plan.sharedDay)}</p>
      <p className="type-caption mt-0.5 text-mute">{clockLine(plan.startsAt)}</p>

      {viewerAnswers ? (
        <Answer planId={plan.id} />
      ) : (
        <p className="type-label pill-quiet mt-4 inline-block rounded-full px-3 py-1.5">
          {answerer === null
            ? "Waiting on an answer"
            : `${answerer.displayName} answers this`}
        </p>
      )}
    </div>
  );
}

function Answer({ planId }: { planId: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  async function answer(value: "agreed" | "declined"): Promise<void> {
    if (sending) return;
    setSending(true);
    setRefused(null);
    const outcome = await patchPlan(planId, { answer: value });
    setSending(false);
    if (outcome === null) router.refresh();
    else setRefused(outcome);
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={sending}
          onClick={() => void answer("agreed")}
          className="press pill-ink type-card min-h-11 rounded-full px-6 py-2.5"
        >
          Yes
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => void answer("declined")}
          className="press pill-quiet type-label min-h-11 rounded-full px-5 py-2.5"
        >
          Not this one
        </button>
      </div>
      {refused !== null ? (
        <p className="type-caption mt-2 text-danger">{refused}</p>
      ) : null}
    </>
  );
}

function AgreedCard({ plan }: { plan: DatePlan }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  async function markIt(): Promise<void> {
    if (sending) return;
    setSending(true);
    setRefused(null);
    const outcome = await patchPlan(plan.id, { happened: true });
    setSending(false);
    if (outcome === null) router.refresh();
    else setRefused(outcome);
  }

  return (
    <div className="card rounded-[1.125rem] p-5">
      <h3 className="type-title text-ink">{titleOf(plan)}</h3>
      {plan.note !== undefined ? (
        <p className="type-quote mt-2 text-ink">&ldquo;{plan.note}&rdquo;</p>
      ) : null}
      <p className="type-label mt-3 text-ink">{dayLine(plan.sharedDay)}</p>
      <p className="type-caption mt-0.5 text-mute">{clockLine(plan.startsAt)}</p>

      <div className="mt-4">
        <button
          type="button"
          disabled={sending}
          onClick={() => void markIt()}
          className="press pill-quiet type-label min-h-11 rounded-full px-5 py-2.5"
        >
          We did this
        </button>
      </div>
      {refused !== null ? (
        <p className="type-caption mt-2 text-danger">{refused}</p>
      ) : null}
    </div>
  );
}

function HappenedCard({
  plan,
  photos,
}: {
  plan: DatePlan;
  photos: readonly Photo[];
}) {
  return (
    <div className="card rounded-[1.125rem] p-5">
      <h3 className="type-title text-ink">{titleOf(plan)}</h3>
      <p className="type-caption mt-0.5 text-mute">{dayLine(plan.sharedDay)}</p>

      {photos.length > 0 ? (
        /* The page this date made. Not a link to a page — the page. */
        <Link
          href="/book/days"
          className="press mt-3 flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
          aria-label={`The photographs from ${dayLine(plan.sharedDay)}`}
        >
          {photos.slice(0, 4).map((photo) => (
            /* eslint-disable-next-line @next/next/no-img-element -- the proxy
               serves these at a fixed path; the optimizer would rewrite it to
               a signed URL the service worker cannot cache. Same reasoning as
               every other photograph in this app. */
            <img
              key={photo.id}
              src={thumbSrc(photo)}
              alt={photo.caption ?? ""}
              width={112}
              height={112}
              className="photo h-28 w-28 shrink-0 rounded-[0.5rem] object-cover"
            />
          ))}
        </Link>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** `null` when it worked; the server's own sentence when it did not. */
async function patchPlan(
  planId: string,
  body: { answer: "agreed" | "declined" } | { happened: true },
): Promise<string | null> {
  try {
    const response = await fetch(`/api/dates/${planId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return null;
    const parsed: unknown = await response.json();
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as { error: unknown }).error === "object" &&
      (parsed as { error: unknown }).error !== null
    ) {
      const error = (parsed as { error: { message?: unknown } }).error;
      if (typeof error.message === "string") return error.message;
    }
    return "that was refused";
  } catch {
    return "that did not reach the server";
  }
}
