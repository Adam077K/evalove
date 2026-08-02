import type { Photo } from "@/lib/types";

/**
 * Fixture photographs. Ordinary days, not highlights — the walk to
 * the office, the thing on the desk, the sky. Captions are in each
 * person's own voice. Times are each person's own city.
 */

const pic = (seed: string, w = 1200, h = 1600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const PHOTOS: Record<string, Photo> = {
  /* — seeded gathering (from before; no shared day) — */
  "seed-eva-1": {
    id: "seed-eva-1", kind: "book", author: "eva", sharedDay: "",
    postedAtLocal: "9:12 pm", caption: "The night we closed the dumpling place",
    width: 1200, height: 1600, displayUrl: pic("ea-dumpling"),
  },
  "seed-eva-2": {
    id: "seed-eva-2", kind: "book", author: "eva", sharedDay: "",
    postedAtLocal: "9:14 pm", caption: "Roosevelt Island tram, the loud sunset",
    width: 1200, height: 900, displayUrl: pic("ea-tram", 1200, 900),
  },
  "seed-eva-3": {
    id: "seed-eva-3", kind: "book", author: "eva", sharedDay: "",
    postedAtLocal: "9:15 pm", caption: "Your jacket, my chair",
    width: 1200, height: 1600, displayUrl: pic("ea-jacket"),
  },
  "seed-adam-1": {
    id: "seed-adam-1", kind: "book", author: "adam", sharedDay: "",
    postedAtLocal: "6:03 am", caption: "Gordon beach before anyone",
    width: 1200, height: 900, displayUrl: pic("ea-gordon", 1200, 900),
  },
  "seed-adam-2": {
    id: "seed-adam-2", kind: "book", author: "adam", sharedDay: "",
    postedAtLocal: "6:05 am", caption: "The good shakshuka, documented",
    width: 1200, height: 1600, displayUrl: pic("ea-shakshuka"),
  },

  /* — dailies — */
  "d0729-eva": {
    id: "d0729-eva", kind: "daily", author: "eva", sharedDay: "2026-07-29",
    postedAtLocal: "8:41 am", caption: "F train, miracle seat",
    width: 1200, height: 1600, displayUrl: pic("ea-ftrain"),
  },
  "d0729-adam": {
    id: "d0729-adam", kind: "daily", author: "adam", sharedDay: "2026-07-29",
    postedAtLocal: "2:10 pm", caption: "Office AC lost the war",
    width: 1200, height: 1600, displayUrl: pic("ea-officefan"),
  },
  "d0730-eva": {
    id: "d0730-eva", kind: "daily", author: "eva", sharedDay: "2026-07-30",
    postedAtLocal: "1:22 pm", caption: "Deli guy drew a cat on my coffee",
    width: 1200, height: 1600, displayUrl: pic("ea-coffeecat"),
  },
  "d0730-adam": {
    id: "d0730-adam", kind: "daily", author: "adam", sharedDay: "2026-07-30",
    postedAtLocal: "7:48 pm", caption: "Carmel market tomatoes, obscene",
    width: 1200, height: 1600, displayUrl: pic("ea-tomatoes"),
  },
  /* a day that closed half-finished — Eva's plate stands alone */
  "d0731-eva": {
    id: "d0731-eva", kind: "daily", author: "eva", sharedDay: "2026-07-31",
    postedAtLocal: "6:52 pm", caption: "Sudden rain, everyone under the same awning",
    width: 1200, height: 900, displayUrl: pic("ea-awning", 1200, 900),
  },
  /* today — Adam has posted, Eva's side is still coming */
  "d0802-adam": {
    id: "d0802-adam", kind: "daily", author: "adam", sharedDay: "2026-08-02",
    postedAtLocal: "6:20 am", caption: "The cat that owns our stairwell",
    width: 1200, height: 1600, displayUrl: pic("ea-staircat"),
  },
};
