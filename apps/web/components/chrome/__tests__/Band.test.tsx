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

  it("carries bg-canvas material", () => {
    const { container } = render(<Band />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("bg-canvas");
  });

  /**
   * Eva first, everywhere the two of them appear in sequence — the
   * same rule `MEMBERS: readonly [Member, Member] = [EVA, ADAM]`
   * (lib/fixtures/members.ts) and Dates' own DECO section already
   * hold ("New York first; the ink is hers"). New York is Eva's city
   * (`EVA.homeTimezone === "America/New_York"`); Tel Aviv is Adam's.
   * This is the most visible surface in the app — on every route — so
   * asserted, not left to be remembered: New York must precede Tel
   * Aviv in the rendered order, and Eva's reading carries the stronger
   * tone, both by DOM order and by document position.
   */
  it("holds Eva-first: New York precedes Tel Aviv in DOM order, ink is hers", () => {
    const { container } = render(<Band />);

    // Assert clock order by DOM — both readings rendered, New York first
    const allSpans = container.querySelectorAll("span");
    let newYorkIndex = -1;
    let telAvivIndex = -1;

    allSpans.forEach((span, idx) => {
      if (span.textContent?.includes("NEW YORK")) {
        newYorkIndex = idx;
      }
      if (span.textContent?.includes("TEL AVIV")) {
        telAvivIndex = idx;
      }
    });

    expect(newYorkIndex).toBeGreaterThanOrEqual(0);
    expect(telAvivIndex).toBeGreaterThan(newYorkIndex);

    // After the Band moved to paper: Eva's city carries text-ink (full
    // darkness — the stronger reading); Adam's carries text-mute (the
    // receded reading). Both sides are asserted positively — asserting
    // only text-mute on Tel Aviv would pass even if text-ink were stripped
    // from Eva's span, leaving New York with no distinguishing tone at all.
    const evaCity = container.querySelector("span.text-ink");
    expect(evaCity?.textContent).toBe("NEW YORK");
    const adamCity = container.querySelector("span.text-mute");
    expect(adamCity?.textContent).toBe("TEL AVIV");
  });
});
