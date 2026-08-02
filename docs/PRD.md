# Product Requirements Document

> High-level product requirements defining what we're building, for whom, and how success is measured.

<!--
AGENT INSTRUCTIONS
Agent: product-lead
When: Created at project kickoff; updated at the start of each sprint or when scope changes.
How:
  1. Fill in every _[placeholder]_ based on research from TARGET_MARKET.md and PERSONAS.md.
  2. Write the Executive Summary last — after all other sections are complete.
  3. Keep the Core Features table in sync with BACKLOG.md — feature names must match exactly.
  4. When a section changes, bump the Revision History table and note your agent name.
  5. Never delete the Out of Scope section — it prevents scope creep.
  6. Open Questions must be resolved before a feature enters Active Sprint.
  7. PRD is not Approved until all three stakeholders sign off in the Sign-off section.
-->

---

## Executive Summary

> Written last, after all other sections are filled. Max 200 words. Should be readable by someone who reads nothing else in this document.

_[One-paragraph narrative: product name, the specific problem it solves, who experiences that problem most acutely, the proposed solution, the key differentiator vs. existing alternatives, and the single most important success metric that will tell us it's working.]_

**Status at a Glance**

| Field | Value |
|-------|-------|
| **Stage** | _[Pre-MVP \| MVP \| Beta \| GA]_ |
| **Launch Date Target** | _[date]_ |
| **PRD Version** | _[e.g., v0.1]_ |
| **PRD Owner** | product-lead |
| **Last Updated** | _[date]_ |

---

## Overview

**Product name:** _[Product name]_
**One-line description:** _[What the product does, for whom, and what outcome it delivers — max 20 words]_
**Current version / stage:** _[e.g., v0.1 — pre-MVP | MVP | Beta | GA]_
**PRD owner:** product-lead
**Last major revision:** _[Date of last substantive change]_

---

## Problem Statement

_[2-4 sentences describing the specific, observable problem this product solves. Be concrete — reference the user behavior or workflow that is broken today. Avoid solution language here.]_

**Root cause:** _[What underlying condition creates this problem — market gap, technology shift, workflow mismatch, etc.]_

**Who feels this most acutely:** _[Reference the primary persona by name, e.g., "Sarah (Growth Marketer) in PERSONAS.md"]_

---

## Target Users

| Segment | Description | Priority |
|---------|-------------|----------|
| _[Primary persona name]_ | _[1-line description: role, company size, context]_ | Primary |
| _[Secondary persona name]_ | _[1-line description]_ | Secondary |
| _[Tertiary segment if applicable]_ | _[1-line description]_ | Tertiary |

> See `docs/01-foundation/PERSONAS.md` for full persona profiles.

---

## Goals & Success Metrics

### Business Goals
_[List 2-3 top-level business outcomes this product must achieve, e.g., "Reach $10K MRR within 6 months of launch"]_

### Product Goals
_[List 2-3 product-level goals, e.g., "Users complete core workflow without needing support in under 5 minutes"]_

### Success Metrics (OKR format)

| Objective | Key Result | Target | Timeframe |
|-----------|-----------|--------|-----------|
| _[Objective 1]_ | _[Measurable KR]_ | _[Number]_ | _[e.g., Q1 2026]_ |
| _[Objective 2]_ | _[Measurable KR]_ | _[Number]_ | _[e.g., Q2 2026]_ |
| _[Objective 3]_ | _[Measurable KR]_ | _[Number]_ | _[e.g., Q2 2026]_ |

---

## MVP Definition

> Rule of thumb: If a feature doesn't directly de-risk your riskiest assumption, it's not MVP.

**MVP Scope:**
_[2-3 sentences. What is the absolute minimum version that proves core value to the primary persona? What does "done" look like for MVP? Frame it as: "A user can [do X] and [get outcome Y] without [the thing they currently struggle with]."]_

**MVP Success Criteria**

| Criterion | How We Measure It | Pass Threshold |
|-----------|-------------------|----------------|
| _[e.g., Users complete core workflow without assistance]_ | _[e.g., Moderated user test with 5 participants]_ | _[e.g., 4 of 5 complete without help]_ |
| _[e.g., Core action completed within a session]_ | _[e.g., Event tracking — time from signup to first core action]_ | _[e.g., >60% of signups within 7 days]_ |
| _[e.g., No P0 bugs at launch]_ | _[e.g., QA Lead sign-off after full regression]_ | _[e.g., Zero P0 issues in production]_ |
| _[e.g., User willing to pay or recommend]_ | _[e.g., Exit survey NPS or "would you pay $X?" question]_ | _[e.g., NPS > 7 or >50% say yes to payment]_ |

> See `docs/BACKLOG.md` for MVP task breakdown and sprint assignments.

---

## Core Features

| Feature | Description | Priority | Status | Owner |
|---------|-------------|----------|--------|-------|
| _[Feature name]_ | _[What it does and why it matters]_ | P0 — Must Have | _[Not Started / In Progress / Done]_ | _[agent]_ |
| _[Feature name]_ | _[What it does and why it matters]_ | P0 — Must Have | _[Not Started / In Progress / Done]_ | _[agent]_ |
| _[Feature name]_ | _[What it does and why it matters]_ | P1 — Should Have | _[Not Started / In Progress / Done]_ | _[agent]_ |
| _[Feature name]_ | _[What it does and why it matters]_ | P1 — Should Have | _[Not Started / In Progress / Done]_ | _[agent]_ |
| _[Feature name]_ | _[What it does and why it matters]_ | P2 — Nice to Have | _[Not Started / In Progress / Done]_ | _[agent]_ |

**Priority key:** P0 = blocks launch | P1 = ships with v1 | P2 = post-launch

---

## Non-Functional Requirements

> Non-functional requirements are architectural constraints — not optional polish. Build Lead must review this section before sprint planning begins.

| Category | Requirement | Rationale | Priority |
|----------|-------------|-----------|----------|
| **Performance** | _[e.g., Page load < 2s on 4G. Core API responses < 200ms at P95. Background jobs < 30s.]_ | _[User retention drops sharply after 3s. SLA violatons erode trust.]_ | P0 |
| **Security** | _[e.g., All routes require authentication. No PII in logs or error messages. Secrets via env vars only. JWT/session expiry enforced.]_ | _[Regulatory baseline and user trust.]_ | P0 |
| **Scalability** | _[e.g., Support X concurrent users at launch; Y concurrent users at 12 months. DB connection pooling configured.]_ | _[Capacity planning for infrastructure decisions and cost.]_ | P1 |
| **Accessibility** | _[e.g., WCAG 2.1 AA compliance. Full keyboard navigation. Screen reader tested on VoiceOver + NVDA.]_ | _[Legal requirement in many markets; expands user base.]_ | P1 |
| **Data Privacy** | _[e.g., GDPR-compliant data handling. User data deletion within 30 days of request. Cookie consent required for EU visitors.]_ | _[EU market access and regulatory risk mitigation.]_ | P1 |
| **Reliability** | _[e.g., 99.9% uptime target. Automated alerting for downtime. P1 incident response < 1 hour.]_ | _[Revenue and trust impact of unplanned downtime.]_ | P1 |
| **Compliance** | _[e.g., SOC 2 Type I by GA if selling to enterprise. PCI DSS if handling payment card data.]_ | _[Required for enterprise deals; signals security maturity.]_ | P2 |

---

## Out of Scope

> These items are explicitly excluded from the current version to maintain focus. Revisit after launch.

- _[Feature or use case explicitly excluded — and why, e.g., "Mobile native app — web-first for MVP, revisit at $50K MRR"]_
- _[Feature or use case explicitly excluded]_
- _[Feature or use case explicitly excluded]_
- _[User segment not being served in this version — and when they might be addressed]_

---

## Risks & Mitigations

> At minimum 4 risks required. Any risk rated H/H (High Likelihood × High Impact) must have a concrete mitigation — not just an acknowledgment.

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|-----------|--------|------------|-------|
| _[e.g., Core technology fails to perform at required scale]_ | _M_ | _H_ | _[e.g., Load test before beta. Fallback architecture documented in ARCHITECTURE.md.]_ | _build-lead_ |
| _[e.g., Low activation — users sign up but don't reach Aha moment]_ | _H_ | _H_ | _[e.g., Onboarding flow reviewed by design-lead. Time-to-value target < 5 min. In-product guidance for first session.]_ | _product-lead_ |
| _[e.g., Competitor ships similar feature before our GA launch]_ | _M_ | _M_ | _[e.g., Monitor COMPETITIVE_RESEARCH.md monthly. Accelerate P0 features if threat level rises to H.]_ | _research-lead_ |
| _[e.g., Key engineering resource unavailable during crunch]_ | _L_ | _H_ | _[e.g., Document all architecture decisions in ADRs. Pair on critical paths. No single points of failure in implementation knowledge.]_ | _ceo_ |

---

## Go-to-Market Considerations

> This section captures the GTM assumptions that affect product design decisions. Full GTM planning lives in `docs/05-marketing/GTM_STRATEGY.md` and `docs/05-marketing/CHANNELS.md`.

**Launch Sequencing**

| Phase | Audience | Entry Criteria | Key Product Requirement |
|-------|----------|----------------|------------------------|
| **Private Beta** | _[e.g., 10-20 hand-picked users matching ICP]_ | _[e.g., All P0 features complete; no open P0 bugs]_ | _[e.g., Invite-only access gate; in-app feedback form]_ |
| **Public Beta** | _[e.g., Waitlist — open to anyone who applies]_ | _[e.g., Private beta NPS > 7; D7 retention > 40%]_ | _[e.g., Self-serve signup; email onboarding sequence; in-app support chat]_ |
| **General Availability** | _[All target users]_ | _[e.g., Public beta MRR > $X; monthly churn < 3%; all P1 features complete]_ | _[e.g., Public pricing page; billing fully automated; documentation site live]_ |

**Key GTM Assumption This PRD Depends On:**
_[1-2 sentences: The most important assumption about how customers will find or adopt this product that, if wrong, would require a product change. e.g., "Users will self-serve the core workflow without a sales rep. If enterprise customers require a POC or demo, we will need to add a demo mode and admin handoff flow before GA."]_

---

## Timeline & Milestones

> Dates are targets, not commitments. Update Status column each sprint. Set by CEO + build-lead after initial planning.

| Milestone | Target Date | Owner | Dependencies | Status |
|-----------|-------------|-------|--------------|--------|
| Discovery Complete (personas + market validated) | _[date]_ | product-lead | `docs/01-foundation/PERSONAS.md` filled | _[ ] Not Started_ |
| PRD v1.0 Approved (all sections filled, signed off) | _[date]_ | product-lead | All sections complete | _[ ] Not Started_ |
| MVP Development Complete | _[date]_ | build-lead | PRD v1.0 Approved | _[ ] Not Started_ |
| QA Pass (QA Lead sign-off) | _[date]_ | qa-lead | MVP Dev Complete | _[ ] Not Started_ |
| Private Beta Launch | _[date]_ | ceo | QA Pass + infra ready | _[ ] Not Started_ |
| Public Beta Launch | _[date]_ | ceo | Private beta success criteria met | _[ ] Not Started_ |
| General Availability | _[date]_ | ceo | Public beta success criteria met | _[ ] Not Started_ |
| First Revenue | _[date]_ | ceo | GA Launch + billing live | _[ ] Not Started_ |

---

## Open Questions

> Each question must be assigned an owner and resolved before the related feature enters Active Sprint.

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | _[Unresolved product decision or assumption that needs validation]_ | _[agent or stakeholder]_ | _[date]_ | Open |
| 2 | _[Technical feasibility question]_ | _[agent]_ | _[date]_ | Open |
| 3 | _[Pricing or go-to-market question affecting feature design]_ | _[agent]_ | _[date]_ | Open |

---

## Revision History

| Date | Version | Change | Author |
|------|---------|--------|--------|
| _[date]_ | v0.1 | Initial draft | product-lead |

---

## Stakeholder Sign-off

> This PRD is not Approved until all three roles have signed off. Build Lead sign-off confirms engineering feasibility. CEO sign-off confirms business strategy alignment.

| Role | Agent | Date | Status |
|------|-------|------|--------|
| Product Lead | product-lead | _[date]_ | _Approved / Pending_ |
| Build Lead | build-lead | _[date]_ | _Approved / Pending_ |
| CEO | ceo | _[date]_ | _Approved / Pending_ |

---

_Last updated: [date] | Updated by: [agent]_
