/**
 * index-html.ts — self-contained HTML index for the archive export
 *
 * Pure function only. No I/O, no Supabase, no side effects.
 *
 * NETWORK ISOLATION RULE — enforced by test, not by convention:
 *   The output must contain no external URL references of any kind:
 *   no <script src>, no <link href>, no CDN font, no analytics pixel,
 *   no url() in styles pointing outside the folder.
 *
 *   The file must render from file:// with wifi switched off. A test in
 *   __tests__/index-html.test.ts asserts this by checking that the emitted
 *   HTML contains no 'http://' or 'https://' string.
 *
 *   Images are referenced by relative path only: 'photos/YYYY-MM-DD/filename.jpg'
 *   Fonts are system fonts only: font-family uses the system-ui stack.
 *   CSS and the minimal JS are inline.
 */

import type { PhotoIndexRow } from "./manifest.ts";

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

function escapeHtml(raw: string | null | undefined): string {
  if (raw == null) return "";
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export interface IndexHtmlOptions {
  exportedAt: string; // ISO timestamp
  photoCount: number;
  includesVault: boolean;
  rows: PhotoIndexRow[];
}

/**
 * Build the complete self-contained index.html as a string.
 *
 * All CSS is inline. All fonts are system fonts. No external resources.
 * Images are referenced by the relative file_path from each PhotoIndexRow.
 * Renders from file:// with no network.
 */
export function buildIndexHtml(opts: IndexHtmlOptions): string {
  const { exportedAt, photoCount, includesVault, rows } = opts;

  // Group photos by shared_day for the gallery view
  const byDay = new Map<string, PhotoIndexRow[]>();
  for (const row of rows) {
    const existing = byDay.get(row.shared_day);
    if (existing) {
      existing.push(row);
    } else {
      byDay.set(row.shared_day, [row]);
    }
  }

  const days = [...byDay.keys()].sort();

  const galleryHtml = days
    .map((day) => {
      const dayRows = byDay.get(day) ?? [];
      const photoCards = dayRows
        .map((row) => {
          const captionText = row.caption ? escapeHtml(row.caption) : "(no caption)";
          const variantNote =
            row.file_variant === "display"
              ? `<span class="variant-note" title="The original file was not stored. This is a 1600px display copy.">display copy</span>`
              : "";
          return `
      <figure class="photo-card">
        <a href="${escapeHtml(row.file_path)}">
          <img
            src="${escapeHtml(row.file_path)}"
            alt="${captionText}"
            loading="lazy"
            decoding="async"
            width="320"
          >
        </a>
        <figcaption>
          <span class="author">${escapeHtml(row.author)}</span>
          <span class="time">${escapeHtml(row.taken_at_local)}</span>
          ${variantNote}
          <span class="caption">${captionText}</span>
        </figcaption>
      </figure>`.trim();
        })
        .join("\n      ");

      return `
    <section class="day-section">
      <h2 class="day-heading">${escapeHtml(day)}</h2>
      <div class="photo-grid">
        ${photoCards}
      </div>
    </section>`.trim();
    })
    .join("\n    ");

  const vaultNote = includesVault
    ? `<p class="vault-note">This export includes vault items. They are in the <code>private/</code> folder and are not shown here.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Eva &amp; Adam — archive</title>
  <style>
    /* All styles are inline. No external stylesheet, no CDN, no network reference.
       Fonts are system fonts; this renders with wifi off on any device. */

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      font-size: 1rem;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fafafa;
      padding: 2rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 1rem;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .meta {
      color: #666;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .vault-note {
      background: #fef9c3;
      border: 1px solid #fde047;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      margin: 1rem 0;
      font-size: 0.875rem;
    }

    .day-section {
      margin-bottom: 3rem;
    }

    .day-heading {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid #e8e8e8;
    }

    .photo-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .photo-card {
      width: 320px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }

    .photo-card a {
      display: block;
      background: #f0f0f0;
    }

    .photo-card img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 4/3;
      object-fit: cover;
    }

    .photo-card figcaption {
      padding: 0.75rem;
      font-size: 0.875rem;
    }

    .author {
      font-weight: 600;
      text-transform: capitalize;
    }

    .time {
      color: #666;
      margin-left: 0.5rem;
    }

    .variant-note {
      display: inline-block;
      font-size: 0.75rem;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      border-radius: 3px;
      padding: 0 4px;
      margin-left: 0.5rem;
      cursor: help;
    }

    .caption {
      display: block;
      margin-top: 0.25rem;
      color: #333;
      white-space: pre-wrap;
      word-break: break-word;
    }

    footer {
      margin-top: 4rem;
      border-top: 1px solid #e0e0e0;
      padding-top: 1rem;
      font-size: 0.75rem;
      color: #999;
    }

    @media (max-width: 600px) {
      .photo-card {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Eva &amp; Adam — archive</h1>
    <p class="meta">
      ${escapeHtml(String(photoCount))} photograph${photoCount === 1 ? "" : "s"} &middot;
      exported ${escapeHtml(new Date(exportedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))}
    </p>
  </header>

  ${vaultNote}

  <main>
    ${galleryHtml || "<p>No photographs in this archive.</p>"}
  </main>

  <footer>
    <p>This file is self-contained and works offline. Open any photograph by clicking it.</p>
    <p>See <code>index.csv</code> for a spreadsheet version of this list.</p>
    <p>Files labeled &ldquo;display copy&rdquo; are 1600px wide versions; the original was not stored at export time.</p>
  </footer>
</body>
</html>`;
}
