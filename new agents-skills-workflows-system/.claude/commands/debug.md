# /debug — Scientific Bug Investigation

Atlas investigates a bug using systematic hypothesis testing. You report symptoms; Atlas finds the cause.

## Usage
```
/debug [describe what's broken]
```

## Examples

```
/debug "users can't log in after password reset"
/debug "payment webhook is silently failing"
/debug "the dashboard shows stale data after refresh"
```

## How It Works

You (the founder) provide:
- What you expected to happen
- What actually happened
- Error messages seen
- When it started / if it ever worked

**You do NOT need to know the cause.** Atlas investigates.

## Atlas's Debug Process

### Phase 1 — Evidence Gathering
Build a picture from observable facts:
- What do we know for certain? (logs, error messages, reproduction steps)
- What are we assuming? (flag every assumption)
- Reproduce the bug reliably before fixing anything

### Phase 2 — Hypothesis Formation
Generate 3+ independent hypotheses BEFORE investigating any:
- Each hypothesis must be falsifiable ("state resets because X" not "something is wrong with state")
- Prioritize by probability × ease to test

### Phase 3 — Systematic Testing
One hypothesis at a time:
- Design an experiment that can DISPROVE the hypothesis
- Make ONE change at a time — multiple changes = you don't know what fixed it
- Record result, conclude, move to next hypothesis

### Phase 4 — Fix and Verify
- Fix root cause (not symptom)
- Verify fix with the original reproduction steps
- Add a test that would catch this regression
- Atomic commit: `fix(scope): [what was wrong and how it's fixed]`

## Restart Protocol

If stuck after 3 failed hypotheses:
1. Write down what you know for certain
2. Write down what you've ruled out
3. Generate fresh hypotheses — different angles from before
4. Start Phase 1 again with fresh eyes

**The fix working but not knowing why = not fixed, just lucky.**

## Output Format

```
## Bug Report

**Symptom:** [What the user reported]
**Reproduced:** [Yes/No + steps]

### Root Cause
[Specific, technical explanation]

### Fix Applied
[What was changed + why]
**Files:** [paths]
**Commit:** [hash]

### Regression Test
[Test added to catch this in future]
```
