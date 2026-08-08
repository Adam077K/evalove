/**
 * Photo people-classification index — generated from the catalogue JSONL files.
 *
 * Three values, drawn from `tools/ingest/catalog/{A,B,C}.jsonl`:
 *
 *   "both"    — both Eva and Adam are visibly present in the photograph.
 *   "unclear" — the subjects are not clearly identifiable as the couple.
 *   "neither" — confirmed: neither Eva nor Adam is in the frame.
 *
 * The database has no `people` column (the migration that would add one is
 * tracked at `apps/web/supabase/migrations/20260808_add_people_column.sql`
 * — Irreversible tier, to be applied by the founder).  Until that migration
 * runs, this module is the only place that knows whether a photo is a couple
 * photograph.
 *
 * Keys are the photo `id` values that `tools/ingest/load.ts` writes to the
 * database — deterministically derived from the source filename via SHA-256
 * (salt `"eva-adam-photo-ingest/photo-id"`).  Fixture photos mint their own
 * IDs and will not appear here; they degrade to `undefined` (treated as
 * "unclear") in all callers.
 *
 * Regeneration: if new photos are ingested, re-run:
 *   node tools/ingest/scripts/gen-people-index.mjs > apps/web/lib/people-index.ts
 * (or update this file manually by appending entries from the new catalogue
 * batch, using the same SHA-256 derivation.)
 */

export type PeopleClass = "both" | "unclear" | "neither";

/**
 * Return the people classification of a photo by its database `id`,
 * or `undefined` if this id was not in the catalogue at last generation.
 *
 * `undefined` is treated the same as `"unclear"` by all callers — it is not
 * an error, just a fact that the caller has no information.
 */
export function peopleOf(photoId: string): PeopleClass | undefined {
  return PEOPLE_INDEX[photoId];
}

/** Priority rank — lower is higher priority. Used for couple-first ordering. */
export function peoplePriority(cls: PeopleClass | undefined): number {
  switch (cls) {
    case "both":    return 0;
    case "unclear": return 1;
    case "neither": return 2;
    default:        return 1; // unknown → treat as unclear
  }
}

// ---------------------------------------------------------------------------
// Generated map — 52 entries from catalogue A (16–24 Jul), B (25 Jul–1 Aug),
// C (2–7 Aug).  Do not edit by hand; see module header for regeneration.
// ---------------------------------------------------------------------------

const PEOPLE_INDEX: Record<string, PeopleClass> = {
  "08f0ccd4-6460-c7fa-e242-3fd05f10d8a1": "unclear",  // 2026-07-16 16:7:26.JPG
  "d40e2e56-8c03-c045-f7d8-e96ec4c9b59c": "unclear",  // 2026-07-18 18:7:26-1.JPG
  "920a6628-55e8-400d-e3bf-13f6fcbc4c31": "both",     // 2026-07-24 24:7:26-10.HEIC
  "31e1abef-11be-3b65-1d6b-408720c41b56": "unclear",  // 2026-07-24 24:7:26-11.HEIC
  "45c512a6-3816-cae2-876f-c4d568bf982e": "unclear",  // 2026-07-24 24:7:26-12.HEIC
  "9a3817c3-4c3f-62ba-78e9-c8756f9cfdb2": "unclear",  // 2026-07-24 24:7:26-13.HEIC
  "3d3e315f-cab2-e48b-d73b-9f85f87b92db": "unclear",  // 2026-07-24 24:7:26-14.HEIC
  "2c8b941d-2c0d-8643-9783-65a18422c807": "unclear",  // 2026-07-24 24:7:26-15.HEIC
  "7df36495-cec4-59a9-4856-75a8eee82308": "both",     // 2026-07-24 24:7:26-16.HEIC
  "25e1acff-4891-5b20-b4c8-28fc196e01f5": "both",     // 2026-07-24 24:7:26-17.HEIC
  "0ad8bccf-104f-8be0-4bd7-a3b52ed0f723": "both",     // 2026-07-24 24:7:26-18.JPG
  "b8079a44-a096-541d-a737-7a0832b33a11": "neither",  // 2026-07-24 24:7:26-19.JPG
  "93c31c0a-dbde-589b-ae63-1880b7955e2e": "both",     // 2026-07-24 24:7:26-20.HEIC
  "4f9c2db8-83f9-a6f5-605e-a1afa33d6cef": "unclear",  // 2026-07-24 24:7:26-21.HEIC
  "6b5c7c40-ee11-52fc-2971-1ee4801214af": "unclear",  // 2026-07-24 24:7:26-22.heic
  "ba6c9d34-fd6e-e984-a7cc-ddee18b3ab7b": "unclear",  // 2026-07-24 24:7:26-3.HEIC
  "47a51f29-50e3-a817-41d9-a7729db992a8": "both",     // 2026-07-24 24:7:26-4.JPG
  "df359283-f73e-a3e5-d962-85f75fc102d1": "unclear",  // 2026-07-24 24:7:26-5.JPG
  "f4c9d8ba-ace6-e262-4b34-b9a58db46ce3": "unclear",  // 2026-07-24 24:7:26-6.PNG
  "b269706e-95f1-3601-f9fd-b19c62c34441": "unclear",  // 2026-07-24 24:7:26-7.JPG
  "aa1d6050-0088-394b-a01e-d705a884a8b1": "both",     // 2026-07-24 24:7:26-8.JPG
  "d55324a8-a57d-3675-c9db-af092109717e": "both",     // 2026-07-24 24:7:26-9.HEIC
  "1748f7d6-727f-306d-337e-4a13219e34b7": "both",     // 2026-07-24 24:7:26.HEIC
  "e379972e-557f-e0ca-fbb1-ce1bdeffb1ea": "both",     // 2026-07-24 24:7:26.JPG
  "2edeb031-a980-a45d-2e43-330928d46cdf": "unclear",  // 2026-07-25 25:7:26-1.HEIC
  "87217ed9-3672-f1e7-e02a-5d32a4376ef3": "neither",  // 2026-07-25 25:7:26-10.jpg
  "0a837b1a-ea7f-475e-33da-99f88f82ffb1": "unclear",  // 2026-07-25 25:7:26-2.HEIC
  "fd4f579b-1520-1a5d-a486-456eb8217dc7": "unclear",  // 2026-07-25 25:7:26-3.JPG
  "5e265ab5-936f-3d17-2e12-888e512b6fb2": "neither",  // 2026-07-25 25:7:26-4.HEIC
  "0220759a-e805-3e3d-3879-da50c5c525e7": "neither",  // 2026-07-27 27:7:26-1.HEIC
  "c6d3a8fc-d0d8-8fe8-61fb-effdfd50c69a": "neither",  // 2026-07-27 27:7:26-2.HEIC
  "67d28961-c353-ed78-ff76-11c3fc13b606": "unclear",  // 2026-07-28 28:7:26-6.MOV
  "c542f6bc-fa1f-2084-a077-fb052f8a3a90": "unclear",  // 2026-07-30 30:7:26-1.JPG
  "94f234e8-2bff-928e-6f1c-4b30f65b158f": "unclear",  // 2026-07-30 30:7:26.JPG
  "e37cb25f-8b31-9b74-eabb-868d96b4e4c4": "unclear",  // 2026-07-31 31:7:26-1.JPG
  "c500aad5-45ec-f4e8-2e21-949dc89ca32d": "unclear",  // 2026-07-31 31:7:26-4.JPG — "three young men, novelty star headbands" — not the couple
  "244598e8-7090-d016-5af7-af229e3b2edc": "unclear",  // 2026-07-31 31:7:26-5.HEIC
  "3013448d-7797-43cf-7460-302b11ea9c83": "unclear",  // 2026-08-01 1:8:26-1.MOV
  "1881b412-deb3-fc77-86a7-cda382f8480f": "unclear",  // 2026-08-01 1:8:26-2.HEIC
  "ce6d8acb-6b8c-602f-820c-6b03d8c75fe7": "unclear",  // 2026-08-01 1:8:26-3.MP4
  "4cac8905-6492-fcb8-7629-3389741b1854": "unclear",  // 2026-08-02 2:8:26-1.HEIC
  "6b74ae75-a0e3-95a1-5c25-2af4ad4cd75f": "neither",  // 2026-08-03 3:8:26-1.JPG
  "872c2783-b0d5-02f6-eb4b-9c66a4fdac24": "neither",  // 2026-08-03 3:8:26-2.JPG
  "931ee32e-3a06-8a7e-7c97-63b2c29386ba": "unclear",  // 2026-08-03 3:8:26-3.JPG
  "b269d313-17ef-34d2-4ed6-82c24e534444": "unclear",  // 2026-08-03 3:8:26-6.HEIC
  "a0c87b46-060e-28ce-8a7b-f09c458f4cb1": "neither",  // 2026-08-06 6:8:26-1.JPG
  "bd2c8cc1-df71-5e6f-5928-e9e2495ee51a": "neither",  // 2026-08-06 6:8:26-2.HEIC
  "c17d9413-edb1-2fea-ecff-ffcabfe95b10": "neither",  // 2026-08-06 6:8:26-3.JPG
  "d5dd9b8a-bbc9-f618-162f-3351d120215e": "neither",  // 2026-08-06 6:8:26-4.JPG
  "7301af9e-4221-7ab5-3eec-6258de4f87bb": "unclear",  // 2026-08-06 6:8:26-5.JPG
  "7018f36c-babe-611c-c49c-c2b0621449e5": "neither",  // 2026-08-06 6:8:26-6.JPG
  "95a3e2d2-9d02-ec9e-de7a-e43a9bf99dc9": "neither",  // 2026-08-07 7:8:26-1.JPG
};
