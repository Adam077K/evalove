import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The table itself — a real paper stock as substrate, not a colour.
 *
 * The law says paper stocks are assets; rendering `--canvas` as a
 * flat fill is how the seam join became visible (a flat fill at
 * texture sd 0.43 can never meet photographic paper at sd 7.69
 * invisibly). Every surface that ends in a <Seam> sits on a Paper
 * of the same stock, so texture and tone match by construction.
 *
 * THE LAMP. CEO ruling 2026-08-04: the light in the room dims, not
 * the objects. The substrate carries `.under-lamp`, the same curve
 * every image material uses, so at night the whole table darkens as
 * one surface. Children are NOT blanket-dimmed from here: token
 * surfaces and text dim through the night token swap already, and
 * each material component applies .under-lamp to its own image.
 * Photographs never dim — never give one .under-lamp.
 *
 * The Seam's default strip is tone-graded to bone-laid's measured
 * mean, so the sheet that tears at the bottom of a bone-laid Paper
 * is the same paper to the eye. (A substrate derived by tiling the
 * strip itself was tried and failed: mirror-stacking a narrow band
 * turns its diagonal grain into a herringbone weave. Substrates
 * must be generated as stocks, not improvised from strips.)
 */

export type PaperStock = "coldpress" | "bone-laid" | "bone";

export interface PaperProps {
  /**
   * Which stock the table is made of. Pair it with the matching
   * Seam strip grade — coldpress ↔ the stock-toned strip,
   * bone-laid ↔ the bone-graded strip.
   * @default "coldpress"
   */
  stock?: PaperStock;
  children: ReactNode;
  className?: string;
}

interface StockSpec {
  src: string;
  /**
   * background-size, per stock, calibrated so the grain density
   * matches the seam strip at the join (measured by texture sd at
   * display scale, not eyeballed): bone-laid's 1792px source needs
   * 134% up; the 1024px coldpress stock's coarser tooth needs 58%
   * down. Recalibrate if a source is regenerated.
   */
  size: string;
  /**
   * Warm fill that paints immediately before the texture PNG/webp
   * loads. Without it, each leaf in BookTurnStage is transparent
   * during slow network: all the stacked gridArea="1/1" leaves
   * bleed through each other — overlapping captions, white photo
   * holes. The colour is tuned to the stock's measured mean tone
   * so the fill is invisible once the texture arrives. Not a
   * loading indicator — it is what the paper looks like with no
   * grain.
   */
  color: string;
}

/**
 * Full-bleed stocks. coldpress is the generated substrate stock in
 * the seam strip's own tone family, shipped as a vertically
 * mirror-stacked runtime tile (its raw vertical wrap was not
 * seamless: edge diff 10.6 vs internal 6.6). bone-laid ships as a
 * runtime webp of the canonical PNG. The canonical assets stay in
 * the library untouched.
 */
const STOCKS: Record<PaperStock, StockSpec> = {
  coldpress: { src: "/materials/paper-coldpress-stock-tile.webp", size: "58% auto", color: "#f2ece4" },
  "bone-laid": { src: "/materials/paper-bone-laid.webp", size: "134% auto", color: "#ede0c8" },
  bone: { src: "/materials/paper-bone-v2.png", size: "100% auto", color: "#f0e8d8" },
};

export function Paper({ stock = "coldpress", children, className }: PaperProps) {
  const spec = STOCKS[stock];

  return (
    <div className={cn("relative", className)} style={{ isolation: "isolate" }}>
      {/* The stock, dimming with the room's lamp.
          Painted before children — no z games. */}
      <div
        aria-hidden="true"
        className="under-lamp absolute inset-0"
        style={{
          backgroundColor: spec.color,
          backgroundImage: `url(${spec.src})`,
          backgroundSize: spec.size,
        }}
      />
      {/* h-full so absolutely-positioned children measure against the
          whole sheet when a caller stretches the Paper (the opened
          book's pages): anchored to a content-height box, the
          bookmark's "bottom of the page" was 175px above the page's
          bottom. Unstretched Papers are untouched — h-full of an
          auto parent is auto. */}
      <div className="relative h-full">{children}</div>
    </div>
  );
}
