/**
 * compose.ts — `authorshipOf` and its dependents.
 *
 * The two "no slug" cases this module must tell apart, and must NOT confuse
 * with each other (founder decision, 2026-08-07):
 *
 *   - `authorMemberId: null` — deliberately unsigned. Never throws.
 *   - `authorMemberId` set, `authorSlug` still `undefined` — a producer
 *     failed to resolve it. Still throws, exactly as before this change.
 *
 * And the render-facing consequence: `handClass`/`chinHandClass` must never
 * silently fall through to "Adam" for an unsigned photo — they throw, same
 * as `authorSlugOf`, so a render site that forgot to check
 * `authorshipOf(photo).signed` fails loudly instead of inventing an author.
 */
import { describe, expect, it } from "vitest";
import {
  authorSlugOf,
  authorshipOf,
  chinHandClass,
  handClass,
  isAdam,
  isEva,
  unsignedChinHandClass,
  unsignedHandClass,
} from "../compose";

const SIGNED_EVA = { authorMemberId: "eva-id", authorSlug: "eva" as const };
const SIGNED_ADAM = { authorMemberId: "adam-id", authorSlug: "adam" as const };
const UNSIGNED = { authorMemberId: null, authorSlug: undefined };
/** authorMemberId is set (this photo IS supposed to be signed) but the
    producer never attached authorSlug — the "failed to resolve" case. */
const UNRESOLVED = { authorMemberId: "some-id", authorSlug: undefined };

describe("authorshipOf", () => {
  it("resolves a signed photo to { signed: true, slug }", () => {
    expect(authorshipOf(SIGNED_EVA)).toEqual({ signed: true, slug: "eva" });
    expect(authorshipOf(SIGNED_ADAM)).toEqual({ signed: true, slug: "adam" });
  });

  it("resolves a deliberately unsigned photo (authorMemberId: null) to { signed: false } — no throw", () => {
    expect(authorshipOf(UNSIGNED)).toEqual({ signed: false });
  });

  it("STILL throws for a signed photo whose slug failed to resolve", () => {
    expect(() => authorshipOf(UNRESOLVED)).toThrow(/no authorSlug resolved/);
  });
});

describe("isEva / isAdam", () => {
  it("read the signed slug correctly", () => {
    expect(isEva(SIGNED_EVA)).toBe(true);
    expect(isAdam(SIGNED_EVA)).toBe(false);
    expect(isEva(SIGNED_ADAM)).toBe(false);
    expect(isAdam(SIGNED_ADAM)).toBe(true);
  });

  it("are both false for an unsigned photo — neither invents an author", () => {
    expect(isEva(UNSIGNED)).toBe(false);
    expect(isAdam(UNSIGNED)).toBe(false);
  });

  it("still throw for an unresolved (bug) photo, same as authorshipOf", () => {
    expect(() => isEva(UNRESOLVED)).toThrow();
    expect(() => isAdam(UNRESOLVED)).toThrow();
  });
});

describe("authorSlugOf", () => {
  it("returns the slug for a signed photo", () => {
    expect(authorSlugOf(SIGNED_EVA)).toBe("eva");
  });

  it("throws for an unsigned photo — callers must check authorshipOf(photo).signed first", () => {
    expect(() => authorSlugOf(UNSIGNED)).toThrow(/unsigned photo/);
  });

  it("throws for an unresolved photo", () => {
    expect(() => authorSlugOf(UNRESOLVED)).toThrow();
  });
});

describe("handClass / chinHandClass — never silently render an unsigned photo in a hand", () => {
  it("return the right hand for a signed photo", () => {
    expect(handClass(SIGNED_EVA)).toMatch(/font-eva/);
    expect(handClass(SIGNED_ADAM)).toMatch(/font-adam/);
    expect(chinHandClass(SIGNED_EVA)).toMatch(/font-eva/);
    expect(chinHandClass(SIGNED_ADAM)).toMatch(/font-adam/);
  });

  it("THROW for an unsigned photo rather than defaulting to Adam's hand", () => {
    // This is the regression this whole feature exists to prevent: before
    // authorshipOf existed, isEva/isAdam both false on an unsigned photo
    // would fall through a naive `isEva(photo) ? eva : adam` ternary and
    // silently render it in Adam's hand.
    expect(() => handClass(UNSIGNED)).toThrow();
    expect(() => chinHandClass(UNSIGNED)).toThrow();
  });
});

describe("unsignedHandClass / unsignedChinHandClass — the app's own voice", () => {
  it("never reach for either hand's font", () => {
    expect(unsignedHandClass()).not.toMatch(/font-eva|font-adam/);
    expect(unsignedHandClass("large")).not.toMatch(/font-eva|font-adam/);
    expect(unsignedChinHandClass()).not.toMatch(/font-eva|font-adam/);
  });

  it("set the app's display voice (Fraunces), per design law §2", () => {
    expect(unsignedHandClass()).toMatch(/font-display/);
    expect(unsignedChinHandClass()).toMatch(/font-display/);
  });
});
