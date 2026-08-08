/**
 * candidates.ts — the committed, reasoned roster of live captions this tool
 * corrects. Same shape as `tools/authorship-fix/candidates.ts`: a small,
 * hand-reviewed list frozen into source control, keyed by
 * `checksumSha256` (the same join key `tools/book-placement/db.ts` and
 * `tools/authorship-fix/db.ts` already use to match a catalogued file to
 * the live row it became), so a founder re-run months from now — on a
 * machine that never had `/tmp/evapics-A` on it — plans against source
 * control alone, not an ephemeral catalogue path.
 *
 * WHY THIS EXISTS (2026-08-08 breach). Photo `0ad8bccf-104f-8be0-4bd7-
 * a3b52ed0f723` (`24:7:26-18.JPG`) carries the caption "Same photo as
 * 24:7:26-4.JPG at lower resolution." — an ingest catalogue's own
 * deduplication note, rendered as if a person had written it under their
 * own photograph. See `apps/web/lib/caption-law.ts` for the exact
 * mechanism and `tools/ingest/manifest.ts`'s `resolveCaptionSeed` for the
 * pipeline fix that stops a new one of these from being written; this tool
 * is the separate, narrow job of correcting the one row that already shipped.
 *
 * AUDIT SCOPE. All 48 non-deleted rows in the live `photos` table were read
 * (`tools/export/read.ts`'s `fetchPhotos`, read-only) and every caption
 * judged by hand against `lib/caption-law.ts`'s guard AND by ear (does this
 * read as something a person wrote about their own life?). This is the
 * ONLY offender found — see the team-lead handoff this tool answers for the
 * full audit trail of the other 47.
 *
 * WHY `proposedCaption` IS `null` FOR THIS FILE, NOT A REWRITE. The
 * catalogue's own verdict on this exact file (`tools/ingest/catalog/A-16-
 * 24jul.jsonl`, and independently `tools/authorship-fix/candidates.ts`'s
 * own reasoning for the same file) is that it is a lower-resolution
 * duplicate export of `24:7:26-4.JPG` — "same pose and instant... a true
 * duplicate," not a distinct moment. `24:7:26-4.JPG` already has an honest,
 * specific caption live ("Sunset over the water, and neither of them is
 * looking at it.," photo `47a51f29-50e3-a817-41d9-a7729db992a8`). Any new
 * caption written for THIS file would either (a) just restate that one, or
 * (b) invent a distinction between the two exports that does not exist. The
 * founder's own standing rule for this pipeline is that an uncaptioned
 * photograph is a completely fine outcome, and it is the honest one here.
 *
 * Whether this near-duplicate photograph belongs in the Book at all (as
 * opposed to just being uncaptioned) is a SEPARATE curation decision, out
 * of scope for a caption fix — this tool only ever touches `caption`.
 */

export interface CaptionCandidate {
  /** The original source filename — human-readable identity only; matching
      against the live database is by `checksumSha256`, never this string. */
  file: string;
  /** The display derivative's checksum — the join key against live
      `photos.checksum_sha256`. */
  checksumSha256: string;
  /** The exact caption this tool expects to find live, right now. If a
      re-run finds something different, `resolve.ts` refuses to touch that
      row rather than overwrite a caption nobody flagged as the problem. */
  currentCaption: string;
  /** `null` — remove the caption entirely (an honest, judged "no caption is
      better than an invented one"). A non-null value REPLACES the caption
      with this exact text — always hand-judged for register, never a raw
      substitution from a catalogue field. */
  proposedCaption: string | null;
  reason: string;
}

export const CAPTION_CORRECTIONS_2026_08_08: readonly CaptionCandidate[] = [
  {
    file: "24:7:26-18.JPG",
    checksumSha256: "dece1ae7dc20144df6d119641a1f15b05551eb60872792361a73dd637362a1c1",
    currentCaption: "Same photo as 24:7:26-4.JPG at lower resolution.",
    proposedCaption: null,
    reason:
      "A lower-resolution duplicate export of 24:7:26-4.JPG (same pose, same instant, " +
      'already captioned "Sunset over the water, and neither of them is looking at it."). ' +
      "No honest, distinct caption exists for this file on its own — proposing none.",
  },
] as const;
