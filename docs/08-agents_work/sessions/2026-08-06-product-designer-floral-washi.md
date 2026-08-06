---
date: 2026-08-06
role: product-designer
task: floral-washi
branch: feat/floral-washi
status: BLOCKED — no image-generation tool reachable
---

BLOCKED before any asset existed. `ToolSearch` (needed to load `mcp__higgsfield__*`) returned "not enabled in this context"; no other MCP image tool, generation API key, or local generator was reachable from this session — confirmed by checking `env` and `apps/web/.env.local` key names (no HIGGSFIELD/OPENAI/REPLICATE/etc.). Made no code changes: registering `TAPE_ASSETS`/the pick list without real files would ship broken `<img>` references and silently re-roll every existing day's tape for nothing. Full plan (asset naming, 1024×336 for both — floral detail needs the taller plate's extra render height at 84px — registration, pick-list edit, coverage test) is ready to execute the moment plates exist; see return JSON for prompts.

Generation prompts (Style Bible Family 2 base, customized per brief — sunflower is Eva's named motif, not the Bible's generic "muted pink/green"):

**floral-pressed:** "Close-up product photography of a single strip of Japanese washi tape, laid flat and straight, tiny pressed sunflower motif repeated along the strip — small dried sunflower heads and petals in faded warm gold, ochre and dried brown, botanical scientific-illustration register, muted as if pressed between book pages, natural paper fibre visible through the translucent tape body, semi-transparent (65-75% opacity), warm studio lighting from upper left, both short ends torn with a soft irregular deckle edge, long edges slightly irregular, photorealistic macro detail, no shadow." Background-removed to true alpha, exported 1024×336 webp.

**floral-blue:** same base, descriptor swapped to "tiny pressed cornflower and forget-me-not blossoms in dusty muted blue with pale sage-green stems." Same post-process, same 1024×336.
