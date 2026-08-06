// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element -- the two hand-built
   fixtures below must be exactly what the product renders: a raw
   `<img class="photo">`, which is what this check queries for. */
/**
 * THE LAMP NEVER REACHES A PHOTOGRAPH — the ancestor check.
 *
 * globals.css §6 states the rule this file defends:
 *
 *   "Photographs are the sole exception and are NEVER dimmed — never
 *    give a photograph `.under-lamp`, per the standing rule that at
 *    11pm the brightest thing on the screen is the other one's face."
 *
 * Every earlier check on this codebase verified that an `img.photo`
 * computes `filter: none`. It always did — and every photograph in the
 * open Book was dimmed ×0.73 and sepia'd at night anyway, because
 * `.under-lamp` sat on the cloth wrapper ABOVE the pages
 * (BookObject.tsx). A CSS `filter` renders its whole subtree and then
 * filters the result; the child's own `filter: none` is applied first
 * and cannot undo what happens to the composited group afterwards.
 * There is no child-side escape. A test that reads the <img> is
 * structurally incapable of seeing the defect — which is why one
 * shipped, through seven review gates.
 *
 * So this test walks UP. For every photograph on every surface that
 * renders one, it reads the computed `filter` of each ancestor in turn
 * and fails on any that alters pixels.
 *
 * WHAT COUNTS AS ALTERING PIXELS. `brightness`, `sepia`, `saturate`,
 * `contrast`, `grayscale`, `invert`, `hue-rotate`, `blur`, `opacity`
 * and `url()` all rewrite the subtree's colour. `drop-shadow` does
 * not: it composites a shadow BEHIND the already-rendered subtree and
 * leaves every source pixel untouched. That distinction is not a
 * convenience — the page turn (BookTurnStage.tsx) and the sticker
 * mount (Mounted.tsx) both put a legitimate `drop-shadow` above
 * photographs, and globals.css §"the turn" states the same exemption
 * in words. Anything else above a photograph fails here.
 *
 * WHY THE STYLESHEET IS BUILT FROM THE REAL globals.css. The set of
 * dimming classes is not hard-coded: every `@utility` block in the
 * real file that declares a `filter` is extracted and injected into
 * jsdom, so a NEW dimming utility placed above a photograph is caught
 * on the day it is written, without anyone remembering to update this
 * file. `assertInstrumentIsLive` refuses to let the suite pass if that
 * extraction or injection ever silently yields nothing.
 *
 * WHAT THIS TEST CANNOT DO. jsdom does not rasterise and does not
 * evaluate `var()`, so this proves STRUCTURE, not pixels: it shows no
 * filter stands between the lamp tokens and any photograph, from which
 * the photograph's independence from `--lamp-dim` follows by the CSS
 * spec. `data-mode` is toggled across the sweep because the rule is
 * stated for both rooms, and the check is deliberately mode-invariant:
 * `.under-lamp` computes a non-`none` filter by DAY too
 * (`brightness(calc(1 - 0 * 0.27))` is an identity function, but it is
 * still a filter and still composites its subtree), so a day-only run
 * would catch it just the same. Actual pixel equality between the two
 * rooms needs a browser and stays on the visual-verification list.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PHOTOS } from "@/lib/fixtures/photos";
import { mountFor } from "@/components/book/compose";
import type { MountKind } from "@/components/book/compose";
import type { Return } from "@/lib/resurface";
import { BookSheet } from "@/components/book/BookSheet";
import { ResurfacedItem } from "@/components/book/ResurfacedItem";
import { TodayDoorway } from "@/components/home/TodayDoorway";
import ReviewBookStatesPage from "@/app/(app)/review/book-states/page";
import ReviewTodayPairPage from "@/app/(app)/review/today-pair/page";

vi.mock("next/navigation", () => ({ usePathname: () => "/today" }));

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

// `useReducedMotion` (Mounted) and BookObject's own reduced-motion
// check both read `matchMedia`, which jsdom does not implement.
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

afterEach(cleanup);

/* ------------------------------------------------------------------ *
 * Reading the real law out of the real stylesheet
 * ------------------------------------------------------------------ */

/** Resolved from the working directory, not `import.meta.url`: under
    the jsdom environment `import.meta.url` is not a `file:` URL and
    `readFileSync` rejects it outright. Both candidates are checked so
    the suite runs from `apps/web` or from the repo root. */
const GLOBALS_CSS_PATH = ["app/globals.css", "apps/web/app/globals.css"]
  .map((p) => resolve(process.cwd(), p))
  .find(existsSync);

if (GLOBALS_CSS_PATH === undefined) {
  throw new Error(
    `globals.css not found from ${process.cwd()} — this test reads the real ` +
      `stylesheet and must never fall back to a hard-coded copy of the lamp curve`,
  );
}

const GLOBALS_CSS = readFileSync(GLOBALS_CSS_PATH, "utf8");

/** Block comments carry the words "filter:" in prose; strip them first. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Top-level function names in a `filter` value. Brace/paren depth is
 * tracked so `drop-shadow(0 2px 4px rgba(...))` reports `drop-shadow`
 * and never `rgba`, and `brightness(calc(1 - var(--x)))` reports
 * `brightness` and never `calc` or `var`.
 */
function filterFunctions(value: string): string[] {
  const names: string[] = [];
  let depth = 0;
  let token = "";
  for (const ch of value) {
    if (ch === "(") {
      if (depth === 0) {
        names.push(token.trim().toLowerCase());
        token = "";
      }
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) token = "";
    } else if (depth === 0) {
      token += ch;
    }
  }
  return names.filter((n) => n.length > 0);
}

/**
 * The one exemption, and the reason for it: `drop-shadow` composites a
 * shadow behind an already-rendered subtree without touching a single
 * source pixel. Every other filter function rewrites them.
 */
const PIXEL_SAFE = new Set(["drop-shadow"]);

function altersPixels(value: string | null | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "" || v === "none" || v === "initial" || v === "unset") return false;
  const fns = filterFunctions(v);
  // An unparseable non-none value is treated as hostile on purpose: an
  // unreadable filter above a photograph is not something to wave through.
  if (fns.length === 0) return true;
  return fns.some((fn) => !PIXEL_SAFE.has(fn));
}

/** Every `@utility NAME { … }` in globals.css that declares a `filter`. */
function utilityFilters(css: string): Map<string, string> {
  const found = new Map<string, string>();
  const header = /@utility\s+([a-zA-Z0-9_-]+)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = header.exec(css)) !== null) {
    const start = header.lastIndex;
    let depth = 1;
    let i = start;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") depth -= 1;
      i += 1;
    }
    const body = css.slice(start, i - 1);
    const decl = /(?:^|[;{])\s*filter\s*:\s*([^;}]+)/.exec(body);
    if (decl) found.set(match[1]!, decl[1]!.trim());
  }
  return found;
}

const UTILITY_FILTERS = utilityFilters(stripComments(GLOBALS_CSS));

/** The utilities whose filter would dim, tint or blur what sits under them. */
const DIMMING_UTILITIES = [...UTILITY_FILTERS.entries()]
  .filter(([, value]) => altersPixels(value))
  .map(([name]) => name);

beforeAll(() => {
  const sheet = document.createElement("style");
  sheet.textContent = [...UTILITY_FILTERS.entries()]
    .map(([name, value]) => `.${name} { filter: ${value}; }`)
    .join("\n");
  document.head.appendChild(sheet);
});

/* ------------------------------------------------------------------ *
 * The walk
 * ------------------------------------------------------------------ */

function describeElement(el: Element): string {
  const cls = el.getAttribute("class");
  const inline = (el as HTMLElement).style?.filter;
  return [
    el.tagName.toLowerCase(),
    cls ? `.${cls.trim().split(/\s+/).join(".")}` : "",
    inline ? ` [style filter: ${inline}]` : "",
  ].join("");
}

/**
 * Every ancestor of `el`, nearest first, whose own computed `filter`
 * would alter the pixels of everything beneath it. `el` itself is not
 * examined: `.photo`'s own `filter: none` is exactly the reading that
 * hid this defect, and `.is-away .photo`'s privacy blur is legitimate
 * and lives on the photograph itself.
 */
function dimmingAncestorsOf(el: Element): { el: Element; filter: string }[] {
  const offenders: { el: Element; filter: string }[] = [];
  let node = el.parentElement;
  while (node !== null) {
    const filter = getComputedStyle(node).filter;
    if (altersPixels(filter)) offenders.push({ el: node, filter });
    node = node.parentElement;
  }
  return offenders;
}

/**
 * The assertion this codebase was missing. Fails loudly, naming the
 * offending ancestor and its filter — and fails just as loudly if a
 * surface rendered no photograph at all, because a sweep that finds
 * nothing to check is not a passing sweep.
 */
function expectNoLampAbovePhotographs(surface: string): void {
  const photos = Array.from(document.querySelectorAll("img.photo"));
  expect(
    photos.length,
    `${surface}: rendered no img.photo — this check would have passed vacuously`,
  ).toBeGreaterThan(0);

  const offences = photos.flatMap((photo) =>
    dimmingAncestorsOf(photo).map(
      (o) =>
        `${surface}: ${describeElement(photo)} is filtered by ancestor ` +
        `${describeElement(o.el)} → filter: ${o.filter}`,
    ),
  );
  expect(offences, `${surface}: a filter on an ancestor filters the photograph`).toEqual(
    [],
  );
}

/* ------------------------------------------------------------------ *
 * One curve, several readers, no drift
 * ------------------------------------------------------------------ */

/** `:root`'s value for a custom property — the first declaration wins,
    which is `:root`'s, ahead of the night block's override. */
function rootToken(name: string): string | undefined {
  return new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(stripComments(GLOBALS_CSS))?.[1]?.trim();
}

/** Every product `.tsx` under a directory, recursively — tests
    excluded, since a test that quotes the curve is not a reader of it
    (this file's own prose was the first thing the scan caught). */
function productTsxUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : productTsxUnder(full);
    }
    const isProductTsx = entry.name.endsWith(".tsx") && !entry.name.includes(".test.");
    return entry.isFile() && isProductTsx ? [full] : [];
  });
}

/* ------------------------------------------------------------------ *
 * The instrument, before it is trusted
 * ------------------------------------------------------------------ */

describe("the instrument", () => {
  it("reads the dimming utilities out of the real globals.css", () => {
    expect(UTILITY_FILTERS.get("photo")).toBe("none");
    expect(DIMMING_UTILITIES).toContain("under-lamp");
    expect(DIMMING_UTILITIES).not.toContain("photo");
  });

  it("classifies drop-shadow as pixel-safe and every other filter as not", () => {
    expect(altersPixels("none")).toBe(false);
    expect(altersPixels("")).toBe(false);
    expect(altersPixels("drop-shadow(0 2px 4px rgba(41,32,24,0.2))")).toBe(false);
    expect(
      altersPixels(
        "drop-shadow(0 2px 4px rgba(41,32,24,0.2)) drop-shadow(0 6px 14px rgba(41,32,24,0.12))",
      ),
    ).toBe(false);
    expect(altersPixels("brightness(0.73)")).toBe(true);
    expect(altersPixels("sepia(0.22)")).toBe(true);
    expect(altersPixels("blur(24px)")).toBe(true);
    expect(altersPixels("opacity(0.5)")).toBe(true);
    expect(altersPixels("url(#dim)")).toBe(true);
    // The real thing, tokens and all — the exact string Pinned.tsx and
    // Polaroid.tsx inline behind their drop-shadows.
    expect(
      altersPixels(
        "drop-shadow(0 2px 2px rgba(41, 32, 24, 0.3)) brightness(calc(1 - var(--lamp-dim, 0) * var(--lamp-brightness-drop, 0.27))) sepia(calc(var(--lamp-dim, 0) * var(--lamp-sepia-saturation, 0.22)))",
      ),
    ).toBe(true);
  });

  it("catches the exact structure that shipped — and shows why reading the <img> never could", () => {
    render(
      <div className="under-lamp">
        <img className="photo" alt="" src="/x.jpg" />
      </div>,
    );
    const photo = document.querySelector("img.photo")!;

    // This is what every previous gate measured. It is true. It is also
    // worthless: the ancestor filters the composited result afterwards.
    expect(getComputedStyle(photo).filter).toBe("none");

    const offenders = dimmingAncestorsOf(photo);
    expect(offenders).toHaveLength(1);
    expect(offenders[0]!.filter).toContain("brightness");
    expect(() => expectNoLampAbovePhotographs("trap")).toThrow();
  });

  it("does not fire on a legitimate drop-shadow ancestor (the page turn, the sticker mount)", () => {
    render(
      <div style={{ filter: "drop-shadow(0 12px 16px rgb(41 32 24 / 0.18))" }}>
        <img className="photo" alt="" src="/x.jpg" />
      </div>,
    );
    expect(dimmingAncestorsOf(document.querySelector("img.photo")!)).toEqual([]);
  });

  it("keeps the lamp curve as one definition — every inline reader's fallback matches :root", () => {
    // `drop-shadow` forces the curve inline in four places (Pinned,
    // Polaroid, and the two ribbons), each reading the lamp tokens
    // with a literal fallback. The tokens are the definition; the
    // fallback is a last-resort default. If a token moves and a
    // fallback does not, the curve has quietly forked — the exact
    // failure globals.css §6 warns about, and the reason these values
    // live in :root at all.
    const readers = productTsxUnder(resolve(GLOBALS_CSS_PATH, "../../components"));
    const drift: string[] = [];
    let seen = 0;
    readers.forEach((file) => {
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/var\(--(lamp-[a-z-]+),\s*([^)]+)\)/g)) {
        seen += 1;
        const declared = rootToken(m[1]!);
        if (declared !== m[2]!.trim()) {
          drift.push(`${file.split("/").pop()}: --${m[1]} fallback ${m[2]} vs :root ${declared}`);
        }
      }
    });
    expect(seen, "no inline reader of the lamp curve found — the scan has gone blind").toBeGreaterThan(0);
    expect(drift, "an inline fallback has drifted from its :root token").toEqual([]);
  });

  it("keeps the away-veil blur on the photograph itself, never on an ancestor", () => {
    // `.is-away .photo` is a privacy control, not decoration, and it is
    // the one filter allowed to touch a photograph. It must stay a rule
    // ABOUT the photograph — moving the blur onto `.is-away` alone would
    // blur the whole page and would not be this rule any more.
    const away = /\.is-away\s+([^{]+)\{\s*filter:\s*blur/.exec(stripComments(GLOBALS_CSS));
    expect(away, "the away-veil blur rule has moved or been deleted").not.toBeNull();
    expect(away![1]!.trim()).toBe(".photo");
  });
});

/* ------------------------------------------------------------------ *
 * The sweep — every surface that renders a photograph
 * ------------------------------------------------------------------ */

/** Fixture photographs that actually carry an image. */
const IMAGE_PHOTOS = Object.values(PHOTOS).filter((p) => p.width > 0 && p.height > 0);

const MOUNT_KINDS: MountKind[] = ["chin", "torn", "stock"];

/** A photo id that `mountFor` sends to the given mount — found by
    search rather than hard-coded, so it follows compose.ts's own pick
    list if the rotation ever changes. */
function idSeedingMount(kind: MountKind): string {
  for (let i = 0; i < 10_000; i += 1) {
    const id = `lamp-sweep-${kind}-${i}`;
    if (mountFor(id) === kind) return id;
  }
  throw new Error(`no id seeds the "${kind}" mount — compose.mountFor has changed`);
}

describe.each(["day", "night"])("no lamp above a photograph — %s", (mode) => {
  beforeAll(() => {
    document.documentElement.setAttribute("data-mode", mode);
  });

  it("the review harness for the Book — covers, openings, pair and single spreads", () => {
    render(<ReviewBookStatesPage />);
    expectNoLampAbovePhotographs(`book-states (${mode})`);
  });

  it("the Book OPEN — the object's own pages, which is where the lamp reached them", () => {
    render(<ReviewBookStatesPage />);
    const covers = screen.getAllByRole("button", { name: "Open the book" });
    expect(covers.length, "the harness renders no openable book").toBeGreaterThan(0);
    // fireEvent, not `.click()` — the phase change is React state and
    // needs to settle inside act() before the DOM is walked.
    covers.forEach((cover) => fireEvent.click(cover));
    // The pages only exist once the object is open.
    expect(screen.getAllByRole("region", { name: "The book, open" }).length).toBe(
      covers.length,
    );
    expectNoLampAbovePhotographs(`book-states, opened (${mode})`);
  });

  it("the review harness for Today — the pair, the single hero, the Tuesday", () => {
    render(<ReviewTodayPairPage />);
    expectNoLampAbovePhotographs(`today-pair (${mode})`);
  });

  it("the doorway corner at the foot of Today", () => {
    render(<TodayDoorway now={new Date("2026-08-02T15:00:00Z")} />);
    expectNoLampAbovePhotographs(`today doorway (${mode})`);
  });

  it("every mount a photograph can land in — polaroid chin, torn sheet, stock border", () => {
    // The mount is seeded from the photograph's own id and decides
    // which material wraps the <img>: a polaroid frame (whose own
    // lamp filter is inlined on a SIBLING), a torn backing sheet, or a
    // plain stock border. Each is a different ancestry, so all three
    // are swept rather than whichever one today's fixtures happen to
    // draw — `mkPhoto` mints a fresh uuid per process, so the seeded
    // mount of a fixture is not stable across runs and cannot be the
    // thing this coverage rests on.
    MOUNT_KINDS.forEach((kind) => {
      const photo = { ...IMAGE_PHOTOS[0]!, id: idSeedingMount(kind) };
      const returned: Return = { reason: "date", label: "A year ago today", photo };
      const { unmount } = render(
        <BookSheet>
          <ResurfacedItem returned={returned} />
        </BookSheet>,
      );
      expectNoLampAbovePhotographs(`${kind} mount (${mode})`);
      unmount();
    });
  });

  it("every fixture photograph, in the mount its own id seeded this run", () => {
    IMAGE_PHOTOS.forEach((photo) => {
      const returned: Return = { reason: "date", label: "A year ago today", photo };
      const { unmount } = render(
        <BookSheet>
          <ResurfacedItem returned={returned} />
        </BookSheet>,
      );
      expectNoLampAbovePhotographs(`${mountFor(photo.id)} mount, ${photo.id} (${mode})`);
      unmount();
    });
  });
});
