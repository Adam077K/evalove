---
date: 2026-08-04
status: LOCKED — Phase 0b spec
from: design-lead
to: product-designer, image-generation agent, frontend-engineer
companion: 2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md
authority: Every value in this document derives from the design law. Deviations require design-lead approval.
---

# Style Bible — Eva & Adam Asset Generation

## Purpose and the problem it solves

The founder authorised asset generation without limit. The constraint is not volume. It is **incoherence** — assets from many prompts look like assets from many prompts. This document ensures every asset in the scrapbook and deco city looks as if it came from one hand.

**How to use it:** For each family, the style prompt is copy-paste-ready. Copy it verbatim, append only what the individual entry specifies, and keep the seed constant. Changing the prompt between runs of the same family breaks coherence.

## Two rules carried from the design law, stated here for the generation agent

1. **The sunflower is Eva's motif and it is generated first, in isolation, before any other sticker.** Not as item 1 of a batch. It has a named owner. If the sunflower is wrong, everything that references "Eva's botanical motif" is wrong too.

2. **Deco city plates ship as separate PNG layers — sky, far skyline, mid skyline, near buildings, foreground — never as a single flattened image.** A single flattened cityscape, however beautiful, is a failed deliverable. The sky tone and window lights must be driveable at runtime.

3. **The Sorriso New York reference (halftone restaurant image, `Screenshot 2026-08-04 at 7.39.32 AM.png`) is not part of the city illustration brief.** It is parked for possible future use against the cassette or record feature. Do not put it in any generation prompt for the deco city plates.

---

## Family 1 — Paper Stocks (8 variants)

### What they are

Seamlessly tileable texture images. They are not flat CSS fills — they are the material beneath every object in the scrapbook. They tile behind the composition and give the ground its fibre, weight, and warmth.

### Reference images

`Screenshot 2026-08-04 at 7.47.24 AM.png` (Figma scrapbook album: kraft paper and white page textures)
`Screenshot 2026-08-04 at 7.47.15 AM.png` (open scrapbook spread with visible paper texture under compositions)
All scrapbook references as secondary references for colour temperature and grain density.

### Base style prompt (copy verbatim, modify only `[STOCK_DESCRIPTOR]`)

```
Ultra-high-resolution scan of [STOCK_DESCRIPTOR], flat lay, perfectly even studio lighting from upper left at 15 degrees angle, macro detail visible, natural paper fibre and grain texture, warm tone, no vignette, no shadow, seamlessly tileable, photorealistic scan quality, 8K, no digital artifacts, no ruled lines unless specified
```

### The 8 variants

| # | Name | `[STOCK_DESCRIPTOR]` to insert | Seed |
|---|---|---|---|
| 1 | Bone writing paper | a single sheet of high-quality cream writing paper, warm white, subtle horizontal grain, fine smooth texture | 42 |
| 2 | Kraft | a sheet of natural kraft paper, warm amber-brown, rough visible fibre, slightly coarse texture, corrugated paper quality | 7 |
| 3 | Ledger | a sheet of vintage ledger paper, pale warm grey, faint horizontal blue-grey ruled lines at 22px equivalent spacing, aged paper feel | 19 |
| 4 | Graph | a sheet of graph paper on warm cream stock, pale warm grey grid lines forming 5mm squares, warm cream background | 31 |
| 5 | Vellum | a sheet of translucent vellum paper, semi-transparent, very fine smooth texture, near-white warm tone, slight translucency showing through | 88 |
| 6 | Newsprint | a sheet of aged newsprint, warm grey-beige, coarser grain, slightly rough texture, slightly yellowed at edges | 55 |
| 7 | Cold-press watercolour | a sheet of cold-press watercolour paper, off-white, slightly dimpled surface texture, heavier weight paper feel, small surface irregularities | 23 |
| 8 | Onion-skin | a sheet of onion-skin typing paper, very thin, near-transparent, delicate texture, pale warm cream, very fine grain | 14 |

### Output spec

- Format: PNG, 1024×1024, sRGB
- Seamlessly tileable on all four edges
- No baked shadows (shadows are applied by the physics engine at runtime)
- The vellum and onion-skin variants must have partial transparency at their edges to enable layering effects in the composition system

### What "wrong" looks like — reject on sight

- **Too smooth:** looks like plastic or a flat CSS fill, not paper. If you cannot see grain at 1:1 pixel density, regenerate.
- **Blue-tinted:** any stock that reads as cool or grey-blue fails. All 8 must read as warm.
- **Uniform colour with no variation:** real paper has slight tonal variation across the sheet. A perfectly flat single colour is a CSS fill wearing a texture costume.
- **Baked-in dramatic shadow:** no vignette, no drop shadow, no edge darkening. The physics engine applies shadows at runtime.
- **Not seamlessly tileable:** test by placing two copies side by side. Visible seam → regenerate.

---

## Family 2 — Washi Tape (12 patterns)

### What they are

Strip assets — a length of washi tape that the composition system places at any angle, bridging objects or anchoring them to the surface. Each strip is an individual PNG with transparency outside the tape body.

### Reference images

`IMG_8121.jpg` (washi tape strip visible on note paper)
`Screenshot 2026-08-04 at 7.47.24 AM.png` (washi tape visible attaching polaroid in the upper area)
`Screenshot 2026-08-04 at 7.47.15 AM.png` (tape used to attach sticker)

### Base style prompt (copy verbatim, modify only `[TAPE_DESCRIPTOR]`)

```
Close-up product photography of a single strip of Japanese washi tape, 3cm wide by 14cm long, placed diagonally on pure white background, [TAPE_DESCRIPTOR], natural paper fibre visible through the translucent tape body, semi-transparent (65–75% opacity), warm studio lighting from upper left, slight transparency showing white background through tape material, slightly irregular natural edges (not die-cut clean), photorealistic macro detail, isolated on transparent background, no shadow
```

### The 12 patterns

| # | Name | `[TAPE_DESCRIPTOR]` to insert | Seed |
|---|---|---|---|
| 1 | Narrow stripe — cream | thin parallel stripes in warm cream and off-white, barely visible contrast, nearly solid cream | 101 |
| 2 | Narrow stripe — sage | thin parallel stripes in sage green and warm cream, 2mm stripes | 102 |
| 3 | Narrow stripe — blush | thin parallel stripes in pale blush pink and warm cream | 103 |
| 4 | Houndstooth — warm | small houndstooth pattern in warm brown and cream | 104 |
| 5 | Chevron — gold | chevron pattern in aged gold and warm cream | 105 |
| 6 | Kraft solid | nearly solid warm amber-brown, matching kraft paper texture, minimal pattern | 106 |
| 7 | Small floral — pressed | tiny pressed botanical flowers in muted pink and green on cream | 107 |
| 8 | Small floral — blue | tiny pressed flower pattern in dusty blue on cream | 108 |
| 9 | Botanical — leaf | small leaf and vine pattern in warm green on cream | 109 |
| 10 | Botanical — branch | thin branch and berry pattern in warm brown on cream | 110 |
| 11 | Colour-field — sage | solid sage green field, paper texture visible | 111 |
| 12 | Scallop border | scallop edge border pattern in white on translucent cream, border runs along one long edge of the tape | 112 |

### Output spec

- Format: PNG with transparency, 200×640px (the tape occupies the full width; the transparent zone is outside the tape body)
- The tape itself is semi-transparent (65–75%): the composition system applies it over a surface and the surface shows through
- Both short ends have a natural torn or slightly rough cut quality — not a geometrically clean cut
- Edges along the long sides are slightly irregular — ±1–2px variation, not straight

### What "wrong" looks like — reject on sight

- **Opaque:** washi tape is always translucent. If you cannot see white background through the tape body, it is wrong.
- **Die-cut clean edges:** real washi has slight natural edge variation. Perfectly straight long edges are wrong.
- **Oversaturated pattern:** patterns should be muted enough that they do not compete with photographs. If the tape draws your eye more than a photo beside it, the saturation is too high.
- **No fibre texture:** the tape body must show the paper fibre structure, not a flat colour.
- **Wrong proportions:** tape should read as a strip, approximately 4:1 length:width ratio or longer. If it looks like a sticker, regenerate.

---

## Family 3 — Mounts

### 3a — Polaroid frames (3 variants)

**What they are:** The frame only, as a PNG — the photograph is composited inside the transparent window at runtime. The frame itself is rendered; the image area is transparent.

**Reference images:** `IMG_8120.jpg` (polaroid scatter — classic proportions visible), `IMG_8124.jpg` (polaroids in upper right), `Screenshot 2026-08-04 at 7.48.58 AM.png` (polaroids inside book with visible border weight)

**Style prompt:**
```
Product photography of a single Polaroid photo frame, white thick paper border, flat lay on white background, viewing window cut out and transparent, thick bottom border (approximately 3× the top and side border width), authentic Polaroid proportions, slightly warm white paper, very subtle paper texture on the frame surface, no photograph inside (window is empty/transparent), photorealistic, minor contact shadow at bottom edge only
```

**The 3 variants:**

| # | Name | Additional descriptor |
|---|---|---|
| 1 | Classic | standard Polaroid 600 proportions, 3.5in × 4.2in equivalent aspect ratio |
| 2 | Wide-border | equal borders on all four sides, slightly more square overall format |
| 3 | Mini | half the physical scale of Classic — for secondary or archival photographs |

**Output spec:** PNG with transparent image window. Frame dimensions based on Classic: 800×960px total (the viewing window is a transparent rectangle inset from the border). The bottom caption area (the wide border) is included and may be used for handwritten captions by the composition system.

**What "wrong" looks like:** Bevelled or plastic-looking frame (Polaroid borders are matte paper, not plastic), visible photograph inside the window (the window must be transparent for runtime compositing), exaggerated vintage effect (mild warmth only, not sepia).

---

### 3b — Photo corners (4 pieces)

**What they are:** Individual corner triangles, positioned by the composition system at the four corners of a photograph that is not in a polaroid frame.

**Style prompt:**
```
Close-up macro photograph of a single adhesive photo corner, traditional black paper photo mounting corner, triangular shape, slightly glossy paper, slightly worn, isolated on transparent background, photorealistic, subtle shadow on lower right edge
```

**Four assets:** top-left, top-right, bottom-left, bottom-right — each rotated appropriately. Generate one and rotate programmatically, or generate four for natural variation.

**Output spec:** 128×128px PNG each, transparent background except the corner piece itself.

**What "wrong" looks like:** White photo corners (they should be black), corner with photograph inside it (the corner holds the photograph at its edges, it does not contain it), overly plastic or shiny (they are matte paper).

---

### 3c — Torn-edge mounts (8 variants)

**What they are:** A backing paper with a torn, irregular edge on which a photograph sits. The tear is at one or more edges; the paper body behind the photograph is opaque.

**Reference images:** `Screenshot 2026-08-04 at 7.47.24 AM.png` (torn kraft paper backing visible in large background), `Screenshot 2026-08-04 at 7.47.15 AM.png` (torn paper pieces throughout the composition).

**Base style prompt (copy verbatim, modify only `[TORN_DESCRIPTOR]`):**
```
Close-up macro photography of a piece of [PAPER_TYPE] paper with a torn edge at [TORN_EDGE_POSITION], flat lay on white background, natural paper fibre visible at the torn edge, tear character: [TEAR_CHARACTER], transparent outside the paper body, no scissors-cut edge — all irregular edges are torn, photorealistic macro detail
```

**The 8 variants:**

| # | `[PAPER_TYPE]` | `[TORN_EDGE_POSITION]` | `[TEAR_CHARACTER]` | Seed |
|---|---|---|---|---|
| 1 | cream writing paper | bottom edge only | fine, slightly rough tear | 201 |
| 2 | cream writing paper | right edge only | medium rough, some fibre pullout | 202 |
| 3 | cream writing paper | top and right edges | fine on top, rough on right | 203 |
| 4 | ledger paper | bottom edge only | rough tear across ruled lines | 204 |
| 5 | kraft paper | bottom and left edges | very rough, long fibre pullout | 205 |
| 6 | newsprint | top edge only | very rough, jagged, large tear variation | 206 |
| 7 | cream writing paper | all four edges | medium rough, consistent character | 207 |
| 8 | cold-press watercolour paper | bottom edge only | gentle deckle-like tear, very even | 208 |

**Output spec:** PNG with transparency outside the paper body. The opaque paper body occupies approximately 800×600px of a 900×700px canvas; the torn edges feather into transparency.

**What "wrong" looks like:** Cut edges instead of torn (the edge must have fibre pullout and irregular variation — no straight lines at the torn edge), all four edges torn identically (each variant specifies which edges are torn), uniform tear (real torn paper has variation along the tear line, not a consistent sawtooth).

---

### 3d — Deckle edge (1 variant)

**What it is:** A single strip of paper with a soft, wavy deckle edge — the natural uncut edge of handmade paper. Used for notes and text pieces.

**Style prompt:**
```
Macro photography of a strip of handmade watercolour paper with natural deckle edges on the long sides, warm cream colour, cold-press texture, the deckle edge is soft, wavy, irregular, shows paper fibre extending into the transparent zone, flat lay on white background, transparent outside the paper body, photorealistic
```

**Output spec:** PNG with transparency, 800×160px (the strip is wide and short; the deckle edges run along the long sides).

---

## Family 4 — Fasteners

### Shared constraint

All fasteners have a baked contact shadow. Unlike paper stocks (where shadows are physics-engine-applied), fasteners are small enough that baked shadows are acceptable and preferred — they reduce runtime shadow calculation for small objects.

### 4a — Pushpins (3 types)

**Reference images:** `IMG_8118.jpg` (red heart pushpins visible), `IMG_8121.jpg` (binder clip visible as reference for metal reflectivity), `IMG_8123.jpg` (same).

**Base style prompt:**
```
Product photography of a single [PIN_DESCRIPTOR] pushpin, viewed from 40-degree overhead angle, pin pointing straight down out of frame, [TOP_MATERIAL] top, photorealistic, warm studio lighting, small tight contact shadow on white surface below, isolated on transparent background
```

| # | Name | `[PIN_DESCRIPTOR]` | `[TOP_MATERIAL]` | Seed |
|---|---|---|---|---|
| 1 | Eva's pushpin | brass-topped metal | aged brass metal, warm gold tone, slight patina | 301 |
| 2 | Adam's pushpin | cream plastic-topped | matte cream off-white plastic, slightly rounded dome | 302 |
| 3 | Neutral pushpin | matte black | flat matte black plastic | 303 |

**Output spec:** 256×256px PNG, transparent background, contact shadow baked in. 2× resolution (512×512) for retina.

**What "wrong" looks like:** Pushpin viewed from the side (must be top-down 40° angle), shiny plastic top when brass is specified (Eva's pin is aged brass, not chrome), missing contact shadow.

---

### 4b — Binder clips (2 sizes)

**Reference images:** `IMG_8121.jpg`, `IMG_8124.jpg` (binder clip clearly visible in centre-right, shows chrome finish and open handles).

**Style prompt:**
```
Product photography of a [SIZE] binder clip, chrome steel finish, both handles in the open resting position (pointing up), viewed from 45-degree overhead angle, photorealistic metal texture with natural reflections, warm studio lighting, isolated on transparent background, tight contact shadow at base
```

| # | Name | `[SIZE]` | Seed |
|---|---|---|---|
| 1 | Large binder clip | large (32mm) | 311 |
| 2 | Small binder clip | small (19mm) | 312 |

**Output spec:** PNG with transparency, baked contact shadow. Large: 400×300px. Small: 256×192px.

---

### 4c — Paperclips, staples, brads

**Paperclip:**
```
Product photography of a single standard steel paperclip, flat lay, semi-reflective steel, warm studio lighting, isolated on transparent background, top-down view
```
Output: 256×64px PNG. Seed: 321.

**Staple:**
```
Macro photography of a single metal staple, flat lay, silver steel, visible staple legs, isolated on transparent background, extreme close-up
```
Output: 128×48px PNG. Seed: 331.

**Brad (paper fastener):**
```
Product photography of a single brass brad paper fastener, top view with prongs spread flat, brass gold tone finish, isolated on transparent background
```
Output: 128×128px PNG. Seed: 341.

---

## Family 5 — Stickers

### The sunflower — generated first, in isolation

**This asset is generated before any other sticker and before any batch run.** It has a named owner (Eva) and every botanical sticker that follows it takes its generation quality as the floor.

**Reference images:** None specific — the sunflower is Eva's motif, not derived from any reference image. It should feel pressed and dried, as if placed in a book.

**Style prompt:**
```
Single pressed and dried sunflower, flat botanical illustration, transparent background, warm golden-yellow petals showing natural pressing texture and slight curl at petal tips, dark brown dried centre showing seed pattern, some petals slightly translucent from drying, professional botanical art quality, slight warm aging as if pressed between book pages for weeks, isolated on transparent background, no drop shadow, high detail at macro scale
```

**Output spec:** 512×512px PNG, transparent background. The sunflower should occupy approximately 80% of the canvas. Seed: 401.

**After the sunflower is approved** — review it against: does it look pressed and dried (not fresh)? Is it recognizably a sunflower (not a generic yellow flower)? Does it have the quality of a real botanical specimen? Only after approval run the remaining botanicals.

---

### Pressed botanicals (5 remaining, generated as a batch after sunflower approved)

**Base style prompt (copy verbatim, change only `[PLANT_DESCRIPTOR]`):**
```
Single pressed and dried [PLANT_DESCRIPTOR], flat botanical illustration, transparent background, natural dried colour (muted, slightly faded from pressing), some translucency from the pressing process, professional botanical art quality, slight warm aging as if pressed between book pages, isolated on transparent background, consistent style with the approved sunflower in this set, no drop shadow
```

| # | Name | `[PLANT_DESCRIPTOR]` | Seed |
|---|---|---|---|
| 2 | Lavender | sprig of lavender with multiple small flowers, pale purple-grey dried colour | 402 |
| 3 | Baby's breath | small cluster of baby's breath (Gypsophila), white-cream tiny blooms | 403 |
| 4 | Rose | single rose head pressed flat, deep pink muted from drying | 404 |
| 5 | Fern frond | single fern frond, arching, dried green with slight yellow at edges | 405 |
| 6 | Daisy | single daisy pressed flat, white petals, pale yellow dried centre | 406 |

**Output spec:** 512×512px PNG each, transparent background, botanicals occupy 70–80% of canvas.

**What "wrong" looks like for all botanicals:** Fresh-looking (should appear dried and pressed), oversaturated colour (pressed botanicals have muted, slightly faded colour), opaque background (the background must be transparent), uniform opacity across the entire plant (translucency varies naturally in pressed specimens — petals should be slightly more transparent than stems).

---

### Stars (3 sizes)

**Style prompt:**
```
Single gold foil star sticker, flat lay, slightly shiny foil surface with natural light reflection, minor scuff marks showing the sticker has been used, isolated on transparent background, no drop shadow, [SIZE] five-pointed star shape
```

| # | Size | `[SIZE]` in prompt | Output px | Seed |
|---|---|---|---|---|
| 1 | Large star | large (2cm equivalent) | 256×256 | 411 |
| 2 | Medium star | medium (1.2cm equivalent) | 160×160 | 412 |
| 3 | Small star | small (0.6cm equivalent) | 96×96 | 413 |

---

### Playing card elements (2)

**Style prompt:**
```
Single playing card, [CARD_DESCRIPTOR], slightly weathered edges, warm aged card stock, isolated on transparent background, photorealistic
```

| # | Name | `[CARD_DESCRIPTOR]` | Seed |
|---|---|---|---|
| 1 | Ace of hearts | ace of hearts face-up, red heart, classic card design | 421 |
| 2 | Two of hearts | two of hearts face-up, two red hearts, classic card design | 422 |

Output: 256×360px PNG each.

---

### Cherries (1)

**Reference image:** `IMG_8119.jpg` (cherries visible clearly in upper area of reference)

**Style prompt:**
```
Pair of fresh dark red cherries joined at the stem, isolated on transparent background, slightly illustrated style (not photograph), clean cut edge, vibrant deep red colour, green stem visible, glossy surface
```

Output: 256×256px PNG. Seed: 431.

---

### Vinyl record (1)

**Reference image:** `IMG_8122.jpg`, `IMG_8123.jpg` (vinyl records visible clearly)

**Style prompt:**
```
Single vinyl record, top-down view, dark black grooved surface, small white centre label reading "Limited Edition", slight reflections on the grooved surface, isolated on transparent background, photorealistic, slightly illustrated quality
```

Output: 512×512px PNG (vinyl needs the larger canvas to show groove detail). Seed: 441.

---

### Music notes (decorative, 1 asset)

**Style prompt:**
```
Small collection of musical notes (quarter notes and eighth notes) arranged loosely, black ink on transparent background, hand-drawn quality, not digital-perfect, slight variation in stroke weight
```

Output: 256×128px PNG. Seed: 451.

---

## Family 6 — Deco City Plates

This is the most complex family. Read every word before generating anything.

### Why the previous spec was wrong and what replaces it

The original spec said "generate five transparent PNG layers." Text-to-image models do not produce alpha channels. An agent handed that requirement would either produce flat colour scenes and call them layers, or stall. This revision gives the pipeline that can actually be executed.

The fix comes from the reference art itself. Batman:TAS backgrounds are silhouette-driven — the buildings are shapes, and colour is laid over them in production. So:

1. **Generate each architectural layer as a black silhouette on a pure white ground.** No colour, no transparency — just black ink on white paper.
2. **Key white to alpha at build time** using luminance-to-alpha conversion. White → fully transparent. Black → fully opaque. Grey edge pixels → proportionally transparent. You get clean transparent PNG with naturally anti-aliased edges, at no extra generation cost.
3. **Apply colour at runtime** using design law tokens (`--night-sky`, `--night-gold`, etc.), not baked into the image. Sky tone, window light, season and weather all stay live.
4. **The sky layer is not generated at all.** It is drawn in code — a gradient + stars + moon + weather overlay. This is cheaper, sharper, more controllable, and eliminates 12 generation runs (the old 4 season × 3 weather variants).
5. **Window lights are not painted into any image.** They are small coloured rectangles composited from a coordinate list. Individual windows can light and darken per awake/asleep status.

This approach is more faithful to the reference art than a colour render would be, because it is how the source art is actually constructed.

---

### Layer architecture

```
Layer 6 (top)    Foreground       — balcony rail, curtain, immediate objects
Layer 5          Window lights    — coordinate-driven rect overlay, live
Layer 4          Near buildings   — articulated facade silhouette
Layer 3          Mid skyline      — landmark silhouettes
Layer 2          Far skyline      — distant mass, simple
Layer 1 (bottom) Sky              — code-drawn: gradient + stars + moon + weather
```

Layers 2–4 and 6 are generated assets (silhouette PNGs). Layer 5 is a code-composited overlay from a JSON coordinate list. Layer 1 is entirely code.

---

### Reference images

Copy into every generation prompt as style anchors:
- `images (11).jpeg` — Batman:TAS rooftop night city. **The discipline model.** Flat, hard-edged, strong silhouette, deep blue-black sky.
- `images (12).jpeg` — Couple at window. Silhouette figures against orange-red dusk. Shows how the foreground + city relationship should read.
- `images (13).jpeg` — Art deco casino illustration. Limited palette per scene, flat shapes.
- `65716ede74580268e6ec73cfeb5f5b00.jpg` — Batman:TAS interior. Hard-edged shadow, flat vector.
- `images (14).jpeg` — Balcony scene in rain. Foreground rail element.

**Not in any city brief:** `Screenshot 2026-08-04 at 7.39.32 AM.png` (Sorriso New York halftone). Different register — park against cassette/record work.

---

### Layer 1 — Sky (code, not generated)

The sky is drawn entirely in code. It is not a generated image file. Specifying it here so the frontend-engineer who builds the compositing system knows exactly what it must produce.

**Parameters the code sky renderer takes:**

```typescript
type SkyParams = {
  city: 'nyc' | 'tlv';
  hour: number;          // 0–23, local to that person
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
};
```

**What it renders:**

- **Gradient base:** `--night-sky` (#0D1220) at top, stepping slightly warmer and lighter toward the horizon (approximately #121A2C at 70% mark, #1A2540 at horizon). Tel Aviv is warmer at the horizon than New York: add ~10° hue warmth to the horizon stop for TLV.
- **Stars:** seeded PRNG scatter (seed = city string hash), 80–200 dots at 1–2px, opacity 0.4–0.9, visible only when weather is `clear` or `storm` (storm: sparse, blinking). Denser in winter clear; invisible in rain, snow, fog.
- **Moon:** white circle at fixed position per city per season, 20–28px diameter, slight warm tint (#F4EFE0), visible only in clear/storm.
- **Weather overlays (Canvas animated):**
  - `rain`: diagonal grey-white line scatter, 45°, animated downward, opacity 0.25
  - `snow`: white dot scatter, gentle downward float, opacity 0.35
  - `fog`: radial gradient overlay, #1C2840 at 50% opacity, spreading from lower thirds
  - `storm`: rapid diagonal rain + occasional brightness flash at 0.08 opacity

**Why code, not image:** The sky must track the real hour. A generated sky image cannot do that. A gradient in code matches `--night-sky` exactly and costs zero bytes at rest.

---

### Layers 2–4 and 6 — Silhouette generation

#### Base style prompt (verbatim, copy exactly, append only the layer descriptor)

```
Pure black silhouette illustration on pure white (#FFFFFF) background. [LAYER_DESCRIPTOR]. Flat black shapes only — no shading, no grey values, no gradients inside shapes. Pure flat vector quality. Hard edge where every silhouette meets the white ground. Reference style: Batman The Animated Series background art. No colour except pure black on pure white.
```

The prompt is the same for every architectural layer. Only `[LAYER_DESCRIPTOR]` changes. This keeps the generative model's output family coherent across all layers.

#### Depth cues that distinguish layers

The generation model has no concept of parallax. Depth is encoded through these specific visual signals — state them in the `[LAYER_DESCRIPTOR]`:

| Layer | Key depth signals to specify |
|---|---|
| Far (layer 2) | Small apparent building size. Rectangular massing with minimal roofline variation. No water towers, no setbacks visible. Dense but simple. Buildings occupy lower 15–20% of image height. |
| Mid (layer 3) | Larger apparent buildings. Stepped setbacks visible. Landmark profiles specified by name. Water towers visible as small circles on rooftops. Buildings occupy lower 30–40% of image height. |
| Near (layer 4) | Large buildings filling lower 50–65% of image. Articulated facades: parapet details, fire escape geometry, window grid visible as rectangular notches in the silhouette (do NOT punch through — see note). Individual building character visible. |
| Foreground (layer 6) | Immediate foreground: balcony railing at bottom of frame, curtain edge or arch framing the sides. Silhouette reads as interior frame enclosing the city view. |

**Note on near-building windows:** The near-buildings silhouette has NO window holes punched through it. The building is a solid black shape. Windows are a separate coordinate-driven layer (Layer 5). If the generated near-buildings image has white rectangular openings in the building facade, reject it.

---

### City A — New York City (Eva's city)

#### Layer 2 — Far skyline (NYC)

```
[LAYER_DESCRIPTOR]: Far distant Manhattan skyline. Dense mass of rectangular buildings at extreme distance. Minimal roofline variation — mostly flat tops at varying heights. No specific landmark identification. Buildings are small, tightly packed, span the full width. Silhouette occupies lower 18% of image height.
```
Seed: 520.

#### Layer 3 — Mid skyline (NYC)

```
[LAYER_DESCRIPTOR]: Mid-distance Manhattan skyline. Empire State Building clearly identifiable by silhouette at left-centre: tall, stepped crown tapering to a radio antenna. Chrysler Building clearly identifiable to the right: pointed art deco crown with distinctive eagle gargoyles and stainless steel arched windows visible as silhouette detail. Surrounding mid-rise buildings fill in between with varied stepped setbacks. Water towers visible as small circles on several rooftops. Silhouette occupies lower 38% of image height.
```
Seed: 521.

**Landmark test:** Cover everything except the mid-skyline layer. Ask: is that the Empire State Building? Is that the Chrysler Building? If uncertain, regenerate. Silhouette identifiability is the minimum bar.

#### Layer 4 — Near buildings (NYC)

```
[LAYER_DESCRIPTOR]: Close Manhattan apartment building facades. Large buildings filling lower 58% of image height. Brick facade geometry visible as flat horizontal and vertical rectangular detail. Parapet caps along roofline. Fire escape geometry as thin rectangular outlines on the building face. Window grid present as shallow indentations in the silhouette face — NOT punched through, the silhouette remains solid. Street-level detail at bottom edge.
```
Seed: 522.

#### Layer 6 — Foreground (NYC)

```
[LAYER_DESCRIPTOR]: New York apartment interior foreground. Cast iron balcony railing with art deco scroll pattern spanning the bottom 20% of the frame. Curtain edges framing the left and right sides (heavy drapes, partially drawn). Silhouette reads as a frame enclosing the city view. No city buildings in this layer — the layer is transparent except for the railing and curtain edges. Interior light suggestion at the very bottom edge.
```
Seed: 524.

---

### City B — Tel Aviv (Adam's city)

Prompt structure identical to NYC. `[LAYER_DESCRIPTOR]` values adjusted for Tel Aviv's character.

**Character differences from NYC:**
- Lower overall density — buildings are more widely spaced, more sky visible between them
- Mediterranean: slightly lower building heights, more variety in roofline shape
- Warmer ambient character

#### Layer 2 — Far skyline (TLV)

```
[LAYER_DESCRIPTOR]: Far distant Tel Aviv skyline. Less dense than Manhattan — wider spacing between buildings with sky gaps visible. Buildings are smaller apparent size. Lower overall height profile. Silhouette occupies lower 15% of image height.
```
Seed: 620.

#### Layer 3 — Mid skyline (TLV)

```
[LAYER_DESCRIPTOR]: Mid-distance Tel Aviv skyline. Three Azrieli towers clearly identifiable by their distinctive plan shapes: one circular tower (tallest of the three, stepped crown), one triangular tower (triangular plan visible in silhouette as a tapered form), one square tower. Moshe Aviv Tower is the tallest single structure — rectangular with a distinctive antenna spire. Surrounding buildings at lower heights with varied rooflines. Silhouette occupies lower 35% of image height.
```
Seed: 621.

**Landmark test:** The Azrieli trio is the identifiability test — the circular, triangular, and square towers together are unlike any other skyline in the world. If the trio is not readable from the silhouette, regenerate.

#### Layer 4 — Near buildings (TLV)

```
[LAYER_DESCRIPTOR]: Close Tel Aviv building facades. Mediterranean-influenced — mix of flat-roofed apartment buildings and older Bauhaus-style structures. Some buildings show rounded balcony projections along their faces as slight curved protrusions in the silhouette. Window grid as shallow rectangular detail, NOT punched through. Buildings fill lower 55% of image height.
```
Seed: 622.

#### Layer 6 — Foreground (TLV)

```
[LAYER_DESCRIPTOR]: Tel Aviv apartment balcony foreground. Open balcony railing, more slender than the NYC version — thin horizontal and vertical rails. A terracotta pot with trailing plant at one side (leaves as simple rounded silhouette forms). Wider field of view than NYC foreground — more sky visible, more open feel. Railing spans bottom 18% of frame. Left and right edges open rather than curtain-framed.
```
Seed: 624.

---

### Layer 5 — Window lights (coordinate list, not generated)

Window lights are **not painted into any image**. They are small coloured rectangles composited by the runtime system from a JSON coordinate list per city.

**Why not generate them:** A model cannot be told exactly which pixel positions to place lit windows. And the windows need to change dynamically — Eva's building lights up when she is awake; Adam's lights up when he is awake. Baked images cannot do this.

**Coordinate file schema:**

```json
{
  "city": "nyc",
  "reference_size": { "w": 1170, "h": 2532 },
  "layers": {
    "mid": [
      {
        "id": "m001",
        "x": 0.423,
        "y": 0.512,
        "w": 18,
        "h": 22,
        "token": "night-gold",
        "person": null
      },
      {
        "id": "m002",
        "x": 0.387,
        "y": 0.489,
        "w": 14,
        "h": 18,
        "token": "night-amber",
        "person": "eva"
      }
    ],
    "near": [
      {
        "id": "n001",
        "x": 0.156,
        "y": 0.634,
        "w": 20,
        "h": 24,
        "token": "night-gold",
        "person": null
      }
    ]
  }
}
```

**Field definitions:**

| Field | Type | Meaning |
|---|---|---|
| `x`, `y` | `number` (0–1) | Position as fraction of `reference_size`, from top-left |
| `w`, `h` | `number` (px) | Window size at `reference_size` resolution |
| `token` | `"night-gold"` \| `"night-amber"` | Which design law colour token to use for this window |
| `person` | `"eva"` \| `"adam"` \| `null` | `null` = ambient city window, always lit at 70% opacity. `"eva"` or `"adam"` = their specific building's window, lit when that person is marked awake. |

**Coordinate list production:** The coordinate lists for NYC and TLV are hand-authored by the product-designer by overlaying a grid on the rendered near/mid layers and marking window positions. They are not generated. This is the one manual step in the pipeline — it takes 30 minutes per city and never needs redoing unless the silhouette layers change.

---

### Keying technique — white to alpha

After generation, each silhouette PNG (layers 2, 3, 4, 6) is processed to produce transparent PNGs. **This is a build-time operation**, not runtime.

**Method: luminance-to-alpha**

```
alpha = 1.0 - (luminance / 255)
```

Where luminance = 0.299R + 0.587G + 0.114B (standard luma).

- Pure white (#FFFFFF, luminance 255) → alpha 0.0 (fully transparent)
- Pure black (#000000, luminance 0) → alpha 1.0 (fully opaque)
- Edge pixel with luminance 180 → alpha 0.29 (semi-transparent)

**Why this handles the diagonal-roofline anti-aliasing problem:** The generation model naturally produces slightly grey pixels along diagonal edges (its own anti-aliasing). Luminance-to-alpha converts those grey pixels to semi-transparent pixels automatically — the edge is smooth without any additional processing step.

**Hard-threshold keying is banned.** A hard threshold (all pixels above luminance 200 → transparent, all below → opaque) produces jagged stairstepping on any diagonal or curved edge. The luminance-to-alpha method handles this for free.

**Implementation:** `sharp` (Node.js) can do this in one pipeline step:
```js
sharp(input)
  .toColorspace('b-w')              // convert to greyscale
  .raw()                             // get pixel buffer
  // invert: dark → high alpha
  .then(buf => /* luma-to-alpha */ )
  .png({ compressionLevel: 9 })
```
Or with ImageMagick: `convert input.png -alpha copy -channel alpha -negate -evaluate multiply 0.999 output.png` (approximately — the frontend-engineer will confirm the exact flags).

**After keying:** The PNG contains only the building silhouette as a black shape with natural anti-aliased edges on a transparent background. Colour is applied at runtime by the composition system using CSS `mix-blend-mode: multiply` or equivalent Canvas compositing, filling the opaque areas with the appropriate design law token colour.

---

### Colour application at runtime

The keyed silhouette PNGs have no colour — they are monochrome alpha masks. The composition system paints each layer with design law tokens at render time.

| Layer | Runtime fill colour |
|---|---|
| Far silhouette | `--night-sky` tinted 15% lighter: approximately `#1A2540` |
| Mid silhouette | `--night-sky` tinted 25% lighter: approximately `#1E2D50` |
| Near silhouette | `#1E2438` (same as original near-building token) |
| Foreground silhouette | Near-black: `#0D1018` (darker than the buildings behind it) |

This means changing the night palette in the design law automatically repaints all silhouettes — no asset regeneration needed.

---

### Output spec

**Generated silhouette files (pre-keying):**
- Format: PNG, no transparency, pure black silhouette on pure white
- Resolution: 1170×2532px (full iPhone 3× screen)
- Colour space: sRGB
- Compression: maximum (these are 2-colour images, they compress extremely well)

**After keying (shipped assets):**
- Format: PNG with alpha
- Same resolution
- No ICC profile embedding
- These are the files that go into `public/assets/city/`

**Coordinate JSON files:**
- `public/assets/city/nyc/windows.json`
- `public/assets/city/tlv/windows.json`

**No sky image files.** The sky is code-drawn.

**Directory structure (revised for silhouette approach):**
```
public/
  assets/
    city/
      nyc/
        far.png           ← keyed silhouette
        mid.png           ← keyed silhouette
        near.png          ← keyed silhouette
        foreground.png    ← keyed silhouette
        windows.json      ← coordinate list for window overlay
      tlv/
        far.png
        mid.png
        near.png
        foreground.png
        windows.json
      sky.ts              ← or sky.tsx: the code sky renderer
```

Total generated assets for city: **8 PNG files** (4 per city × 2 cities). Down from 28 files in the old spec (12 sky variants × 2 cities + 4 architectural layers × 2 cities). The sky and window lights have no file footprint.

---

### Seeds — city plates

| Asset | City | Seed |
|---|---|---|
| Far silhouette | NYC | 520 |
| Mid silhouette | NYC | 521 |
| Near silhouette | NYC | 522 |
| Foreground | NYC | 524 |
| Far silhouette | TLV | 620 |
| Mid silhouette | TLV | 621 |
| Near silhouette | TLV | 622 |
| Foreground | TLV | 624 |

Seeds 523 and 623 (the old window-overlay generation) are retired. Window lights are now coordinate-driven, not generated.

---

### What "wrong" looks like for city plates — reject on sight

- **Any colour in the silhouette file:** the generated image must be pure black shapes on pure white. A grey building, a coloured sky, any shadow gradient — reject and regenerate.
- **Grey pixels in the middle of a building body:** edge pixels may be grey (this is correct — luminance-to-alpha needs them). Grey pixels in the flat centre of a building indicate the model produced shading. Reject.
- **A single flattened image delivered as "the layer stack":** still a failed deliverable under the revised spec. The four architectural layers (far, mid, near, foreground) are four separate files.
- **Unidentifiable mid skyline:** the mid-skyline silhouette must pass the landmark test. Cover everything else. Ask: Empire State Building? Chrysler Building? (NYC). Azrieli trio? Moshe Aviv? (TLV). If uncertain: regenerate.
- **Window holes punched through the near-buildings silhouette:** the near-buildings image must be a solid building shape. Windows are Layer 5 (coordinate-driven). A near-buildings image with white rectangular holes in it means the model mis-interpreted the brief.
- **Sky file delivered:** there is no sky file. If a sky image was generated, it is a misunderstanding of the spec. The sky is code.
- **Flat foreground:** the foreground silhouette should clearly read as "inside a room looking out." A foreground that is just a strip of black at the bottom is not sufficient — the railing detail and curtain/arch framing must be present.

---

## Seed discipline — how to use seeds

Every seed above is a generation seed. Rules:

1. **Same seed = same output.** Use the same seed every time you regenerate the same asset. If an asset needs revision, revise the style prompt, not the seed (unless the seed is itself the problem).
2. **New variant = new seed.** If you add a variant not listed here, allocate a new seed in the next available slot for that family (paper: 40s, washi: 100s, mounts: 200s, fasteners: 300s, stickers: 400s, city: 500s/600s).
3. **Document all new seeds here.** This file is the seed register. Any seed used in generation must appear here.
4. **Seed changes must be noted.** If a seed change was required (rare — usually means the seed produced an unusable result), note it: `seed 42 → seed 46 (original produced blue-tinted result, failed warm requirement)`.

---

## Self-hosting requirement

All assets self-hosted. No CDN, ever. The app must work with the network hostile. Reasons:
- Eva on her subway commute. Network is hostile. Assets must render.
- Private content must never touch an external service's CDN.
- Platform independence: no third-party CDN availability dependency.

Asset directory structure (to be confirmed by frontend-engineer in Phase 1):
```
public/
  assets/
    paper/          ← 8 paper stock tiles
    tape/           ← 12 washi tape strips
    mounts/
      polaroid/     ← 3 frames
      corners/      ← 4 corner pieces
      torn/         ← 8 torn edge variants
      deckle/       ← 1 deckle strip
    fasteners/      ← pushpins, clips, etc.
    stickers/
      botanicals/   ← sunflower first, then 5 more
      stars/        ← 3 sizes
      cards/        ← 2 playing card elements
      other/        ← cherries, vinyl, notes
    city/
      nyc/
        sky/        ← 12 weather×season variants
        far/        ← 1 silhouette layer
        mid/        ← 1 landmark layer
        near/       ← 1 building layer + 1 window overlay
        foreground/ ← 1 balcony layer
      tlv/          ← same structure
```
