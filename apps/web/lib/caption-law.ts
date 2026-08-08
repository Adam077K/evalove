/**
 * The machine-shaped-caption guard.
 *
 * One real breach, found in the live Book (2026-08-08): a photograph's
 * caption read "Same photo as 24:7:26-4.JPG at lower resolution." — an
 * internal deduplication note from the ingest catalogue's `caption_seed`
 * field, rendered as if a person had written it under their own photograph.
 *
 * THE MECHANISM, PRECISELY (do not re-assume it was a `notes`-into-
 * `caption_seed` field mixup — it wasn't): `tools/ingest/catalog/` holds
 * three vision-pass catalogues, one row per source file, each with BOTH a
 * `caption_seed` (meant to read as human prose) and a separate `notes`
 * field (internal observations for whoever lays photos out — duplicates,
 * bursts, "this may not belong"). `tools/ingest/prepare.ts` read
 * `caption_seed` — the CORRECT field — into the manifest's `captionSeed`,
 * and `tools/ingest/load.ts` read that straight into `commitPhoto`'s
 * `caption` input. The field mapping was right at every step. The bug is
 * that nothing ever inspected the CONTENT of `caption_seed` before trusting
 * it: for exactly one of 52 source files (`24:7:26-18.JPG`, a low-res
 * re-export of `24:7:26-4.JPG`), the vision pass itself wrote
 * notes-shaped prose into the `caption_seed` field, and every layer of the
 * pipeline passed it straight through as if it were the human-sounding
 * caption the field is supposed to hold.
 *
 * So the fix is not "stop reading the wrong field" — it already read the
 * right one. It is: never trust a caption's CONTENT without looking at it,
 * at every layer a caption can reach a photo, structurally, the same way
 * `commitPhoto`'s `verifyDerivativesAreClean` never trusts an upload's
 * claimed EXIF-free state without re-scanning the bytes itself. This
 * pattern is that scan, for text.
 *
 * WHAT IT LOOKS FOR — each branch is a marker that essentially never
 * appears in a person's own account of their life, chosen from the actual
 * breach plus the sibling machine language already living in
 * `tools/ingest/catalog/*.jsonl`'s `notes` fields (the shape this class of
 * defect takes if a `notes` value or a raw vision-pass note ever DOES leak
 * into a caption in the future):
 *
 *   - a source filename with its extension ("24:7:26-4.JPG", "IMG_0142.heic")
 *   - "same photo/image/picture as", "duplicate of/export", "near-duplicate"
 *   - resolution/dimension talk ("lower resolution", "852x1118")
 *   - camera/file metadata talk ("EXIF", "camera metadata", "aspect ratio")
 *   - "burst" as a camera-mode noun ("burst of photos", "photo burst")
 *   - "screenshot(s)" — a source classification, not a moment
 *   - a photograph referred to as "this file"/"this export", not a moment
 *
 * WHAT THIS DELIBERATELY DOES NOT FLAG — bare hedging words like "likely"
 * or "appears to be" are NOT in the pattern on their own. They read the
 * breach's own `notes` field ("appears to be a lower-resolution export...")
 * but a bare "likely" or "appears to be" is common enough in ordinary prose
 * ("the light appears gold at that hour") that including it here would
 * trade one false negative for many false positives on genuine captions —
 * same trade-off `lib/copy-law.ts`'s header documents for "today"/"earlier".
 * Every branch actually in the pattern below was checked against all 48
 * live captions and the 11 shipped fixture captions
 * (`lib/fixtures/photos.ts`) before being kept; see
 * `lib/__tests__/caption-law.test.ts`.
 */
export const MACHINE_SHAPED_CAPTION_PATTERN =
  /\.(?:jpe?g|png|heic|mov|mp4)\b|\bsame\s+(?:photo|image|picture)\s+as\b|\b(?:near[- ]|exact\s+|true\s+|byte-identical\s+)?duplicate\s+(?:of|export|photo|image)\b|\bnear[- ]duplicate\b|\b(?:lower|higher)[- ]resolution\b|\b\d{3,5}\s*[x×]\s*\d{3,5}\b|\bexif\b|\bcamera\s+metadata\b|\bgps\s+metadata\b|\baspect\s+ratio\b|\bburst\s+(?:of|shot|shots|mode)\b|\bphoto\s+burst\b|\bthis\s+(?:file|export)\b|\blikely\s+shooter\b|\bscreenshots?\b/i;

/** True when `text` reads as an internal/technical note about a photo file
    rather than a person's own account of a moment. Empty/whitespace-only
    text is never machine-shaped — it is simply not a caption. */
export function isMachineShapedCaption(text: string): boolean {
  return MACHINE_SHAPED_CAPTION_PATTERN.test(text);
}
