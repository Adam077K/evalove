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


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    fore = build_fore_edge()
    fore.save(ASSETS / "book-fore-edge-standin.png")
    fore.save(PUBLIC / "book-fore-edge-standin.webp", quality=90)

    cover = build_cover()
    cover.save(ASSETS / "book-cover-burgundy-standin.png")
    cover.save(PUBLIC / "book-cover-burgundy-standin.webp", quality=88)

    ribbon = build_ribbon()
    ribbon.save(ASSETS / "book-ribbon-sage-standin.png")
    ribbon.save(PUBLIC / "book-ribbon-sage-standin.webp", quality=90)

    for name in (
        "book-fore-edge-standin.webp",
        "book-cover-burgundy-standin.webp",
        "book-ribbon-sage-standin.webp",
    ):
        p = PUBLIC / name
        print(f"{name}: {p.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
