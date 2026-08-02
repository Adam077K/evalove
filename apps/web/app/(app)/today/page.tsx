import type { Metadata } from "next";
import type { SharedDay } from "@/lib/types";
import { Spread } from "@/components/spread/Spread";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { PHOTOS } from "@/lib/fixtures/photos";

export const metadata: Metadata = {
  title: "The daily spread — Eva & Adam",
};

/**
 * Review surface: the three states of the daily spread, side by side,
 * rendered from fixtures. `?mode=day|night` previews both rooms.
 */

function dayOf(date: string): SharedDay {
  const d = SHARED_DAYS.find((s) => s.date === date);
  if (!d) throw new Error(`fixture day missing from SHARED_DAYS: ${date}`);
  return d;
}

export default function TodayPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
      <header className="mb-12 flex items-baseline justify-between gap-4">
        <h1 className="type-heading">The daily spread</h1>
        <nav aria-label="Mode" className="type-caption text-ink-soft">
          <a className="underline underline-offset-2" href="?mode=day">
            day
          </a>
          {" · "}
          <a className="underline underline-offset-2" href="?mode=night">
            night
          </a>
        </nav>
      </header>

      <div className="space-y-20">
        <section aria-labelledby="state-pair">
          <h2 id="state-pair" className="type-eyebrow mb-5 text-ink-soft">
            The completed pair
          </h2>
          <Spread
            day={dayOf("2026-07-30")}
            evaPhoto={PHOTOS["d0730-eva"]}
            adamPhoto={PHOTOS["d0730-adam"]}
          />
        </section>

        <section aria-labelledby="state-half">
          <h2 id="state-half" className="type-eyebrow mb-5 text-ink-soft">
            The half pair — the day is still open
          </h2>
          <Spread day={dayOf("2026-08-02")} adamPhoto={PHOTOS["d0802-adam"]} live />
        </section>

        <section aria-labelledby="state-plate">
          <h2 id="state-plate" className="type-eyebrow mb-5 text-ink-soft">
            The single plate — a day that closed half-finished
          </h2>
          <Spread day={dayOf("2026-07-31")} evaPhoto={PHOTOS["d0731-eva"]} />
        </section>
      </div>
    </main>
  );
}
