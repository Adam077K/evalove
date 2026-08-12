/**
 * /review/board — development-only viewing surface for the board T1 ground.
 *
 * Renders the pannable walnut table with design-H's hard-coded objects.
 * This is the T1 success criterion: visually indistinguishable from design-H
 * at the same pan offset, judged by looking at both images.
 *
 * Public under NODE_ENV === "development" via the review layout gate.
 * Do not link to this from any product surface.
 *
 * force-dynamic: prevents the fixture content from being baked into the
 * static build artifact. Matches every other review page in this tree.
 * (See review/layout.tsx for the full explanation of why both guards
 * are needed together.)
 *
 * The design-H photograph files (design-p1.jpg through design-p8.jpg) are
 * gitignored because they are real photographs of Eva and Adam. They are
 * served from the local public/ directory at runtime and are absent in
 * production builds. The review page renders correctly in development when
 * they are present, and shows broken-image placeholders when absent — which
 * is the correct failure mode for a dev-only surface.
 */

import type { Metadata } from "next";
import { BoardReviewContent } from "@/components/board/BoardReviewContent";

export const metadata: Metadata = {
  title: "Review: board T1 ground — dev",
};

export const dynamic = "force-dynamic";

export default function ReviewBoardPage() {
  return <BoardReviewContent />;
}
