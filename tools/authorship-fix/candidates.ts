/**
 * candidates.ts — the committed, reasoned roster this tool plans against.
 *
 * WHY THIS IS A COMMITTED FILE, NOT A RE-READ OF /tmp OR tools/ingest/output.
 * `/tmp/authorship-pass/verdicts.tsv`, `/tmp/evapics-A/catalog.jsonl` and
 * `tools/ingest/output/manifest.json` do not survive a reboot (the first
 * two live in `/tmp`) or a fresh clone (`manifest.json` is gitignored —
 * `.gitignore:37`). `tools/book-placement/source.ts` made the identical
 * call for the same reason: merge the ephemeral sources ONCE, commit the
 * result, and every later run — including a founder re-run months from
 * now, on a machine that never had `/tmp/evapics-A` on it — plans against
 * source control alone.
 *
 * SCOPE. All 21 photographs the founder's 24 July evening actually has in
 * the live archive (`24:7:26-12.HEIC`, a byte-identical duplicate of -11,
 * was excluded upstream by `tools/book-placement/plan.ts` and was never
 * ingested — see its own `ADJACENT_PAIRS` comment). 18 of the 21 already
 * carry the SAME author `tools/ingest/verdicts.ts`'s founder-fixed mapping
 * (`person_a` -> adam, `person_b` -> eva, `cannot_tell`/`third_party` ->
 * unsigned) already gave them at ingest — `currentAuthor` records what
 * SHOULD already be live, so `resolve.ts` can flag a mismatch rather than
 * silently trust it. `openQuestion: true` marks the 3 where the founder's
 * 2026-08-08 ask ("images from the 24 in july of us to adam and eva") is
 * actually live: both of them are pictured together AND the automatic pass
 * could not resolve a shooter, so the photograph sits unsigned. This tool
 * does not guess an author for those three — see apply.ts's printed output
 * and README-equivalent doc comment for why, and how to override.
 *
 * WHAT WAS DELIBERATELY LEFT OUT OF `openQuestion`, AND WHY (per-file, so a
 * reader does not have to re-derive it):
 *   - 24:7:26-11.HEIC (cannot_tell) — catalogue: "other two visible figures
 *     (wavy-haired woman, checked-shirt woman) don't match either
 *     established look — reads as a wider friend group." Not a photo of
 *     the two of them; a solo POV shot at a group hangout with OTHER
 *     people. `catalogPeople: "unclear"`, not "both".
 *   - 24:7:26-19.JPG (cannot_tell) — catalogue: "pure sunset landscape...
 *     nobody from the couple in frame." `catalogPeople: "neither"`.
 *   - 24:7:26-22.heic — NOT cannot_tell/third_party at all; the
 *     authorship pass resolved it to person_a/adam ("person_b is one of
 *     the people standing at the lectern being photographed, so she can't
 *     be the shooter"). This is the day's event photo the CTO brief's own
 *     scoping note refers to ("the day also contains landscapes and an
 *     event photo") — already signed, not open.
 *   - 8 further already-signed "both" photographs (couple selfies etc.,
 *     e.g. 24:7:26-8.JPG, -9.HEIC, -16/-17.HEIC, -20.HEIC, the plain
 *     `.HEIC`/`.JPG` pair) are NOT open questions: the authorship pass
 *     positively identified a shooter for each (selfie geometry, a hand
 *     holding a second phone in frame, etc.) — see each row's `reason`.
 *
 * A SEPARATE, OUT-OF-SCOPE NOTE ON THE OTHER 3 `third_party` ROWS IN THE
 * WHOLE ARCHIVE (2 of the archive's 5 third_party rows are NOT here): the
 * team-lead brief that assigned this task describes "the 5 rows currently
 * marked third_party" as uniformly "photographs a passer-by took OF THE
 * TWO OF THEM." That is true for the 2 rows on 24 July
 * (24:7:26-4.JPG, 24:7:26-18.JPG, both below). It does not hold for the
 * other 3: `31:7:26-1.JPG` and `31:7:26-4.JPG` are catalogued as "three
 * young men posed close together indoors... none of the three visible
 * faces closely match the established person_a look" (verdicts.tsv) — a
 * friend-group photo where neither Eva nor Adam is confirmed present, not
 * a couple photo. This task is scoped to 24 July only (per the brief's own
 * title), so those two are correctly out of scope either way; flagged here
 * so nobody downstream assumes all 5 third_party rows are "of us."
 */

export type ResolvedAuthor = "eva" | "adam" | "unsigned";

export interface AuthorshipCandidate {
  /** The original filename — the one stable key every stage of the ingest
      pipeline (catalogue, verdicts, manifest) agrees on. */
  file: string;
  /** The display derivative's checksum — the join key against live
      `photos.checksum_sha256`, exactly as `tools/book-placement` matches. */
  checksumSha256: string;
  /** The catalogue's own read of who is pictured (`/tmp/evapics-A/catalog.jsonl`, "people"). */
  catalogPeople: "both" | "unclear" | "neither";
  /** The authorship pass's verdict (`/tmp/authorship-pass/verdicts.tsv`). */
  verdictShooter: "person_a" | "person_b" | "cannot_tell" | "third_party";
  /** What SHOULD already be live, per `tools/ingest/verdicts.ts`'s
      SHOOTER_TO_AUTHOR mapping — the same one `tools/ingest/load.ts` applied
      at ingest time. Not re-derived from `verdictShooter` here on purpose:
      if this file's mapping and verdicts.ts's mapping ever disagree, that
      is a bug worth a loud diff, not a silent recomputation. */
  currentAuthor: ResolvedAuthor;
  /**
   * True for exactly the files this task concerns: BOTH of them pictured
   * together AND the shooter genuinely unresolved (a stranger, or "can't
   * tell which partner"). `apply.ts` stages NO default change for these —
   * see its own doc comment for why — only an explicit override changes
   * them.
   */
  openQuestion: boolean;
  /** One line, human, citing the actual evidence — never invented. */
  reason: string;
}

export const AUTHORSHIP_ROSTER_2026_07_24: readonly AuthorshipCandidate[] = [
  {
    file: "24:7:26-3.HEIC",
    checksumSha256: "ddadf2a38fe404436d14038c3e063aff2382f23d97eaf74a54061023314fbb25",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason:
      "solo man reflected in a mirror, candid unaware framing — verdict: shot by his partner (adam)",
  },
  {
    file: "24:7:26-4.JPG",
    checksumSha256: "4baeee6ad782dbb97f05c670c4f6d088e4d5c91e38e75ae1e2961b19b87f5e43",
    catalogPeople: "both",
    verdictShooter: "third_party",
    currentAuthor: "unsigned",
    openQuestion: true,
    reason:
      'OF US, SHOT BY A STRANGER: "both in frame from behind/side at a comfortable ' +
      "mid-distance, full torsos and surroundings visible, no extended arm or hand " +
      'holding a phone anywhere in frame — reads as a bystander shot" (verdicts.tsv). ' +
      "Neither of them held the camera for this one.",
  },
  {
    file: "24:7:26-5.JPG",
    checksumSha256: "726bd81d7aaeb32e66b2f2b02f35c7c0a16fb2a055c1c3b5b5797c529a135ce3",
    catalogPeople: "unclear",
    verdictShooter: "person_b",
    currentAuthor: "eva",
    openQuestion: false,
    reason: "solo man on the wall at sunset, back turned — verdict: shot by his partner (eva)",
  },
  {
    file: "24:7:26-6.PNG",
    checksumSha256: "5a47db42047ad7e9a016497ff4c3c68e0dda4affdec5f4b4fcdb352cf65197ff",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason: "solo woman viewing a photo wall, back turned — verdict: shot by her partner (adam)",
  },
  {
    file: "24:7:26-7.JPG",
    checksumSha256: "24828a36b55780febddbc40a20f785a054b01f9c4ac16695789e7e43150b4725",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason: "solo woman on the wall at sunset, back turned — verdict: shot by her partner (adam)",
  },
  {
    file: "24:7:26-8.JPG",
    checksumSha256: "33cde806755292b4d267b7456a98ec8b5c76f15436ccfbbd7b409ad727b36961",
    catalogPeople: "both",
    verdictShooter: "person_b",
    currentAuthor: "eva",
    openQuestion: false,
    reason:
      "extreme close-up couple selfie, her face dramatically larger/closer with visible " +
      "arm's-length distortion — verdict: she held the phone (eva); already signed, not open",
  },
  {
    file: "24:7:26-9.HEIC",
    checksumSha256: "5adab80b6ec9b26418c2ad98ef32bed8c4ca123deb5f5845f93d9fbd12185bda",
    catalogPeople: "both",
    verdictShooter: "person_b",
    currentAuthor: "eva",
    openQuestion: false,
    reason:
      "overhead couple shot; a hand in her sleeve colour visibly holds the phone with the " +
      "camera app on screen — verdict: eva; already signed, not open",
  },
  {
    file: "24:7:26-10.HEIC",
    checksumSha256: "653bee17d4cdb48a80c57ac4e4834c1881b90fa0eca20b0084b024d4e81b23ce",
    catalogPeople: "both",
    verdictShooter: "cannot_tell",
    currentAuthor: "unsigned",
    openQuestion: true,
    reason:
      'OF US, SHOOTER GENUINELY UNCLEAR: "tight overhead cheek-to-cheek embrace shot ' +
      "straight down; no hand or arm holding a phone visible in frame on either side; " +
      'composition nearly symmetric, can\'t attribute to either person" (verdicts.tsv). ' +
      "Could plausibly be either of them at arm's length overhead — not a stranger's shot, " +
      "but not distinguishable between the two either.",
  },
  {
    file: "24:7:26-11.HEIC",
    checksumSha256: "6de5d8dd497907b1cc3afa0dee039b842cbddd656930be9f9b2e655a11356499",
    catalogPeople: "unclear",
    verdictShooter: "cannot_tell",
    currentAuthor: "unsigned",
    openQuestion: false,
    reason:
      "NOT a photo of the two of them — a wider friend-group hangout; the other two people " +
      'in frame "don\'t match either established look" (catalogue). Correctly unsigned, ' +
      "and out of this task's scope (not \"of us\").",
  },
  {
    file: "24:7:26-13.HEIC",
    checksumSha256: "6bf833b9a9d2809068ebc3ea82dcebcfef11ef58c397a4ed0a732e056f6b8d75",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason: "solo figure at an arcade cabinet, candid unaware framing — verdict: adam",
  },
  {
    file: "24:7:26-14.HEIC",
    checksumSha256: "52a4dc4db7133431b59fcc7b98f664a7bb5175b2aa7118cd3ef11fd1c1b757f4",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason: "solo woman at a restaurant booth, facing camera at table distance — verdict: adam",
  },
  {
    file: "24:7:26-15.HEIC",
    checksumSha256: "e47e711791831867c9f22dfc0837f1cba055817ff97d197c917b827fcbfaa712",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason: "her hands are full with her own phone photographing the sunset — verdict: adam",
  },
  {
    file: "24:7:26-16.HEIC",
    checksumSha256: "e7fcb594effb30ec23812fbabe20888ce0ea035354981a73fd31a4ecfe485d2e",
    catalogPeople: "both",
    verdictShooter: "person_b",
    currentAuthor: "eva",
    openQuestion: false,
    reason:
      "couple selfie, her face closer/larger (arm's-length asymmetry) — verdict: eva; " +
      "already signed, not open",
  },
  {
    file: "24:7:26-17.HEIC",
    checksumSha256: "4f0b7c1a07ca65f6d07099206283212826a0f621a8d4ec9091c53274a1924ab4",
    catalogPeople: "both",
    verdictShooter: "person_b",
    currentAuthor: "eva",
    openQuestion: false,
    reason: "burst pair with -16 (4s apart), same asymmetry — verdict: eva; already signed, not open",
  },
  {
    file: "24:7:26-18.JPG",
    checksumSha256: "dece1ae7dc20144df6d119641a1f15b05551eb60872792361a73dd637362a1c1",
    catalogPeople: "both",
    verdictShooter: "third_party",
    currentAuthor: "unsigned",
    openQuestion: true,
    reason:
      "OF US, SHOT BY A STRANGER: same evidence and pose as 24:7:26-4.JPG (the catalogue " +
      'calls it "same photo... at lower resolution," a near-duplicate export, not a distinct ' +
      "moment). Kept as its own open question rather than silently folded into -4's answer — " +
      "this tool does not deduplicate; if you sign one, decide this one too.",
  },
  {
    file: "24:7:26-19.JPG",
    checksumSha256: "d155751e6705408b392534413a7cc31b3fffcdc5f8f932bb6af2373c8eadc637",
    catalogPeople: "neither",
    verdictShooter: "cannot_tell",
    currentAuthor: "unsigned",
    openQuestion: false,
    reason:
      "a landscape — pure sunset sky, nobody from the couple in frame. Correctly unsigned; " +
      "not \"of us.\"",
  },
  {
    file: "24:7:26-20.HEIC",
    checksumSha256: "8a7223872cc5f2e434a9ac47a1006f4986ef639dcbe7a0c2288f949cb5d119dd",
    catalogPeople: "both",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason:
      "classic arm's-length selfie, his face large/close with wide-angle distortion — " +
      "verdict: adam; already signed, not open",
  },
  {
    file: "24:7:26-21.HEIC",
    checksumSha256: "99d1cdf1e7afd5e628b012fdb04066720bcabb54c002bf0ca6b631fc1d2132ed",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason: "solo woman at a railing, posed and aware, natural distance — verdict: adam",
  },
  {
    file: "24:7:26-22.heic",
    checksumSha256: "7818333ed363f1e246c6ba78e5ebd0dc0b1ef8b0715330c99464df00460af37e",
    catalogPeople: "unclear",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason:
      "the day's event photo — eva is one of the people at the lectern being photographed, " +
      "so she cannot be the shooter — verdict: adam. Not \"of us\" (a group/event frame).",
  },
  {
    file: "24:7:26.HEIC",
    checksumSha256: "4c4122070578f3ca7a5a404c69a1b04ac3d2b80084062c3deb5cf1e6f0d8d21d",
    catalogPeople: "both",
    verdictShooter: "person_a",
    currentAuthor: "adam",
    openQuestion: false,
    reason:
      "overhead couple shot; her arm/hand are both occupied lifting a can to her mouth, his " +
      "head is out of frame beneath the lens — verdict: adam; already signed, not open",
  },
  {
    file: "24:7:26.JPG",
    checksumSha256: "6a65af15df5e0a80b3beb14dbd20f8d073afe895501d7df9a05750a191e67025",
    catalogPeople: "both",
    verdictShooter: "person_b",
    currentAuthor: "eva",
    openQuestion: false,
    reason:
      "same close-up arm's-length selfie geometry as -8.JPG, same evening — verdict: eva; " +
      "already signed, not open",
  },
] as const;
