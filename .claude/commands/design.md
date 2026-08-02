# /design — Professional Design Pipeline

Design a UI component, page, or screen with reference-driven design, brainstorming, layered implementation, and visual verification.

## Usage
```
/design [component, page, or screen description]
```

## What This Does

### Step 1 — CEO Intake & Classification
CEO classifies the task:
- **NEW_PAGE** — Full page from scratch
- **REDESIGN** — Modify existing page/screen
- **COMPONENT** — Single component (button, card, modal)
- **DESIGN_SYSTEM** — Tokens, colors, spacing updates
- **POLISH** — Visual refinement, animations, micro-interactions
- **AUDIT** — Visual consistency check

CEO asks clarifying questions: Who uses this? What states? What mood/aesthetic? Any constraints?

### Step 2 — Design Lead: Research & References
Design Lead gathers inspiration BEFORE designing:
1. **Refero MCP** — Search real-world UI screens and flows for reference
2. **Playwright MCP** — Screenshot reference URLs + current app state
3. Compile a **Reference Board** (3-5 inspirations with notes on what to borrow)
4. Read existing components — understand current design language

### Step 3 — Brainstorm with User (for big tasks)
For NEW_PAGE and REDESIGN:
1. Present reference board to user
2. Ask: "Which reference feels closest? What elements do you like?"
3. Discuss structure, mood, constraints
4. Align on direction BEFORE any design or code

For COMPONENT/POLISH/DESIGN_SYSTEM: brainstorm if spec is unclear, skip if clear.

### Step 4 — Architecture & Structure (for big tasks)
For NEW_PAGE and REDESIGN:
1. Define sections, information hierarchy, user journey
2. Create wireframe-level structure
3. Present wireframe to user for approval

### Step 5 — Layered Design
Design in 4 layers (not all at once):
1. **Layout & Grid** — sections, spacing, responsive breakpoints
2. **Typography & Colors** — fonts, sizes, brand palette application
3. **Content & Media** — text, images, icons, data visualization
4. **Animation & Motion** — entry animations, hover states, transitions

Design Lead chooses tools:
- **Pencil MCP** — precise visual design in .pen files
- **Stitch MCP** — AI-generated screens + variants for exploration
- **Code-first** — direct Tailwind/React (Design Lead has full code authority)
- Can use **multiple tools** and compare approaches

### Step 6 — Implementation
Design Lead either:
- **Implements directly** (for COMPONENT, POLISH, small changes)
- **Dispatches Frontend Developer** with a rich reference package (references, brand tokens, Stitch screens, taste-skill dials, animation specs)
- **Parallel waves** for big pages (multiple Frontend Developers on different sections)

### Step 7 — Visual Verification
After implementation:
1. **Playwright** screenshots at mobile/tablet/desktop
2. Compare against design intent and references
3. Run `ui-visual-validator` 13-point checklist
4. Self-critique: "Would a professional designer be proud of this?"

### Step 8 — Design Critic Review Loop
1. Spawn **Design Critic** agent for external perspective
2. Critic reviews from user POV + professional designer POV
3. Returns prioritized feedback: CRITICAL / SHOULD_FIX / NICE_TO_HAVE
4. Fix all CRITICAL and SHOULD_FIX issues
5. Re-screenshot, re-verify
6. **Loop until quality bar is met** (no fixed cap)

### Step 9 — Quality Gate
1. **WCAG accessibility check** via QA Lead (PASS required)
2. **Responsive verification** (375px, 768px, 1024px, 1440px)
3. **Brand compliance** (colors, fonts, spacing, icons)
4. **Anti-slop check** (taste-skill rules)

### Step 10 — User Review & Approval
Present final result with desktop + mobile screenshots. User approves or requests changes.

## MCP Tools Used
- **Refero** — reference gathering (search screens, flows, get details)
- **Stitch** — AI screen generation and variant exploration
- **Pencil** — precise visual design in .pen files
- **Playwright** — screenshots, responsive testing, reference capture

## Skills Loaded (by task type)
- **All tasks:** `taste-skill` (mandatory base)
- **NEW_PAGE:** + `frontend-design`, `design-orchestration`, `web-design-guidelines`
- **REDESIGN:** + `frontend-design`, `ui-visual-validator`
- **COMPONENT:** + `core-components`, `radix-ui-design-system`
- **POLISH:** + `emilkowal-animations`, `react-view-transitions`
- **AUDIT:** + `ui-visual-validator`, `web-design-guidelines`, `wcag-audit-patterns`

## Agents Involved
- **Design Lead** — orchestrates the full pipeline
- **Frontend Developer** — implements from design reference package
- **Design Critic** — external review from user + designer perspective
- **QA Lead** — WCAG accessibility gate

## Abort Conditions
- Missing spec (no states defined) → Design Lead asks user in brainstorm
- Existing component covers this → return existing path, no new work
- WCAG BLOCK → fix before shipping
- Design Critic CRITICAL issues → fix before shipping
- User rejects direction → back to brainstorm

## Notes
- **References are mandatory** — Refero is always searched before designing
- **Brainstorm is mandatory** for NEW_PAGE and REDESIGN
- **All 4 states required** — loading, empty, error, success
- **No generic AI slop** — taste-skill rules enforced throughout
- **Critique loop has no fixed cap** — iterates until quality bar is met
- **Design Lead has full code authority** — can implement directly or delegate
- **MCP graceful fallback** — if any MCP is unavailable, pipeline continues with alternatives
