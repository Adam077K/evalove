// @vitest-environment jsdom
/**
 * The Dates screen — night window above, a torn edge, the paper below.
 *
 * WHAT CHANGED HERE, 2026-08-10, AND WHY. This suite used to render
 * `../page` directly. That page is now an async Server Component that reads
 * `date_plans` and `photos`, so it cannot be rendered in jsdom at all — and
 * the composition it used to assert on moved, whole, into
 * `components/dates/DatesScreen.tsx`. That component is what both the live
 * route and `app/(app)/review/dates/page.tsx` render, so asserting on it is
 * asserting on the shipping screen rather than on a page shell.
 *
 * Every assertion the old suite made is still made below. Three are new, and
 * they are the ones this feature exists for:
 *
 *   - the proposal comes before both shelves (the founder could not find the
 *     feature; ordering is the fix, so ordering is asserted);
 *   - photographs appear on Dates ONLY as the page a happened date left
 *     behind — the old suite asserted no photograph could ever appear here,
 *     which was true of a screen where no date had ever happened;
 *   - no relative time reaches the screen.
 */
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { RELATIVE_TIME_PATTERN } from "@/lib/copy-law";
import { ADAM, EVA } from "@/lib/fixtures/members";
import { PHOTOS } from "@/lib/fixtures/photos";

import type { MemberLite } from "@/components/dates/plan-copy";
import type { DatePlan } from "@/lib/types";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/dates",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: PropsWithChildren<{ href: string }>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The two shelves that were already here are stubbed: their own suites cover
// them, and DatesExplorer's rail measures DOM geometry jsdom does not have.
// They are stubbed as marked elements rather than removed, because their
// POSITION relative to the proposal is one of the things under test.
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

const { DatesScreen } = await import("@/components/dates/DatesScreen");

const MEMBERS: MemberLite[] = [
  { id: EVA.id, slug: "eva", displayName: EVA.displayName },
  { id: ADAM.id, slug: "adam", displayName: ADAM.displayName },
];

/** A day far enough ahead that no window on it has closed. */
const AHEAD = "2027-05-14";

const PROPOSED: DatePlan = {
  id: "p-1",
  kind: "two-kitchens",
  status: "proposed",
  proposedBy: EVA.id,
  sharedDay: AHEAD,
  windowId: "w6",
  startsAt: `${AHEAD}T16:00:00.000Z`,
  note: "the one with the anchovies",
  createdAt: "2027-05-10T09:00:00.000Z",
};

const HAPPENED: DatePlan = {
  id: "h-1",
  kind: "the-same-hour-walk",
  status: "happened",
  proposedBy: ADAM.id,
  sharedDay: "2026-07-30",
  windowId: "w5",
  startsAt: "2026-07-30T14:00:00.000Z",
  answeredBy: EVA.id,
  answeredAt: "2026-07-29T09:00:00.000Z",
  happenedAt: "2026-07-30T15:00:00.000Z",
  createdAt: "2026-07-29T08:00:00.000Z",
};

function screen(over: Partial<Parameters<typeof DatesScreen>[0]> = {}) {
  return render(
    <DatesScreen
      windowLine="Eva’s lunch break"
      today="2027-05-13"
      proposed={[]}
      agreed={[]}
      happened={[]}
      members={MEMBERS}
      photosByDay={{}}
      {...over}
    />,
  );
}

describe("the Dates screen — the night window", () => {
  it("renders the window sentence", () => {
    const { container } = screen();
    const nightSection = container.querySelector(".bg-night-sky");
    expect(nightSection).not.toBeNull();

    const windowSentence = nightSection?.querySelector(".type-title.italic");
    expect(windowSentence).not.toBeNull();
    expect(windowSentence?.textContent).toBeTruthy();
  });

  it("omits the window sentence when there is no clock to read", () => {
    // `currentWindow` returns null for a non-finite instant or an unresolvable
    // zone. The page passes that through as `windowLine: null`, and the band
    // must then say nothing rather than say something empty.
    const { container } = screen({ windowLine: null });
    const nightSection = container.querySelector(".bg-night-sky");
    expect(nightSection).not.toBeNull();
    expect(nightSection?.querySelector(".type-title.italic")).toBeNull();
  });

  it("renders both shore images with alt='' and aria-hidden=true", () => {
    const { container } = screen();
    const images = container.querySelectorAll("img[alt='']");
    expect(images.length).toBeGreaterThanOrEqual(2);

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
    const { container } = screen();

    const nightSkySection = container.querySelector(".bg-night-sky");
    const seamElement = Array.from(container.querySelectorAll("*")).find((el) =>
      (el.getAttribute("class") ?? "").includes("rotate-180"),
    );
    const h1 = container.querySelector("h1");

    expect(nightSkySection).not.toBeNull();
    expect(seamElement).not.toBeNull();
    expect(h1).not.toBeNull();

    expect(nightSkySection?.compareDocumentPosition(seamElement!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(seamElement?.compareDocumentPosition(h1!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("renders NEW YORK before TEL AVIV — Eva before Adam", () => {
    const { container } = screen();
    const text = container.textContent ?? "";
    const newYorkIndex = text.indexOf("NEW YORK");
    const telAvivIndex = text.indexOf("TEL AVIV");

    expect(newYorkIndex).toBeGreaterThanOrEqual(0);
    expect(telAvivIndex).toBeGreaterThan(newYorkIndex);
  });

  it("renders the Dates paper with the Dates heading", () => {
    const { container } = screen();
    expect(container.querySelector("h1")?.textContent).toBe("Dates");
  });
});

describe("the Dates screen — the order that was the bug", () => {
  it("puts asking for a date before both shelves", () => {
    // The founder opened this route and could not find the feature. It was
    // already one tap from the dock, so the failure was what arriving here
    // showed: two shelves of reading and nothing to do. This assertion is that
    // fix, stated so it cannot be undone by an innocent-looking reorder.
    const { container } = screen();

    const propose = container.querySelector("#propose-title");
    const hosted = container.querySelector('[data-testid="hosted-dates"]');
    const shelf = container.querySelector('[data-testid="dates-explorer"]');

    expect(propose).not.toBeNull();
    expect(hosted).not.toBeNull();
    expect(shelf).not.toBeNull();

    expect(propose?.compareDocumentPosition(hosted!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(hosted?.compareDocumentPosition(shelf!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("offers a way to ask, addressed to the other one", () => {
    const { container } = screen();
    // A real control, not the word "Ask" appearing somewhere in the document.
    const ask = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.startsWith("Ask "),
    );
    expect(ask, "no Ask button on the screen").toBeDefined();
    // The viewer defaults to Eva, so the button is addressed to Adam. If this
    // ever reads "Ask Eva" by default, the proposal is being addressed to
    // whoever is making it.
    expect(ask?.textContent).toBe("Ask Adam");
  });

  it("puts both wall clocks on every hour it offers, Eva's city first", () => {
    // The load-bearing assertion of the whole feature. A date between two
    // clocks seven hours apart is not "8pm" — it is one hour with two
    // readings, and an hour showing one of them is an hour one of them has to
    // do arithmetic on.
    //
    // Asserted as ORDER INSIDE EACH CHIP, not as presence anywhere in the
    // document. The first version of this test read `lastIndexOf("New York")`
    // against the whole screen and asserted only that it was >= 0 — which the
    // DECO band's own "NEW YORK", fifteen hundred pixels up the page, would
    // have satisfied on its own with every chip blank. That is the exact
    // shape of assertion this project keeps shipping, written by the person
    // warning about it.
    const { container } = screen();
    const hours = Array.from(container.querySelectorAll("button[aria-pressed]"));
    expect(hours.length, "no hour to choose").toBeGreaterThan(0);

    for (const chip of hours) {
      const text = chip.textContent ?? "";
      const newYork = text.indexOf("New York");
      const telAviv = text.indexOf("Tel Aviv");
      expect(newYork, `"${text}" does not name New York`).toBeGreaterThanOrEqual(0);
      expect(telAviv, `"${text}" does not name Tel Aviv`).toBeGreaterThanOrEqual(0);
      expect(newYork, `"${text}" puts Tel Aviv first`).toBeLessThan(telAviv);
      // A reading, not a band name: "12:00 pm in New York, 7:00 pm in Tel Aviv".
      expect(/\d{1,2}:\d{2}\s*(?:am|pm)/i.test(text), `"${text}" has no clock`).toBe(
        true,
      );
    }
  });
});

describe("the Dates screen — what is between them", () => {
  it("draws nothing at all when nothing is between them", () => {
    // Bare paper, not a card saying they have no dates. No "yet", no empty
    // calendar illustration, no waiting copy.
    const { container } = screen();
    expect(container.querySelector("#asked-title")).toBeNull();
    expect(container.querySelector("#agreed-title")).toBeNull();
    expect(container.querySelector("#left-title")).toBeNull();
  });

  it("names who asked, and says the other one answers", () => {
    const { container } = screen({ proposed: [PROPOSED] });
    const text = container.textContent ?? "";
    expect(text).toContain("Eva asked");
    expect(text).toContain("The same meal, two kitchens");
    expect(text).toContain("the one with the anchovies");
  });

  it("shows the photographs a happened date left behind", () => {
    const eva = PHOTOS["d0730-eva"];
    const adam = PHOTOS["d0730-adam"];
    expect(eva, "fixture photo missing").toBeDefined();
    expect(adam, "fixture photo missing").toBeDefined();

    const { container } = screen({
      happened: [HAPPENED],
      photosByDay: { "2026-07-30": [eva!, adam!] },
    });

    const photos = container.querySelectorAll("img.photo");
    expect(photos).toHaveLength(2);
  });

  it("shows no photograph for a happened date whose day left none", () => {
    // The link is `shared_day`, and a day can hold nothing. A card that
    // rendered a frame anyway would be inventing a page.
    const { container } = screen({ happened: [HAPPENED], photosByDay: {} });
    expect(container.querySelectorAll("img.photo")).toHaveLength(0);
  });

  it("renders no photograph anywhere else on the screen", () => {
    // The old suite asserted no photograph could appear on Dates at all,
    // which was true of a screen where no date had ever happened. The rule
    // that survives is narrower and still worth holding: a photograph on this
    // screen is always the page a date left behind.
    const { container } = screen({ proposed: [PROPOSED] });
    expect(container.querySelectorAll("img.photo")).toHaveLength(0);
  });
});

describe("the Dates screen — the copy laws", () => {
  it("makes no relative-time claim anywhere on the screen", () => {
    const { container } = screen({
      proposed: [PROPOSED],
      happened: [HAPPENED],
      photosByDay: {},
    });

    // The screen name "Dates" and the dock label "Today" are proper nouns the
    // pattern cannot tell from a timestamp (see lib/copy-law.ts's own KNOWN
    // LIMITATION). Neither appears in the strings this walk reads, because it
    // reads the sections that carry dates rather than the whole document.
    const sections = [
      container.querySelector("#propose-title")?.closest("section"),
      container.querySelector("#asked-title")?.closest("section"),
      container.querySelector("#left-title")?.closest("section"),
    ];

    for (const section of sections) {
      const text = section?.textContent ?? "";
      expect(text.length, "a section under test rendered nothing").toBeGreaterThan(0);
      expect(RELATIVE_TIME_PATTERN.exec(text)?.[0] ?? null, text).toBeNull();
    }
  });

  it("the relative-time guard is live, not a no-op", () => {
    expect(RELATIVE_TIME_PATTERN.test("we did this yesterday")).toBe(true);
  });

  it("counts nothing — no tally of dates proposed, agreed or had", () => {
    const { container } = screen({
      proposed: [PROPOSED],
      happened: [HAPPENED],
      photosByDay: {},
    });
    const text = container.textContent ?? "";
    expect(/\b\d+\s*(?:dates?|times?|streaks?)\b/i.test(text)).toBe(false);
  });
});
