# Leaf-shape crop findings — 2026-08-10

## Which crop ships (React)?

`Polaroid.tsx` uses `aspectRatio: "795 / 1024"` (portrait) for every frame.
The photo is `position:absolute` inside the window (`left:9.56%, top:9.77%, width:81.05%,
height:65.53%`) with `object-cover`.  
**Result: landscape photos are cropped.**  
The 8 landscape photos in the fixture set (e.g. `seed-eva-2` 1200×900, `seed-adam-1` 1200×900,
`d0731-eva` 1200×900) have their top and bottom cropped by ~24 % each when they land in a
chin or square Polaroid frame.

The mock (`design-H.html` line 717) uses a fixed `height:196px` on the window, cropping
portrait photos. Both are real. Neither is the product.

## Can React clip the handwritten chin sentence?

**No.** There is no `overflow-hidden` anywhere between the Polaroid and the page root:

- `BookSheet.tsx` line 24 comment: *"so no overflow-hidden here, ever."*
  Confirmed in the component: `<div className={cn("relative", className)}>` — no overflow class.
- `Mounted.tsx`: only `position: relative` in `baseStyle`, no overflow.
- `Spread.tsx`: `<section className="relative">` and plain `<div>` wrappers — no overflow.
- The chin div itself: `absolute inset-x-[11%] top-[77.5%] bottom-[4%]` — absolute children
  overflow the positioned parent freely when that parent has no overflow constraint.

**Consequence for this task:** the chin-clipping failure is mock-only.
The task does NOT shrink — it still needs the frame AR change and the min-height floor —
but the test can assert on height (adequate room for text) rather than overflow clipping.
