// @vitest-environment jsdom
/**
 * ResurfacedItem — an unsigned photograph (migration 12, founder decision
 * 2026-08-07) renders honestly: no invented author, no empty byline, no
 * dash, no "Unknown" — and a signed photograph whose slug failed to resolve
 * still fails loudly, exactly as before this change.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { PHOTOS } from "@/lib/fixtures/photos";
import type { Return } from "@/lib/resurface";
import { BookSheet } from "@/components/book/BookSheet";
import { ResurfacedItem } from "@/components/book/ResurfacedItem";

afterEach(cleanup);

const SIGNED_FIXTURE = PHOTOS["seed-eva-1"];

/** A photograph nobody signed — same bytes/registry entry as a real fixture,
    author fields cleared to the deliberately-unsigned shape. */
const UNSIGNED_PHOTO = {
  ...SIGNED_FIXTURE,
  id: "unsigned-fixture-with-image",
  authorMemberId: null,
  authorSlug: undefined,
  caption: "the four of us, that terrace",
};

const UNSIGNED_NO_IMAGE = {
  ...SIGNED_FIXTURE,
  id: "unsigned-fixture-no-image",
  authorMemberId: null,
  authorSlug: undefined,
  width: 0,
  height: 0,
  caption: "a line nobody signed",
};

/** authorMemberId IS set (this one is supposed to be signed) but no
    authorSlug was ever attached — the producer-failed-to-resolve case. */
const UNRESOLVED_PHOTO = {
  ...SIGNED_FIXTURE,
  id: "unresolved-fixture",
  authorMemberId: "some-id-with-no-roster-entry",
  authorSlug: undefined,
};

const FORBIDDEN_STRINGS = ["Eva", "Adam", "Unknown", "undefined", "null"];

describe("ResurfacedItem — an unsigned photograph", () => {
  it("renders a photograph with a caption, inventing no author", () => {
    const returned: Return = {
      reason: "date",
      label: "A year ago today",
      photo: UNSIGNED_PHOTO,
    };
    render(
      <BookSheet>
        <ResurfacedItem returned={returned} />
      </BookSheet>,
    );

    // The caption itself renders — the photo is not suppressed. `getByText`
    // throws if no element carries this text, which is the assertion.
    screen.getByText(UNSIGNED_PHOTO.caption);

    const text = document.body.textContent ?? "";
    for (const forbidden of FORBIDDEN_STRINGS) {
      expect(text, `rendered text unexpectedly contains "${forbidden}"`).not.toContain(
        forbidden,
      );
    }

    // Alt text on the <img> must not name a person either.
    const img = document.querySelector("img.photo");
    expect(img).not.toBeNull();
    const alt = img!.getAttribute("alt") ?? "";
    expect(alt).not.toMatch(/Eva|Adam/);
  });

  it("renders a text-only item (no image) with a caption, inventing no author", () => {
    const returned: Return = {
      reason: "date",
      label: "A year ago today",
      photo: UNSIGNED_NO_IMAGE,
    };
    render(
      <BookSheet>
        <ResurfacedItem returned={returned} />
      </BookSheet>,
    );

    screen.getByText(UNSIGNED_NO_IMAGE.caption);
    const text = document.body.textContent ?? "";
    for (const forbidden of FORBIDDEN_STRINGS) {
      expect(text, `rendered text unexpectedly contains "${forbidden}"`).not.toContain(
        forbidden,
      );
    }
  });

  it("does not render an empty byline, a dash, or the word Unknown", () => {
    const returned: Return = {
      reason: "date",
      label: "A year ago today",
      photo: UNSIGNED_PHOTO,
    };
    render(
      <BookSheet>
        <ResurfacedItem returned={returned} />
      </BookSheet>,
    );
    const text = document.body.textContent ?? "";
    // A lone em/en dash standing in for a byline, or the literal word.
    expect(text).not.toMatch(/\bUnknown\b/);
    expect(text).not.toMatch(/^\s*[—-]\s*$/m);
  });
});

describe("ResurfacedItem — a signed photograph whose slug failed to resolve", () => {
  it("STILL throws — this is a bug at the producer, not a legal unsigned state", () => {
    const returned: Return = {
      reason: "date",
      label: "A year ago today",
      photo: UNRESOLVED_PHOTO,
    };
    // React logs the thrown error to the console during the failed render;
    // that noise is expected here and is not itself part of the assertion.
    expect(() =>
      render(
        <BookSheet>
          <ResurfacedItem returned={returned} />
        </BookSheet>,
      ),
    ).toThrow(/no authorSlug resolved/);
  });
});
