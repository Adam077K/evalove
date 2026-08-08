import type { Metadata } from "next";
import { Column } from "@/components/chrome/Column";
import { Paper } from "@/components/materials";
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
 *
 * `<Paper>` wraps `<Column>` — see the same note on `/send`. Every
 * `.card` here reads as "a plate laid on the page" (globals.css); it
 * needs a page under it.
 */
export default function DatesPage() {
  return (
    <Paper stock="coldpress">
      <Column>
        <header className="mb-8">
          <p className="type-micro text-mute">for the two of them</p>
          <h1 className="type-hero mt-1.5 text-ink">Dates</h1>
        </header>

        <div className="space-y-10">
          <HostedDates />
          <DatesExplorer />
        </div>
      </Column>
    </Paper>
  );
}
