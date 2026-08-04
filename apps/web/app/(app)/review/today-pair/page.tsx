import type { Metadata } from "next";
import type { SharedDay } from "@/lib/types";
import { Spread } from "@/components/spread/Spread";
import { TodayPairContent } from "@/components/home/TodayPair";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { PHOTOS } from "@/lib/fixtures/photos";

export const metadata: Metadata = {
  title: "Review: today pair — dev",
};

/**
 * Development review surface — not reachable from the dock.
 *
 * Renders the three TodayPair states and the three Spread states from
 * fixtures so all states can be viewed without changing FIXTURE_TODAY.
 * `?mode=day|night` previews both colour rooms.
 *
 * This is a development tool only. Do not link to it from product surfaces.
 */

function dayOf(date: string): SharedDay {
  const d = SHARED_DAYS.find((s) => s.date === date);
  if (!d) throw new Error(`fixture day missing from SHARED_DAYS: ${date}`);
  return d;
}

export default function ReviewTodayPairPage() {
  return (
    <div>
      <header className="mb-10 flex items-baseline justify-between gap-4">
        <h1 className="type-hero text-ink">Review — today pair</h1>
        <nav aria-label="Mode" className="flex gap-1.5">
          <a
            className="type-micro card press rounded-full px-3.5 py-1.5 text-mute"
            href="?mode=day"
          >
            day
          </a>
          <a
            className="type-micro card press rounded-full px-3.5 py-1.5 text-mute"
            href="?mode=night"
          >
            night
          </a>
        </nav>
      </header>

      {/* ---- TodayPair states ---- */}

      <div className="space-y-16 mb-20">
        <section aria-labelledby="pair-half">
          <h2 id="pair-half" className="type-micro mb-4 text-mute">
            Pair — one posted (Adam posted, Eva&apos;s side is bare paper)
          </h2>
          {/* The fixture state: Adam posted 2026-08-02, Eva has not yet */}
          <TodayPairContent
            adamPhoto={PHOTOS["d0802-adam"]}
          />
        </section>

        <section aria-labelledby="pair-both">
          <h2 id="pair-both" className="type-micro mb-4 text-mute">
            Pair — both posted
          </h2>
          <TodayPairContent
            evaPhoto={PHOTOS["d0730-eva"]}
            adamPhoto={PHOTOS["d0730-adam"]}
          />
        </section>

        <section aria-labelledby="pair-none">
          <h2 id="pair-none" className="type-micro mb-4 text-mute">
            Pair — neither posted (collapses to meta lines only)
          </h2>
          {/* No photos: both sides collapse. No empty box anywhere. */}
          <TodayPairContent />
        </section>
      </div>

      {/* ---- Spread states (Brief A / The Book) — unchanged below ---- */}

      <hr className="border-t border-line mb-10" />
      <h2 className="type-micro mb-8 text-mute">Spread states (The Book)</h2>

      <div className="space-y-16">
        <section aria-labelledby="state-half">
          <h2 id="state-half" className="type-micro mb-4 text-mute">
            Spread — one posted, live clock (today&apos;s date)
          </h2>
          <Spread day={dayOf("2026-08-02")} adamPhoto={PHOTOS["d0802-adam"]} live />
        </section>

        <section aria-labelledby="state-pair">
          <h2 id="state-pair" className="type-micro mb-4 text-mute">
            Spread — both posted
          </h2>
          <Spread
            day={dayOf("2026-07-30")}
            evaPhoto={PHOTOS["d0730-eva"]}
            adamPhoto={PHOTOS["d0730-adam"]}
          />
        </section>

        <section aria-labelledby="state-plate">
          <h2 id="state-plate" className="type-micro mb-4 text-mute">
            Spread — one posted, past day
          </h2>
          <Spread day={dayOf("2026-07-31")} evaPhoto={PHOTOS["d0731-eva"]} />
        </section>
      </div>
    </div>
  );
}
