import type { ReactNode } from "react";
import { notFound } from "next/navigation";

/**
 * The second gate on `/review/`.
 *
 * `middleware.ts` is the first: it walls the whole `/review/` prefix behind
 * `NODE_ENV === "development"` so a signed-out request never reaches these
 * pages outside a developer's own machine. That gate is a prefix check
 * against a request path — which is exactly why it needs a second, redundant
 * gate here. `/review/` is a directory, not an enumerated list of routes:
 * any file dropped in this tree tomorrow is public in development the
 * moment it exists, with no line added anywhere to review. A layout is the
 * one place a guard can sit *above* every route this directory will ever
 * contain, present and future, without being re-added per page.
 *
 * Same rule as `app/dev/materials/page.tsx`: a dev surface that reaches
 * production is how dev surfaces become permanent. Auth already covers this
 * tree twice over (the middleware above, and every real route still
 * requiring a session) — this check is hygiene, not the security boundary.
 */
export default function ReviewLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return <>{children}</>;
}
