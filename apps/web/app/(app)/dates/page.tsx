import type { Metadata } from "next";
import { DatesExplorer } from "@/components/dates/DatesExplorer";
import { HostedDates } from "@/components/dates/HostedDates";

export const metadata: Metadata = {
  title: "Dates — Eva & Adam",
};

/**
 * Dates — two shelves.
 *
 * The hosted dates are the games the app itself runs (a story one
 * line each, twenty questions, the paired question). The idea shelf
 * is the researched library, keyed to the nine real windows two
 * clocks seven hours apart actually produce — browsable by window,
 * opening on the one happening right now.
 */
export default function DatesPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="type-micro text-mute">for the two of them</p>
        <h1 className="type-hero mt-1.5 text-ink">Dates</h1>
      </header>

      <div className="space-y-10">
        <HostedDates />
        <DatesExplorer />
      </div>
    </div>
  );
}
