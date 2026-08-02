# design-screen — Evalove Design Operating System Workflow

The ultracode orchestration script for the Evalove design pipeline. One screen in, one
craft-validated screen out, graded against the founder's reference folder.

## What it does

Encodes the `REFERENCE -> DIRECTION -> BUILD -> VALIDATE(loop)` pipeline as a
deterministic `.claude/workflows` Workflow. Given a screen name, it:

1. Loads the screen's reference contract (`docs/design/references/[screen]/`) plus the
   global product-feel set (`docs/design/references/_product-feel/`) — references are
   **vibe, not blueprint** — and design-lead distills the **DIRECTION** here (the one
   memorable element, the primary layout move, the motion-budget tier). The DIRECTION
   stage of the pipeline runs inside this first phase, feeding the build.
2. Runs the dedicated front-end **product-designer** to BUILD the screen in Evalove's own
   design language.
3. Runs a **design-critic <-> design-polisher** loop: the critic grades CRAFT-PARITY &
   FEELING vs the references (never 1:1 copy-fidelity); the polisher closes the named
   craft gaps. Repeat until PASS or the round cap, then escalate to the founder.
4. Returns the validated screen + Playwright screenshots and the final critic verdict.

## How to invoke

Run via the **Workflow** tool with the registered name and the screen name as args:

```
Workflow(name: "design-screen", args: "dashboard")
Workflow(name: "design-screen", args: "home")
```

`args` is the screen slug — it must match a folder under `docs/design/references/[screen]/`.
The script is plain JavaScript run by the workflow harness; `agent`, `parallel`,
`pipeline`, `phase`, `log`, and `args` are injected globals (async context — `await`
directly). Wall-clock and randomness are unavailable inside the harness.

## Founder checkpoints (3 — the script PAUSES and escalates, never auto-continues)

1. **LOCK the reference folder** — before any build. The visual contract that captures
   taste. The script verifies the folder exists; if it is missing/empty it stops and
   asks the founder to populate `docs/design/references/[screen]/` + `REFERENCE.md`.
2. **~50% FIRST-PAINT build** — after the designer's first build, before the polish loop
   grinds. The script surfaces the first-paint screenshots for the founder to react to.
3. **JUDGE the final** — the validated screen + screenshots are returned for the
   founder's final approval. PASS from the critic is necessary, not sufficient.

The harness cannot block on human input mid-run, so each checkpoint is emitted as a
`log()` narrator line + a structured `checkpoint` field in the result. The CEO/design-lead
relays it to the founder and re-invokes if changes are requested.

## Runtime mode

Subagents cannot spawn subagents (nested Task is blocked), so this Workflow is the
deterministic orchestrator: it calls `agent(..., { agentType })` for each role directly.
This is the alternative to the design-lead dispatch-packet mode — use the Workflow when
you want the loop run mechanically; use design-lead when a human-in-the-loop chief is
steering. Both are documented in the design OS spec.

---

```js
export const meta = {
  name: "design-screen",
  description:
    "Evalove design pipeline as a deterministic Workflow: load the screen's reference folder + global product-feel, run the product-designer build, then a design-critic <-> design-polisher loop until craft-parity with the references (expressed in Evalove's own language), and return the validated screen + screenshots. References are vibe, not blueprint. Three founder checkpoints (lock refs, 50% first-paint, judge final) are surfaced as stop points.",
  phases: [
    { title: "Reference", detail: "Load the screen folder + _product-feel; lock the contract; design-lead distills the DIRECTION (one memorable move, layout, motion budget)." },
    { title: "Build", detail: "product-designer builds the screen in Evalove's own design language." },
    { title: "First paint", detail: "Founder checkpoint #2 — surface the ~50% first-paint screenshots." },
    { title: "Validate loop", detail: "design-critic grades craft-parity; design-polisher closes the gaps; repeat to PASS or cap." },
    { title: "Judge", detail: "Founder checkpoint #3 — return the validated screen + screenshots for final judgment." }
  ]
};

// Max critic<->polisher rounds before escalating to the founder.
const MAX_ROUNDS = 4;

const screen = (args || "").toString().trim();
if (!screen) {
  log("No screen name passed. Invoke as Workflow(name: 'design-screen', args: '<screen-slug>').");
  return {
    status: "BLOCKED",
    reason: "missing_screen_arg",
    hint: "args must be the screen slug, matching a folder under docs/design/references/[screen]/"
  };
}

const screenRefDir = `docs/design/references/${screen}/`;
const productFeelDir = `docs/design/references/_product-feel/`;

// ---------------------------------------------------------------------------
// PHASE 1 — REFERENCE  (Founder checkpoint #1: LOCK the reference folder)
// ---------------------------------------------------------------------------
phase("Reference");
log(`Loading reference contract for "${screen}".`);

const reference = await agent(
  `You are the design-lead assembling the reference contract for the Evalove screen "${screen}".

PRINCIPLE — references are VIBE, not BLUEPRINT. You catalogue the FEELING, craft level, and
aesthetic confidence to transfer. Cloning layouts 1:1 is forbidden downstream.

Do this:
1. Read every file in "${productFeelDir}" — the GLOBAL whole-product soul, loaded on every screen.
2. Read every file in "${screenRefDir}" — this screen's north-star references + Refero-expanded
   real-pixel screens + REFERENCE.md ("what we steal: the FEELING/move, not the layout").
3. Decide whether the reference folder is LOCKED: it is locked only if "${screenRefDir}" exists,
   is non-empty, and contains a REFERENCE.md. If it is missing or empty, the founder has not yet
   set the visual contract — this is FOUNDER CHECKPOINT #1 and you must stop.

Return JSON ONLY:
{
  "locked": true|false,
  "screen": "${screen}",
  "product_feel_files": ["docs/design/references/_product-feel/..."],
  "screen_ref_files": ["docs/design/references/${screen}/..."],
  "feeling_brief": "2-4 sentences: the richness/confidence/polish to hit, expressed for Evalove",
  "direction": "the DIRECTION for the build: the one memorable element, the primary layout move, and the motion-budget tier (1/2/3) — expressed for Evalove",
  "what_we_steal": ["the move/feeling, never the layout", "..."],
  "missing": ["only if not locked: what the founder must add"]
}`,
  {
    label: `reference:${screen}`,
    phase: "Reference",
    agentType: "design-lead",
    schema: {
      type: "object",
      required: ["locked", "screen", "feeling_brief"],
      properties: {
        locked: { type: "boolean" },
        screen: { type: "string" },
        product_feel_files: { type: "array", items: { type: "string" } },
        screen_ref_files: { type: "array", items: { type: "string" } },
        feeling_brief: { type: "string" },
        direction: { type: "string" },
        what_we_steal: { type: "array", items: { type: "string" } },
        missing: { type: "array", items: { type: "string" } }
      }
    }
  }
);

if (!reference || !reference.locked) {
  log("FOUNDER CHECKPOINT #1 — reference folder not locked. Stopping before any build.");
  return {
    status: "AWAITING_FOUNDER",
    checkpoint: "lock_reference_folder",
    screen,
    reason: "The visual contract is not set. Populate the reference folder, then re-invoke.",
    needs: (reference && reference.missing) || [
      `${screenRefDir} with 2-3 founder north-star references`,
      `${screenRefDir}REFERENCE.md noting the feeling/move to steal`,
      `${productFeelDir} global product-feel set (set once)`
    ]
  };
}

log(`Reference contract LOCKED for "${screen}". Feeling: ${reference.feeling_brief}`);

// ---------------------------------------------------------------------------
// PHASE 2 — BUILD  (product-designer builds in Evalove's own language)
// ---------------------------------------------------------------------------
phase("Build");
log(`product-designer building "${screen}".`);

const build = await agent(
  `You are the dedicated front-end product-designer building the Evalove "${screen}" screen.

LOAD BOTH reference sets BEFORE any code:
- Global product-feel: read all of "${productFeelDir}".
- This screen's contract: read all of "${screenRefDir}" including REFERENCE.md.

VIBE, NOT CLONE: absorb the references' richness/confidence/polish, then SYNTHESIZE something
ORIGINAL in Evalove's own design language. Inspired-by, never traced. Do NOT reproduce a
reference layout 1:1.

Feeling to hit: ${reference.feeling_brief}
Direction (the build target — one memorable element, primary layout move, motion tier): ${reference.direction || "(synthesize from the feeling brief + references)"}
What we steal: ${JSON.stringify(reference.what_we_steal || [])}

Hard-wired craft (always on): design-taste-frontend, high-end-visual-design, emilkowal-animations,
honor the project's brand bar (accent color, type scale, spacing, motion budget) — load the project's
brand/design-system skill if one exists (AUTHORITATIVE on conflict with generic skills), frontend-design,
humanizer (all copy), full-output-enforcement (zero stubs/TODOs). Apply the generic skills' techniques
with Evalove's locked brand tokens.

Build the real screen as shippable TSX + Tailwind with ALL FOUR states (loading skeletons, composed
empty, inline error, success). Create a worktree, commit atomically, run pnpm typecheck + lint clean,
then capture Playwright screenshots at desktop (1440), tablet (768), and mobile (375).

Return JSON ONLY:
{
  "status": "COMPLETE"|"BLOCKED",
  "agent": "product-designer",
  "screen": "${screen}",
  "branch": "design/<slug>",
  "worktree": ".worktrees/design-<slug>",
  "files_changed": ["apps/web/src/..."],
  "commits": ["design(<scope>): ..."],
  "screenshots": ["absolute path or base64 per breakpoint"],
  "summary": "2 sentences max",
  "blockers": []
}`,
  {
    label: `build:${screen}`,
    phase: "Build",
    agentType: "product-designer",
    schema: {
      type: "object",
      required: ["status", "agent", "screen", "screenshots"],
      properties: {
        status: { type: "string" },
        agent: { type: "string" },
        screen: { type: "string" },
        branch: { type: "string" },
        worktree: { type: "string" },
        files_changed: { type: "array", items: { type: "string" } },
        commits: { type: "array", items: { type: "string" } },
        screenshots: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
        blockers: { type: "array", items: { type: "string" } }
      }
    }
  }
);

if (!build || build.status === "BLOCKED") {
  log("Build BLOCKED. Returning blockers for design-lead/founder to resolve.");
  return {
    status: "BLOCKED",
    screen,
    stage: "build",
    reference,
    build: build || null
  };
}

const branch = build.branch || `design/${screen}`;
const worktree = build.worktree || `.worktrees/design-${screen}`;
let screenshots = build.screenshots || [];

// ---------------------------------------------------------------------------
// FOUNDER CHECKPOINT #2 — ~50% FIRST-PAINT build
// ---------------------------------------------------------------------------
phase("First paint");
log("FOUNDER CHECKPOINT #2 — first-paint build ready. Surface to founder before the polish grind.");
const firstPaint = {
  checkpoint: "first_paint_50pct",
  branch,
  worktree,
  screenshots,
  summary: build.summary || ""
};

// ---------------------------------------------------------------------------
// PHASE 3 — VALIDATE LOOP  (design-critic <-> design-polisher to craft-parity)
// ---------------------------------------------------------------------------
phase("Validate loop");

let verdict = null;
let round = 0;
const rounds = [];

while (round < MAX_ROUNDS) {
  round += 1;
  log(`Critic pass ${round}/${MAX_ROUNDS} for "${screen}".`);

  const critic = await agent(
    `You are the design-critic grading the Evalove "${screen}" build against its reference folder.

GRADE CRAFT-PARITY & FEELING, NEVER COPY-FIDELITY. Forbidden question: "does this match reference X
1:1?" Required question: "does this hit the same richness/confidence/polish as the references,
expressed as Evalove?" PASS = indistinguishable in CRAFT-LEVEL from the references, in Evalove's own
language — not a pixel match.

Load ui-visual-validator + the project's brand/design-system skill if one exists. Read all of "${productFeelDir}" and all of
"${screenRefDir}". Take Playwright screenshots of the BUILD (worktree ${worktree}, branch ${branch})
at desktop/tablet/mobile and compare them SIDE-BY-SIDE against the reference images. Score the
RICHNESS GAP: depth, micro-interactions, signature details, motion choreography, density of
considered detail, brand-token discipline (honor the project's brand bar: accent color, type scale, spacing, motion budget, all four states).

Return a SPECIFIC "here is what's missing to reach the references' craft bar, expressed as Evalove"
list. Be measurable ("40px gap; system specifies 24px"), never vague. Include 1-3 things working well.

Return JSON ONLY:
{
  "verdict": "PASS"|"NEEDS_WORK"|"CRITICAL_ISSUES",
  "agent": "design-critic",
  "screen": "${screen}",
  "round": ${round},
  "richness_gap": "1-3 sentences naming the gap to the references' craft bar",
  "working_well": ["..."],
  "findings": [{ "severity": "CRITICAL|SHOULD_FIX|NICE_TO_HAVE", "location": "...", "issue": "...", "fix": "..." }],
  "screenshot_paths": ["..."]
}`,
    {
      label: `critic:${screen}:r${round}`,
      phase: "Validate loop",
      agentType: "design-critic",
      schema: {
        type: "object",
        required: ["verdict", "agent", "screen", "findings"],
        properties: {
          verdict: { type: "string" },
          agent: { type: "string" },
          screen: { type: "string" },
          round: { type: "number" },
          richness_gap: { type: "string" },
          working_well: { type: "array", items: { type: "string" } },
          findings: {
            type: "array",
            items: {
              type: "object",
              required: ["severity", "location", "issue", "fix"],
              properties: {
                severity: { type: "string" },
                location: { type: "string" },
                issue: { type: "string" },
                fix: { type: "string" }
              }
            }
          },
          screenshot_paths: { type: "array", items: { type: "string" } }
        }
      }
    }
  );

  verdict = critic;
  rounds.push(critic);
  if (critic && Array.isArray(critic.screenshot_paths) && critic.screenshot_paths.length) {
    screenshots = critic.screenshot_paths;
  }

  if (critic && critic.verdict === "PASS") {
    log(`Critic PASS on round ${round}. Craft-parity reached (in Evalove's language).`);
    break;
  }

  if (round >= MAX_ROUNDS) {
    log(`Round cap (${MAX_ROUNDS}) hit without PASS. Escalating to the founder.`);
    break;
  }

  const gaps = (critic && critic.findings) || [];
  log(`design-polisher closing ${gaps.length} craft gap(s) for round ${round + 1}.`);

  const polish = await agent(
    `You are the design-polisher. Your SOLE job is adding CRAFT DENSITY to the Evalove "${screen}" build
to close the gaps the critic named — against the reference folder, AFTER the functional build is done.

Worktree ${worktree}, branch ${branch}. Read all of "${productFeelDir}" and all of "${screenRefDir}".
Load the project's brand/design-system skill (AUTHORITATIVE tokens) + emilkowal-animations + design-taste-frontend +
high-end-visual-design + humanizer for any copy.

Add depth, micro-interactions, signature details, and motion choreography (emilkowal: animate only
transform/opacity, ease-out entering, 200-400ms UI, prefers-reduced-motion fallback). Stay in Evalove's
own design language with locked brand tokens. No new business logic (that is frontend-engineer's lane). Zero stubs/TODOs.

Address these critic findings:
${JSON.stringify(gaps, null, 2)}

Richness gap to close: ${(critic && critic.richness_gap) || ""}

Commit atomically, run pnpm typecheck + lint clean, re-capture Playwright screenshots at
desktop/tablet/mobile.

Return JSON ONLY:
{
  "status": "COMPLETE"|"BLOCKED",
  "agent": "design-polisher",
  "screen": "${screen}",
  "branch": "${branch}",
  "worktree": "${worktree}",
  "files_changed": ["apps/web/src/..."],
  "commits": ["design(polish/<scope>): ..."],
  "gaps_closed": ["..."],
  "screenshots": ["..."],
  "blockers": []
}`,
    {
      label: `polish:${screen}:r${round}`,
      phase: "Validate loop",
      agentType: "design-polisher",
      schema: {
        type: "object",
        required: ["status", "agent", "screen"],
        properties: {
          status: { type: "string" },
          agent: { type: "string" },
          screen: { type: "string" },
          branch: { type: "string" },
          worktree: { type: "string" },
          files_changed: { type: "array", items: { type: "string" } },
          commits: { type: "array", items: { type: "string" } },
          gaps_closed: { type: "array", items: { type: "string" } },
          screenshots: { type: "array", items: { type: "string" } },
          blockers: { type: "array", items: { type: "string" } }
        }
      }
    }
  );

  if (polish && Array.isArray(polish.screenshots) && polish.screenshots.length) {
    screenshots = polish.screenshots;
  }

  if (!polish || polish.status === "BLOCKED") {
    log("Polish BLOCKED. Escalating to the founder mid-loop.");
    return {
      status: "BLOCKED",
      screen,
      stage: "polish",
      round,
      branch,
      worktree,
      reference,
      first_paint: firstPaint,
      critic: verdict,
      polish: polish || null,
      screenshots
    };
  }
}

// ---------------------------------------------------------------------------
// FOUNDER CHECKPOINT #3 — JUDGE the final
// ---------------------------------------------------------------------------
phase("Judge");
const passed = !!(verdict && verdict.verdict === "PASS");
log(
  passed
    ? "FOUNDER CHECKPOINT #3 — validated screen ready for final judgment."
    : `FOUNDER CHECKPOINT #3 — round cap reached at verdict "${verdict && verdict.verdict}". Founder decides: accept, re-run, or re-lock references.`
);

return {
  status: passed ? "VALIDATED" : "ESCALATED",
  checkpoint: "judge_final",
  screen,
  branch,
  worktree,
  craft_parity: passed,
  rounds_run: round,
  reference,
  first_paint: firstPaint,
  final_verdict: verdict,
  critic_rounds: rounds,
  screenshots,
  founder_action: passed
    ? "Approve to ship, or request changes and re-invoke."
    : "Accept as-is, raise the round cap and re-run, or re-lock the reference folder."
};
```

---

## Loop & checkpoint summary

| Stage | Agent (`agentType`) | Output | Checkpoint |
|-------|---------------------|--------|------------|
| Reference | `design-lead` | locked contract + feeling brief | #1 LOCK (stops if folder unset) |
| Build | `product-designer` | TSX/Tailwind screen + screenshots | — |
| First paint | — | first-paint screenshots surfaced | #2 ~50% FIRST-PAINT |
| Validate loop | `design-critic` -> `design-polisher` | craft-parity verdict + closed gaps | — |
| Judge | — | validated screen + final verdict | #3 JUDGE FINAL |

- **Pipeline shape:** the critic<->polisher loop is sequential by necessity (each polish
  pass depends on the prior critic verdict). `parallel`/`pipeline` are reserved for
  multi-screen runs — fan several screen slugs through this Workflow concurrently, never
  to race the critic against the polisher on one screen.
- **Round cap:** `MAX_ROUNDS = 4`. On cap without PASS the script returns
  `status: "ESCALATED"` rather than shipping unvalidated craft.
- **First application:** the dashboard + home screens.
