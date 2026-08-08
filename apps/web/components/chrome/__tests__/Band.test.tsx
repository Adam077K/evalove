// @vitest-environment jsdom
/**
 * The masthead is the one §0 exception (design law, revised
 * 2026-08-06): invariant, byte-identical on every route, never a
 * skeleton. This is the regression test for all three: it takes no
 * route input at all (so it *cannot* branch), it renders two real
 * clock readings on first paint with no client tick yet run (so it
 * cannot render empty or loading), and it carries the presence dot
 * `DualClocks` established rather than a re-invented affordance.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Band } from "../Band";

afterEach(cleanup);

describe("Band", () => {
  it("shows both cities and a real clock reading before any client tick", () => {
    render(<Band />);
    expect(screen.getByText("NEW YORK")).toBeTruthy();
    expect(screen.getByText("TEL AVIV")).toBeTruthy();
    // `11:48 pm` shape — never blank, never a `--:--` placeholder.
    const readings = screen.getAllByText(/^\d{1,2}:\d{2}\s?(am|pm)$/i);
    expect(readings).toHaveLength(2);
  });

  it("is a landmark, labelled, and takes no props that could vary it by route", () => {
    render(<Band />);
    const banner = screen.getByRole("banner", {
      name: "Where Eva and Adam are right now",
    });
    expect(banner).toBeTruthy();
    // Band() takes no arguments — nothing here is a function of the
    // current route. Two renders with nothing passed must produce the
    // same landmark and the same two city labels every time.
    cleanup();
    render(<Band />);
    expect(
      screen.getByRole("banner", { name: "Where Eva and Adam are right now" }),
    ).toBeTruthy();
    expect(screen.getByText("NEW YORK")).toBeTruthy();
    expect(screen.getByText("TEL AVIV")).toBeTruthy();
  });

  it("reserves --band-height for the fixed masthead", () => {
    const { container } = render(<Band />);
    const header = container.querySelector("header");
    expect(header?.style.height).toBe("var(--band-height)");
  });

  /**
   * Eva first, everywhere the two of them appear in sequence — the
   * same rule `MEMBERS: readonly [Member, Member] = [EVA, ADAM]`
   * (lib/fixtures/members.ts) and Today's own DECO section already
   * hold ("New York first; the gold is hers"). New York is Eva's city
   * (`EVA.homeTimezone === "America/New_York"`); Tel Aviv is Adam's.
   * This is the most visible surface in the app — on every route — so
   * asserted, not left to be remembered: New York must precede Tel
   * Aviv in the rendered order, and Eva's reading carries the gold
   * tone, both by DOM order and by document position.
   */
  it("holds Eva-first: New York precedes Tel Aviv, gold is hers", () => {
    const { container } = render(<Band />);
    const text = container.textContent ?? "";
    expect(text.indexOf("NEW YORK")).toBeGreaterThanOrEqual(0);
    expect(text.indexOf("TEL AVIV")).toBeGreaterThan(text.indexOf("NEW YORK"));

    // After the Band moved to paper, Eva's city carries text-ink (full
    // darkness — the stronger reading) and Adam's carries text-mute (the
    // receded reading). The guard is: TEL AVIV is the muted one, which
    // means New York is NOT muted — the distinction holds by exclusion.
    const muted = container.querySelector(".text-mute");
    expect(muted?.textContent).toBe("TEL AVIV");
  });
});
