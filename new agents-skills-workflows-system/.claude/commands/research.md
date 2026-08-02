# /research — Deep Research Mode

Deep, sourced research on any topic.

## Usage
```
/research [topic or question]
```

## What This Does

### Step 1 — Research Lead Intake
Research Lead reads USER-INSIGHTS.md (to build on prior research), clarifies:
- Is this competitive? market? technical? user research?
- Overview or deep-dive?
- What decision will this research inform?

### Step 2 — Decompose into Parallel Threads
Research Lead breaks question into 2-4 specific threads:
- Thread 1: [specific question 1]
- Thread 2: [specific question 2]
- Thread 3: [specific question 3]

### Step 3 — Dispatch Researchers
Researcher workers run in parallel (each on one thread). Each researcher:
1. Checks Context7 for technical docs
2. Fetches official documentation
3. WebSearch for market/competitive info (multiple sources)
4. Returns structured findings with sources + confidence levels

### Step 4 — Synthesis
Research Lead synthesizes all findings into a structured report.

### Step 5 — Output

```
## Research Report: [Topic]

### Key Findings
- [Finding] — Source: [URL] — Confidence: HIGH
- [Finding] — Source: [URL] — Confidence: MEDIUM

### Implications
- [What this means for your project]
- [What decisions this informs]

### Gaps
- [What couldn't be verified]
- [What additional research would help]

### Overall Confidence: HIGH / MEDIUM / LOW
[Rationale]

### Sources
1. [URL] — [description]
2. [URL] — [description]
```

### Step 6 — Memory Update
If user/market insights found: Research Lead updates `.claude/memory/USER-INSIGHTS.md`.

## Notes
- Every claim has a source — no unsourced statements
- Confidence levels are required for every key finding
- Research Lead uses Opus 4.6 for synthesis quality
- Researchers can run in parallel — report takes same time as longest single thread
