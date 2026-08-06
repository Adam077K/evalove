import type { Metadata } from "next";
import { LayProbe } from "./LayProbe";

export const metadata: Metadata = {
  title: "Review: lay probe — dev",
};

/**
 * Development review surface — not reachable from the dock.
 *
 * Design-Lead's falsification build (making-metaphor.md §12): does
 * laying a photograph on a page feel like making, in a thumb? Three
 * prints, take → lift → lay, nothing else. Disposable by design — see
 * LayProbe.tsx's own doc comment for the scope this deliberately
 * leaves out.
 *
 * This is a development tool only. Never link it from product surfaces.
 */
export default function ReviewLayProbePage() {
  return <LayProbe />;
}
