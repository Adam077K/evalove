# ADR-_[NNN]_: _[Decision Title]_

> Architecture Decision Record — copy this file, rename to `NNN-short-decision-name.md`, fill in every section, and link to it from ARCHITECTURE.md or the relevant feature spec.

<!--
Agent: build-lead (primary) | any team lead making an architectural decision
When:
  - Create an ADR whenever a decision: (1) is hard to reverse, (2) affects multiple agents or systems, (3) chooses between real alternatives, or (4) will confuse future engineers if the reasoning isn't documented.
  - You do NOT need an ADR for: trivial implementation details, decisions that affect only one file, or choices with an obvious single option.
  - Status lifecycle: Proposed → Accepted → (Deprecated | Superseded by ADR-NNN)
  - When superseding an ADR: update the old ADR's status to "Superseded by ADR-NNN" and link back here.
How:
  1. Context: describe the situation that forced a decision — constraints, requirements, timing. No decision looks obvious without this.
  2. Decision: one clear sentence. What did we decide to do? Not why — that's Rationale.
  3. Rationale: be honest about trade-offs. If there's a downside to the chosen option, name it here — it demonstrates the decision was made with eyes open.
  4. Alternatives Considered: must have at least 2 real alternatives that were genuinely evaluated. "Do nothing" counts only if it was a real option.
  5. Consequences: negative consequences are expected and acceptable — that's the nature of trade-offs. Omitting them makes the ADR dishonest.
  6. References: link to the PR, issue, DECISIONS.md entry, or external article that informed this decision.
-->

---

## Header

| Field | Value |
|-------|-------|
| **ADR Number** | _[NNN — use next sequential number in this directory]_ |
| **Title** | _[Short imperative phrase — e.g., "Use Supabase RLS instead of application-layer authorization"]_ |
| **Date** | _[YYYY-MM-DD]_ |
| **Status** | _[Proposed / Accepted / Deprecated / Superseded by ADR-NNN]_ |
| **Deciders** | _[Who was involved in making this call — agent names or roles]_ |

---

## Context

_[Describe the situation that forced a decision. What problem were you solving? What constraints existed — technical, time, cost, team knowledge, existing systems? What would happen if no decision was made? A reader who was not in the room should understand why this decision had to be made at this time. 3-5 sentences minimum.]_

_[Example: "As we approach launch, we need to ensure that users can only read and write data they own. Application-layer authorization (checking ownership in every API route handler) is error-prone — a missing check in any handler creates a data leak. We have ~12 API routes today and expect 40+ by Q2. We need a mechanism that enforces data isolation at a lower level than the application code."]_

---

## Decision

_[One clear sentence. What did we decide to do? Start with a verb.]_

_[Example: "Implement Row-Level Security (RLS) policies on all Supabase tables that contain user-owned data, and require Supabase client calls to use the authenticated user's JWT so RLS is enforced."]_

---

## Rationale

_[Why this option over the alternatives? Name the key factors that made this the right call. Then name what we're giving up — every good decision has a trade-off.]_

**Why we chose this:**

1. _[Primary reason — the strongest argument for this decision]_
2. _[Secondary reason]_
3. _[Additional reason, if applicable]_

**What we're trading off:**

- _[Downside 1 — e.g., "RLS policies add complexity to the Supabase migration files and must be tested explicitly"]_
- _[Downside 2 — e.g., "Debugging RLS failures can be opaque — requires understanding Postgres policy evaluation"]_
- _[Downside 3, if applicable]_

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| _[Option A — the chosen approach, restated]_ | _[Pros]_ | _[Cons]_ |
| _[Option B — e.g., Application-layer authorization in every API route]_ | _[e.g., Simple to implement initially; no Postgres knowledge required]_ | _[e.g., Error-prone at scale — any missing check is a security hole; duplicated logic across handlers]_ |
| _[Option C — e.g., Separate authorization service (e.g., Oso, Casbin, OpenFGA)]_ | _[e.g., Purpose-built for complex RBAC/ABAC; separates auth logic cleanly]_ | _[e.g., Significant added complexity and latency; overkill for current requirements]_ |
| _[Option D — Do nothing / defer]_ | _[e.g., Saves time now]_ | _[e.g., Unacceptable security risk — not a real option for user data]_ |

---

## Consequences

**Positive:**
- _[e.g., Data isolation is enforced at the database level — a bug in application code cannot leak another user's data]_
- _[e.g., Removes authorization logic from individual API routes — handlers are simpler]_
- _[e.g., RLS policies are version-controlled in migration files — authorization rules are auditable]_

**Negative:**
- _[e.g., All future migrations must include RLS policies for new tables — this is easy to forget and will require a checklist]_
- _[e.g., Supabase service-role client bypasses RLS — must be used carefully and only in trusted server contexts]_

**Neutral:**
- _[e.g., Testing RLS requires using supabase test helpers or setting `auth.uid()` in test transactions — adds test setup complexity]_
- _[e.g., This decision applies only to Supabase tables. Any data stored outside Supabase (e.g., file storage metadata, third-party APIs) still requires application-layer checks]_

---

## References

- _[Link to DECISIONS.md entry]_
- _[Link to GitHub PR or issue where this was discussed]_
- _[Link to external article, doc, or benchmark that informed the decision]_
- _[Link to related ADRs]_

---

## Implementation Checklist

> Complete before changing Status from Proposed to Accepted. This ensures every ADR is actionable and that the team is informed.

- [ ] Status is set to **Proposed** (not Accepted until reviewed by at least one other decider)
- [ ] At least **2 real alternatives** are listed in the Alternatives table (not just "do nothing" as both)
- [ ] Both **positive and negative consequences** are documented — omitting negatives makes this ADR dishonest
- [ ] An entry has been added to **`.claude/memory/DECISIONS.md`** summarizing this decision in 1-2 lines
- [ ] All **Deciders** listed in the Header have been notified and have reviewed the decision
- [ ] This ADR is **linked from** `docs/03-system-design/ARCHITECTURE.md` or the relevant feature spec in `docs/04-features/specs/`
- [ ] Any **impacted agents or team leads** have been informed of consequences that affect their domain

---

_Last updated: — | Updated by: —_
