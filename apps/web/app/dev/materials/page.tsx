/* eslint-disable @next/next/no-img-element -- the bench composites
   keyed material assets directly; the optimizer must not re-encode
   their alpha, and none of these are content photographs. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Mounted, Paper, Pinned, Seam, Taped, Torn } from "@/components/materials";

/**
 * Materials bench — Wave 0 verification surface, not a product screen.
 *
 * One column, 393px-first, that walks every primitive in both worlds:
 * the two hands, a torn mount, a pinned note, taped objects, the
 * sticker mass, then the Seam falling into the DECO section below it.
 *
 * The Seam here is the acceptance test: scrolling from the paper into
 * the night must read as one continuous space — lifting your eyes from
 * the table to the window — in BOTH modes (place, not time). If a
 * hard edge appears anywhere across it, Wave 0 has failed.
 */

export const metadata: Metadata = {
  title: "Materials bench",
  robots: { index: false },
};

export default function MaterialsBench() {
  /* A dev surface that reaches production is how dev surfaces
     become permanent. (Auth already covers it — middleware walls
     every non-allowlisted route — so this is hygiene, not
     security.) */
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[430px]">
      {/* ---------------- PAPER — the table ----------------
          A real stock as substrate (same coldpress as the Seam, so
          the join cannot exist), dimming with the lamp at night. */}
      <Paper stock="coldpress" className="px-5 pb-14 pt-8">
        <p className="type-micro text-mute">materials bench · wave 0</p>

        {/* The two hands. Caveat flows; Patrick Hand stands. */}
        <p className="font-eva mt-9 text-[26px] leading-snug text-ink">
          the coffee place drew a heart in the foam again
        </p>
        <p className="font-adam mt-3 text-[19px] leading-snug text-ink">
          saved you the window seat — warmer than it looks
        </p>

        {/* Torn mount, note elevation, Adam's hand on the paper. */}
        <Mounted id="bench-note-torn" context="note" elevation={3} className="mt-12 ml-8">
          <Torn variant={8}>
            <div className="bg-surface px-5 py-4">
              <p className="font-adam text-[17px] leading-snug text-ink">
                the ticket stub is from the late show. you were asleep
                three minutes in
              </p>
            </div>
          </Torn>
        </Mounted>

        {/* Pinned note — Eva's brass pin, her hand. */}
        <Mounted id="bench-note-pinned" context="note" elevation={3} className="mt-14 mr-10">
          <Pinned variant="eva" placement="top-center">
            <div className="bg-surface px-5 pb-5 pt-4">
              <p className="font-eva text-[21px] leading-snug text-ink">
                Saturday. the better foam heart. promised
              </p>
            </div>
          </Pinned>
        </Mounted>

        {/* Taped object — corner strips at 45°, translucency check
            over the busiest asset in the drawer. */}
        <Mounted id="bench-ticket-taped" context="book-photo" elevation={4} className="mt-16 ml-14 w-[220px]">
          <Taped variant="houndstooth" placement="top-left" angle={-3}>
            <Taped variant="kraft" placement="top-right" angle={4}>
              <img
                src="/materials/sticker-ticket-cinema.webp"
                alt=""
                className="under-lamp block w-full"
              />
            </Taped>
          </Taped>
        </Mounted>

        {/* The sticker mass. Sunflower first — Eva's motif, always. */}
        <div className="mt-14 flex items-end gap-6">
          <Mounted id="bench-sticker-sunflower" context="sticker" elevation={1}>
            <img src="/materials/sticker-sunflower-pressed-v3.webp" alt="" className="under-lamp w-[120px]" />
          </Mounted>
          <Mounted id="bench-sticker-rose" context="sticker" elevation={1}>
            <img src="/materials/sticker-rose-red-pressed.webp" alt="" className="under-lamp w-[84px]" />
          </Mounted>
          <Mounted id="bench-sticker-star" context="sticker" elevation={1}>
            <img src="/materials/sticker-star-gold-foil.webp" alt="" className="under-lamp w-[56px]" />
          </Mounted>
        </div>

        {/* Just placed this session — the one settle on the bench. */}
        <Mounted
          id="bench-note-settling"
          context="note"
          elevation={2}
          settled={false}
          className="mt-11 ml-24 w-max"
        >
          <div className="bg-surface px-4 py-3">
            <p className="font-eva text-[19px] text-ink">just placed</p>
          </div>
        </Mounted>
      </Paper>

      {/* ---------------- the Seam — no mode check, ever ---------------- */}
      <Seam />

      {/* ---------------- DECO — the window ---------------- */}
      <section className="relative bg-night-sky pb-0 pt-12">
        <div className="px-5">
          {/* Poiret One: DECO place only, ≥32px only. */}
          <h2 className="font-deco text-[34px] tracking-[0.18em] text-night-gold">
            NEW YORK
          </h2>
          <h2 className="font-deco mt-1 text-[32px] tracking-[0.22em] text-night-mute">
            TEL AVIV
          </h2>

          {/* The window sentence — the app's own voice, Fraunces italic. */}
          <p className="type-quote mt-8 text-night-ink">
            Eva&rsquo;s in bed, Adam&rsquo;s awake.
          </p>

          {/* The stamp — Outfit, small, never handwritten. */}
          <p className="type-micro mt-3 normal-case text-night-mute">
            left while Eva was asleep · Adam 6:20 am · Eva 11:20 pm
          </p>
        </div>

        {/* The two skylines, far city behind near city. Opacity on the
            far plate is atmosphere between illustration layers — the
            no-filter law protects photographs, and these are drawn. */}
        <div className="relative mt-10 h-[236px] overflow-hidden">
          <img
            src="/materials/city-tlv-far-silhouette.webp"
            alt=""
            className="absolute bottom-8 left-0 w-full opacity-45"
          />
          <img
            src="/materials/city-nyc-near-silhouette.webp"
            alt=""
            className="absolute -bottom-10 right-0 w-[92%]"
          />
        </div>
      </section>
    </main>
  );
}
