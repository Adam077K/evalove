// @vitest-environment jsdom
/**
 * Dates page — night window above, a torn edge, two shelves of paper below.
 *
 * The night section (window sentence, cities, shores) moved here from Today.
 * The Seam (rotated) sits between night and paper. The DOM order is critical:
 * bg-night-sky section → rotated Seam → paper world. A reversed Seam inverts
 * the composition on both sides.
 *
 * Eva's name (NEW YORK) must precede Adam's (TEL AVIV) — a product law.
 * Photographs never render on Dates.
 */
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/dates",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: PropsWithChildren<{ href: string }>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock DatesExplorer and HostedDates to avoid DOM effects that jsdom doesn't support
vi.mock("@/components/dates/DatesExplorer", () => ({
  DatesExplorer: () => <div data-testid="dates-explorer" />,
}));

vi.mock("@/components/dates/HostedDates", () => ({
  HostedDates: () => <div data-testid="hosted-dates" />,
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

const { default: DatesPage } = await import("../page");

describe("Dates page", () => {
  it("renders the window sentence when currentWindow returns a window id", () => {
    const { container } = render(<DatesPage />);

    // The window sentence should be present when currentWindow returns a valid id
    const nightSection = container.querySelector(".bg-night-sky");
    expect(nightSection).not.toBeNull();

    // Look for the window sentence in the night section
    const windowSentence = nightSection?.querySelector(".type-title.italic");
    // Assert positive: the element exists. If the window sentence does not render,
    // this fails — preventing the test from passing when it should fail.
    expect(windowSentence).not.toBeNull();
    expect(windowSentence?.textContent).toBeTruthy();
  });

  it.todo(
    "omits the window sentence when currentWindow returns null — untestable without deep-mocking lib/shared-day (untouchable)"
  );

  it("renders both shore images with alt='' and aria-hidden=true", () => {
    const { container } = render(<DatesPage />);

    const images = container.querySelectorAll("img[alt='']");
    // Should have at least the two shore images
    expect(images.length).toBeGreaterThanOrEqual(2);

    // Check that shore images have aria-hidden
    const nyShore = Array.from(images).find((img) =>
      img.getAttribute("src")?.includes("nyc-shore"),
    );
    const tlvShore = Array.from(images).find((img) =>
      img.getAttribute("src")?.includes("tlv-shore"),
    );

    expect(nyShore).not.toBeNull();
    expect(nyShore?.getAttribute("alt")).toBe("");
    expect(nyShore?.getAttribute("aria-hidden")).toBe("true");

    expect(tlvShore).not.toBeNull();
    expect(tlvShore?.getAttribute("alt")).toBe("");
    expect(tlvShore?.getAttribute("aria-hidden")).toBe("true");
  });

  it("maintains DOM order: bg-night-sky section → rotated Seam → paper world", () => {
    const { container } = render(<DatesPage />);

    // Find the three critical sections by their actual markers
    const nightSkySection = container.querySelector(".bg-night-sky");
    const seamElement = Array.from(container.querySelectorAll("*")).find(
      (el) => (el.getAttribute("class") ?? "").includes("rotate-180")
    );
    const h1 = container.querySelector("h1");

    // Assert all three are present (positive assertions first).
    // If the Seam vanishes, this fails immediately, preventing the test
    // from passing when the critical composition element is missing.
    expect(nightSkySection).not.toBeNull();
    expect(seamElement).not.toBeNull();
    expect(h1).not.toBeNull();

    // Now verify DOM order using compareDocumentPosition
    // DOCUMENT_POSITION_FOLLOWING (4) means nightSkySection comes before seamElement
    const nightSkyBeforeSeam = nightSkySection?.compareDocumentPosition(seamElement!);
    expect(nightSkyBeforeSeam).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    // seamElement comes before h1
    const seamBeforeH1 = seamElement?.compareDocumentPosition(h1!);
    expect(seamBeforeH1).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders NEW YORK before TEL AVIV — Eva before Adam", () => {
    const { container } = render(<DatesPage />);

    const text = container.textContent ?? "";
    const newYorkIndex = text.indexOf("NEW YORK");
    const telAvivIndex = text.indexOf("TEL AVIV");

    expect(newYorkIndex).toBeGreaterThanOrEqual(0);
    expect(telAvivIndex).toBeGreaterThan(newYorkIndex);
  });

  it("does not render any photographs on Dates", () => {
    const { container } = render(<DatesPage />);

    const photos = container.querySelectorAll("img.photo");
    expect(photos).toHaveLength(0);
  });

  it("renders the Dates paper with Dates heading", () => {
    const { container } = render(<DatesPage />);

    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toBe("Dates");
  });
});
