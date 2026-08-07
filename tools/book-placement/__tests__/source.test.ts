import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadSourceItems } from "../source.ts";

function writeFixture(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "book-placement-source-test-"));
  const path = join(dir, "source-items.json");
  writeFileSync(path, JSON.stringify(content));
  return path;
}

describe("loadSourceItems", () => {
  it("loads the real committed source-items.json with exactly 51 items", () => {
    const items = loadSourceItems();
    expect(items).toHaveLength(51);
    expect(items.filter((i) => i.kind === "image")).toHaveLength(48);
    expect(items.filter((i) => i.kind === "video")).toHaveLength(3);
  });

  it("every real item has a file, an isoDate and a kind", () => {
    for (const item of loadSourceItems()) {
      expect(item.file.length).toBeGreaterThan(0);
      expect(item.isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["image", "video"]).toContain(item.kind);
    }
  });

  it("every image item carries a checksum; video items carry null", () => {
    for (const item of loadSourceItems()) {
      if (item.kind === "image") expect(typeof item.checksumSha256).toBe("string");
      else expect(item.checksumSha256).toBeNull();
    }
  });

  it("throws a specific error rather than silently accepting a malformed isoDate", () => {
    const path = writeFixture({
      generatedAt: "now",
      sourceManifest: "test",
      items: [{ file: "a.jpg", isoDate: "16 July 2026", kind: "image", checksumSha256: "x" }],
    });
    expect(() => loadSourceItems(path)).toThrow(/malformed "isoDate"/);
  });

  it("throws a specific error rather than silently accepting an unknown kind", () => {
    const path = writeFixture({
      generatedAt: "now",
      sourceManifest: "test",
      items: [{ file: "a.jpg", isoDate: "2026-07-16", kind: "gif", checksumSha256: "x" }],
    });
    expect(() => loadSourceItems(path)).toThrow(/unknown "kind"/);
  });

  it("throws if the file has no file name", () => {
    const path = writeFixture({
      generatedAt: "now",
      sourceManifest: "test",
      items: [{ file: "", isoDate: "2026-07-16", kind: "image", checksumSha256: "x" }],
    });
    expect(() => loadSourceItems(path)).toThrow(/no "file"/);
  });

  it("throws if items is missing entirely", () => {
    const path = writeFixture({ generatedAt: "now", sourceManifest: "test" });
    expect(() => loadSourceItems(path)).toThrow(/"items" is not an array/);
  });
});
