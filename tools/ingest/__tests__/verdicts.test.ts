/**
 * verdicts.ts — the founder's fixed identity mapping, and the exact tally
 * it must produce over the real authorship-pass output (founder decision,
 * 2026-08-07): person_a -> adam (16), person_b -> eva (7), cannot_tell +
 * third_party -> unsigned (28). 51 rows total.
 *
 * `fixtures/verdicts.tsv` is a committed copy of `/tmp/authorship-pass/
 * verdicts.tsv` as it existed when this feature was built — a durable
 * regression fixture that survives /tmp being cleared. A second describe
 * block below also runs the same assertions directly against the live
 * `/tmp` path, when present, so a real environment drift would show up too.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { authorFromVerdict, parseVerdictsTsv } from "../verdicts";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const FIXTURE_PATH = resolve(HERE, "fixtures/verdicts.tsv");
const LIVE_PATH = "/tmp/authorship-pass/verdicts.tsv";

function tally(content: string): { adam: number; eva: number; unsigned: number; total: number } {
  const verdicts = parseVerdictsTsv(content);
  const counts = { adam: 0, eva: 0, unsigned: 0 };
  for (const v of verdicts.values()) counts[authorFromVerdict(v)]++;
  return { ...counts, total: verdicts.size };
}

describe("parseVerdictsTsv + authorFromVerdict — the committed fixture", () => {
  const content = readFileSync(FIXTURE_PATH, "utf8");

  it("produces exactly 16 adam / 7 eva / 28 unsigned, 51 rows total", () => {
    expect(tally(content)).toEqual({ adam: 16, eva: 7, unsigned: 28, total: 51 });
  });

  it("maps person_a to adam and person_b to eva — never swapped", () => {
    const verdicts = parseVerdictsTsv(content);
    const aRow = [...verdicts.values()].find((v) => v.shooter === "person_a");
    const bRow = [...verdicts.values()].find((v) => v.shooter === "person_b");
    expect(aRow, "fixture has no person_a row to check").toBeDefined();
    expect(bRow, "fixture has no person_b row to check").toBeDefined();
    expect(authorFromVerdict(aRow!)).toBe("adam");
    expect(authorFromVerdict(bRow!)).toBe("eva");
  });

  it("maps both cannot_tell and third_party to unsigned", () => {
    const verdicts = parseVerdictsTsv(content);
    const ct = [...verdicts.values()].find((v) => v.shooter === "cannot_tell");
    const tp = [...verdicts.values()].find((v) => v.shooter === "third_party");
    expect(ct, "fixture has no cannot_tell row to check").toBeDefined();
    expect(tp, "fixture has no third_party row to check").toBeDefined();
    expect(authorFromVerdict(ct!)).toBe("unsigned");
    expect(authorFromVerdict(tp!)).toBe("unsigned");
  });

  it("rejects a shooter value outside the founder's fixed mapping", () => {
    expect(() =>
      parseVerdictsTsv(
        "file\tshooter\tconfidence\tevidence\nsomething.jpg\tperson_c\tlow\tnonsense\n",
      ),
    ).toThrow(/not one of/);
  });
});

describe.skipIf(!existsSync(LIVE_PATH))(
  "parseVerdictsTsv + authorFromVerdict — the live /tmp path, when present",
  () => {
    it("still produces exactly 16 adam / 7 eva / 28 unsigned right now", () => {
      const content = readFileSync(LIVE_PATH, "utf8");
      expect(tally(content)).toEqual({ adam: 16, eva: 7, unsigned: 28, total: 51 });
    });
  },
);
