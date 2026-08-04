/**
 * index-html.test.ts — self-containment and structure tests for the HTML index
 *
 * Fixtures only. No database, no filesystem, no network.
 *
 * THE CRITICAL TEST (criterion 3):
 *   The emitted HTML must contain no http:// or https:// references.
 *   External references — CDN fonts, analytics, remote scripts, remote stylesheets
 *   — would silently break the file when opened offline or years from now.
 *   A single assertion here makes that failure loud and immediate.
 */

import { describe, it, expect } from "vitest";

import { buildIndexHtml } from "../index-html.ts";
import type { PhotoIndexRow } from "../manifest.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXTURE_ROWS: PhotoIndexRow[] = [
  {
    id: "a1b2c3d4-0000-0000-0000-000000000000",
    shared_day: "2026-08-03",
    author: "eva",
    taken_at_local: "2026-08-03 10:30:00",
    caption: "Carmel market tomatoes",
    kind: "daily",
    file_path: "photos/2026-08-03/2026-08-03--eva--1030--a1b2c3d4.jpg",
    file_variant: "original",
    checksum_sha256: "abc123",
  },
  {
    id: "b2c3d4e5-0000-0000-0000-000000000000",
    shared_day: "2026-08-03",
    author: "adam",
    taken_at_local: "2026-08-03 23:05:00",
    caption: null,
    kind: "daily",
    file_path: "photos/2026-08-03/2026-08-03--adam--2305--b2c3d4e5.jpg",
    file_variant: "display",
    checksum_sha256: "def456",
  },
  {
    id: "c3d4e5f6-0000-0000-0000-000000000000",
    shared_day: "2026-08-10",
    author: "eva",
    taken_at_local: "2026-08-10 09:15:00",
    caption: "Morning light through the window",
    kind: "daily",
    file_path: "photos/2026-08-10/2026-08-10--eva--0915--c3d4e5f6.jpg",
    file_variant: "original",
    checksum_sha256: "ghi789",
  },
];

const BASE_OPTS = {
  exportedAt: "2026-08-03T15:00:00.000Z",
  photoCount: FIXTURE_ROWS.length,
  includesVault: false,
  rows: FIXTURE_ROWS,
};

// ---------------------------------------------------------------------------
// The critical no-network test
// ---------------------------------------------------------------------------

describe("buildIndexHtml — network isolation (criterion 3)", () => {
  it("contains no http:// or https:// references", () => {
    const html = buildIndexHtml(BASE_OPTS);
    // The entire HTML must not contain any http:// or https:// strings.
    // (Caption text is plain text that is HTML-escaped; even if a caption
    // contained a URL, the function would include it as inert text, but
    // our fixtures deliberately contain no URLs so this assertion is clean.)
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
  });

  it("contains no <script src> loading from a remote origin", () => {
    const html = buildIndexHtml(BASE_OPTS);
    // No script tag with an external src
    expect(html).not.toMatch(/<script[^>]+src\s*=\s*["']https?:/i);
  });

  it("contains no <link href> loading from a remote origin", () => {
    const html = buildIndexHtml(BASE_OPTS);
    expect(html).not.toMatch(/<link[^>]+href\s*=\s*["']https?:/i);
  });

  it("contains no url() pointing to a remote origin", () => {
    const html = buildIndexHtml(BASE_OPTS);
    expect(html).not.toMatch(/url\(\s*['"]?https?:/i);
  });

  it("contains no @import from a remote origin", () => {
    const html = buildIndexHtml(BASE_OPTS);
    expect(html).not.toMatch(/@import\s+['"]https?:/i);
  });
});

// ---------------------------------------------------------------------------
// Structure tests
// ---------------------------------------------------------------------------

describe("buildIndexHtml — structure", () => {
  it("is a complete HTML document with DOCTYPE", () => {
    const html = buildIndexHtml(BASE_OPTS);
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("declares utf-8 charset", () => {
    const html = buildIndexHtml(BASE_OPTS);
    expect(html).toContain('charset="utf-8"');
  });

  it("includes photo images with relative src paths", () => {
    const html = buildIndexHtml(BASE_OPTS);
    expect(html).toContain("photos/2026-08-03/2026-08-03--eva--1030--a1b2c3d4.jpg");
    expect(html).toContain("photos/2026-08-03/2026-08-03--adam--2305--b2c3d4e5.jpg");
  });

  it("groups photos under their shared day", () => {
    const html = buildIndexHtml(BASE_OPTS);
    expect(html).toContain("2026-08-03");
    expect(html).toContain("2026-08-10");
  });

  it("HTML-escapes caption text", () => {
    const opts = {
      ...BASE_OPTS,
      rows: [
        {
          ...FIXTURE_ROWS[0]!,
          caption: '<script>alert("xss")</script>',
        },
      ],
    };
    const html = buildIndexHtml(opts);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("marks display-variant photos with a note", () => {
    const html = buildIndexHtml(BASE_OPTS);
    // The display variant (adam's photo) should have a variant note
    expect(html).toContain("display copy");
  });

  it("renders when rows is empty", () => {
    const html = buildIndexHtml({ ...BASE_OPTS, photoCount: 0, rows: [] });
    expect(html).toContain("No photographs");
  });

  it("includes a vault note when includesVault is true", () => {
    const html = buildIndexHtml({ ...BASE_OPTS, includesVault: true });
    expect(html.toLowerCase()).toContain("vault");
    expect(html.toLowerCase()).toContain("private");
  });
});
