# Feature Spec Template

_Copy this file and rename it to `[feature-name].md`. Fill in every section — do not leave placeholder text in a filed spec._

<!-- Agent: product-lead | When: any time a new feature is scoped | Instructions: Copy this file, rename it to the feature slug (kebab-case), fill in all sections top to bottom. Delete sections that genuinely do not apply but leave a one-line note explaining why. Mark Status as Draft until at least one reviewer signs off. Move to Approved only after build-lead confirms feasibility. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | _[Full human-readable feature name]_ |
| **Feature Slug** | _[kebab-case-name — used for file name, feature flag, and branch name]_ |
| **Status** | _Draft / Review / Approved / Done_ |
| **Author** | _[role or name]_ |
| **Reviewers** | _[role(s) who need to sign off — at minimum: product-lead + build-lead]_ |
| **Created** | _YYYY-MM-DD_ |
| **Last Updated** | _YYYY-MM-DD_ |
| **Target Sprint** | _[Sprint name or date]_ |

---

## Prioritization

> Fill this section before moving Status to Approved. Used to compare features objectively and prevent gut-feel prioritization.

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | _[1–10]_ | _[How many users affected per quarter?]_ |
| **Impact** | _[1–3]_ | _[1 = minimal, 2 = medium, 3 = massive]_ |
| **Confidence** | _[10–100%]_ | _[How confident are we in Reach and Impact estimates?]_ |
| **Effort** | _[person-weeks]_ | _[Total engineering + design + QA effort]_ |
| **RICE Score** | _[(R × I × C) ÷ E]_ | _[Higher = higher priority]_ |

**MoSCoW Classification:** _Must Have / Should Have / Could Have / Won't Have (this cycle)_

**Why this priority?** _[1-2 sentences: why now vs. other items in the backlog]_

---

## Overview

_2-3 sentences. What is this feature? Who uses it? What does it enable that wasn't possible before?_

---

## Problem

_What user problem does this solve? Be specific. Quote real user language from USER-INSIGHTS.md or interview notes if available. Avoid internal jargon._

> _"[Direct user quote if available]"_ — _[source/context]_

_If no direct quote exists, describe the pain in the user's terms._

---

## Proposed Solution

_How do we solve the problem? Describe the solution at a product level — not implementation details. Include the rough UX flow as a numbered sequence._

**UX Flow:**

1. _[Step 1 — what the user sees/does]_
2. _[Step 2]_
3. _[Step 3]_
4. _[Result — what the user has at the end]_

---

## User Stories

_Link to entries in `USER_STORIES.md` where they exist, or define inline below. Use standard format._

- As a _[user type]_, I want _[action]_ so that _[benefit]_.
- As a _[user type]_, I want _[action]_ so that _[benefit]_.
- As a _[user type]_, I want _[action]_ so that _[benefit]_.

---

## Acceptance Criteria

> Acceptance Criteria are the contract between product and QA. Test Engineer writes automated tests against these. Each story should have at least one AC. Use Given/When/Then format for clarity.

**Happy Path**
- Given _[precondition]_, when _[user action]_, then _[expected outcome]_.

**Error State**
- Given _[precondition leading to an error]_, when _[user action]_, then _[expected error handling — message, fallback, recovery path]_.

**Edge Case**
- Given _[boundary condition or unusual state]_, when _[user action]_, then _[expected outcome — no crash, graceful degradation, or explicit message]_.

_[Add more Given/When/Then rows as needed. Aim for one AC per distinct behavior.]_

---

## UX / UI Notes

_Wireframe description (text-based is fine), key interactions, and edge cases. Design Lead will use this to create high-fidelity mocks._

**Key Interactions:**

- _[Interaction 1 — e.g., clicking X reveals Y]_
- _[Interaction 2]_

**Edge Cases:**

- _[Edge case 1 — e.g., what happens if the user has no data yet]_
- _[Edge case 2 — e.g., what happens on mobile / slow connection]_
- _[Edge case 3 — error states]_

---

## Technical Requirements

### Backend Changes

_API routes, server actions, business logic, auth rules, rate limiting, background jobs._

- _[e.g., New POST /api/feature-name endpoint — Zod schema, returns ...]_
- _[e.g., Inngest job for async processing]_

### Frontend Changes

_New pages, components, state, forms, loading/error states._

- _[e.g., New page at /dashboard/feature — Server Component]_
- _[e.g., Client component for real-time updates]_

### Database Changes

_New tables, columns, indexes, RLS policies._

- _[e.g., Add `feature_items` table — see schema below]_
- _[e.g., Add index on `user_id` + `created_at`]_

### External Services

_Third-party APIs, webhooks, credentials needed._

- _[e.g., Stripe webhook for payment confirmation]_
- _[e.g., Resend transactional email on completion]_

---

## Non-Functional Requirements

> Copy applicable NFRs from `docs/PRD.md` and add any that are specific to this feature.

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | _[e.g., Feature endpoint responds < 200ms at P95 under normal load]_ | _[Load test with k6 / Playwright benchmark]_ |
| **Security** | _[e.g., Endpoint requires auth; input validated via Zod; no PII in logs]_ | _[Security review checklist + automated scan]_ |
| **Scalability** | _[e.g., Works correctly with 10K items per user account]_ | _[Seed DB with 10K records; run E2E]_ |
| **Accessibility** | _[e.g., All new UI elements are keyboard navigable; ARIA labels on interactive elements]_ | _[Screen reader walkthrough + axe-core audit]_ |

---

## Dependencies

> Upstream = what must exist before this feature can ship. Downstream = what will break or change if this feature changes.

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| _[e.g., Auth system]_ | _[API / Service / Data / Feature]_ | _[Done / In Progress / Not Started]_ | _[H/M/L]_ |
| _[e.g., Stripe billing integration]_ | _[External Service]_ | _[Done / In Progress / Not Started]_ | _[H/M/L]_ |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| _[e.g., Analytics dashboard]_ | _[data-lead]_ | _[Yes/No]_ | _[Impact description]_ |
| _[e.g., Mobile app]_ | _[frontend-developer]_ | _[Yes/No]_ | _[Impact description]_ |

---

## Out of Scope

_Explicit exclusions for this version. Be direct — this prevents scope creep._

- _[Thing that sounds related but is NOT included]_
- _[Thing we may build later but not now]_
- _[Thing another team/agent owns]_

---

## Risk Assessment

> At minimum: technical risk, adoption risk, dependency risk.

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| _[Technical risk — e.g., third-party API reliability]_ | _H/M/L_ | _H/M/L_ | _[Mitigation step]_ |
| _[Adoption risk — e.g., users won't discover the feature]_ | _H/M/L_ | _H/M/L_ | _[e.g., In-app tooltip on first access; email announcement]_ |
| _[Dependency risk — e.g., upstream service not ready in time]_ | _H/M/L_ | _H/M/L_ | _[e.g., Build behind feature flag; can ship independently if needed]_ |

---

## Success Metrics

_How will we know if this feature worked? Define specific, measurable numbers. Set a timeframe._

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| _[e.g., Feature adoption rate]_ | _[e.g., 0%]_ | _[e.g., 40% of active users]_ | _[e.g., 30 days post-launch]_ |
| _[e.g., Task completion rate]_ | _[e.g., N/A]_ | _[e.g., >80%]_ | _[e.g., 14 days post-launch]_ |
| _[e.g., Support tickets about X]_ | _[e.g., 5/week]_ | _[e.g., <1/week]_ | _[e.g., 60 days post-launch]_ |

---

## Rollout Plan

> For any P0 feature or database migration, rollback plan is mandatory before this spec reaches Approved status.

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | _[Agents / team members only]_ | _[All acceptance criteria pass; no P0 bugs]_ | _[e.g., 1–2 days]_ |
| **Private Beta** | _[e.g., 5–10 hand-picked users]_ | _[No critical issues; positive qualitative feedback]_ | _[e.g., 1 week]_ |
| **Gradual Rollout** | _[e.g., 10% → 50% → 100% of users]_ | _[Error rate < X%; performance targets met]_ | _[e.g., 2 weeks]_ |
| **Full Launch** | All users | _[All rollout stages passed]_ | — |

**Feature Flag**
- Behind a feature flag? _[Yes / No]_
- Flag name: _[e.g., `feature-name-enabled`]_
- Flag owner: _[agent responsible for enabling/disabling]_

**Rollback Plan**
- Rollback trigger: _[e.g., Error rate > X%, P0 bug reported, performance SLA missed]_
- Rollback decision maker: _[e.g., build-lead or ceo]_
- Rollback steps: _[e.g., Disable feature flag → monitor error rate → hot-fix or revert deploy]_
- Data impact: _[e.g., Any DB migrations are backwards-compatible; no data loss on rollback]_

---

## Open Questions

_Unresolved items that must be answered before or during build. Assign an owner._

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | _[Question]_ | _[role]_ | _YYYY-MM-DD_ |
| 2 | _[Question]_ | _[role]_ | _YYYY-MM-DD_ |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| _YYYY-MM-DD_ | _Initial draft_ | _[role]_ |

---

_Last updated: — | Updated by: —_
