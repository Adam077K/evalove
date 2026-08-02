import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Plus } from "lucide-react";
import { DualClocks } from "@/components/home/DualClocks";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PartnerTile } from "@/components/home/PartnerTile";
import { SealedCard } from "@/components/home/SealedCard";
import { TonightCard } from "@/components/home/TonightCard";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { ADAM, EVA } from "@/lib/fixtures/members";
import { PHOTOS, postedAtLocal } from "@/lib/fixtures/photos";
import { photoSrc, thumbSrc } from "@/lib/fixtures/resolve";
import { completeDays } from "@/lib/shared-day";
import { spellNumber } from "@/lib/words";

export const metadata: Metadata = {
  title: "Home — Eva & Adam",
};

/**
 * Home — the room the app opens into.
 *
 * Order is the day's own order: where the two of them are right now
 * (the clocks), what today's ritual is waiting on, what one left the
 * other, one idea that fits this window, and the two doorways —
 * the book and the partner conversation.
 *
 * Sections rise in with a 70ms cascade (`--i`).
 */

const stagger = (i: number): CSSProperties =>
  ({ "--i": i }) as CSSProperties;

export default function HomePage() {
  return (
    <div className="space-y-5">
      <div className="stagger-child" style={stagger(0)}>
        <HomeHeader />
      </div>

      <div className="stagger-child" style={stagger(1)}>
        <DualClocks />
      </div>

      <div className="stagger-child" style={stagger(2)}>
        <TodayCard />
      </div>

      <div className="stagger-child" style={stagger(3)}>
        <SealedCard />
      </div>

      <div className="stagger-child" style={stagger(4)}>
        <TonightCard />
      </div>

      <div className="stagger-child grid grid-cols-2 gap-3" style={stagger(5)}>
        <BookTile />
        <PartnerTile />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Today's pair — the ritual, summarised. One photo each; the card
 * shows exactly where the day stands and opens the full spread.
 * ------------------------------------------------------------------ */

function TodayCard() {
  const day = SHARED_DAYS.find((d) => d.date === FIXTURE_TODAY);
  const todays = Object.values(PHOTOS).filter(
    (p) => p.sharedDay === FIXTURE_TODAY && p.kind === "daily",
  );
  const adamPhoto = day?.adamPosted
    ? todays.find((p) => p.authorMemberId === ADAM.id)
    : undefined;
  const evaPhoto = day?.evaPosted
    ? todays.find((p) => p.authorMemberId === EVA.id)
    : undefined;

  const status = !day
    ? "A new day — no photographs yet"
    : day.bothPosted
      ? "Both sides are in"
      : day.adamPosted
        ? "Adam has posted · a place is ready for Eva"
        : day.evaPosted
          ? "Eva has posted · a place is ready for Adam"
          : "A new day — no photographs yet";

  return (
    <Link
      href="/today"
      className="card hover-lift block rounded-[1.75rem] p-5"
      aria-label={`Today: ${status}`}
    >
      <header className="flex items-center justify-between">
        <h2 className="type-title text-ink">Today</h2>
        <span className="type-label flex items-center gap-1 text-us-deep">
          Open <ArrowUpRight size={15} strokeWidth={2.1} />
        </span>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <TodaySlot who="eva" photoSrcUrl={evaPhoto ? thumbSrc(evaPhoto) : undefined} caption={evaPhoto ? postedAtLocal(evaPhoto) : undefined} />
        <TodaySlot who="adam" photoSrcUrl={adamPhoto ? thumbSrc(adamPhoto) : undefined} caption={adamPhoto ? postedAtLocal(adamPhoto) : undefined} />
      </div>

      <p className="type-caption mt-3.5 text-mute">{status}</p>
    </Link>
  );
}

function TodaySlot({
  who,
  photoSrcUrl,
  caption,
}: {
  who: "eva" | "adam";
  photoSrcUrl?: string;
  caption?: string;
}) {
  const isEva = who === "eva";
  const name = isEva ? "Eva" : "Adam";
  const ring = isEva ? "border-eva/45" : "border-adam/45";
  const soft = isEva ? "bg-eva-soft" : "bg-adam-soft";
  const inkCls = isEva ? "text-eva-deep" : "text-adam-deep";

  if (!photoSrcUrl) {
    return (
      <div
        className={`relative flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed ${ring} ${soft}`}
        role="img"
        aria-label={`A place ready for ${name}'s photograph`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface ${inkCls} shadow-e1`}
        >
          <Plus size={17} strokeWidth={2.1} />
        </span>
        <span className={`type-label ${inkCls}`}>{name}</span>
      </div>
    );
  }

  return (
    <figure className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem]">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixture seeds */}
      <img
        src={photoSrcUrl}
        alt={`${name}'s photograph from today`}
        className="photo absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <figcaption className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-full bg-black/35 px-3 py-1 text-white backdrop-blur-md">
        <span className="type-label">{name}</span>
        {caption ? <span className="type-caption opacity-90">{caption}</span> : null}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * The book's doorway — its latest kept photograph as the cover, the
 * day-count in prose (never a metric).
 * ------------------------------------------------------------------ */

function BookTile() {
  const cover = PHOTOS["d0730-eva"];
  const kept = completeDays(SHARED_DAYS).length;
  const keptLine =
    kept === 0 ? "the first page is waiting" : `${spellNumber(kept)} days, kept`;

  return (
    <Link
      href="/book"
      className="press relative min-h-36 overflow-hidden rounded-[1.75rem] shadow-e2"
      aria-label={`The book — ${keptLine}`}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- fixture seeds
        <img
          src={photoSrc(cover)}
          alt=""
          aria-hidden="true"
          className="photo absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 block" style={{ background: "var(--grad-sky)" }} />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(20,10,30,0.72) 0%, rgba(20,10,30,0.12) 55%, transparent 100%)",
        }}
      />
      <span className="absolute inset-x-0 bottom-0 p-4 text-white">
        <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <BookOpen size={15} strokeWidth={1.9} />
        </span>
        <span className="type-card block">The book</span>
        <span className="type-caption block opacity-85">{keptLine}</span>
      </span>
    </Link>
  );
}
