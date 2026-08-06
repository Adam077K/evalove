// @vitest-environment jsdom
/**
 * Founder decision, 2026-08-06: the surface list is Today · The Book ·
 * Dates — Echo is no longer a tab. This is the regression test for
 * that: exactly four links (three destinations plus the pen), in
 * order, and nothing pointing at `/echo` ever again.
 *
 * `next/link` is mocked to a plain `<a>` because it otherwise expects
 * to be mounted under Next's own App Router context, which nothing in
 * this test tree provides — the assertions below only care about the
 * rendered `href`s, not Link's prefetch behaviour.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

afterEach(cleanup);

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// `useReducedMotion` reads `matchMedia`, which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const { Dock } = await import("../Dock");

describe("Dock", () => {
  it("is exactly Today · The Book · (pen) · Dates, in that order", () => {
    render(<Dock />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toEqual(["/today", "/book", "/send", "/dates"]);
  });

  it("never links to /echo", () => {
    render(<Dock />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).not.toContain("/echo");
    expect(screen.queryByText("Echo")).toBeNull();
  });

  it("keeps the pen — /send — in the raised centre position", () => {
    render(<Dock />);
    const pen = screen.getByRole("link", { name: "Send something small" });
    expect(pen.getAttribute("href")).toBe("/send");
  });
});
