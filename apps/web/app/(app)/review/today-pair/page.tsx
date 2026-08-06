import type { Metadata } from "next";
import type { SharedDay } from "@/lib/types";
import { Spread } from "@/components/spread/Spread";
import { TodayPairContent } from "@/components/home/TodayPair";
import { Paper } from "@/components/materials";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { PHOTOS } from "@/lib/fixtures/photos";

export const metadata: Metadata = {
  title: "Review: today pair — dev",
};

// Forces this route to render per-request rather than being prerendered at
// build time. Without this, `next build` still statically generates this
// page — the layout's `notFound()` changes the response status to 404 and
// the visible UI, but Next still serializes this page's RSC tree into the
// static build artifact, embedding every fixture caption and photo URL
// below in `.next/server/app/review/today-pair.html` regardless of the
// 404. `force-dynamic` is what actually stops that: with no static artifact
// to bake anything into, there is nothing to leak from a build output.
export const dynamic = "force-dynamic";

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

      {/* Each state sits on the real coldpress stock — the torn mount
          and the tape are graded against it, and judging them on the
          flat canvas fill would be judging a different composition.
          overflow-x-clip stands in for the page root's clip so the
          single-edge bleed does not widen the review document. */}
      <div className="space-y-16 mb-20 overflow-x-clip">
        <section aria-labelledby="pair-one">
          <h2 id="pair-one" className="type-micro mb-4 text-mute">
            One item — hero (Adam posted, single-edge bleed)
          </h2>
          {/* The fixture state: Adam posted 2026-08-02, Eva has not yet */}
          <Paper stock="coldpress" className="-mx-5 px-5 py-8 md:-mx-8 md:px-8">
            <TodayPairContent adamPhoto={PHOTOS["d0802-adam"]} />
          </Paper>
        </section>

        <section aria-labelledby="pair-both">
          <h2 id="pair-both" className="type-micro mb-4 text-mute">
            The pair — both posted, unequal on purpose
          </h2>
          <Paper stock="coldpress" className="-mx-5 px-5 py-8 md:-mx-8 md:px-8">
            <TodayPairContent
              evaPhoto={PHOTOS["d0730-eva"]}
              adamPhoto={PHOTOS["d0730-adam"]}
            />
          </Paper>
        </section>

        <section aria-labelledby="pair-tuesday">
          <h2 id="pair-tuesday" className="type-micro mb-4 text-mute">
            The Tuesday — nothing arrived; the last thing is still there
          </h2>
          {/* Neither posted today: the last thing left, unchanged,
              plus the pressed-through impression. Never an empty box. */}
          <Paper stock="coldpress" className="-mx-5 px-5 py-8 md:-mx-8 md:px-8">
            <TodayPairContent lastLeft={PHOTOS["d0731-eva"]} />
          </Paper>
        </section>

        <section aria-labelledby="pair-empty">
          <h2 id="pair-empty" className="type-micro mb-4 text-mute">
            Empty archive — bare paper is a clear table, not a container
          </h2>
          <Paper stock="coldpress" className="-mx-5 px-5 py-8 md:-mx-8 md:px-8">
            <TodayPairContent />
          </Paper>
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
