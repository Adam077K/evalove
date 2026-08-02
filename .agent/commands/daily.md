# /daily — Daily Planning Kickoff

Start the day with context loaded and priorities clear.

## Usage
```
/daily
```

## What This Does

1. Iris reads `.claude/memory/DECISIONS.md` for overnight context
2. Iris reads `CLAUDE.md` for current project state
3. Iris reads `.claude/memory/CODEBASE-MAP.md` for any active dev work
4. Iris checks context: if > 50%, recommend `/compact` before starting
5. Iris proposes:
   - **Today's Focus** — 1-3 high-leverage tasks with done-when criteria
   - **Blockers** — anything that needs clearing before work starts
   - **Decisions needed** — open questions that will unblock the team

## Output Format

```
## Good Morning — [Date]

### Context Check
[Context usage: X% — OK to proceed / Recommend /compact first]

### Today's Focus
1. [Highest leverage task] — Done when: [specific criteria]
2. [Second priority] — Done when: [criteria]
3. [Optional third]

### Blockers to Clear
- [Anything blocking above tasks + who unblocks it]

### Decisions Needed
- [Open question + owner + deadline]

### Agents Routing Today
Iris → [plan for the day]
```

## Notes

- If no CLAUDE.md exists: Iris asks 3 questions to understand the project
- Always ends with: "Who do you want to start with?"
- If > 70% context: recommend starting with `/clear` and `/compact`
