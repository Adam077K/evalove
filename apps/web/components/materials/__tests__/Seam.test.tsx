// @vitest-environment jsdom
/**
 * `rotated` — the shared shell's band uses this to tear paper DOWN
 * away from a night masthead, the geometric inverse of Today's own
 * (unrotated) seam. The regression this guards: a future edit reaching
 * for `scaleY(-1)` instead, which the component's own docstring says
 * would twin whatever lower tear already exists on screen rather than
 * produce a genuinely different meander — see `Seam.tsx` for the pixel
 * evidence a full rotation was checked against.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Seam } from "../Seam";

describe("Seam", () => {
  it("does not rotate by default", () => {
    const { container } = render(<Seam />);
    const strip = container.firstElementChild as HTMLElement;
    expect(strip.className).not.toContain("rotate-180");
  });

  it("rotates 180° — a point reflection, never a scaleY mirror — when asked", () => {
    const { container } = render(<Seam rotated />);
    const strip = container.firstElementChild as HTMLElement;
    expect(strip.className).toContain("rotate-180");
    expect(strip.className).not.toMatch(/scale-y/i);
  });

  it("keeps every other prop working alongside rotation", () => {
    const { container } = render(<Seam rotated variant="bone" height={200} className="extra" />);
    const strip = container.firstElementChild as HTMLElement;
    expect(strip.className).toContain("rotate-180");
    expect(strip.className).toContain("extra");
    expect(strip.getAttribute("style")).toContain("200px");
    const img = strip.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/materials/seam-tear-bone.webp");
  });
});
