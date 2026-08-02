# Technical Debt Tracker

_A living record of known shortcuts, compromises, and deferred improvements in the codebase._

<!-- Agent: code-reviewer + build-lead | When: after every code review, sprint retrospective, or when new debt is introduced intentionally | Instructions: Add new debt to the Active table immediately when discovered or accepted. Move resolved items to Recently Resolved. Update the Debt Health Score each time you touch this file. IDs are sequential — never reuse a retired ID. -->

---

## Debt Health Score

**_Low / Medium / High_** — _[1-sentence overall assessment of the codebase's debt burden right now]_

_Last assessed: YYYY-MM-DD_

---

## Active Debt

_Sorted by Priority (High first). Impact and Effort use H/M/L._

| ID | Area | Description | Impact | Effort | Priority | Owner | Added |
|---|---|---|---|---|---|---|---|
| TD-001 | _[e.g., Auth]_ | _[e.g., Session tokens not rotated on privilege escalation]_ | _H_ | _M_ | _P1_ | _[role]_ | _YYYY-MM-DD_ |
| TD-002 | _[e.g., API]_ | _[e.g., No rate limiting on public endpoints]_ | _H_ | _L_ | _P1_ | _[role]_ | _YYYY-MM-DD_ |
| TD-003 | _[e.g., DB]_ | _[e.g., Missing index on users.email — full scans on login]_ | _M_ | _L_ | _P2_ | _[role]_ | _YYYY-MM-DD_ |

_Add new rows above this line. Delete example rows when real entries exist._

---

## Recently Resolved

_Items cleared in the last 2 sprints. Archive older entries to keep this table short._

| ID | What | Resolved Date | Who Fixed It |
|---|---|---|---|
| _TD-XXX_ | _[Brief description of what was fixed]_ | _YYYY-MM-DD_ | _[role]_ |

---

## Debt Prevention Rules

_The team follows these rules to avoid introducing new debt without deliberate sign-off._

- **Name it when you accept it.** If you merge a known shortcut, create a TD entry before the PR closes.
- **No undocumented TODOs.** Every `// TODO` comment must have a corresponding TD entry with an ID. Comment format: `// TODO [TD-XXX]: description`.
- **N+1 queries are never acceptable.** All DB access must be batched or joined — no lazy loading by default.
- **No `any` in TypeScript.** Strict types are a correctness requirement, not a style preference.
- **Debt above P1 blocks the next release.** High-impact debt must be resolved or explicitly re-prioritized before shipping.
- **Review debt monthly.** Build-lead reviews this file at the start of each sprint and re-prioritizes as needed.

---

## Scheduled Cleanup Sprints

_Dedicated time for debt reduction. At least one cleanup sprint per quarter._

| Sprint | Focus Area | Target Date | Status |
|---|---|---|---|
| _[Sprint name or number]_ | _[e.g., API validation coverage]_ | _YYYY-MM-DD_ | _Planned / In Progress / Done_ |
| _[Sprint name or number]_ | _[e.g., Remove deprecated endpoints]_ | _YYYY-MM-DD_ | _Planned_ |

---

_Last updated: — | Updated by: —_
