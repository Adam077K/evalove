# Roadmap

> What we're building, in what order, and what we've explicitly decided not to build.

<!--
Agent: product-lead
When:
  - Written at the start of each sprint or milestone planning session.
  - "Now" is reviewed and updated weekly — items that slip must move to "Next" with a note.
  - "Next" and "Later" are reviewed monthly.
  - "Won't Do" is the most important section — update it every time a feature request is declined.
How:
  1. North Star must be a single sentence. If it takes two sentences, it's not north-star clarity.
  2. "Now" must have a named owner for every item — no ownerless work in the active sprint.
  3. Status values for "Now": Planned | In Progress | In Review | Done | Blocked (add blocker note).
  4. "Next" is committed work for the following milestone — it is not a wish list. Only items the team is prepared to immediately start when "Now" closes.
  5. "Later" is organized by theme — not a flat list. Group by strategic bet or user segment.
  6. "Won't Do" must include the reason. Without a reason, the same request will re-appear and re-consume planning time.
  7. Dates in "Now" are ETAs, not commitments. Mark overdue items clearly.
-->

---

## North Star

_[One sentence: what are we building toward? This should be specific enough to reject feature requests that don't serve it. Format: "We are building [product] that enables [who] to [achieve what outcome] so that [higher-level impact]."]_

_[Example: "We are building the fastest way for solo founders to go from idea to first paying customer, so that more companies survive the zero-to-one phase."]_

---

## Now

_[Current sprint or milestone. Everything here is actively in flight or immediately up next. If the list exceeds ~8 items, the sprint is too large.]_

**Milestone:** _[e.g., "MVP — First Paying Customer" | ETA: YYYY-MM-DD]_

| Feature | Description | Owner | Status | ETA |
|---------|-------------|-------|--------|-----|
| _[e.g., User authentication]_ | _[Clerk auth, signup/login flow, protected routes]_ | _[backend-developer]_ | _[Done]_ | _[YYYY-MM-DD]_ |
| _[e.g., Core feature [X]]_ | _[Brief description of the main value-add feature]_ | _[Agent or team]_ | _[In Progress]_ | _[YYYY-MM-DD]_ |
| _[e.g., Payment integration]_ | _[Stripe subscription checkout, webhook handling, plan enforcement]_ | _[backend-developer]_ | _[Planned]_ | _[YYYY-MM-DD]_ |
| _[e.g., Onboarding flow]_ | _[Post-signup setup wizard to get users to first value fast]_ | _[frontend-developer]_ | _[Planned]_ | _[YYYY-MM-DD]_ |
| _[e.g., Email notifications]_ | _[Welcome email, key transactional emails via Resend]_ | _[Agent]_ | _[Blocked — waiting on Resend domain verification]_ | _[YYYY-MM-DD]_ |
| _[Feature]_ | _[Description]_ | _[Owner]_ | _[Status]_ | _[ETA]_ |

---

## Next

_[The next milestone — committed work the team will start immediately after "Now" closes. If you're not prepared to staff it immediately, move it to "Later".]_

**Milestone:** _[e.g., "Growth — 10 Paying Customers" | Estimated start: YYYY-MM-DD]_

- **_[Feature group — e.g., Analytics & Insights]_:** _[Brief description of what this milestone delivers and why it matters now]_
  - _[Specific feature 1]_
  - _[Specific feature 2]_
  - _[Specific feature 3]_

- **_[Feature group — e.g., Team Collaboration]_:** _[Brief description]_
  - _[Specific feature 1]_
  - _[Specific feature 2]_

- **_[Feature group]_:** _[Brief description]_
  - _[Specific feature 1]_

---

## Later

_[Future milestones grouped by strategic theme. These are on the radar but not committed. Order within each theme is rough priority.]_

### _[Theme 1 — e.g., Enterprise Readiness]_
_[Why this theme matters and roughly when we'd address it — e.g., "Relevant when ARR > $50K; enterprise buyers require these before sign-off"]_

- _[Feature — e.g., SSO / SAML integration]_
- _[Feature — e.g., Audit log for admin actions]_
- _[Feature — e.g., Custom roles and permissions]_
- _[Feature — e.g., Data export / GDPR tooling]_

### _[Theme 2 — e.g., Platform / Integrations]_
_[Why this theme matters]_

- _[Feature — e.g., Public API + API key management]_
- _[Feature — e.g., Zapier / Make integration]_
- _[Feature — e.g., Slack integration]_

### _[Theme 3 — e.g., AI / Automation]_
_[Why this theme matters]_

- _[Feature]_
- _[Feature]_

### _[Theme 4 — e.g., Mobile]_
_[Why this theme matters and what would trigger investing in it]_

- _[Feature]_

---

## Won't Do / Explicitly Not Building

_[The most important section for focus. Every time a feature request is declined, add it here with the reason. This prevents the same conversation from happening twice.]_

| Feature | Why We're Not Building It |
|---------|--------------------------|
| _[e.g., Native mobile apps (iOS/Android)]_ | _[e.g., Our users are on desktop. Mobile adds 6+ months of development time for a segment that represents <5% of target users based on research. Revisit if mobile usage exceeds 20% of sessions.]_ |
| _[e.g., Self-hosted / on-premise deployment]_ | _[e.g., Requires significant infrastructure and support investment. Not compatible with our SaaS unit economics at current stage. This is a "Later" conversation only if enterprise demand materially arrives.]_ |
| _[e.g., Free tier with no credit card]_ | _[e.g., Attracts non-converting users and increases support load without proportional revenue. We offer a free trial with CC instead.]_ |
| _[e.g., Feature X requested by [user/prospect]]_ | _[e.g., Serves a single customer's workflow without broader applicability. Not aligned with North Star. Referred them to the API.]_ |
| _[Feature]_ | _[Reason — be specific]_ |

---

## Last Reviewed

**Date:** _[YYYY-MM-DD]_
**Reviewed by:** _[Agent or person]_
**Key changes this review:** _[e.g., Moved payment integration from Next to Now. Added Team Collaboration theme to Later. Added "self-hosted" to Won't Do based on support conversation.]_

---

_Last updated: — | Updated by: —_
