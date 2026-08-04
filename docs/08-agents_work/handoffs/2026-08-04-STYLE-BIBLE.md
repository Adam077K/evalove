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

This is the most complex family. Read every word.

### The layer architecture

A complete night scene is composed of 5 layers per city. **These are separate files, always.** The composition system stacks them. A single flattened image cannot be accepted.

```
Layer 5 (top)    Foreground       — balcony rail, curtain edge, immediate objects
Layer 4          Near buildings   — the street-level block you are looking at
Layer 3          Mid skyline      — major architectural landmarks
Layer 2          Far skyline      — the most distant buildings, darkest silhouettes
Layer 1 (bottom) Sky              — the sky gradient, driven by real hour
```

The sky layer is driven by real hour and season. The far/mid/near layers are static (buildings don't move). Window lights on the near and mid layers are a separate transparent overlay driven by awake/asleep status.

### Reference images

**Primary references (copy these into every city generation brief):**
- `images (11).jpeg` — Batman:TAS night city from rooftop. The definitive style reference: flat vector, hard-edged, deep blue-black sky, yellow-green building windows. This image is the style target.
- `images (12).jpeg` — Couple at window overlooking orange-red dusk city. The romantic register and the lit-window-as-stage metaphor.
- `images (13).jpeg` — Art deco casino illustration. Limited palette per scene, flat vector shapes.
- `65716ede74580268e6ec73cfeb5f5b00.jpg` — Batman:TAS interior. Hard-edged shadows, flat vector.
- `images (14).jpeg` — Balcony scene in rain. Atmosphere, rain treatment, balcony foreground element.
- `Screenshot 2026-08-04 at 7.38.59 AM.png` — SALON art deco poster. The palette register for interiors.
- `Screenshot 2026-08-04 at 7.39.41 AM.png` — New Haven deco illustration. Warm interior vs. cold exterior contrast.

**Not in any city brief:** `Screenshot 2026-08-04 at 7.39.32 AM.png` (Sorriso New York halftone). Different register — park against cassette/record work.

### Base style prompt for city illustration layers

```
Art deco city illustration, [LAYER_DESCRIPTOR], flat vector graphic, hard-edged shadows, strong silhouettes, Batman The Animated Series background art visual style, limited 4-colour palette (stated per layer), no photorealism, no gradient mesh, sharp edges on all building shapes, professional illustration quality
```

### City A — New York (Eva's city)

**Identifying landmarks to include:**
- Mid skyline: Empire State Building silhouette (tall, stepped crown, antenna), Chrysler Building (distinctive eagle gargoyles and stainless steel crown visible even as silhouette)
- Far skyline: general Manhattan density
- Foreground: iron balcony railing with scroll detail, or heavy curtain edge suggesting an apartment interior

**Per layer:**

**Sky layer (12 variants: 4 seasons × 3 weather):**

For each variant, use:
```
Art deco city illustration, [SEASON] night sky over New York, [WEATHER_DESCRIPTOR], gradient from deep navy-black (#0D1220) at top to slightly lighter blue at horizon, stars [STAR_DESCRIPTOR], no buildings in this layer — sky only, flat illustration quality
```

| Season × Weather | `[SEASON]` | `[WEATHER_DESCRIPTOR]` | `[STAR_DESCRIPTOR]` | Sky seed |
|---|---|---|---|---|
| Spring clear | spring | clear night, crisp air | faint scattered stars | 501 |
| Spring rain | spring | rain falling, heavy clouds obscuring sky | none visible | 502 |
| Summer clear | summer | warm clear night, slight haze near horizon | scattered stars | 503 |
| Summer rain | summer | summer storm, lightning in far clouds | none | 504 |
| Autumn clear | autumn | crisp autumn night, strong star visibility | dense star field | 505 |
| Autumn rain | autumn | autumn rain, fast-moving clouds | occasional star through gaps | 506 |
| Winter clear | winter | cold clear winter night, brilliant stars, possible thin clouds | very bright dense stars | 507 |
| Winter snow | winter | snow falling, low clouds, diffuse light from city glow below | none | 508 |
| Winter rain | winter | cold rain, heavy clouds, dark | none | 509 |
| Spring snow | spring | unusual late spring snow, soft flakes | none | 510 |
| Summer lightning | summer | lightning storm, dramatic clouds | none | 511 |
| Autumn fog | autumn | fog rolling in, soft diffuse sky, reduced visibility | none | 512 |

**Far skyline layer:**
```
Art deco city illustration, far distant Manhattan skyline at night, extreme distance, darkest silhouettes (#1A1F2E), minimal window detail (1–2 lit windows at most per building), flat vector, general Manhattan density profile, no specific landmark identification at this distance, 4-colour palette: #0D1220 (sky), #1A1F2E (buildings), #C49A1E (rare window), #243048 (mid-distance buildings)
```
Seed: 520.

**Mid skyline layer:**
```
Art deco city illustration, mid-distance Manhattan skyline at night, Empire State Building clearly identifiable by silhouette and stepped crown at centre-left, Chrysler Building silhouette at right, warm amber-gold lit windows on both (#C49A1E), other surrounding mid-rise buildings as silhouettes, flat vector, hard-edged, 4-colour palette: transparent background, #283050 (building bodies), #C49A1E (lit windows), #1C2540 (shadow sides)
```
Seed: 521.

**Near buildings layer:**
```
Art deco city illustration, close foreground Manhattan buildings at night, detailed brick or stone facade visible as flat geometry, multiple lit windows (#C49A1E warm, #D4892A intimate), street-level detail at bottom edge, flat vector, hard-edged shadows, 4-colour palette: transparent background, #1E2438 (building facade), #C49A1E (standard window light), #D4892A (warm interior light), #141926 (shadow/recess)
```
Seed: 522.

**Window light overlay (separate transparent layer, driven by awake/asleep):**
```
Transparent overlay layer, sparse amber-gold lit window shapes (#C49A1E, 85% opacity) on transparent background, window shapes match the near-buildings layer geometry exactly, approximately 40% of windows lit, photorealistic placement
```
Seed: 523. This layer is toggled/faded based on awake status.

**Foreground layer:**
```
Art deco city illustration, apartment balcony foreground, iron railing with art deco scroll detail at bottom of frame, warm amber interior light spilling from behind viewer (suggesting the lit room), foreground objects optional (small table, coffee cup), transparent sky area above railing shows the city layers behind, flat vector, warm interior vs cold exterior contrast
```
Seed: 524.

---

### City B — Tel Aviv (Adam's city)

**Identifying landmarks to include:**
- Mid skyline: Azrieli towers (three towers, distinctive — circular, triangular, square), Moshe Aviv Tower (tallest in Tel Aviv, with distinctive antenna)
- Character: lower density than Manhattan, wider spacing between tall buildings, Mediterranean warmth even at night (warmer ambient light than New York)
- Foreground: open balcony with Mediterranean influence — possibly arched opening, climbing plants in a pot, view more open than the enclosed New York apartment

The prompt structure is identical to New York but with Tel Aviv landmark descriptors. Seeds begin at 601 (sky variants) through 624 (foreground). The style prompt base is identical — same Batman:TAS discipline, same colour palette anchors.

**Key difference from New York:** Tel Aviv's night is warmer (less cool blue in the sky layer, more amber warmth in the mid sky). Adjust the sky layer prompt: "warm deep navy, slight amber warmth at the horizon from city heat, not as cold as a northern city."

---

### Output spec for all city plates

- Format: PNG with transparency (except sky layer which is fully opaque)
- Sky layer: 1170×2532px (full iPhone screen at 3×)
- Far/mid/near/foreground layers: same dimensions, transparent outside their content area
- Colour space: sRGB, no ICC profile embedding
- No anti-aliasing blur at hard edges — this is flat vector illustration; edges must be crisp
- The near-buildings layer and mid-skyline layer deliver two versions: windows-lit and windows-unlit (or the window overlay is a separate file — preferred, since it allows partial-opacity states)

### What "wrong" looks like for city plates — reject on sight

- **A single flattened image:** the layer stack is the deliverable. A flattened PNG, however beautiful, cannot be used.
- **Photorealistic style:** must be flat vector illustration. If it looks like a photograph or like 3D-rendered architecture, regenerate.
- **Gradients inside building shapes:** buildings are flat silhouettes. A gradient-filled building is not Batman:TAS style.
- **More than 5 colours per layer:** the limited palette per scene is the discipline. Count the colours; if more than 5, identify which to remove.
- **Unrecognizable silhouette:** the mid skyline must be identifiable as New York or Tel Aviv from the silhouette alone, without labels. If a neutral viewer cannot name the city, the landmark indicators are not strong enough.
- **City plates that are generic:** "a night city" is not acceptable. "Manhattan seen from a Midtown apartment at 11pm in autumn" is the target specificity.
- **Lit windows that do not match layer geometry:** the window overlay must align precisely with the windows in the near-buildings layer. Misalignment breaks the compositing.

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
