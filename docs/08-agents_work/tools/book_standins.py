#!/usr/bin/env python3
"""
Mechanical stand-ins for the three Book-object assets (Wave 2).

The higgsfield MCP is not reachable from the Wave 2 worker context, so
the closed book's materials are DERIVED from the committed real stocks
rather than generated. This follows the established Wave 0 practice of
mechanical derivation (seam-tear-coldpress-tostock was tone-graded with
per-channel gains; the coldpress tile was mirror-stacked; the torn-edge
mount was a measured crop) — nothing here is drawn: every output pixel
is a real scanned-stock pixel, moved, gained, or luminance-mapped.

Outputs (all named -standin; replace when generated assets arrive):

  book-fore-edge-standin      Stacked sheet edges seen edge-on, fine
                              VERTICAL lines. Built by stacking 4-7px
                              vertical slivers sampled from different
                              columns of paper-bone-v2 (each sheet edge
                              is a different piece of real bone paper),
                              with per-sheet light: the leading column
                              lifted, the trailing column shaded — the
                              light between sheets, composited around
                              real material (the Pinned precedent).

  book-cover-burgundy-standin Bone-laid stock luminance-mapped to deep
                              burgundy bookcloth. The laid texture is
                              carried through as per-pixel luminance
                              ratio (gamma-boosted so the weave stays
                              visible at the darker value); the hue is
                              the one invented component, which is why
                              this is a stand-in and not a library
                              asset.

  book-ribbon-sage-standin    A strip of bone stock luminance-mapped to
                              sage, notch-cut at the tail (a mechanical
                              crop, like the torn-edge mount). Reads as
                              a paper-silk bookmark; gated for
                              replacement by a generated silk ribbon.

Deterministic: seeded PRNG, same output every run.
"""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "08-agents_work" / "screens" / "2026-08-04-assets"
PUBLIC = ROOT.parent / "apps" / "web" / "public" / "materials"

SEED = 20260804


def luminance_map(src: Image.Image, target: tuple[int, int, int], gamma: float) -> Image.Image:
    """Recolour real texture: out = target * (L / mean_L) ** gamma.

    Keeps every grain of the scan as a luminance ratio; only the hue is
    imposed. Done with point LUTs per channel over an L-mode copy so the
    mapping is exact and fast.
    """
    grey = src.convert("L")
    hist = grey.histogram()
    total = sum(hist)
    mean = sum(i * n for i, n in enumerate(hist)) / total

    def lut_for(channel_value: int) -> list[int]:
        out = []
        for l in range(256):
            ratio = (l / mean) if mean > 0 else 1.0
            v = channel_value * (ratio**gamma)
            out.append(max(0, min(255, round(v))))
        return out

    r = grey.point(lut_for(target[0]))
    g = grey.point(lut_for(target[1]))
    b = grey.point(lut_for(target[2]))
    return Image.merge("RGB", (r, g, b))


def flatten_toward_mean(im: Image.Image, keep: float) -> Image.Image:
    """Compress an image's variation toward its own mean colour.

    keep=1.0 leaves the texture untouched; keep=0.3 keeps 30% of the
    deviation. Used on fore-edge slivers and the ribbon strip: at
    sliver scale the stock's fibre patches read as wood grain, so the
    real texture is retained but quieted until the composited
    per-sheet light is the dominant signal — which is how an actual
    fore-edge reads (near-uniform paper, structure from the edges).
    """
    channels = im.split()
    luts = []
    for ch in channels:
        hist = ch.histogram()
        total = sum(hist)
        mean = sum(i * n for i, n in enumerate(hist)) / total
        luts.append([max(0, min(255, round(mean + (v - mean) * keep))) for v in range(256)])
    return Image.merge(im.mode, tuple(ch.point(lut) for ch, lut in zip(channels, luts)))


def gain_column(im: Image.Image, x: int, gain: float) -> None:
    """Multiply one pixel column — the light between sheet edges."""
    if x < 0 or x >= im.width:
        return
    col = im.crop((x, 0, x + 1, im.height))
    col = col.point(lambda v: max(0, min(255, round(v * gain))))
    im.paste(col, (x, 0))


def build_fore_edge() -> Image.Image:
    """2048x1024 of stacked sheet edges as fine vertical lines."""
    rng = random.Random(SEED)
    stock = Image.open(ASSETS / "paper-bone-v2.png").convert("RGB")
    # One consistent horizontal band of the scan — sheets in a block
    # were cut from the same ream, so they agree in tone.
    band = stock.crop((0, 640, stock.width, 640 + 1024))

    out = Image.new("RGB", (2048, 1024))
    x = 0
    while x < out.width:
        w = rng.randint(4, 7)
        sx = rng.randint(0, band.width - w - 1)
        sliver = band.crop((sx, 0, sx + w, 1024))
        # Quiet the fibre: at 4-7px wide the stock's warm patches read
        # as wood grain, not paper. Keep 30% of the real variation.
        sliver = flatten_toward_mean(sliver, keep=0.3)
        # Sheet-to-sheet variation: each edge caught the light or the
        # guillotine slightly differently.
        gain = rng.uniform(0.965, 1.035)
        sliver = sliver.point(lambda v, g=gain: max(0, min(255, round(v * g))))
        out.paste(sliver, (x, 0))
        # The gap: trailing column shaded, leading column of the next
        # sheet lifted. Composited light, not drawn material.
        gain_column(out, x + w - 1, 0.76)
        gain_column(out, x, 1.06)
        x += w
    return out


def build_cover() -> Image.Image:
    """Bone-laid stock as deep burgundy bookcloth, texture carried."""
    stock = Image.open(ASSETS / "paper-bone-laid.png").convert("RGB")
    # Deep burgundy bookcloth. Gamma 1.6 keeps the laid weave visible
    # at the dark value — a straight per-channel gain (the tostock
    # method) crushes sd to ~2 at this depth and reads as a fill.
    return luminance_map(stock, (114, 48, 56), gamma=1.6)


def build_ribbon() -> Image.Image:
    """220x1500 sage strip, notch-cut tail, RGBA."""
    stock = Image.open(ASSETS / "paper-bone-v2.png").convert("RGB")
    strip = stock.crop((300, 200, 300 + 220, 200 + 1500))
    strip = flatten_toward_mean(strip, keep=0.35)
    sage = luminance_map(strip, (150, 163, 133), gamma=1.1)

    rgba = sage.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    # Swallowtail notch: a mechanical triangular crop from the tail,
    # apex 110px up from the bottom on the centreline.
    notch = 110
    for y in range(h - notch, h):
        depth = (y - (h - notch)) / notch  # 0 → 1 toward the tail
        cut = round((w / 2) * depth)
        for x in range(w // 2 - cut, w // 2 + cut):
            px[x, y] = (0, 0, 0, 0)
    # Selvedge shading: 2px at each long edge, slightly shaded — the
    # roll of a woven edge catching less light.
    for edge_x, gain in ((0, 0.88), (1, 0.94), (w - 2, 0.94), (w - 1, 0.88)):
        for y in range(h):
            r, g, b, a = px[edge_x, y]
            if a:
                px[edge_x, y] = (round(r * gain), round(g * gain), round(b * gain), a)
    return rgba


def rekey_polaroid(
    source: str,
    out_size: tuple[int, int],
    window: tuple[float, float, float, float],
) -> Image.Image:
    """Re-key a polaroid frame from its raw scan, geometrically.

    Shared recipe for both frames — see rekey_polaroid_chin below for
    why value keying cannot work on these scans. `window` is the punch
    rect as fractions (x0, x1, y0, y1), inset conservatively where the
    scan is skewed: near-white outside the rect stays opaque and reads
    as frame, which is harmless; frame edge lines inside the rect are
    not near-white and survive.
    """
    import numpy as np
    from scipy import ndimage

    rgb = np.asarray(Image.open(ASSETS / source).convert("RGB")).astype(np.float32)
    h, w, _ = rgb.shape
    mn = rgb.min(axis=2)

    outline = ndimage.binary_opening(mn < 244, iterations=2)
    down = np.maximum.accumulate(outline, axis=0)
    up = np.maximum.accumulate(outline[::-1, :], axis=0)[::-1, :]
    right = np.maximum.accumulate(outline, axis=1)
    left = np.maximum.accumulate(outline[:, ::-1], axis=1)[:, ::-1]
    inside = down & up & right & left

    ys, xs = np.mgrid[0:h, 0:w]
    x0, x1, y0, y1 = window
    zone = (ys > h * y0) & (ys < h * y1) & (xs > w * x0) & (xs < w * x1)
    alpha = inside.astype(np.float32)
    alpha[(mn >= 244) & inside & zone] = 0.0

    row_run = outline.sum(axis=1)
    col_run = outline.sum(axis=0)
    long_rows = np.where(row_run > 0.5 * w)[0]
    long_cols = np.where(col_run > 0.5 * h)[0]
    alpha[: max(0, long_rows[0] - 4), :] = 0.0
    alpha[long_rows[-1] + 4 :, :] = 0.0
    alpha[:, : max(0, long_cols[0] - 4)] = 0.0
    alpha[:, long_cols[-1] + 4 :] = 0.0

    out = np.dstack([rgb, alpha[..., None] * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA").resize(out_size, Image.LANCZOS)


def rekey_polaroid_chin() -> Image.Image:
    """Re-key polaroid-frame-chin from the raw scan, geometrically.

    The shipped webp lost 79% of its chin: the chin paper measures
    min-channel p50 253 — WHITER than the background corners (mean
    244) — so no value threshold can separate frame paper from ground,
    and the border-connected flood ate the chin through any near-white
    bridge. The register bans decay, so the damage is a defect, not
    patina. Geometry (span fill + rect window punch + bbox clamp, in
    rekey_polaroid above) succeeds where value cannot; anti-aliasing
    comes from keying at scan resolution and resizing to the shipped
    size (~2.25x supersampling).
    """
    return rekey_polaroid(
        "polaroid-frame-chin.png", (795, 1024), (0.088, 0.912, 0.09, 0.752)
    )


def rekey_polaroid_empty() -> Image.Image:
    """Re-key polaroid-frame-empty — same disease, same cure.

    Its flood-keyed webp had a clean window but an eaten lower border
    (obvious in the first pair-spread capture). The raw scan is skewed
    ~2 deg, so the punch rect is inset ~1%: the skew wedges left opaque
    at the window corners are frame-cream over the print and read as
    the frame's own overlap.
    """
    return rekey_polaroid(
        "polaroid-frame-empty.png", (900, 1024), (0.115, 0.90, 0.125, 0.73)
    )


# The strip's meander inside each keyed ribbon's trim box, measured
# from dark-pixel alpha. Everything outside the band is junk by
# construction. The sage band is in POST-TRIM box fractions of the
# (never re-trimmed) shipped webp; burgundy/brass are fractions of
# key_assets.py's fresh trim boxes.
RIBBON_BANDS = {
    "book-ribbon-sage": (0.40, 0.63),
    "book-ribbon-burgundy": (0.37, 0.68),
    "book-ribbon-brass": (0.09, 0.46),
}


def clean_ribbon(path: Path, band: tuple[float, float], retrim: bool = True) -> Image.Image:
    """Post-process a KEYED real silk ribbon.

    key_assets.py leaves the backdrop's shadow scallops: their
    near-white interiors die at the WHITE threshold, but their
    OUTLINES sit just below it and survive — invisible on paper,
    obvious on midnight (the proof-sheet principle), and at 2x they
    read as pencil smudges even on paper. Three rules, each earned
    on a capture:

      band     the strip meanders inside a narrow column band
               (measured per asset from dark alpha) — everything
               outside is junk by construction
      white+grey  in the lower half, where the shadow cloud lives:
               near-white pixels (mn >= 225, the sage rule) and grey
               pixels (max-min < 30 at mn >= 160) both die. Silk
               sheen is SATURATED everywhere, even burgundy's
               highlights — value alone cannot separate silk from
               scallop outline (sheen reaches mn 209, outlines start
               near 160), saturation can.
      blobs    a ribbon is ONE connected piece — after the colour
               kills disconnect the cloud, whatever is not the main
               component is junk regardless of colour. Order matters:
               blob-dropping BEFORE the colour kills misses junk the
               semi-opaque cloud still bridges to the strip.
    """
    import numpy as np
    from scipy import ndimage

    im = Image.open(path).convert("RGBA")
    a = np.asarray(im).copy()
    h, w, _ = a.shape
    lo, hi = band
    a[:, : int(w * lo), 3] = 0
    a[:, int(w * hi) :, 3] = 0

    lower = a[int(h * 0.5) :, :, :]
    mn = lower[:, :, :3].min(axis=2).astype(int)
    mx = lower[:, :, :3].max(axis=2).astype(int)
    grey = ((mx - mn) < 30) & (mn >= 160)
    lower[:, :, 3] = np.where((mn >= 225) | grey, 0, lower[:, :, 3])

    vis = a[:, :, 3] > 8
    lbl, n = ndimage.label(vis)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
        a[:, :, 3] = np.where(lbl == int(np.argmax(sizes)) + 1, a[:, :, 3], 0)

    if retrim:
        ys, xs = np.nonzero(a[:, :, 3] > 8)
        pad = 6
        a = a[
            max(0, ys.min() - pad) : min(h, ys.max() + 1 + pad),
            max(0, xs.min() - pad) : min(w, xs.max() + 1 + pad),
        ]
    return Image.fromarray(a, "RGBA")


def clean_shipped_ribbon() -> None:
    """Rebuild the SHIPPED ribbon (book-ribbon.webp, burgundy silk)
    from its keyed master. The web derivative in ASSETS/web and the
    shipped file are the same pixels at <=1024.

    Expects the keyed master FRESH from key_assets.py — the band
    fractions are measured on ITS trim box. clean_ribbon re-trims, so
    running this twice over the same master would clear the band
    against the wrong box and eat the strip. To reproduce from
    scratch: key_assets.py 'book-ribbon-burgundy.png' first, then
    this.

    The filename carries no colour on purpose: the shipped teal spent
    a wave named "sage", and a name that says one colour while
    shipping another is the stale-migration-header defect wearing a
    different hat. Rejected colourways (sage/teal, brass) stay in
    ASSETS under their colour names.
    """
    cleaned = clean_ribbon(
        ASSETS / "keyed" / "book-ribbon-burgundy.png",
        RIBBON_BANDS["book-ribbon-burgundy"],
    )
    tw, th = cleaned.size
    scale = min(1.0, 1024 / max(tw, th))
    web = (
        cleaned.resize((round(tw * scale), round(th * scale)), Image.LANCZOS)
        if scale < 1.0
        else cleaned
    )
    web.save(ASSETS / "web" / "book-ribbon-burgundy.webp", quality=90, method=6)
    web.save(PUBLIC / "book-ribbon.webp", quality=90, method=6)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    # The fore-edge stand-in is the one derivative that SHIPS: judged
    # against the generated book-fore-edge asset in situ, the standin's
    # fine even pitch reads as hundreds of pages where the generated
    # lines read as a handful of thick sheets. The cover and ribbon
    # stand-ins lost the same comparison and stay in ASSETS as record
    # only — the real cloth and silk assets ship instead.
    fore = build_fore_edge()
    fore.save(ASSETS / "book-fore-edge-standin.png")
    fore.save(PUBLIC / "book-fore-edge-standin.webp", quality=90)

    cover = build_cover()
    cover.save(ASSETS / "book-cover-burgundy-standin.png")

    ribbon = build_ribbon()
    ribbon.save(ASSETS / "book-ribbon-sage-standin.png")

    chin = rekey_polaroid_chin()
    chin.save(PUBLIC / "polaroid-frame-chin.webp", quality=92)

    empty = rekey_polaroid_empty()
    empty.save(PUBLIC / "polaroid-frame-empty.webp", quality=92)

    for name in ("book-fore-edge-standin.webp", "polaroid-frame-chin.webp"):
        p = PUBLIC / name
        print(f"{name}: {p.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
