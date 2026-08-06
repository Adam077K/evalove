/**
 * Founder decision, 2026-08-06: Echo is no longer a destination.
 * `/echo` redirects rather than serving `EchoChat`. This pins the
 * destination, not merely the fact that something throws — `redirect()`
 * from `next/navigation` works by throwing a sentinel Error whose
 * `.digest` is `NEXT_REDIRECT;<type>;<url>;<statusCode>;` (see
 * `next/dist/client/components/redirect.js`), so the real assertion is
 * on the parsed destination, not on "did it throw".
 */
import { describe, expect, it } from "vitest";

import EchoPage from "../page";

describe("/echo", () => {
  it("redirects to /today, specifically — not merely that it redirects", () => {
    let digest: string | undefined;

    try {
      EchoPage();
      throw new Error("EchoPage() returned instead of redirecting");
    } catch (error) {
      digest = (error as { digest?: string }).digest;
    }

    expect(digest).toBeDefined();

    const [code, type, destination] = (digest as string).split(";");
    expect(code).toBe("NEXT_REDIRECT");
    expect(["push", "replace"]).toContain(type);
    expect(destination).toBe("/today");
  });
});
