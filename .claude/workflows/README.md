# Evalove T5 Workflow Library

Deterministic multi-agent workflows the **CEO** runs via the `Workflow` tool for **T5** tasks
(big / mid+ coding, design, research, QA). The script — not an agent — spawns the fleet, so the
nested-Task block does not apply and fan-out is cheap (Sonnet workers, Opus judge, Haiku trivial).

See `.claude/agents/ceo.md` → "Topology classification" and the topology memory for when T5 fires.

| Script | Invoke | Required args | Returns |
|--------|--------|---------------|---------|
| `qa.js` | `Workflow({name:"qa", args})` | `tier: "full"\|"irreversible"` (+ optional `ref`, `context`) | **binding** `verdict: PASS\|BLOCK` + blockers |
| `coding.js` | `Workflow({name:"coding", args})` | `slices: [{id, agentType, brief, files}]` (+ `tier`) | per-slice results + chained QA verdict |
| `design.js` | `Workflow({name:"design", args})` | `brief` (+ `target`, `variations`, `reference`) | winning direction + build-ready spec |
| `research.js` | `Workflow({name:"research", args})` | `question` (+ `depth: "standard"\|"deep"`) | cited, confidence-rated brief |

## Shapes
- **qa** — 5 dimension reviewers → 3 adversarial verifiers on *block-eligible* findings only (P1 always; P2 at irreversible — P3/advisory are reported unverified, never block) → Opus judge with a deterministic P1-always-BLOCK override. Strict-majority + quorum vote. Irreversible adds loop-until-dry fresh-eyes rounds (budget-guarded, max 3). Pure vote/verdict logic is unit-tested in `lib/gate-logic.mjs` (`node --test .claude/workflows/lib/gate-logic.test.mjs`).
- **coding** — parallel build slices in isolated worktrees → always chains the combined diff into `qa.js`. Never merges (Adam-gated after PASS).
- **design** — N variations from distinct angles → parallel `design-critic` scoring → Opus synthesis grafting best runner-up ideas.
- **research** — Opus decompose → multi-modal parallel sweep → adversarial per-claim verification → Opus cited synthesis.

## Rules
- Authorization: classifying a task **T5** is the CEO's standing permission to run these. `ultracode` = Adam's manual force-everything override.
- Cost ceiling: **$15** per T5 ticket (vs $10 default). Typical ~15-20 agent run ≈ $3-6; Irreversible loop up to ≈ $15.
- `qa.js` is the sacred gate: a `BLOCK` stops the merge and the **CEO cannot override it**. Only **Adam** may override, via a logged finding-by-finding false-positive appeal (never to bypass a confirmed real defect).
- Models: workers `sonnet`, judges/synthesis `opus`, trivial `haiku`. Matches the locked model-routing rule.
