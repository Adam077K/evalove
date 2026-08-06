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

afterEach(cleanup);

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
  const seam = main?.firstElementChild as HTMLElement | null;
  return {
    headerClassName: header?.className ?? null,
    headerHeightVar: header?.style.height ?? null,
    mainClassName: main?.className ?? null,
    seamClassName: seam?.className ?? null,
    seamIsAriaHidden: seam?.getAttribute("aria-hidden") ?? null,
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

  it("hosts the torn edge rotated, not mirrored, immediately above route content", () => {
    const { container } = render(
      <AppLayout>
        <div />
      </AppLayout>,
    );
    const main = container.querySelector("main");
    const seam = main?.firstElementChild as HTMLElement;
    expect(seam.className).toContain("rotate-180");
    expect(seam.className).not.toMatch(/scale-y/i);
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
});
