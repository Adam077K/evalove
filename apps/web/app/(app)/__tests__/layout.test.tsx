// @vitest-environment jsdom
/**
 * The shared shell — the regression test for "the layouts always
 * switch and tweak" (founder, 2026-08-06). `AppLayout` must wrap
 * completely different route content in an identical band, seam and
 * `--band-height` reservation: if a future edit starts reading
 * `usePathname` inside it and branching per route, the three hand-
 * rolled top insets this replaced (1.5rem/1.75rem/2.25rem) are one
 * `if` statement away from coming back.
 *
 * `next/navigation` and `next/link` are mocked because `<Dock />`
 * (rendered inside the shell) otherwise expects Next's own router
 * context, which nothing in this test tree provides — see
 * `components/chrome/__tests__/Dock.test.tsx` for the same mocks.
 */
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: PropsWithChildren<{ href: string }>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// `useReducedMotion` (inside `<Dock />`) reads `matchMedia`, which jsdom
// does not implement.
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

const { default: AppLayout } = await import("../layout");

/** Everything outside `{children}` — the part that must never vary by route. */
function shellSkeleton(container: HTMLElement) {
  const header = container.querySelector("header");
  const main = container.querySelector("main");
  return {
    headerClassName: header?.className ?? null,
    headerHeightVar: header?.style.height ?? null,
    mainClassName: main?.className ?? null,
  };
}

describe("AppLayout — the shared shell", () => {
  it("wraps unrelated children in an identical band + seam + main", () => {
    const { container: today } = render(
      <AppLayout>
        <div data-testid="today">A photograph, a caption, a sealed note.</div>
      </AppLayout>,
    );
    const todaySkeleton = shellSkeleton(today);
    cleanup();

    const { container: dates } = render(
      <AppLayout>
        <p>An entirely different shape: a header, two shelves of cards.</p>
      </AppLayout>,
    );
    const datesSkeleton = shellSkeleton(dates);

    expect(todaySkeleton).toEqual(datesSkeleton);
  });

  it("reserves --band-height on main — the same pattern --dock-footprint already uses", () => {
    const { container } = render(
      <AppLayout>
        <div />
      </AppLayout>,
    );
    const main = container.querySelector("main");
    expect(main?.className).toContain("pt-[var(--band-height)]");
  });

  it("main's first child is not a seam — the seam belongs to Dates now (founder, 2026-08-08)", () => {
    const { container } = render(
      <AppLayout>
        <div />
      </AppLayout>,
    );
    const main = container.querySelector("main");
    const firstChild = main?.firstElementChild as HTMLElement | null;
    // After the seam moved to Dates, the shell no longer owns the torn edge.
    // main's first child is whatever the route renders, never rotate-180.
    // Assert the positive side first: firstChild exists and is the route's content
    expect(firstChild).not.toBeNull();
    // Then assert it is not a seam
    expect(firstChild?.className ?? "").not.toContain("rotate-180");
  });

  it("renders exactly one masthead landmark, fixed at the top", () => {
    const { container } = render(
      <AppLayout>
        <div />
      </AppLayout>,
    );
    const headers = container.querySelectorAll("header");
    expect(headers).toHaveLength(1);
    expect(headers[0]?.className).toContain("fixed");
    expect(headers[0]?.className).toContain("top-0");
  });

  /**
   * The App Router does not unmount a shared layout between sibling
   * routes; `rerender` into the same container — changing only
   * `children`, exactly as a route change would — is the in-tree
   * equivalent of that. `<Band />` and `<Dock />` sit at the same
   * position in the tree on both renders, so React must reuse the
   * same component instances rather than tear down and recreate them:
   * the masthead's own `<header>` node is checked for reference
   * equality (not just equal markup), and `setInterval` is spied on to
   * prove the band's 10s tick was armed exactly once — never
   * re-armed, which is what "must not flicker or re-tick" requires.
   */
  it("keeps the band as the same DOM node across a route change, clock uninterrupted", () => {
    vi.useFakeTimers();
    const intervalSpy = vi.spyOn(globalThis, "setInterval");

    const { container, rerender } = render(
      <AppLayout>
        <div data-testid="today">Today</div>
      </AppLayout>,
    );
    const headerBefore = container.querySelector("header");
    expect(headerBefore).not.toBeNull();
    const armsBeforeNav = intervalSpy.mock.calls.length;
    expect(armsBeforeNav).toBeGreaterThan(0);

    rerender(
      <AppLayout>
        <p data-testid="dates">for the two of them — Dates</p>
      </AppLayout>,
    );

    expect(container.querySelector("header")).toBe(headerBefore);
    expect(intervalSpy.mock.calls.length).toBe(armsBeforeNav);

    intervalSpy.mockRestore();
  });
});
