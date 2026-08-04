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

export type PaperStock = "bone-laid" | "bone";

export interface PaperProps {
  /**
   * Which stock the table is made of. bone-laid pairs with the
   * Seam's default (bone-graded coldpress tear).
   * @default "bone-laid"
   */
  stock?: PaperStock;
  children: ReactNode;
  className?: string;
}

/**
 * Full-bleed stocks. bone-laid ships as a runtime webp derived from
 * the canonical PNG (438 KB vs 6.8 MB — the PNG stays the source of
 * truth in the library); bone-v2 has no consumer yet and still
 * points at its PNG.
 */
const STOCKS: Record<PaperStock, string> = {
  "bone-laid": "/materials/paper-bone-laid.webp",
  bone: "/materials/paper-bone-v2.png",
};

export function Paper({ stock = "bone-laid", children, className }: PaperProps) {
  return (
    <div className={cn("relative", className)} style={{ isolation: "isolate" }}>
      {/* The stock, dimming with the room's lamp. 134%, not 100%:
          the bone-laid source is 1792px wide against the seam
          strip's 1344, so at equal display width the substrate's
          grain renders 25% finer than the tear it ends in — the
          density mismatch was measurable at the join (texture sd
          5.5 vs 8.2). Scaling the stock to the strip's pixel scale
          closes it. Painted before children — no z games. */}
      <div
        aria-hidden="true"
        className="under-lamp absolute inset-0"
        style={{
          backgroundImage: `url(${STOCKS[stock]})`,
          backgroundSize: "134% auto",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
