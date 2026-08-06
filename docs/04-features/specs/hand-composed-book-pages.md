# Hand-Composed Book Pages — PRD
Linear: (none supplied)
Status: DRAFT

## 0. What today's decision actually is

Adam opened the Book and said two things that turned out to be one question: *"I want the book layout to hold more than 1 image in the page"* and *"where is the edit book part?"* He was offered four directions and chose the one that changes what the Book *is*: **the Book becomes something you make**, not only something that accumulates. Auto-composition stays the default and the honest fallback for every page; a page can be opened and reworked by hand — photographs placed, taped, written on.

This is stated as founder-locked and not re-argued here. What follows is the shape of it — scoped tightly enough that CTO can build against it without guessing, and honest about where it costs something the Book currently has for free.

**The gap this spec cannot close, stated once so nobody mistakes silence for resolution:** every word of the problem statement below is Adam's. `USER-INSIGHTS.md`'s source log has exactly one contributor (`2026-08-02 | Founder brief via CEO`), and `PRODUCT-VISION-V2.md` §7 names this as failure mode #5 — *"Eva has still never been asked anything... nothing in my vision survives her answering them differently."* Composition is the single feature in this product's history most likely to land differently for the person who receives a page someone else arranged than for the person who arranges it. This spec is written anyway, on schedule, per the founder's standing decision to build in parallel with her five questions outstanding (`DECISIONS.md`, 2026-08-03) — but it is the sharpest instance yet of that open risk, and CTO/Design-Lead should treat "how does this land for Eva specifically" as a first-week question, not a retrospective one.

## Problem

**Who:** both halves of the couple, but asymmetrically. Adam is the one who said this out loud today; Eva has not been asked. The capability itself is symmetric (see §"Who may compose," below) — the problem statement is not, and that imbalance is inherited, not invented here.

**What they said, verbatim:** *"I want the book layout to hold more than 1 image in the page"* and *"where is the edit book part?"* Both point at the same gap: a page is capped at exactly two photographs — one from each of them — because `Spread.tsx` encodes `evaPhoto && adamPhoto ? pair : single` as the *data model*, not a display choice. And there is no edit surface anywhere in the shipped product. The only trace of intent to ever build one is a comment in `Dock.tsx`: *"Stage 2 (not built, designed for): the editing tools arrive as additional `<TrayTool>` children when edit mode is found — the tray itself does not change."* The tray was built for scissors, tape and a pen. They were never made.

**What they're doing today instead:** nothing — there is no workaround inside the product. The Book fills itself from the daily ritual and that is the entire extent of anyone's control over what it looks like. Two people who describe the aesthetic brief itself as *"lots more of those cute little things"* and *"an object you own rather than software"* (`USER-INSIGHTS.md`) currently own an object they cannot touch.

**Cost of not solving it:** the founder said so directly — this was the loudest thing he said on opening the app today, ranked above the layout and proportion bugs also reported in the same sitting (`2026-08-06-HANDOFF-USE-THE-APP.md` §0). An object described as "something you own" that cannot be touched reads as software wearing a costume, which is exactly the failure mode the whole scrapbook direction exists to avoid (`DESIGN-LAW` §6, the logo test).

**What success looks like:** a page in the Book can hold photographs from anywhere in the archive, arranged, mounted and decorated by either partner, without ever feeling like a task the app is asking them to do.

## Solution

**What Evalove builds:** an edit mode for any page in the Book. Opened, it turns the tray's send-icon slot into scissors/tape/pen tools (per the `Dock.tsx` Stage-2 design already anticipated) and lets whoever is composing:

- pull any photograph from the archive — not only the two the page's own day produced — onto that page,
- place, rotate and re-mount any photograph already on the page (using the existing seeded mount/rotation system in `compose.ts` and `<Mounted>` as the placement primitive, not a new one),
- add stickers, washi tape and handwritten notes from the material library already specified in `DESIGN-LAW.md` §3,
- and reset the page back to its automatic arrangement at any time.

**What it explicitly does NOT do:**
- It does not create a new kind of page. Composing acts on the Book's existing day-pages; a freeform page unconnected to any calendar day is out of scope (see below).
- It does not move a photograph. Placing photo X (from day N) onto day M's page adds a *reference*; the photograph's home — its dated place in the archive and the export — never changes.
- It does not touch a photograph's row, caption text, or authorship. Composing is presentation only.
- It never reaches into the vault. The photo picker draws from `photos` only; there is no path, in code or in the schema, from `vault_items` onto a Book page — same DB-enforced impossibility `book_entries` already gives the current (unrelated) schema, and whatever table replaces it for this feature must preserve that property structurally, not by convention.

### Who may compose

**Recommendation: either partner, alone, may open and rework any page in the Book — including a page whose photographs the other person posted, and including touching the other person's photograph's placement, mount, or decoration on that shared page.**

Composing is never destructive: it cannot alter a photograph's record, delete it, or remove it from the archive — it only changes how the page presents what is already there, and it can always be reset (see below). That is the load-bearing distinction between this feature and the one directly-relevant precedent in the codebase, `feat/unilateral-remove`: that branch scopes unilateral *deletion* to what a person authored — `softDeletePhoto(photoId, identity.memberId)` checks authorship before hiding a photo, because destruction of someone else's contribution is a real harm a symmetric permission model would allow. Composition carries no equivalent risk, because nothing is destroyed and everything is reversible. Restricting composition to "only your own half of the page" would also break the material logic the whole design law is built on — washi tape is specified explicitly to *bridge* two objects, and a page with one photo from each of them is, structurally, one shared object with two authors, not two half-pages glued together.

**This is flagged as an open question for the founder anyway** (see below), because it is a real decision about a shared object and the brief specifically asked that it not be decided quietly.

### Archive immutability — how this relates to §6

`PRODUCT-VISION-V2.md` §6 commits that either partner can carry the entire archive out of the building alone, at any moment, in a format that opens without the app or the company. Composition must not put a second, harder promise on top of the one already made and not yet fully built (export is CTO's open track, per `DECISIONS.md` 2026-08-03).

**The rule: composition is a layer, never a replacement, and the layer is cheap.**

- The underlying facts — which photographs exist, who took them, what day they belong to, what they say — are never modified by composing. Composing writes a *second*, small record: which photographs appear on a given page, and how they are placed there. The auto-composition function (`compose.ts`, already pure and seeded from a stable ID) is not deleted or bypassed — it is what a page falls back to the moment its override is removed. "Reset to automatic" is not a separate feature to build; it is the *absence* of an override record, which the render path already produces correctly today.
- The export's guarantee is about the photographs and what was said about them, not about how a page happened to be arranged on a given day. A composition record is small, plain data (which photos, in what order, with what rotation/sticker/tape choices) — it should ship in the export as a human-readable sidecar (JSON is fine), never as a binary that requires the app's rendering code to be meaningful. Whether the export additionally includes a rendered snapshot image of each composed page (nice to have, not required) is a CTO cost/complexity call, not a product requirement — flagged below, not decided here.
- A photograph referenced on a composed page that is not its own day never becomes harder to find or export because of that reference. It still lives, in the export, in exactly one dated folder — the day it was actually taken or posted.

### Change visibility — and where the line against "seen" actually sits

The founder's own caution was precise: *"no seen status" bans read-receipts, not change-visibility* — and the risk is smuggling one back in disguised as something else.

**Recommendation: a page carries a small, quiet, factual line — typeset in Outfit, the app's own voice for facts, never handwriting — stating who last arranged the page and when, in absolute terms** (*"arranged by Eva, Tuesday"*), the same register the existing arrival stamp already uses (*"left while Eva was asleep · 5:12 his morning"*). This is discoverable only by turning to that page — never pushed, never badged, never surfaced as a dot on the dock or the Book's cover. It answers "did this page change" without answering "has the other person looked at it," which is the distinction the founder drew. It is not solicited (it only exists on pages that have actually been composed) and it does not compare two people's activity against each other — it states a fact about one page, the same way a museum label states who restored a painting without ranking restorers.

**What this explicitly rules out, because each of these would smuggle a seen-status back in:** no notification when a page is composed. No badge on the Book icon in the tray. No "N pages updated" summary anywhere. No highlighting or visual distinction that marks a composed page as different-in-kind from an auto-composed one when browsing the Book at a glance (composing is quiet in the same way a real object doesn't announce that someone rearranged the desk — you find it by looking at the desk, not by a note taped to the door).

### Discovery without solicitation

The law is explicit: *"Composing is never solicited... Edit mode is found, not offered."* `Dock.tsx` already anticipates the mechanism at the tray level (`<TrayTool>` children appear "when edit mode is found"), but that only describes what happens once you're in edit mode — it doesn't yet answer how you get there.

**Recommendation: the entry point into edit mode is a permanent, quiet affordance that is part of the Book/page object itself at all times — never a button that appears because the app decided you might want it, never a tooltip, never a first-run tour, never "New!" copy, never something that only shows up on a page missing content.** The nearest real-world analogy the design law already uses is exactly right: the pen is always in the same place and is never handed to anyone. Applied here, the tool tray (or a direct gesture on the page itself — long-press, or a persistent unlabeled icon at the tray's Stage-2 slot) is simply *always there* to be found by someone exploring the object, the same way a real scrapbooking table has scissors sitting at its edge whether or not you reach for them today. **This spec does not prescribe the exact gesture** — that is Design-Lead's call under the material law — but the product requirement is absolute: nothing about entering edit mode may differ in visibility between a page that has never been composed and one that has been composed fifty times, and nothing may call attention to the affordance's existence beyond it simply being there to find.

## Out of Scope

- The visual and material treatment of the tools themselves (scissors, tape, pen craft, placement gestures on a phone) — Design-Lead, in parallel.
- The persisted data model and migration for composition overrides — CTO. Flagged below as touching schema, which is at minimum Full tier and, if it is a migration, Irreversible tier per `CLAUDE.md`'s QA gate table.
- A freeform page not tied to any calendar day. Adam's ask was specifically about a *day's page* holding more than one image; an unattached page is a natural v2 extension, not decided against here, just not this build.
- Real-time or simultaneous co-editing of the same page by both partners at once. Not required for v1; each edit is a discrete save.
- Any rendered-image snapshot of a composed page inside the export bundle. The export's obligation is met by the original photograph files plus a plain-data composition record (see "Archive immutability"); a rendered snapshot is a nice-to-have CTO may add later.
- Composing on Today. Today's mechanic (one thing left, the sealed-card ceremony) is unchanged; composition applies to Book pages only.
- Any AI-suggested arrangement, auto-decoration, or "smart" composition assistance.

## User Stories

- As either partner, I want to add more than one photograph to a day's page, so that the page can hold what the day actually looked like rather than being capped at one photo each.
- As either partner, I want to pull a photograph from a different day onto a page I'm arranging, so that I can put related memories together the way I would in a physical scrapbook.
- As either partner, I want to place, rotate and decorate photographs on a page by hand, so that the Book feels like something I made rather than something that assembled itself.
- As either partner, I want to know a page has been reworked without being told to go look at it, so that the change is visible without becoming a demand on my attention.
- As either partner, I want to undo my own arrangement and get back the page the app would have made automatically, so that composing never feels like a decision I can't take back.

## Acceptance Criteria (Definition of Done)

- [ ] Given a page with an automatic layout, when either partner opens edit mode on that page, then they can select photographs from anywhere in the archive — not only that day's own two — and place, rotate, re-mount and decorate them, with no prepared slot or empty-well ever rendered as part of that flow.
- [ ] Given a page that has been composed by hand, when the other partner opens that page later, then it renders in its most recently composed state, at full photographic strength, with no "seen," "new," or unread indicator anywhere in the app triggered by the change.
- [ ] Given a page that has been composed, when either partner chooses to return to the automatic arrangement, then the reset is always available and produces exactly the deterministic layout the page would show had it never been touched.
- [ ] Given a photograph placed onto a composed page belonging to a day other than its own, when the archive is exported, then that photograph's file appears exactly once, in the dated folder of the day it was actually taken or posted — never duplicated, never relocated — and the composition record referencing it is present as plain, human-readable data, not a binary requiring app code to interpret.
- [ ] Given any page in the Book that neither partner has ever opened in edit mode, when either partner views it, then it looks exactly as it does today — no new visual element is added anywhere in the Book that announces the page *could* be arranged.
- [ ] Given a page composed by one partner, when the other partner opens it, then a single small, typeset (Outfit, not handwritten) line states who last arranged the page and when, in absolute terms — and this line is the only visibility mechanism triggered by composing; no push notification, badge, or dock/cover indicator fires as a result.
- [ ] Given either partner composing a page that carries a photograph the other partner authored, when they move, re-mount, or decorate that photograph on the shared page, then the action succeeds — but the underlying photograph row, its caption text, and its authorship are never altered, and it remains fully intact and reachable on its own day regardless of what any composed page currently shows.
- [ ] Given the photo picker inside edit mode, when a partner browses the archive to select a photograph, then no `vault_items` row is ever selectable, listed, or placeable on any Book page, under any composition state.

## RICE Score

Reach: 2 | Impact: 3 | Confidence: 80% | Effort: 3 weeks | Score: 1.6

- Reach: 2 **(fact — fixed population)**. `PRODUCT-VISION-V2.md` §0 already argues, and this spec agrees, that a reach-based prioritization arithmetic is noise at n=2 — there is no backlog this competes against; the founder directed this build today. Included only to satisfy the completeness gate, not as a ranking signal.
- Impact: 3, massive **(fact)**. This is the loudest thing the founder said on opening the app today, ranked ahead of layout/proportion bugs raised in the same sitting, and he chose the direction that "changes the Book's nature" over three smaller alternatives.
- Confidence: 80% **(assumed)**. The core mechanic is founder-locked; three sub-questions (who may compose, exact discovery gesture, whether a rendered export snapshot is worth building) remain genuinely open and could narrow scope after founder review.
- Effort: 3 weeks **(assumed — low confidence, CTO must confirm)**. New persisted composition-override data model plus a migration (Irreversible tier — schema change), archive-wide photo picker, placement/decoration UI reusing existing `<Mounted>`/`compose.ts` primitives, reset-to-auto, the composed-by stamp, and an export-pipeline extension. This is the largest single feature built on this project to date by the founder's own framing ("the biggest build").

## Open Questions for Founder

1. **Q: May either partner rework a page containing the other's photograph, including moving or re-mounting the other's photo on their shared page — or is each person's composing limited to their own half of a page?**
   Recommendation: either partner, full page, on the reasoning in "Who may compose" above (composing is non-destructive and always reversible, unlike the `feat/unilateral-remove` precedent it might otherwise be confused with). Why it's still open: it's a real decision about a genuinely shared object, and the brief that produced this spec explicitly asked that this exact question not be decided quietly.

2. **Q: Is a single small "arranged by [name], [date]" line — visible only on that page, never pushed or badged — the right amount of change-visibility, or is even that too much?**
   Recommendation: ship it. It is the minimum needed so a page changing under someone doesn't feel concealed, and it deliberately answers "what changed" rather than "have you looked," which is the line the founder drew between banned seen-status and allowed change-visibility. Why it's open: "too little" and "too much" both have real costs here — too little risks a page feeling like it changed behind someone's back; too much risks the label itself becoming a quiet tally of who composes more (§7's argument against, below).

3. **Q: Should the export additionally include a rendered image of each composed page (so it's viewable at a glance outside the app), or is the plain-data composition record plus the original photograph files enough to satisfy §6's "openable on a laptop in ten years" promise?**
   Recommendation: plain data is enough for v1 — the promise in §6 is about the photographs and what was written about them, not about recreating this specific app's paper-and-tape rendering outside of it. A rendered snapshot is real, deferrable cost. Why it's open: it's a genuine trade-off between archival completeness and build cost, and it's the founder's archive to prioritize.

## Argument Against

The strongest case against building this: **the Book's entire current virtue is that it requires nothing, and this adds an obligation shape to the one surface in the product that was designed to have none.**

Today, a page exists whether or not anyone shows up — the Tuesday test (`DESIGN-LAW` §6) is passed by bare paper being worth looking at on its own. Composing introduces an activity with real time cost (choosing photographs, placing, taping, writing), and even without a single counter, streak, or notification, the *capability existing* changes what an empty auto-composed page silently says: it used to mean "nothing else was true of this day," and now it can also mean "nobody has bothered to make this day's page nice yet." That second reading is a verdict the product has spent two design passes deliberately trying not to render (`PRODUCT-VISION-V2.md` §2.2, *"the product may render what happened; it may never classify a day by how many people contributed to it"*) — and this spec's own recommended composed-by stamp, if either partner composes noticeably more than the other, risks becoming exactly the kind of visible-effort tally the project has explicitly banned in every other register (§4.2: *"never record or display who left more"*). I believe the mitigations in this spec (no solicitation, no badge, reset always available, the stamp states a fact about one page rather than comparing two people) hold that line — but they are mitigations against a risk this feature itself creates, not a risk that exists today.

The second cost is opportunity cost, stated plainly because the founder's own framing named it: this is *"the biggest build"* of the options on the table, on the one surface (the Book) this project has already spent two full waves on, while `PRODUCT-VISION-V2.md` §7's own list of fatal risks — Eva never having been asked anything, the export/credential/availability track in §6 still being partly open, Dates and Echo still being real, unbuilt destinations per today's own `DECISIONS.md` — sit unresolved. None of those are made worse by building this, but none of them are made better either, and every week spent here is a week not spent closing a gap that could sink the product outright rather than merely polish it.

The founder has already chosen the largest of four options with these costs visible in the original framing, so this is recorded as an argued flag, not a recommendation to reverse course.

## Tech notes for CTO

- **`apps/web/components/spread/Spread.tsx`** and **`apps/web/components/book/compose.ts`** are the current auto-composition engine — deterministic, seeded from each item's stable database ID, never re-rolls. This must remain the fallback a page renders when no composition override exists; do not fork or duplicate this logic for the composed path, wrap it.
- **`apps/web/components/chrome/Dock.tsx`** already anticipates edit mode structurally: *"the editing tools arrive as additional `<TrayTool>` children when edit mode is found — the tray itself does not change."* Build against that seam rather than adding new chrome.
- **Schema — flag before building:** `apps/web/supabase/migrations/20260802090500_book_entries.sql` exists but its own header states application status is unknown, and it encodes a *different* architecture than the one currently shipping (`position`-ordered pages, one page per photo or per finished date, and — load-bearing for this spec — `book_entries_photo_idx` enforces **a photograph appears in the book at most once**). That constraint directly conflicts with this spec's Q5 answer, that a photograph can be referenced from a composed page belonging to a day other than its own while remaining visible on its own day. Confirm whether `book_entries` is live/relevant at all relative to the current `photos` + `shared_day` architecture Spread.tsx actually reads from, or whether it's an orphaned table from a superseded design. A new composition-override table (page → ordered list of photo references + placement metadata) is very likely needed regardless.
- **Any schema change here is a migration** — per `CLAUDE.md`'s QA gate table, DB migrations are Irreversible tier: Full review + 2-of-3 multi-judge + founder sign-off, sequenced database-engineer before backend-engineer.
- **Vault boundary must be preserved structurally, not by convention** — the current `book_entries` table has no foreign key to `vault_items` at all, so a vault item literally cannot be placed in the book. Whatever replaces it for composition must preserve that same structural impossibility (no FK path, not just a filtered query).
- **Export pipeline** — coordinate with whoever owns the B1 export engine track (`DECISIONS.md`, 2026-08-03 archive-survival entries). The composition-override record should ship as a plain-data sidecar per exported day/page; confirm the export tool's existing format before inventing a new one.
- **`lib/shared-day/` is untouched by this feature** — composition is a presentation layer over the existing pairing engine, not a change to it.
