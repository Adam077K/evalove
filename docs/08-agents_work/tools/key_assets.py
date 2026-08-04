"""Turn generated white-ground assets into trimmed RGBA materials.

Why not the law's `alpha = 1 - L/255`: that formula is correct only for the
black-on-white city silhouettes. Applied to a white daisy, baby's breath, a
cream ticket or a white polaroid frame it deletes the subject, because those
are light objects on a light ground. Global luminance keying cannot tell a
white petal from white paper.

What this does instead:
  1. mark near-white pixels
  2. keep only the near-white region CONNECTED TO THE IMAGE BORDER  <- the fix
  3. soft-edge that boundary from colour distance, and unpremultiply the
     white the model composited into the anti-aliased pixels
  4. trim to the alpha bounding box
  5. write a full-res RGBA master and a web-sized derivative

Alpha is carried in 0..1 throughout and scaled to 0..255 exactly once, at the
point of writing. An earlier version mixed the two scales and keyed every
asset to nothing.

Local only. No network.

usage: python3 key_assets.py <glob> <out_dir> [--web-max 1024]
"""
import sys, os, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage

WHITE = 244          # min-channel at or above this counts as "paper white"
SOLID = 40           # this far below WHITE counts as fully opaque subject
FEATHER = 3          # px band around the background boundary that gets soft alpha
PAD = 6              # px of transparent margin kept after trimming
PUNCH = 0.0          # enclosed near-white components >= this frac become holes
DESPECKLE = 0.05     # border-touching subject blobs < this frac of the main blob go


def key_one(path, out_dir, web_max):
    name = os.path.splitext(os.path.basename(path))[0]
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    h, w, _ = rgb.shape
    mn = rgb.min(axis=2)

    # 1 + 2 — background is near-white AND reachable from the border
    near_white = mn >= WHITE
    lbl, _ = ndimage.label(near_white)
    border = np.concatenate([lbl[0, :], lbl[-1, :], lbl[:, 0], lbl[:, -1]])
    bg_labels = [v for v in np.unique(border) if v != 0]
    bg = np.isin(lbl, bg_labels) if bg_labels else np.zeros_like(near_white)

    # PUNCH: a large near-white region fully enclosed by the subject is a hole,
    # not subject — the window of a polaroid frame, the centre of a ring. Border
    # connectivity alone keeps it opaque, which makes the mount unusable.
    if PUNCH > 0:
        for v in np.unique(lbl):
            if v == 0 or v in bg_labels:
                continue
            comp = lbl == v
            if comp.mean() >= PUNCH:
                bg |= comp

    # DESPECKLE: models leave dark junk along the source frame edge — a ragged
    # strip under the star, black rims on the polaroids, thin bars beside the
    # rose. Real subject sits inboard with a margin, so drop subject components
    # that BOTH touch the border AND are small next to the main blob. Size
    # alone would eat the separate sprigs of lavender and baby's breath.
    if DESPECKLE > 0:
        sub_lbl, _ = ndimage.label(~bg)
        if sub_lbl.max() > 1:
            sizes = ndimage.sum(np.ones_like(sub_lbl), sub_lbl,
                                range(1, sub_lbl.max() + 1))
            biggest = sizes.max()
            edge = set(np.unique(np.concatenate([
                sub_lbl[0, :], sub_lbl[-1, :], sub_lbl[:, 0], sub_lbl[:, -1]])))
            for i, sz in enumerate(sizes, start=1):
                if i in edge and sz < DESPECKLE * biggest:
                    bg |= (sub_lbl == i)

    bg_frac = float(bg.mean())
    if bg_frac < 0.005:
        return {"name": name, "action": "left opaque (full-bleed)",
                "bg_frac": round(bg_frac, 4), "size": [w, h], "flag": None}

    # alpha in 0..1 for the whole of this function
    a = np.where(bg, 0.0, 1.0)

    # 3 — soft edge only in a narrow band just inside the subject
    dist = ndimage.distance_transform_edt(~bg)
    band = (dist > 0) & (dist <= FEATHER)
    cov = np.clip((WHITE - mn) / float(SOLID), 0.0, 1.0)
    a[band] = cov[band]

    # unpremultiply the white blended into partially-covered pixels
    out = rgb.copy()
    a3 = a[..., None]
    partial = (a > 0.0) & (a < 1.0)
    with np.errstate(divide='ignore', invalid='ignore'):
        un = (rgb - 255.0 * (1.0 - a3)) / np.where(a3 == 0.0, 1.0, a3)
    out[partial] = np.clip(un[partial], 0.0, 255.0)

    alpha255 = np.clip(a * 255.0, 0, 255)          # <- the single scale point
    rgba = np.dstack([np.clip(out, 0, 255), alpha255]).astype(np.uint8)

    # 4 — trim
    ys, xs = np.nonzero(alpha255 > 8)
    if len(ys) == 0:
        return {"name": name, "action": "SKIPPED — keyed to nothing",
                "bg_frac": round(bg_frac, 4), "size": [w, h], "flag": "EMPTY"}
    y0, y1 = max(0, ys.min() - PAD), min(h, ys.max() + 1 + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(w, xs.max() + 1 + PAD)
    rgba = rgba[y0:y1, x0:x1]
    th, tw = rgba.shape[1], rgba.shape[0]
    tw, th = rgba.shape[1], rgba.shape[0]

    # 5 — write master + web derivative
    img = Image.fromarray(rgba, 'RGBA')
    os.makedirs(os.path.join(out_dir, 'keyed'), exist_ok=True)
    os.makedirs(os.path.join(out_dir, 'web'), exist_ok=True)
    img.save(os.path.join(out_dir, 'keyed', name + '.png'), optimize=True)

    scale = min(1.0, web_max / float(max(tw, th)))
    web = img.resize((max(1, round(tw * scale)), max(1, round(th * scale))),
                     Image.LANCZOS) if scale < 1.0 else img
    web.save(os.path.join(out_dir, 'web', name + '.webp'), quality=90, method=6)

    kept = float((alpha255 > 8).mean())
    soft = float(((alpha255 > 8) & (alpha255 < 247)).sum())
    flag = None
    if kept < 0.02:
        flag = "almost nothing survived — inspect"
    elif soft == 0:
        flag = "no soft edge — will look cut out"
    return {"name": name, "action": "keyed", "bg_frac": round(bg_frac, 3),
            "kept_frac": round(kept, 3), "size": [w, h], "trimmed": [tw, th],
            "web": list(web.size), "flag": flag}


# Per-asset overrides. Keyed by filename stem. These are not taste — each one
# is a measured property of what the model actually returned, so the run is
# reproducible instead of hand-tuned each time.
#
#   white      background sits below the default 244 (ticket ~236, disco ball
#              on a grey gradient, rose flanked by pale bars)
#   punch      enclosed near-white regions are holes, not subject — the
#              polaroid apertures
#   skip       full-bleed stock: it IS the background, nothing to key
OVERRIDES = {
    'paper-bone-laid':         {'skip': True},
    'paper-bone-v2':           {'skip': True},
    'sticker-ticket-cinema':   {'white': 230},
    'sticker-discoball':       {'white': 230},
    'sticker-daisy-pressed':   {'white': 230},
    'sticker-rose-red-pressed': {'white': 232},
    'polaroid-frame-empty':    {'punch': 0.02},
    'polaroid-frame-chin':     {'punch': 0.02},
}

# Superseded by a later generation — kept as source, never keyed into the library.
RETIRED = {'pushpin-brass', 'sunflower-recraft'}


def run(pattern, out_dir, web_max):
    base = dict(WHITE=WHITE, PUNCH=PUNCH, DESPECKLE=DESPECKLE)
    report = []
    for p in sorted(glob.glob(pattern)):
        stem = os.path.splitext(os.path.basename(p))[0]
        if stem in RETIRED:
            report.append({"name": stem, "action": "retired (superseded)",
                           "bg_frac": 0.0, "flag": None})
            continue
        ov = OVERRIDES.get(stem, {})
        if ov.get('skip'):
            report.append({"name": stem, "action": "full-bleed stock, not keyed",
                           "bg_frac": 0.0, "flag": None})
            continue
        globals()['WHITE'] = ov.get('white', base['WHITE'])
        globals()['PUNCH'] = ov.get('punch', base['PUNCH'])
        globals()['DESPECKLE'] = ov.get('despeckle', base['DESPECKLE'])
        report.append(key_one(p, out_dir, web_max))
    globals().update(base)
    return report


if __name__ == '__main__':
    pattern, out_dir = sys.argv[1], sys.argv[2]
    web_max = 1024
    if '--web-max' in sys.argv:
        web_max = int(sys.argv[sys.argv.index('--web-max') + 1])
    report = run(pattern, out_dir, web_max)
    for r in report:
        flag = f"   <-- {r['flag']}" if r.get('flag') else ""
        tr = (f" trim {r['trimmed'][0]}x{r['trimmed'][1]} kept {r['kept_frac']}"
              if 'trimmed' in r else "")
        print(f"{r['name']:34s} {r['action']:26s} bg {r['bg_frac']:<6}{tr}{flag}")
    with open(os.path.join(out_dir, 'keying-report.json'), 'w') as f:
        json.dump(report, f, indent=2)
