import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { Return } from "@/lib/resurface";
import type { Photo } from "@/lib/types";
import { BEGUN } from "@/lib/fixtures/book";
import { longDate } from "@/lib/time";
import { PHOTOS } from "@/lib/fixtures/photos";
import { ResurfacedItem } from "@/components/book/ResurfacedItem";

export const metadata: Metadata = {
  title: "Review: book states — dev",
};

/**
 * Development review surface — not reachable from the dock.
 *
 * Renders all four states of The Book page so they can be captured by
 * shoot.mjs without modifying any production route or fixture.
 *
 * States:
 *   1. Title page — archive is empty (day one, before first post)
 *   2. Resurfaced photo — date match ("A year ago today")
 *   3. Resurfaced photo — hour match ("Left at this hour, in July")
 *   4. Resurfaced text — no photo, caption only (text-quote path)
 *
 * `?mode=day|night` previews both colour rooms.
 *
 * This is a development tool only. Do not link to it from product surfaces.
 */

const colophon = `Begun ${longDate(BEGUN)}`;

// ── Forced states for review ──────────────────────────────────────────

const DATE_MATCH: Return = {
  reason: "date",
  label: "A year ago today",
  photo: PHOTOS["d0729-eva"],
};

const HOUR_MATCH: Return = {
  reason: "hour",
  label: "Left at this hour, in July",
  photo: PHOTOS["d0730-adam"],
};

// Text-only entry: width/height 0 so ResurfacedItem uses the text-quote path.
// The caption is what came back; no photograph exists.
const TEXT_ONLY_PHOTO: Photo = {
  ...PHOTOS["d0729-eva"],
  id: "review-text-only",
  clientUuid: "review-text-only",
  caption: "Sudden rain, everyone under the same awning",
  width: 0,
  height: 0,
  storagePathDisplay: "",
  storagePathThumb: "",
};

const TEXT_MATCH: Return = {
  reason: "hour",
  label: "Left in the evening, in July",
  photo: TEXT_ONLY_PHOTO,
};

// ─────────────────────────────────────────────────────────────────────

export default function ReviewBookStatesPage() {
  return (
    <div>
      <header className="mb-10 flex items-baseline justify-between gap-4">
        <h1 className="type-hero text-ink">Review — book states</h1>
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

      <div className="space-y-20">

        {/* ── State 1: Title page (day one, empty archive) ────────────────
         *  The masthead anchors the top, blank paper fills the viewport,
         *  imprint anchors the foot. Rendered in a 100dvh-tall container
         *  so the composition reads as a page rather than a void.
         * ────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="state-title">
          <h2 id="state-title" className="type-micro mb-4 text-mute">
            State 1 — title page (day one, empty archive)
          </h2>
          <div
            className="flex flex-col border border-line rounded"
            style={{
              minHeight: "calc(100dvh - var(--dock-footprint) - 2rem)",
            }}
          >
            <h3
              className="type-masthead text-ink"
              style={{ fontSize: "clamp(3.5rem, 19.3vw, 6.5rem)" }}
            >
              The book
            </h3>
            <div className="flex-1" aria-hidden="true" />
            <div>
              <hr className="border-t border-line" />
              <Link
                href="/pocket"
                className="flex items-center justify-between py-5 press"
                aria-label="The pocket"
              >
                <span className="type-title text-ink">Eva &amp; Adam</span>
                <Lock
                  size={18}
                  strokeWidth={1.9}
                  className="text-mute"
                  aria-hidden="true"
                />
              </Link>
              <p className="type-micro text-mute pb-2">{colophon}</p>
            </div>
          </div>
        </section>

        {/* ── State 2: Resurfaced photo — date match ───────────────────── */}
        <section aria-labelledby="state-date">
          <h2 id="state-date" className="type-micro mb-4 text-mute">
            State 2 — resurfaced photo, date match ("A year ago today")
          </h2>
          <ResurfacedItem returned={DATE_MATCH} />
        </section>

        {/* ── State 3: Resurfaced photo — hour match ───────────────────── */}
        <section aria-labelledby="state-hour">
          <h2 id="state-hour" className="type-micro mb-4 text-mute">
            State 3 — resurfaced photo, hour match ("Left at this hour, in July")
          </h2>
          <ResurfacedItem returned={HOUR_MATCH} />
        </section>

        {/* ── State 4: Text-only (no photograph, caption only) ─────────── */}
        <section aria-labelledby="state-text">
          <h2 id="state-text" className="type-micro mb-4 text-mute">
            State 4 — text-only (no photograph, caption as the resurfaced item)
          </h2>
          <ResurfacedItem returned={TEXT_MATCH} />
        </section>

      </div>
    </div>
  );
}
