# Photo pipeline fixtures

## `iphone-gps.heic` — 73,583 bytes

A **real** HEIC written by Apple's ImageIO from a real iPhone camera-roll
original (`IMG_4546.HEIC`, iPhone, 2026-05-09). It is the fixture the
EXIF-strip assertion runs against, and it is real on every axis the assertion
depends on:

| | |
|---|---|
| Container | genuine ISOBMFF/HEIF, `ftyp` brand `heic`, `meta` → `iinf` → `iloc` |
| Exif item | genuine, Apple-authored, at item offset 1249 |
| IFD0 | 13 tags including `Make`, `Model`, `Software`, `Orientation` |
| ExifIFD | 34 tags including `MakerNote` (0x927c), `DateTimeOriginal` (0x9003) = `2026:05:09 18:34:05`, `OffsetTimeOriginal` (0x9011) = `+03:00` |
| **GPS IFD** | **15 tags** — `GPSLatitudeRef`, `GPSLatitude`, `GPSLongitudeRef`, `GPSLongitude`, altitude, timestamp, speed, bearing, datestamp, horizontal positioning error |

### Two deliberate departures from the camera-roll original, both stated

**1. Downscaled to 640 px long edge** (`sips -Z 640`), 1,025,211 → 73,583 bytes.
Apple's own ImageIO did the re-encode, so the Exif block is still
Apple-authored — this is not a third-party rewrite. A 1 MB binary in git for
every clone, forever, to prove the same thing a 73 KB one proves, is a cost
with no return.

**2. The GPS coordinates are synthetic. The GPS IFD is not.**

The original carried the founder's actual position to roughly a metre. The
entire point of this pipeline is that those numbers never leave the device;
committing them to a repository that will be pushed to GitHub would be that
exact leak, performed by the test that exists to prevent it.

So three tags were rewritten **in place, at their original offsets, at their
original byte widths** — nothing moved, nothing was re-serialised, every other
byte of the file is what the iPhone wrote:

| Tag | Was | Is |
|---|---|---|
| `GPSLatitude` (0x0002) | *(the founder's latitude)* | `1/1 2/1 300/100` → 1°2′3″ N |
| `GPSLongitude` (0x0004) | *(the founder's longitude)* | `4/1 5/1 600/100` → 4°5′6″ E |
| `GPSAltitude` (0x0006) | *(a real altitude)* | `0/1` |

1°2′3″ N 4°5′6″ E is in the Gulf of Guinea, several hundred kilometres from
land. No photograph was taken there. The value is chosen to be unmistakable
in a diff and impossible to mistake for evidence of anything.

**This substitution does not weaken the assertion.** The test proves a
structure is destroyed, not that particular integers are. The structure — HEIF
Exif item, TIFF header, IFD0, the 0x8825 pointer, a fully populated GPS IFD,
Apple's MakerNote — is byte-identical to what came off the phone. What the
test would be unable to detect is a pipeline that stripped *these* coordinates
while passing others through, and no such pipeline is expressible: the strip is
a re-encode that emits no APP1 segment at all.

### Regenerating

The scrub is three `DataView.setUint32` writes at offsets found by walking the
IFD chain. `lib/photo/exif.ts` already contains every parser needed to locate
them; the procedure is recorded in
`docs/08-agents_work/sessions/2026-08-02-frontend-engineer-t4-pipeline.md`.
