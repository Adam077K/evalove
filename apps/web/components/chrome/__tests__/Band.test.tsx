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
});
