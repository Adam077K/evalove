import type { IsoDate, IsoDateTime, Member, Photo, PhotoKind } from "@/lib/types";
import { localDate, localTime } from "@/lib/time";
import { ADAM, EVA } from "./members";

/**
 * Fixture photographs, against the canonical `Photo` contract.
 * Ordinary days, not highlights — the walk to the office, the thing
 * on the desk, the sky. Captions are in each person's own voice.
 *
 * `createdAt` instants are real UTC; the local times shown in the
 * book are DERIVED from them via each member's IANA zone (§13),
 * which is exactly what the wired app will do. `sharedDay` is the
 * poster's own local date (CEO ruling, DECISIONS 2026-08-02).
 */

const pic = (seed: string, w = 1200, h = 1600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** storagePath → viewable URL. The seam `resolve.ts` reads. */
export const PHOTO_URL_REGISTRY = new Map<string, string>();

let serial = 0;
const uuid = () =>
  `9b2f64de-0a31-4c1a-8f77-${String(++serial).padStart(12, "0")}`;

const sha = (key: string) =>
  (key.replace(/[^a-f0-9]/g, "") + "abcdef0123456789".repeat(4)).slice(0, 64);

function mkPhoto(opts: {
  kind: PhotoKind;
  author: Member;
  createdAt: IsoDateTime;
  caption?: string;
  seed: string;
  w?: number;
  h?: number;
  takenAt?: IsoDateTime;
  /** Overrides the derived shared day — used only by seeded plates. */
  sharedDay?: IsoDate;
}): Photo {
  const id = uuid();
  const display = `photos/display/${id}.jpg`;
  const thumb = `photos/thumb/${id}.jpg`;
  const w = opts.w ?? 1200;
  const h = opts.h ?? 1600;
  PHOTO_URL_REGISTRY.set(display, pic(opts.seed, w, h));
  PHOTO_URL_REGISTRY.set(thumb, pic(opts.seed, 240, Math.round((240 * h) / w)));
  return {
    id,
    clientUuid: id,
    kind: opts.kind,
    authorMemberId: opts.author.id,
    attributionSource: "self_declared",
    sharedDay:
      opts.sharedDay ?? localDate(opts.createdAt, opts.author.homeTimezone),
    sharedDayTz: opts.author.homeTimezone,
    clientReportedTz: opts.author.homeTimezone,
    takenAt: opts.takenAt,
    caption: opts.caption,
    storagePathDisplay: display,
    storagePathThumb: thumb,
    originalLocation: "r2",
    width: w,
    height: h,
    bytes: 187_000 + ((serial * 7919) % 240_000),
    mime: "image/jpeg",
    colorSpace: "display-p3",
    checksumSha256: sha(id),
    exifStripped: true,
    createdAt: opts.createdAt,
  };
}

export const PHOTOS = {
  /* — the opening gathering: from before, added the first evening — */
  "seed-eva-1": mkPhoto({
    kind: "book",
    author: EVA,
    createdAt: "2026-08-02T01:12:00Z", // 9:12 pm NY, Aug 1
    takenAt: "2026-04-18T23:40:00Z",
    caption: "The night we closed the dumpling place",
    seed: "ea-dumpling",
  }),
  "seed-eva-2": mkPhoto({
    kind: "book",
    author: EVA,
    createdAt: "2026-08-02T01:14:00Z",
    takenAt: "2026-05-02T22:10:00Z",
    caption: "Roosevelt Island tram, the loud sunset",
    seed: "ea-tram",
    w: 1200,
    h: 900,
  }),
  "seed-eva-3": mkPhoto({
    kind: "book",
    author: EVA,
    createdAt: "2026-08-02T01:15:00Z",
    takenAt: "2026-06-11T13:05:00Z",
    caption: "Your jacket, my chair",
    seed: "ea-jacket",
  }),
  "seed-adam-1": mkPhoto({
    kind: "book",
    author: ADAM,
    createdAt: "2026-08-02T03:03:00Z", // 6:03 am IL, Aug 2
    takenAt: "2026-03-27T04:20:00Z",
    caption: "Gordon beach before anyone",
    seed: "ea-gordon",
    w: 1200,
    h: 900,
  }),
  "seed-adam-2": mkPhoto({
    kind: "book",
    author: ADAM,
    createdAt: "2026-08-02T03:05:00Z",
    takenAt: "2026-05-19T09:12:00Z",
    caption: "The good shakshuka, documented",
    seed: "ea-shakshuka",
  }),

  /* — dailies — */
  "d0729-eva": mkPhoto({
    kind: "daily",
    author: EVA,
    createdAt: "2026-07-29T12:41:00Z", // 8:41 am NY
    caption: "F train, miracle seat",
    seed: "ea-ftrain",
  }),
  "d0729-adam": mkPhoto({
    kind: "daily",
    author: ADAM,
    createdAt: "2026-07-29T11:10:00Z", // 2:10 pm IL
    caption: "Office AC lost the war",
    seed: "ea-officefan",
  }),
  "d0730-eva": mkPhoto({
    kind: "daily",
    author: EVA,
    createdAt: "2026-07-30T17:22:00Z", // 1:22 pm NY
    caption: "Deli guy drew a cat on my coffee",
    seed: "ea-coffeecat",
  }),
  "d0730-adam": mkPhoto({
    kind: "daily",
    author: ADAM,
    createdAt: "2026-07-30T16:48:00Z", // 7:48 pm IL
    caption: "Carmel market tomatoes, obscene",
    seed: "ea-tomatoes",
  }),
  /* a day that closed half-finished — Eva's plate stands alone */
  "d0731-eva": mkPhoto({
    kind: "daily",
    author: EVA,
    createdAt: "2026-07-31T22:52:00Z", // 6:52 pm NY
    caption: "Sudden rain, everyone under the same awning",
    seed: "ea-awning",
    w: 1200,
    h: 900,
  }),
  /* today — Adam has posted; Eva's side is still coming */
  "d0802-adam": mkPhoto({
    kind: "daily",
    author: ADAM,
    createdAt: "2026-08-02T03:20:00Z", // 6:20 am IL
    caption: "The cat that owns our stairwell",
    seed: "ea-staircat",
  }),
} as const;

export type PhotoKey = keyof typeof PHOTOS;

/** `6:20 am` — a photo's posted time in its author's own city. */
export function postedAtLocal(p: Photo): string {
  return localTime(p.createdAt, p.sharedDayTz);
}
