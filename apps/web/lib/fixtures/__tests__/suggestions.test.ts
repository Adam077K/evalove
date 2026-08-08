import { describe, it, expect } from "vitest";
import { SUGGESTIONS } from "../suggestions";

describe("SUGGESTIONS fixture", () => {
  describe("structure and coverage", () => {
    it("contains exactly 33 entries", () => {
      const entries = Object.values(SUGGESTIONS);
      expect(entries).toHaveLength(33);
    });

    it("every entry has a unique id matching its object key", () => {
      const entries = Object.entries(SUGGESTIONS);
      entries.forEach(([key, entry]) => {
        expect(entry.id).toBe(key);
      });
    });

    it("every window w1-w9 is represented by at least 3 entries", () => {
      const windowCounts: Record<string, number> = {
        w1: 0,
        w2: 0,
        w3: 0,
        w4: 0,
        w5: 0,
        w6: 0,
        w7: 0,
        w8: 0,
        w9: 0,
      };

      Object.values(SUGGESTIONS).forEach((entry) => {
        entry.windowFit.forEach((window) => {
          const current = windowCounts[window];
          if (current !== undefined) {
            windowCounts[window] = current + 1;
          }
        });
      });

      Object.entries(windowCounts).forEach(([window, count]) => {
        expect(
          count,
          `${window} should have at least 3 entries, but has ${count}`
        ).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("field constraints", () => {
    it("every title is 34 characters or fewer", () => {
      Object.values(SUGGESTIONS).forEach((entry) => {
        expect(
          entry.title.length,
          `Title "${entry.title}" exceeds 34 chars (${entry.title.length})`
        ).toBeLessThanOrEqual(34);
      });
    });

    it("every description is 66 characters or fewer", () => {
      Object.values(SUGGESTIONS).forEach((entry) => {
        expect(
          entry.description.length,
          `Description "${entry.description}" exceeds 66 chars (${entry.description.length})`
        ).toBeLessThanOrEqual(66);
      });
    });

    it("no entry has an empty windowFit array", () => {
      Object.values(SUGGESTIONS).forEach((entry) => {
        expect(
          entry.windowFit.length,
          `Entry ${entry.id} has no windows assigned`
        ).toBeGreaterThan(0);
      });
    });

    it("windowFit only contains valid window codes (w1-w9)", () => {
      const validWindows = new Set([
        "w1",
        "w2",
        "w3",
        "w4",
        "w5",
        "w6",
        "w7",
        "w8",
        "w9",
      ]);

      Object.values(SUGGESTIONS).forEach((entry) => {
        entry.windowFit.forEach((window) => {
          expect(
            validWindows.has(window),
            `Entry ${entry.id} has invalid window "${window}"`
          ).toBe(true);
        });
      });
    });
  });

  /**
   * At the fork point (860d2c7, the original 5-entry fixture), counting
   * `windowFit` gives w1:2 w3:1 w4:2 w8:1 w9:1 — so w2, w5, w6, and w7
   * were the four windows with zero entries. w7 (Saturday, the
   * flagship shelf with 40 real library entries) was the one actually
   * rendering an empty state; w9 had coverage from `b1-mirrored-errand`
   * and was never broken. This guards the four windows that were
   * actually empty, not a set that includes an always-covered one.
   */
  describe("no regression on empty windows", () => {
    it("w2 has entries (was empty in v1)", () => {
      const w2Entries = Object.values(SUGGESTIONS).filter((e) =>
        e.windowFit.includes("w2")
      );
      expect(w2Entries.length).toBeGreaterThan(0);
    });

    it("w5 has entries (was empty in v1)", () => {
      const w5Entries = Object.values(SUGGESTIONS).filter((e) =>
        e.windowFit.includes("w5")
      );
      expect(w5Entries.length).toBeGreaterThan(0);
    });

    it("w6 has entries (was empty in v1)", () => {
      const w6Entries = Object.values(SUGGESTIONS).filter((e) =>
        e.windowFit.includes("w6")
      );
      expect(w6Entries.length).toBeGreaterThan(0);
    });

    it("w7 has entries (was empty in v1)", () => {
      const w7Entries = Object.values(SUGGESTIONS).filter((e) =>
        e.windowFit.includes("w7")
      );
      expect(w7Entries.length).toBeGreaterThan(0);
    });
  });
});
