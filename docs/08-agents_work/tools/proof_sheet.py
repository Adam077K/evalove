"""Composite every keyed asset over both grounds so bad alpha is visible.

A white fringe is invisible on paper and obvious on midnight. Half of each
cell is `--night-sky` and half is `--canvas-base`, so one look catches halos,
hard cut-outs and leftover background.

usage: python3 proof_sheet.py <keyed_dir> <out.png> [cell]
"""
import sys, os, glob
from PIL import Image, ImageDraw

NIGHT = (13, 18, 32)      # --night-sky   #0D1220
PAPER = (248, 245, 241)   # --canvas-base #F8F5F1
COLS = 5


def main(src, out, cell=260):
    files = sorted(glob.glob(os.path.join(src, '*.png')))
    if not files:
        print('no keyed assets found'); return
    rows = (len(files) + COLS - 1) // COLS
    label = 18
    sheet = Image.new('RGB', (COLS * cell, rows * (cell + label)), (70, 70, 74))
    d = ImageDraw.Draw(sheet)

    for i, f in enumerate(files):
        cx, cy = (i % COLS) * cell, (i // COLS) * (cell + label)
        tile = Image.new('RGB', (cell, cell), NIGHT)
        tile.paste(Image.new('RGB', (cell // 2, cell), PAPER), (cell // 2, 0))

        im = Image.open(f).convert('RGBA')
        im.thumbnail((cell - 24, cell - 24), Image.LANCZOS)
        tile.paste(im, ((cell - im.width) // 2, (cell - im.height) // 2), im)

        sheet.paste(tile, (cx, cy))
        d.text((cx + 4, cy + cell + 3),
               os.path.splitext(os.path.basename(f))[0][:38], fill=(235, 235, 235))

    sheet.save(out)
    print(f'{len(files)} assets -> {out}  ({sheet.width}x{sheet.height})')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 260)
