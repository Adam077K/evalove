/**
 * Turning real app data into the one block of text the margin is given.
 *
 * This is the only place where records become prompt, which makes it the only
 * place the vault boundary has to hold. Both tripwires fire here: the records
 * are checked for vault shape on the way in, and the assembled text is scanned
 * on the way out. Nothing else in this module is allowed to build prompt text.
 *
 * The clock comes from `lib/shared-day/` rather than from anything invented
 * here. `partnerPresence()` and `dualLocalDates()` are the model this product
 * already agreed on — 109 tests, tzdata-derived, no numeric offsets anywhere —
 * and re-deriving "is Adam asleep" with a subtraction would reintroduce the
 * fixed-anchor mistake that misfiles 44.1% of one partner's posts. The margin
 * reads the same clock as the rest of the app or it does not read one.
 */

import {
  currentWindow,
  dualLocalDates,
  partnerPresence,
  windowById,
} from "@/lib/shared-day";

import { assertPromptVaultFree, assertVaultFree } from "./vault-firewall";

import type {
  ActivityIndexEntry,
  BookEntry,
  IsoDate,
  Member,
  MemberSlug,
  Photo,
} from "@/lib/types";
import type { DateTurn } from "@/lib/types";
import type {
  ActivityGrounding,
  ClockGrounding,
  Grounding,
  MarginRequest,
  MarginSituation,
  WrittenGrounding,
} from "./types";

/* ------------------------------------------------------------------ *
 * The situation
 * ------------------------------------------------------------------ */

function otherOf(slug: MemberSlug): MemberSlug {
  return slug === "eva" ? "adam" : "eva";
}

/**
 * Where both of them are in their day, at instant `at`.
 *
 * Everything here is derived, nothing is stored, and the presence value is a
 * guess by construction — no device reports being awake and there is no
 * last-seen to mine. `unknown` is a real answer and is carried through rather
 * than smoothed into something more confident.
 */
export function situationOf(
  viewer: MemberSlug,
  at: Date = new Date(),
  roster: readonly Member[] = [],
): MarginSituation {
  const partner = otherOf(viewer);
  const presence = partnerPresence(partner, at, roster);
  const dates = dualLocalDates(at);
  const window = currentWindow(at);

  return {
    viewer,
    partner,
    partnerLocalTime: presence.localTime,
    partnerLocalDate: presence.localDate,
    partnerPresence: presence.presence,
    viewerLocalDate: viewer === "eva" ? dates.eva : dates.adam,
    windowLabel: window === null ? null : (windowById(window)?.label ?? null),
    datesDiffer: dates.differ,
  };
}

/* ------------------------------------------------------------------ *
 * Clock grounding
 * ------------------------------------------------------------------ */

const NAME: Readonly<Record<MemberSlug, string>> = {
  eva: "Eva",
  adam: "Adam",
};

/**
 * How to say a presence guess without turning it into a claim.
 *
 * "probably" is not decoration. The whole value is inferred from a wall clock
 * and a working week; a sentence that drops the hedge asserts something this
 * product has no way to know, and HL-3 is the rule that says it must not.
 */
function presenceSentence(situation: MarginSituation): string {
  const who = NAME[situation.partner];

  switch (situation.partnerPresence) {
    case "asleep":
      return `It is ${situation.partnerLocalTime} where ${who} is, on ${situation.partnerLocalDate}. ${who} is probably asleep. Do not write anything that implies ${who} is awake, reading this, or about to reply, and do not suggest anything that would wake ${who}.`;
    case "working":
      return `It is ${situation.partnerLocalTime} where ${who} is, on ${situation.partnerLocalDate}. It is probably a working day for ${who} and probably working hours.`;
    case "awake":
      return `It is ${situation.partnerLocalTime} where ${who} is, on ${situation.partnerLocalDate}. ${who} is probably awake and not at work.`;
    case "unknown":
      return `There is no clock reading for ${who} right now. Do not say anything about what ${who} is doing, and do not guess at the time where ${who} is.`;
  }
}

export function clockGrounding(
  situation: MarginSituation,
): readonly ClockGrounding[] {
  const grounding: ClockGrounding[] = [
    {
      kind: "presence",
      provenance: "the clock, right now",
      text: presenceSentence(situation),
    },
    {
      kind: "dual-dates",
      provenance: "the clock, right now",
      text: situation.datesDiffer
        ? `Eva and Adam are on different calendar dates at this moment. It is ${situation.viewerLocalDate} for ${NAME[situation.viewer]}, who is the one asking.`
        : `Eva and Adam are both on ${situation.viewerLocalDate} at this moment.`,
    },
  ];

  if (situation.windowLabel !== null) {
    grounding.push({
      kind: "window",
      provenance: "the clock, right now",
      // The label is passed as words. The internal ids w1..w9 never leave the
      // code — AC-9 forbids a window code appearing on any surface, and a
      // prompt is a surface the moment the model quotes it back.
      text: `The part of the day this falls in: ${situation.windowLabel}.`,
    });
  }

  return grounding;
}

/* ------------------------------------------------------------------ *
 * Written grounding — their own words
 * ------------------------------------------------------------------ */

function slugOf(memberId: string, roster: readonly Member[]): MemberSlug | null {
  if (memberId === "eva" || memberId === "adam") return memberId;
  return roster.find((m) => m.id === memberId)?.slug ?? null;
}

/**
 * Captions, and only captions.
 *
 * No storage path, no checksum, no dimensions, no `takenAt`. The margin talks
 * about what they wrote, not about the files — and a prompt that carries a
 * storage path is a prompt that can leak one.
 *
 * Soft-deleted and purge-requested photos are dropped. A deleted caption is a
 * caption somebody took back, and taking something back has to mean it stops
 * being said.
 */
export function groundingFromPhotos(
  photos: readonly Photo[],
  roster: readonly Member[] = [],
): readonly WrittenGrounding[] {
  assertVaultFree(photos);

  const out: WrittenGrounding[] = [];
  for (const photo of photos) {
    if (photo.deletedAt !== undefined || photo.purgedAt !== undefined) continue;
    const caption = photo.caption?.trim();
    if (caption === undefined || caption === "") continue;

    const author = slugOf(photo.authorMemberId, roster);
    if (author === null) continue;

    out.push({
      kind: "photo-caption",
      author,
      sharedDay: photo.sharedDay,
      provenance: `${NAME[author]}'s caption on the daily picture, ${photo.sharedDay}`,
      text: caption,
    });
  }
  return out;
}

export function groundingFromBookEntries(
  entries: readonly BookEntry[],
  dayOf: (entry: BookEntry) => IsoDate,
): readonly WrittenGrounding[] {
  assertVaultFree(entries);

  const out: WrittenGrounding[] = [];
  for (const entry of entries) {
    if (entry.deletedAt !== undefined) continue;
    const text = [entry.dateLabel, entry.caption]
      .filter((part): part is string => typeof part === "string")
      .map((part) => part.trim())
      .filter((part) => part !== "")
      .join(" — ");
    if (text === "") continue;

    const day = dayOf(entry);
    out.push({
      kind: "book-entry",
      // A page belongs to the book rather than to one of them; the book is
      // theirs jointly and attributing a page to one person would put words
      // in a mouth. Eva first, per the house rule.
      author: "eva",
      sharedDay: day,
      provenance: `a page in the book, ${day}`,
      text,
    });
  }
  return out;
}

/**
 * Turns from a date session.
 *
 * `secret` is never read. It is typed `unknown` in `lib/types.ts` exactly so
 * that no generic serializer renders it, and the margin is a serializer. Only
 * `body` on a turn crosses into a prompt, and a `reveal` turn is included
 * because by then the secret has been shown to both of them anyway.
 */
export function groundingFromDateTurns(
  turns: readonly DateTurn[],
  sharedDayOfTurn: (turn: DateTurn) => IsoDate,
  roster: readonly Member[] = [],
): readonly WrittenGrounding[] {
  const out: WrittenGrounding[] = [];
  for (const turn of turns) {
    const body = turn.body.trim();
    if (body === "") continue;

    const author = slugOf(turn.memberId, roster);
    if (author === null) continue;

    const day = sharedDayOfTurn(turn);
    out.push({
      kind: "date-turn",
      author,
      sharedDay: day,
      provenance: `${NAME[author]}'s turn in a date, ${day}`,
      text: body,
    });
  }
  return out;
}

export function groundingFromActivities(
  entries: readonly ActivityIndexEntry[],
): readonly ActivityGrounding[] {
  return entries.map((entry) => ({
    kind: "activity",
    activityId: entry.id,
    provenance: `the activity library (${entry.verificationTier})`,
    verified: entry.verificationTier === "verified",
    text: `${entry.title} — ${entry.description} (about ${entry.durationMin} minutes, ${entry.costTier})`,
  }));
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

function renderOne(item: Grounding): string {
  if (item.kind === "activity" && !item.verified) {
    return `- [${item.provenance}; nobody has confirmed this one works — say so if you mention it] ${item.text}`;
  }
  return `- [${item.provenance}] ${item.text}`;
}

const NOTHING_IN_THE_BOOK =
  "Nothing from the book was retrieved for this turn. If the question is about " +
  "their history, say plainly that nothing in the book says — do not fill the " +
  "gap with something plausible.";

/**
 * The single user-turn text the model receives.
 *
 * Ordered clock first, then their words, then the library, then the question.
 * The question goes last because it is the most volatile part of the request
 * and everything before it is a candidate for the cache — a stable prefix is
 * the whole reason prompt caching pays for itself.
 *
 * The vault scan runs on the finished string, immediately before it is
 * returned. It is the last thing that happens to a prompt in this codebase.
 */
export function renderPrompt(request: MarginRequest): string {
  assertVaultFree(request.grounding);

  const clock = request.grounding.filter(
    (g) => g.kind === "presence" || g.kind === "dual-dates" || g.kind === "window",
  );
  const written = request.grounding.filter(
    (g) =>
      g.kind === "photo-caption" ||
      g.kind === "book-entry" ||
      g.kind === "date-turn" ||
      g.kind === "shared-day",
  );
  const activities = request.grounding.filter((g) => g.kind === "activity");

  const sections: string[] = [
    "WHERE THINGS STAND",
    clock.map(renderOne).join("\n"),
    "",
    "WHAT THEY WROTE — everything you may say about their history, and nothing else",
    written.length === 0 ? NOTHING_IN_THE_BOOK : written.map(renderOne).join("\n"),
  ];

  if (activities.length > 0) {
    sections.push(
      "",
      "FROM THE ACTIVITY LIBRARY — researched, not theirs",
      activities.map(renderOne).join("\n"),
    );
  }

  sections.push(
    "",
    `${NAME[request.situation.viewer]} is the one asking. ${NAME[request.situation.viewer]} says:`,
    request.message.trim(),
  );

  const prompt = sections.join("\n");
  assertPromptVaultFree(prompt);
  return prompt;
}
