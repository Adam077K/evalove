import { describe, expect, it } from "vitest";
import {
  buildAuthorshipTsv,
  guessAuthor,
  parseAuthorshipTsv,
  type AuthorshipRow,
} from "../manifest.ts";
import type { CatalogEntry } from "../catalog.ts";

function entry(overrides: Partial<CatalogEntry>): CatalogEntry {
  return {
    file: "1:1:26.JPG",
    date: "2026-01-01",
    people: "unclear",
    subject: "",
    setting: "",
    time_of_day: "",
    likely_shooter: "received",
    mood: "",
    text_visible: null,
    caption_seed: "",
    quality: "ordinary",
    notes: "",
    ...overrides,
  };
}

describe("guessAuthor", () => {
  it("guesses Adam for a solo woman in frame", () => {
    const result = guessAuthor(
      entry({ subject: "a young woman sitting alone on a wall" }),
    );
    expect(result.guess).toBe("adam");
  });

  it("guesses Eva for a solo man in frame", () => {
    const result = guessAuthor(
      entry({ subject: "a man leaning against a tree, earbuds in" }),
    );
    expect(result.guess).toBe("eva");
  });

  it("does not guess when both people are described together", () => {
    const result = guessAuthor(
      entry({ people: "both", subject: "man and woman watching the sunset" }),
    );
    expect(result.guess).toBe("");
  });

  it("does not guess a landscape with neither person", () => {
    const result = guessAuthor(
      entry({ people: "neither", subject: "sunset over the water, no people" }),
    );
    expect(result.guess).toBe("");
  });

  it("does not guess when the text mentions both genders without 'both'", () => {
    // e.g. a group shot description mentioning "a man ... and a woman"
    const result = guessAuthor(
      entry({ subject: "a man speaking while several women stand behind him" }),
    );
    expect(result.guess).toBe("");
  });

  it("never uses likely_shooter (file-format signal) to decide a guess", () => {
    const onPhone = guessAuthor(
      entry({ subject: "a woman on a wall", likely_shooter: "on_this_phone" }),
    );
    const received = guessAuthor(
      entry({ subject: "a woman on a wall", likely_shooter: "received" }),
    );
    expect(onPhone.guess).toBe(received.guess);
  });
});

describe("authorship.tsv round-trip", () => {
  const rows: AuthorshipRow[] = [
    {
      file: "24:7:26-14.HEIC",
      isoDate: "2026-07-24",
      subject: "woman at a sushi restaurant\twith a tab and a\nnewline",
      guess: "adam",
      guessReason: "solo woman in frame",
    },
    {
      file: "6:8:26-1.JPG",
      isoDate: "2026-08-06",
      subject: "bank building, no people",
      guess: "",
      guessReason: "no reliable signal",
    },
  ];

  it("writes a 3-line explanatory header before the column header row", () => {
    const tsv = buildAuthorshipTsv(rows);
    const lines = tsv.split("\n");
    expect(lines.slice(0, 3).every((l) => l.startsWith("#"))).toBe(true);
    expect(lines[3]).toBe(
      ["file", "date", "subject", "guess_author", "guess_reason", "author_correction"].join(
        "\t",
      ),
    );
  });

  it("escapes tabs and newlines out of free-text fields so the sheet stays one-row-per-line", () => {
    const tsv = buildAuthorshipTsv(rows);
    const dataLines = tsv
      .split("\n")
      .filter((l) => !l.startsWith("#") && l.trim() && !l.startsWith("file\t"));
    expect(dataLines).toHaveLength(2);
    expect(dataLines[0]!.split("\t")).toHaveLength(6);
  });

  it("leaves author_correction blank for the founder to fill", () => {
    const tsv = buildAuthorshipTsv(rows);
    const line = tsv.split("\n").find((l) => l.startsWith("24:7:26-14.HEIC"));
    const cols = line!.split("\t");
    expect(cols[5]).toBe("");
  });

  it("parses a founder-filled correction back, case-insensitively", () => {
    const tsv = buildAuthorshipTsv(rows);
    const edited = tsv.replace(
      /24:7:26-14\.HEIC\t([^\n]*)\t$/m,
      "24:7:26-14.HEIC\t$1\tEva",
    );
    const parsed = parseAuthorshipTsv(edited);
    expect(parsed.get("24:7:26-14.HEIC")?.author).toBe("eva");
  });

  it("resolves to null when author_correction is left blank, even with a guess present", () => {
    const tsv = buildAuthorshipTsv(rows);
    const parsed = parseAuthorshipTsv(tsv);
    expect(parsed.get("24:7:26-14.HEIC")?.author).toBeNull();
    expect(parsed.get("6:8:26-1.JPG")?.author).toBeNull();
  });

  it("ignores an invalid correction value rather than accepting it", () => {
    const tsv = buildAuthorshipTsv(rows).replace(/\t$/m, "\tsomeone-else");
    const parsed = parseAuthorshipTsv(tsv);
    expect(parsed.get("24:7:26-14.HEIC")?.author).toBeNull();
  });

  it("ignores comment lines and the header row when parsing", () => {
    const parsed = parseAuthorshipTsv(buildAuthorshipTsv(rows));
    expect(parsed.has("file")).toBe(false);
  });
});
