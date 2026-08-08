/**
 * The machine-shaped-caption guard itself, under test — same shape as
 * `lib/__tests__/copy-law.test.ts`: this file checks the pattern directly
 * against fixed strings, so the guard's own correctness never depends on
 * which pipeline happens to be wired to it today.
 */
import { describe, expect, it } from "vitest";
import {
  MACHINE_SHAPED_CAPTION_PATTERN,
  isMachineShapedCaption,
} from "@/lib/caption-law";
import { PHOTOS } from "@/lib/fixtures/photos";

describe("MACHINE_SHAPED_CAPTION_PATTERN — the real 2026-08-08 breach (must match)", () => {
  it("the exact caption that shipped live on photo 0ad8bccf-104f-8be0-4bd7-a3b52ed0f723", () => {
    expect("Same photo as 24:7:26-4.JPG at lower resolution.").toMatch(
      MACHINE_SHAPED_CAPTION_PATTERN,
    );
  });

  it("the catalogue's own `notes` field for that same file, in case notes ever leaks into a caption", () => {
    expect(
      "appears to be a lower-resolution export of the exact same photo as 24:7:26-4.JPG " +
        "(identical pose and instant, same aspect ratio, this file is 852x1118 vs 4.JPG's " +
        "3840x5120) — true duplicate, drop this one and keep 4.JPG",
    ).toMatch(MACHINE_SHAPED_CAPTION_PATTERN);
  });

  it("the sibling file's `notes` field (24:7:26-4.JPG's own near-duplicate note)", () => {
    expect(
      "near-duplicate of 24:7:26-18.JPG — same pose and instant, same aspect ratio, " +
        "different export resolution (this file is 3840x5120, 18.JPG is 852x1118); " +
        "likely two exports of one photo, use only one in the app",
    ).toMatch(MACHINE_SHAPED_CAPTION_PATTERN);
  });
});

describe("MACHINE_SHAPED_CAPTION_PATTERN — the wider family (must match)", () => {
  const cases: [string, string][] = [
    ["bare filename with extension", "IMG_0142.heic"],
    ["camera metadata talk", "no camera metadata present"],
    ["EXIF talk", "EXIF data suggests this was received, not taken on this phone"],
    ["GPS metadata talk", "GPS metadata was stripped before upload"],
    ["aspect ratio talk", "same aspect ratio as the other export"],
    ["burst as camera-mode noun", "burst of photos, keep only the best one"],
    ["photo burst", "a photo burst from the same second"],
    ["screenshot classification", "screenshot, may not belong in the book"],
    ["duplicate of", "duplicate of an earlier shot"],
    ["duplicate export", "duplicate export, safe to drop"],
    ["exact duplicate", "an exact duplicate of the file above"],
    ["byte-identical duplicate", "byte-identical duplicate photo"],
    ["near duplicate (space, not hyphen)", "near duplicate of the sunset shot"],
    ["lower resolution", "the lower-resolution copy of the same shot"],
    ["higher resolution", "kept the higher resolution version"],
    ["bare pixel dimensions", "3840x5120 vs 852x1118"],
    ["pixel dimensions with x separator, lowercase", "1600x1200"],
    ["this file, not a moment", "this file is smaller than the original"],
    ["this export, not a moment", "this export lost some quality"],
    ["likely shooter (internal heuristic field, not prose)", "likely shooter: received"],
  ];

  it.each(cases)("%s: %j matches", (_label, text) => {
    expect(text).toMatch(MACHINE_SHAPED_CAPTION_PATTERN);
  });
});

describe("MACHINE_SHAPED_CAPTION_PATTERN — every live Book caption as of the 2026-08-08 audit (must NOT match)", () => {
  // Verbatim from the 48 non-deleted rows in the production `photos` table,
  // read via tools/export/read.ts's fetchPhotos on 2026-08-08 — every one of
  // them EXCEPT the single breach above, which is fixed separately (the
  // correction tool, not this guard, rewrites that row).
  const liveCaptions = [
    "Two people on the lawn, small against the black sculpture.",
    "Inside the blue room, everyone becomes a silhouette.",
    "The mirror has more stickers on it than the room has walls.",
    "Sunset over the water, and neither of them is looking at it.",
    "The sky did more that evening than either of us.",
    "Five people on a stage that clearly doesn't belong to all of them equally.",
    "She's looking down the avenue like it might tell her something.",
    "Looking for herself in a wall of other people's races.",
    "Drinking a soda like it's the only thing that matters.",
    "Taking a photo of the sunset instead of just looking at it.",
    "Sushi for two, but only one of them is in the frame.",
    "One more round on the Neo Geo before last call.",
    "Late-night food on the brick, everyone half-lying down.",
    "Cheek to cheek on the ground, like the floor was the point.",
    "The bag says 'how do you do' and nobody answers.",
    "She let the ferry go by without looking up.",
    "Matching tongues out, matching bad manners.",
    "Feet up on brick, taking a photo of nothing in particular.",
    "A kiss on the cheek, and a red car passing at exactly the right moment.",
    "Her smile is doing all the work in this one.",
    "Tongue out for no reason, which is the only good reason.",
    "He watches the sun go down like it owes him something.",
    "the drawing held up against the real skyline, same skyline either way",
    "leaning on the tree, earbuds in, not really posing",
    "a finger pointing down at the highway, the river behind it",
    "a taxi and a bike lane on Fifth, nobody looking at the camera",
    "sun on her face in the park, everyone else out of focus",
    "palm trees and pink clouds while the sprinklers go on",
    "the sun going down behind the marina building, all silhouette",
    "breakfast on the bed, avocado fanned out just so",
    "her back to the camera, looking at the roses, the towers behind",
    "sushi on the counter, everyone talking at once",
    "the same three, same headbands, same squeeze",
    "three of them squeezed together, someone else's star headband on",
    "two of them in the pool, peace sign, everyone squinting",
    "poker night, the pizza going cold in the middle of the table",
    "flat on the floor with the dog, both of us looking up",
    "the cat sits like it pays rent here",
    "two coffees, two screens, studying side by side",
    "the library with the church-shaped ceiling",
    "the desk where the app is getting built",
    "the same desk, now with arrows drawn on it",
    "she looks back in the empty square, the arch behind her",
    "the map, searching Lisbon from home",
    "a wall built entirely out of painted tiles and stars",
    "the bank building flying the Portuguese flag",
    "the train pulling in, doors still red and blurred",
  ];

  it("sanity: exactly 47 live captions are checked here (48 rows minus the one breach)", () => {
    expect(liveCaptions).toHaveLength(47);
  });

  it.each(liveCaptions)("%j does not match", (text) => {
    expect(text).not.toMatch(MACHINE_SHAPED_CAPTION_PATTERN);
  });
});

describe("MACHINE_SHAPED_CAPTION_PATTERN — shipped fixture captions (must NOT match)", () => {
  // Sourced from the real export, not copied, so a future edit to the
  // fixture re-runs the same check against whatever the caption becomes.
  const fixtureCaptions = Object.values(PHOTOS)
    .map((p) => p.caption)
    .filter((c): c is string => typeof c === "string");

  it("sanity: found a non-trivial number of fixture captions", () => {
    expect(fixtureCaptions.length).toBeGreaterThan(5);
  });

  it.each(fixtureCaptions)("%j does not match", (text) => {
    expect(text).not.toMatch(MACHINE_SHAPED_CAPTION_PATTERN);
  });
});

describe("isMachineShapedCaption", () => {
  it("is the same test as the pattern, exposed as a function", () => {
    expect(isMachineShapedCaption("Same photo as 24:7:26-4.JPG at lower resolution.")).toBe(
      true,
    );
    expect(isMachineShapedCaption("the tomatoes at the market, obscene")).toBe(false);
  });

  it("empty string is not machine-shaped — it is simply not a caption", () => {
    expect(isMachineShapedCaption("")).toBe(false);
  });
});
