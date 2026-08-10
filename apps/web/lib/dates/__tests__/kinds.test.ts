import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { RELATIVE_TIME_PATTERN } from "@/lib/copy-law";
import { WINDOWS } from "@/lib/shared-day";
import {
  DATE_KINDS,
  dateKind,
  isDateKindSlug,
  kindsForWindow,
  windowsWithKinds,
} from "../kinds";

import type { DateKindEntry } from "../kinds";

/**
 * The check constraint on `date_plans.kind`, read out of the migration itself
 * rather than retyped here.
 *
 * A slug that TypeScript is happy with and PostgreSQL refuses is a 500 nobody
 * sees until the founder has applied the migration and one of them taps
 * propose. Reading the SQL means the two cannot drift: rename a kind to
 * something with an underscore and this fails in CI, not in production.
 */
function kindCheckPatternFromMigration(): RegExp {
  const sql = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "..",
      "..",
      "supabase",
      "migrations",
      "20260810120000_date_plans.sql",
    ),
    "utf8",
  );
  const found = /kind\s*~\s*'(\^[^']+\$)'/.exec(sql);
  if (found === null || found[1] === undefined) {
    throw new Error(
      "could not find the `kind ~ '...'` check in 20260810120000_date_plans.sql — " +
        "if the constraint moved or changed shape, update this test to read it " +
        "from wherever it now lives rather than deleting the check.",
    );
  }
  return new RegExp(found[1]);
}

/** Every field a person reads on screen. */
function copyOf(k: DateKindEntry): string[] {
  return [k.title, k.line, k.survives];
}

const EMOJI = /\p{Extended_Pictographic}/u;

describe("the seven kinds", () => {
  it("is seven, with no duplicate slugs", () => {
    expect(DATE_KINDS).toHaveLength(7);
    expect(new Set(DATE_KINDS.map((k) => k.slug)).size).toBe(7);
  });

  it("every slug satisfies the check constraint the migration declares", () => {
    const pattern = kindCheckPatternFromMigration();
    // The pattern really does reject something, or this proves nothing.
    expect(pattern.test("Same_Film")).toBe(false);
    expect(pattern.test("-leading-dash")).toBe(false);
    for (const k of DATE_KINDS) {
      expect(pattern.test(k.slug), `${k.slug} fails the SQL check`).toBe(true);
    }
  });

  it("every kind carries the reason it survives the distance", () => {
    for (const k of DATE_KINDS) {
      expect(k.survives.length, `${k.slug} has no reason`).toBeGreaterThan(60);
    }
  });

  it("fits only bands the day model actually has", () => {
    const known = new Set(WINDOWS.map((w) => w.id));
    for (const k of DATE_KINDS) {
      expect(k.windowFit.length, `${k.slug} fits nothing`).toBeGreaterThan(0);
      for (const id of k.windowFit) {
        expect(known.has(id), `${k.slug} names a band that is not one of nine`).toBe(
          true,
        );
      }
    }
  });

  it("labels an unsourced claim as unverified", () => {
    for (const k of DATE_KINDS) {
      if (k.verification === "verified") {
        expect(k.sourceId, `${k.slug} claims verified with no source`).toBeDefined();
      } else {
        // Not sourced is fine; unlabelled is not. Every unverified kind names
        // the library record it stands next to, so a reader can go and check.
        expect(
          k.sourceId ?? k.nearestSourceId,
          `${k.slug} is unverified and points at nothing`,
        ).toBeDefined();
      }
    }
  });
});

describe("the copy laws", () => {
  it("makes no relative-time claim", () => {
    for (const k of DATE_KINDS) {
      for (const text of copyOf(k)) {
        const hit = RELATIVE_TIME_PATTERN.exec(text);
        expect(hit?.[0] ?? null, `${k.slug}: "${text}"`).toBeNull();
      }
    }
  });

  it("the relative-time guard is live, not a no-op", () => {
    // Without this, the test above passes just as happily against a pattern
    // that matches nothing at all.
    expect(RELATIVE_TIME_PATTERN.test("we did this yesterday")).toBe(true);
  });

  it("uses no emoji", () => {
    for (const k of DATE_KINDS) {
      for (const text of copyOf(k)) {
        expect(EMOJI.test(text), `${k.slug}: "${text}"`).toBe(false);
      }
    }
    expect(EMOJI.test("a heart ❤️")).toBe(true);
  });

  it("names Eva before Adam wherever both appear in one line", () => {
    for (const k of DATE_KINDS) {
      for (const text of copyOf(k)) {
        const eva = text.indexOf("Eva");
        const adam = text.indexOf("Adam");
        if (eva === -1 || adam === -1) continue;
        expect(eva, `${k.slug}: "${text}" puts Adam first`).toBeLessThan(adam);
      }
    }
  });

  it("at least one line does name them both, so the rule above is exercised", () => {
    const both = DATE_KINDS.flatMap(copyOf).filter(
      (t) => t.includes("Eva") && t.includes("Adam"),
    );
    expect(both.length).toBeGreaterThan(0);
  });

  it("names no clock time, because the band is chosen later", () => {
    // Found by rendering the screen, not by reading the diff: `same-film`
    // fits two bands and its reason said "Eva starts hers at 15:00, Adam
    // starts his at 22:00". Those are w7's hours. Selected on w8 the card
    // showed that sentence directly above a readback saying 5:00 pm and
    // 12:00 am — the copy contradicting the computation, on screen, in one
    // card. The instant is the readback's job; these lines describe a shape.
    const CLOCK = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b|\b\d{1,2}\s*(?:am|pm)\b/i;
    for (const k of DATE_KINDS) {
      for (const text of copyOf(k)) {
        expect(CLOCK.exec(text)?.[0] ?? null, `${k.slug}: "${text}"`).toBeNull();
      }
    }
    // The pattern really does catch both shapes, or this proves nothing.
    expect(CLOCK.test("Adam starts his at 22:00")).toBe(true);
    expect(CLOCK.test("she starts at 3 pm")).toBe(true);
  });

  it("names an hour span only where every band it fits agrees", () => {
    // `durationMin` is the kind's own length and is shown next to the
    // readback; a `survives` line that also asserted "for the next two hours"
    // was making a claim about the BAND, which is three hours in w8 and two
    // in w7. Bands differ; the sentence cannot.
    for (const k of DATE_KINDS) {
      expect(
        /\b(?:one|two|three|four|1|2|3|4)\s+hours?\b/i.test(k.survives),
        `${k.slug} states an hour span its bands do not all share`,
      ).toBe(false);
    }
  });

  it("counts nothing — no tally of how many dates they have had", () => {
    for (const k of DATE_KINDS) {
      for (const text of copyOf(k)) {
        expect(/\b\d+\s*(?:dates?|times?|streaks?)\b/i.test(text)).toBe(false);
      }
    }
  });
});

describe("lookup", () => {
  it("finds a kind by slug and refuses one that is not there", () => {
    expect(dateKind("same-film")?.title).toBe("The same film, started together");
    expect(dateKind("a-picnic")).toBeNull();
    expect(isDateKindSlug("two-kitchens")).toBe(true);
    expect(isDateKindSlug("two_kitchens")).toBe(false);
    expect(isDateKindSlug(7)).toBe(false);
  });

  it("returns only the kinds that fit a band, and pads nothing", () => {
    // w1 is Eva at midnight and Adam at 07:00 — exactly one kind is written
    // for it, and a short list is the honest answer.
    expect(kindsForWindow("w1").map((k) => k.slug)).toEqual([
      "read-until-she-sleeps",
    ]);
    // w2 is Adam at work against Eva asleep. Nothing is written for it, and
    // nothing is invented.
    expect(kindsForWindow("w2")).toEqual([]);
  });

  it("lists the bands that have something on them, in the order given", () => {
    const order = WINDOWS.map((w) => w.id);
    const withKinds = windowsWithKinds(order);
    expect(withKinds).not.toContain("w2");
    expect(withKinds).toContain("w6");
    // Order preserved: the day runs w8 → w7, and so does this.
    expect(withKinds).toEqual(order.filter((id) => withKinds.includes(id)));
  });
});
