"""Local-only PNG inspector: reports real alpha coverage and corner-background purity.
No network. Stdlib only."""
import zlib, struct, sys, os, glob

def read_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n'
    i, idat, hdr, plte, trns = 8, b'', None, None, None
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]
        typ = d[i+4:i+8]
        data = d[i+8:i+8+ln]
        if typ == b'IHDR':
            hdr = struct.unpack('>IIBBBBB', data)
        elif typ == b'IDAT':
            idat += data
        i += 12 + ln
    w, h, depth, ctype, comp, filt, inter = hdr
    if depth != 8 or inter != 0:
        return None
    nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    bpp = nch
    stride = w * bpp
    out = bytearray(h * stride)
    prev = bytearray(stride)
    pos = 0
    for y in range(h):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos + stride]); pos += stride
        if f == 1:
            for x in range(bpp, stride):
                line[x] = (line[x] + line[x - bpp]) & 255
        elif f == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                c = prev[x - bpp] if x >= bpp else 0
                b = prev[x]
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, nch, ctype, out

for path in sorted(glob.glob(sys.argv[1])):
    r = read_png(path)
    n = os.path.basename(path)
    if not r:
        print(f"{n:34s} UNSUPPORTED"); continue
    w, h, nch, ctype, px = r
    step = max(1, w // 220)          # sample grid, keeps it fast
    if nch == 4:
        tot = clear = semi = 0
        for y in range(0, h, step):
            base = y * w * 4
            for x in range(0, w, step):
                a = px[base + x * 4 + 3]
                tot += 1
                if a < 16: clear += 1
                elif a < 240: semi += 1
        print(f"{n:34s} RGBA  transparent {100*clear/tot:5.1f}%  soft-edge {100*semi/tot:4.1f}%")
    else:
        # corner purity: is the background clean white (keyable) or tinted/gradient?
        cs = []
        for (cy, cx) in ((2, 2), (2, w - 3), (h - 3, 2), (h - 3, w - 3)):
            o = (cy * w + cx) * nch
            cs.append(tuple(px[o:o + 3]))
        mn = min(min(c) for c in cs)
        spread = max(max(c) for c in cs) - mn
        verdict = "clean-white" if mn >= 248 and spread <= 6 else ("tinted/gradient" if mn >= 200 else "DARK-BG")
        print(f"{n:34s} RGB   corners {cs[0]}..{cs[3]}  min {mn}  spread {spread}  -> {verdict}")
