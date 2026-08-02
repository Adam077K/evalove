---
name: board-meeting
description: Run a 4-round multi-persona board meeting on a strategic decision. 6 personas (Visionary, Strategist, Architect, Risk Modeler, Customer Voice, Adversary) deliberate independently with de-anchored framings, cross-critique, then a fresh-context Synthesizer lands a structured decision document. $3/meeting cap, 8/month max. Adam-veto required before decisions propagate. Spec: docs/08-agents_work/ORCHESTRATION.md §2F.
---

# /board-meeting <topic-slug>

Use this command when a decision is irreversible-tier or board-grade — architectural, strategic, vendor, or pricing changes that warrant structured dissent before locking.

## When to invoke

| Trigger | Examples |
|---|---|
| Architectural decision >$1M reversible cost | "Migrate from Mem0 to custom MCP" |
| Strategic pivot or new initiative | "Launch B2C tier", "Open-source the agent layer" |
| Risk-tier shift on irreversible change | "Auto-merge >100-line PRs without QA-Lead" |
| Competitor signal threshold | "Profound launches X — do we respond?" |
| Vendor decision | "Drop Paddle for Stripe?" → Aria persona activated |

## Protocol (4 rounds)

The full protocol is specified in `docs/08-agents_work/ORCHESTRATION.md` §2F. Quick version:

1. **Round 0 — De-anchored framings.** CEO writes 5 differently-framed versions of the topic, one per persona, to prevent topic-prompt anchoring.
2. **Round 1 — Independent.** 6 personas spawned in parallel via Task. Each sees only its own framing. Returns Zod-validated JSON.
3. **Round 2 — Cross-critique.** Each persona reads the other 5 outputs. Returns updated JSON with `changed_mind_on`, `peer_critiques`, `remaining_dissent`.
4. **Round 3 — Synthesizer (Opus, fresh-context Routine).** Reads all 12 R1+R2 outputs. Returns `locked_decisions` with mandatory `source_persona_round` traceability — mechanical anti-hallucination guard.

After Round 3: **Adam-veto checkpoint.** Synthesizer posts to a Linear ticket and Telegram-pings Adam. Adam replies `accept | reject | revise`. Decisions do NOT enter DECISIONS.md until Adam approves.

## Personas (6 voices, locked)

| Persona | Model | Lens |
|---|---|---|
| Visionary | opus | 18-month flywheel — what does this enable? |
| Strategist | sonnet | ANTI-ROADMAP — what we DON'T do |
| Architect | opus | BOM, complexity, rollback cost |
| Risk Modeler | opus | Failure modes, attack surface |
| Customer Voice | sonnet | Churn, friction, acquisition |
| Adversary | opus | Two flavors per `decision_type` field: |

**Adversary branching:**
- `decision_type: vendor` → **Aria** persona (procurement-grade reviewer; contract clauses, SLAs, security)
- `decision_type: strategic` (default) → **broad-Adversary** persona (strongest critic of the thesis regardless of domain)

## How to invoke

### Slash command (interactive Claude Code session)
```
/board-meeting <topic-slug>
```

CEO drafts the topic statement, Adam approves, CEO dispatches.

### Linear ticket (autonomous)
File a Linear ticket with labels:
- `board-meeting`
- `agent:strategist`
- `decision_type:vendor` OR `decision_type:strategic`

The Cloudflare bridge sees the labels, fires CEO with `trust_mode: true` synth-only spec to run the protocol unattended.

## Hard caps

- $3 per meeting (each persona ~$0.30-0.50)
- 8 meetings per month max
- 30 minutes wall-clock target (parallel Rounds 0+1+2 ~10 min each, Round 3 ~5-10 min)
- Synthesizer cannot fabricate decisions: every `locked_decision` must have `source_persona_round` matching one of the 12 R1+R2 outputs (Zod-enforced)
- No locked_decision propagates to DECISIONS.md without Adam's `accept` veto-check reply

## Output artifact

`docs/08-agents_work/board-meetings/YYYY-MM-DD-<topic-slug>-r<NN>.md`

Contains:
- Topic statement (and 5 Round-0 framings)
- All 12 JSON outputs (rendered as readable sections)
- Synthesizer's `locked_decisions` with traceability
- Adam-action items
- `preserved_dissents` block

## Reading the artifact

The Friday Retro Routine reads only Adam-`accept`-veto'd board-meeting artifacts. Use the artifact to audit reasoning quality:
- Did the Synthesizer's `source_persona_round` traceability hold?
- Did the personas meaningfully diverge in Round 1, or did they converge?
- Was `remaining_dissent` preserved or did it shrink artificially?

WS6A produces a persona-distinction baseline (1 synthetic board meeting + measure % uniqueness per persona). If <40%, revisit roster.
