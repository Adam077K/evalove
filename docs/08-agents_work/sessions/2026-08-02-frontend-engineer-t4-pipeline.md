---
date: 2026-08-02
role: frontend-engineer
task: P1-T4 — client photo pipeline + batch upload
branch: feat/t4-photo-pipeline
tier: full
qa_verdict: PENDING
---

# Session Log: frontend-engineer — P1-T4 client photo pipeline

**Status:** Complete, with two contract gaps flagged for the `/api/photos/*` agent.

---

## What was done

- **`lib/photo/`** — EXIF reading (real ISOBMFF + TIFF parsing, not a magic-string
  scan), a runtime metadata guard, the browser codec with lazy HEIC fallback and
  P3/sRGB negotiation, the ordered `preparePhoto` pipeline, SHA-256 over the
  stored bytes, the wi-fi heuristic, and the picker-format probe.
- **`lib/outbox/`** — blobs in OPFS, records in IndexedDB, `enqueueAll` durable
  before any network call, sequential decode, upload concurrency 2, just-in-time
  signed URLs in chunks of 5, jittered backoff with five automatic attempts and
  no terminal state, and the deferred wi-fi-only originals pass.
- **The two gate tests.** A real GPS-tagged iPhone HEIC through the pipeline with
  the **output bytes parsed** for APP1/EXIF and a GPS IFD, and a 30-item batch
  with the connection dropped mid-run that loses zero items.
- 196 vitest tests pass (was 146 at task start). `tsc --noEmit` clean.
  `next build` exits 0.

## The GPS assertion, and exactly what it does and does not prove

`docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.3 calls this the single
highest-value assertion in the suite. It is built as a four-step argument
because any one step alone would be worth very little.

1. **The input really carries GPS.** `lib/photo/__tests__/exif.test.ts` walks the
   real HEIF container — `ftyp` → `meta` → `iinf` (item type `Exif`) → `iloc`
   extent → TIFF header → IFD chain — and asserts `ifds == [IFD0, ExifIFD, GPS]`
   with ≥15 GPS tags including `0x0002`/`0x0004`. A strip test that never proved
   the thing was there passes just as green against a blank file.
2. **The detector is not a rubber stamp.** A negative control builds a genuine
   JPEG around the fixture's *own* Apple Exif payload and asserts the parser
   finds the GPS IFD in it and the guard refuses it.
3. **The output is parsed.** Segment walk (no APP1), container parse
   (`findExifBlock` returns null), and three independent raw byte scans for
   `Exif\0\0`, `II*\0` and `MM\0*`.
4. **The realistic regression is caught.** A codec that forwards the source
   bytes instead of re-encoding — the plausible "it's already a JPEG, skip the
   re-encode" optimisation — makes `preparePhoto` throw `MetadataPresentError`.

**What it does not prove:** that a *browser's* canvas emits no EXIF. Node has no
canvas, so the vitest harness supplies a real baseline JPEG encoder
(`__tests__/support/jpeg-encoder.ts` — SOI/DQT/SOF0/DHT/SOS/EOI, byte-stuffed
entropy data; `file(1)` and Apple's `sips` both read its output as valid
baseline JPEG at the right dimensions). The harness models the canvas contract,
it is not the canvas. **A Playwright spec running `preparePhoto` against a real
`OffscreenCanvas` in WebKit is the missing complement and is not yet written.**

The strip is also enforced at runtime, not only in tests: `assertNoMetadata`
runs on every derivative inside `preparePhoto`, before the outbox can hand
anything to the network.

## The fixture, and why its coordinates are synthetic

`lib/photo/__fixtures__/iphone-gps.heic` (73,583 bytes) is a real Apple HEIC
from a real iPhone camera-roll original (`IMG_4546.HEIC`, 2026-05-09) —
genuine ISOBMFF container, genuine Apple-authored Exif item, 34-tag ExifIFD
including MakerNote, full 15-tag GPS IFD, `DateTimeOriginal 2026:05:09 18:34:05`
with `OffsetTimeOriginal +03:00`.

Two departures from the camera-roll original, both deliberate:

1. **Downscaled to 640 px** with `sips -Z 640` (1,025,211 → 73,583 bytes). Apple's
   own ImageIO did the re-encode, so the Exif block is still Apple-authored.
2. **Three GPS tags rewritten in place**, at their original offsets and byte
   widths, nothing moved: `GPSLatitude` → `1/1 2/1 300/100`, `GPSLongitude` →
   `4/1 5/1 600/100`, `GPSAltitude` → `0/1`.

The original carried the founder's actual position to about a metre. The entire
point of this pipeline is that those numbers never leave the device; committing
them to a repository that will be pushed to GitHub would be that exact leak,
performed by the test that exists to prevent it. The substitution does not
weaken the assertion — the test proves a *structure* is destroyed, and the
structure is byte-identical to what came off the phone.

Full provenance in `lib/photo/__fixtures__/README.md`.

## Files changed

| File | Change |
|------|--------|
| `apps/web/lib/photo/exif.ts` | ISOBMFF + TIFF parsing; DateTimeOriginal, offset, GPS |
| `apps/web/lib/photo/guard.ts` | Runtime refusal of any derivative carrying metadata |
| `apps/web/lib/photo/codec.ts` | Browser codec; lazy `heic2any`; P3 attempted, sRGB fallback |
| `apps/web/lib/photo/prepare.ts` | The ordered pipeline; `close()` in a `finally` |
| `apps/web/lib/photo/checksum.ts` | SHA-256 over the stored derivative, not the source |
| `apps/web/lib/photo/network.ts` | Wi-fi heuristic; `NO_BACKGROUND_SYNC_NOTICE` |
| `apps/web/lib/photo/probe.ts` | Picker-format probe, by magic number |
| `apps/web/lib/photo/types.ts`, `index.ts` | Codec seam; accepted losses in writing |
| `apps/web/lib/outbox/store.ts` | `enqueueAll` — durable before any network call |
| `apps/web/lib/outbox/blobs.ts` | OPFS, both write paths, `storage.persist()` |
| `apps/web/lib/outbox/records.ts` | IndexedDB via `idb` |
| `apps/web/lib/outbox/uploader.ts` | Sequential decode, pool of 2, JIT tickets in 5s |
| `apps/web/lib/outbox/backoff.ts` | Full jitter, 5 attempts, then stays queued |
| `apps/web/lib/outbox/originals.ts` | Deferred wi-fi-only originals |
| `apps/web/lib/outbox/transport.ts` | The three route calls behind one interface |
| `apps/web/lib/photo/__fixtures__/` | The HEIC fixture and its provenance |
| `apps/web/lib/photo/__tests__/`, `lib/outbox/__tests__/` | 50 new tests |

## Decisions made

| Key | Decision | Why |
|---|---|---|
| `t4_fixture_gps_scrubbed` | Real Apple HEIC, real GPS IFD, synthetic coordinates | Committing real home coordinates to git is the leak the test prevents. Structure is what the assertion reads, and the structure is untouched. |
| `t4_runtime_strip_guard` | `assertNoMetadata` runs in production, not only in tests | The regression is somebody adding a "skip the re-encode" fast path. A test catches that when someone runs it; a guard catches it on the device. |
| `t4_codec_seam` | `ImageCodec` interface; browser impl separate from `prepare.ts` | Lets the *ordering* guarantees be tested in Node, and lets a deliberately-cheating codec prove the pipeline refuses it. |
| `t4_no_offset_no_instant` | No `OffsetTimeOriginal` → `takenAt` is left absent | Assuming the uploader's zone mis-files a backlog photograph taken in the other country. Wrong dates are silent forever. |
| `t4_enqueue_blob_before_record` | Blob to disk first, then the record | An interrupted enqueue leaves orphan bytes (collectable, file still in the camera roll) rather than a queue row that can never finish. `enqueueAll` returns `requested` vs `records` vs `rejected` so a short batch cannot read as a whole one. |
| `t4_originals_default_hold` | Unknown connection → do not send originals | iOS Safari exposes no `navigator.connection`, so "unknown" is the normal case, not the edge case. |
| `t4_fresh_ticket_per_attempt` | Each upload attempt takes a new signed URL | The contract has no way to re-sign for an existing `photoId` and the TTL is 2 minutes. See gap 1 below. |
| `t4_no_background_sync_copy` | `NO_BACKGROUND_SYNC_NOTICE` must appear wherever a queued item is shown | iOS has no Background Sync. Implying otherwise is a lie discovered days later. |

## Contract gaps for the `/api/photos/*` agent

Neither blocks this task; both need a route change before the originals path
and the retry path are fully correct in production.

1. **`POST /api/photos/upload-url` cannot re-sign for an existing `photoId`.**
   URLs carry a 2-minute TTL, so every retry must take a fresh ticket and
   therefore a fresh `photoId`. No correctness problem — commit is idempotent on
   `clientUuid` and no row exists until commit — but each retry orphans a pair
   of storage objects. Suggest an optional `photoId` on the request.
2. **There is no route for the deferred original of an already-committed
   photo.** `lib/outbox/originals.ts` codes against a narrow
   `OriginalTransport` (`requestOriginalUrl` / `putObject` /
   `confirmOriginal`) so the shape is written down; the HTTP implementation is
   not written because the route does not exist yet.

## Still open

- **Playwright spec** running the pipeline against a real WebKit canvas — the
  one thing the vitest suite structurally cannot cover. Owned by T12, but the
  photo-specific case should not wait for the rest of that task.
- **Picker-format probe has not been run on the real devices.** `lib/photo/probe.ts`
  ships; §5.2 asks for the measured result from Eva's and Adam's phones on both
  the Photos path and the Files path. That is a two-minute manual step and its
  output belongs in this file.
- **UI wiring.** The engine exposes `OutboxRecord`, which is a superset of the
  `OutboxItem` the design layer's fixtures already model, plus `summarise()` for
  the "27 of 30 uploaded · 3 waiting to retry" line. No batch screen exists yet
  to wire into; `components/send/QuickSend.tsx` still holds its own local mock
  state. Deliberately not redesigned.
