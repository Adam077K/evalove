# User Stories

> The authoritative list of what users need to do, in their words. These stories drive sprint planning, acceptance testing, and design decisions.

<!--
Agent: product-lead
When:
  - Stories are written before implementation begins — never after.
  - New stories are added when: new features are planned, user research reveals unmet needs, or a bug reveals a missing acceptance criterion.
  - Story status is updated throughout each sprint.
  - Acceptance Criteria are the contract with QA — they must be specific enough to write a test case from. Vague criteria ("works correctly") are not acceptance criteria.
How:
  1. Each story must have a user type from PERSONAS.md — not "user" or "admin" in the abstract. Name the persona.
  2. Acceptance Criteria: each criterion must be independently verifiable. If a QA engineer can't write a test from it, rewrite it.
  3. Priority: High = blocks launch or core user journey. Medium = significantly improves the experience. Low = nice to have; can wait.
  4. Status: Backlog | Scoping | In Progress | In Review | Done
  5. US-NNN IDs are permanent — never reassign a number, even if a story is removed. Mark removed stories as "Removed: [reason]".
  6. Epics group related stories. A story belongs to exactly one epic.
  7. When a story is Done, do not delete it — it becomes the specification of what was built.
-->

---

## How to Read These Stories

Each story follows the format:

> As a **[persona from PERSONAS.md]**, I want to **[do something specific]** so that **[I achieve this outcome]**.

Acceptance Criteria define the specific, testable conditions that must be true for the story to be considered complete. They are written from the user's perspective, not the implementation's.

**Status key:** `Backlog` | `Scoping` | `In Progress` | `In Review` | `Done` | `Removed`
**Priority key:** `High` (launch-blocking) | `Medium` (significant improvement) | `Low` (nice to have)

---

## Epic: _[Epic 1 — e.g., Authentication & Onboarding]_

_[One sentence: what user need does this epic address and why does it matter?]_

---

**US-001: Sign up with email**

As a _[e.g., first-time visitor]_, I want to create an account with my email and password so that I can access the product and save my work.

**Acceptance Criteria:**
1. Visiting `/signup` shows a form with email, password, and confirm password fields.
2. Submitting a valid email and matching passwords (min 8 characters) creates an account and redirects to `/onboarding`.
3. Submitting a duplicate email shows an inline error: "An account with this email already exists."
4. Submitting mismatched passwords shows an inline error: "Passwords do not match."
5. Submitting a password under 8 characters shows an inline error: "Password must be at least 8 characters."
6. A welcome email is sent to the user's email address within 2 minutes of successful signup.

**Priority:** High | **Status:** Backlog

---

**US-002: Complete onboarding**

As a _[e.g., newly registered user]_, I want to complete a setup flow after signup so that I can get to the core value of the product without guessing how to start.

**Acceptance Criteria:**
1. After signup, user is redirected to `/onboarding` and cannot access the main app until onboarding is complete.
2. Onboarding collects: _[field 1]_, _[field 2]_, _[field 3]_.
3. Each step shows progress (e.g., "Step 2 of 3").
4. User can return to a previous step using a "Back" button without losing entered data.
5. Completing all steps redirects to the main dashboard and marks `onboarding_complete = true` on the user record.
6. If user closes the browser mid-onboarding and returns, they resume at the step they left off.

**Priority:** High | **Status:** Backlog

---

**US-003: _[Story title]_**

As a _[persona]_, I want to _[action]_ so that _[benefit]_.

**Acceptance Criteria:**
1. _[Criterion — specific and testable]_
2. _[Criterion]_
3. _[Criterion]_
4. _[Criterion — include error/edge case]_

**Priority:** _[High / Medium / Low]_ | **Status:** _[Backlog]_

---

## Epic: _[Epic 2 — e.g., Core Feature]_

_[One sentence: what user need does this epic address?]_

---

**US-010: _[Story title]_**

As a _[persona]_, I want to _[action]_ so that _[benefit]_.

**Acceptance Criteria:**
1. _[Criterion]_
2. _[Criterion]_
3. _[Criterion]_
4. _[Edge case criterion — e.g., "If [X] is empty, show [Y] empty state with a [Z] CTA"]_

**Priority:** _[High / Medium / Low]_ | **Status:** _[Backlog]_

---

**US-011: _[Story title]_**

As a _[persona]_, I want to _[action]_ so that _[benefit]_.

**Acceptance Criteria:**
1. _[Criterion]_
2. _[Criterion]_
3. _[Criterion]_

**Priority:** _[High / Medium / Low]_ | **Status:** _[Backlog]_

---

## Epic: _[Epic 3 — e.g., Billing & Subscription]_

_[One sentence: what user need does this epic address?]_

---

**US-020: Subscribe to a paid plan**

As a _[e.g., user on a free trial]_, I want to enter my payment details and subscribe to a paid plan so that I can continue using the product after my trial ends.

**Acceptance Criteria:**
1. User can navigate to `/settings/billing` and see their current plan and trial status.
2. Clicking "Upgrade" opens a Stripe-hosted checkout page with the correct plan and pricing.
3. Completing payment redirects back to the app with a success message and the user's plan is updated in the DB within 30 seconds (via Stripe webhook).
4. If payment fails, Stripe's hosted page shows the failure reason and allows retry.
5. A payment confirmation email is sent to the user's email address.
6. After upgrade, features gated behind the paid plan are immediately accessible without requiring a page reload.

**Priority:** High | **Status:** Backlog

---

**US-021: _[Story title]_**

As a _[persona]_, I want to _[action]_ so that _[benefit]_.

**Acceptance Criteria:**
1. _[Criterion]_
2. _[Criterion]_
3. _[Criterion]_

**Priority:** _[High / Medium / Low]_ | **Status:** _[Backlog]_

---

## Epic: _[Epic 4 — add more epics as needed]_

_[One sentence: what user need does this epic address?]_

---

**US-030: _[Story title]_**

As a _[persona]_, I want to _[action]_ so that _[benefit]_.

**Acceptance Criteria:**
1. _[Criterion]_
2. _[Criterion]_
3. _[Criterion]_

**Priority:** _[High / Medium / Low]_ | **Status:** _[Backlog]_

---

_Last updated: — | Updated by: —_
