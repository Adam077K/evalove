// @vitest-environment jsdom
/**
 * `Column` is what Dates and Send opt into now that the shell
 * (`app/(app)/layout.tsx`) is edge-to-edge by default. The horizontal
 * figures here must match what Today and The Book apply directly to
 * their own content, or "identical computed horizontal insets across
 * every route" — the shared-shell success criterion — stops being
 * true. See `app/(app)/__tests__/layout.test.tsx` for the shell half
 * of that guarantee.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Column } from "../Column";

describe("Column", () => {
  it("applies the same px-5 / md:px-8 Today and The Book apply directly", () => {
    const { container } = render(<Column>content</Column>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain("px-5");
    expect(div.className).toContain("md:px-8");
  });

  it("reserves --dock-footprint at the bottom and adds no top padding of its own", () => {
    const { container } = render(<Column>content</Column>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain("pb-[calc(var(--dock-footprint)+4rem)]");
    // No pt-* utility anywhere in the className string — the shell
    // reserves --band-height and content sits flush against the seam
    // on every route, columned or not.
    expect(div.className).not.toMatch(/(^|\s)pt-/);
  });

  it("merges a caller className without dropping its own", () => {
    const { container } = render(<Column className="space-y-10">content</Column>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain("space-y-10");
    expect(div.className).toContain("px-5");
  });
});
