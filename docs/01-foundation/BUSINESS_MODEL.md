# Business Model

> How the company makes money, what it costs to operate, and the path to sustainable unit economics.

<!--
AGENT INSTRUCTIONS
Agent: business-lead
When:
  - Written at project kickoff with initial assumptions clearly marked
  - Updated when pricing changes, a new revenue stream is added, or cost structure changes materially
  - Unit Economics updated monthly once the product has real revenue data
How:
  1. Mark every estimate with "(estimate)" until it's backed by real data. Replace when data is available.
  2. Revenue Streams table must stay in sync with pricing pages and POSITIONING.md.
  3. Unit Economics must show the formula, not just the number, so agents can recalculate with new data.
  4. Path to Profitability milestones should be specific: a number + a date + a condition.
  5. If a Revenue Stream is deprecated, don't delete it — mark as "Retired" with a note on why.
-->

## Revenue Streams

| Stream | Type | Price | Billing | Status | Notes |
|--------|------|-------|---------|--------|-------|
| _[e.g., Pro Plan]_ | _[SaaS subscription]_ | _[$XX/mo per seat]_ | Monthly / Annual | _[Active / Planned / Retired]_ | _[Key features included or targeting which persona]_ |
| _[e.g., Team Plan]_ | _[SaaS subscription]_ | _[$XX/mo per org]_ | Annual | _[Active / Planned / Retired]_ | _[e.g., Up to N seats, SSO, advanced admin]_ |
| _[e.g., Usage-based overage]_ | _[Usage]_ | _[$X per unit above limit]_ | Monthly | _[Active / Planned / Retired]_ | _[Define the unit being metered]_ |
| _[e.g., Enterprise / Custom]_ | _[Negotiated]_ | _[Custom]_ | Annual | _[Active / Planned / Retired]_ | _[Minimum contract size, if any]_ |

**Free tier / trial:** _[Describe the free offer — freemium, free trial length, what's included, and conversion goal]_

---

## Cost Structure

| Cost | Monthly (estimate) | Scales With | Notes |
|------|-------------------|-------------|-------|
| _[e.g., Vercel hosting]_ | _[$XX]_ | Traffic | _[Plan tier and next tier trigger]_ |
| _[e.g., Supabase]_ | _[$XX]_ | DB size + connections | _[Plan tier]_ |
| _[e.g., Clerk auth]_ | _[$XX]_ | MAU | _[Free up to N MAU]_ |
| _[e.g., LLM API costs (Anthropic)]_ | _[$XX]_ | Usage / calls | _[Estimate per request + monthly call volume]_ |
| _[e.g., Email (Resend)]_ | _[$XX]_ | Emails sent | _[Volume and cost per email at scale]_ |
| _[e.g., Engineering (contractor / agent)]_ | _[$XX]_ | Fixed | _[Headcount or agent-hours basis]_ |
| _[e.g., Marketing / ads]_ | _[$XX]_ | Fixed / variable | _[Channel and budget basis]_ |
| **Total (est.)** | **_[$XX]_** | | _[Sum of above at current stage]_ |

---

## Unit Economics

> Fill in with real data as soon as it's available. Mark estimates explicitly.

**LTV (Customer Lifetime Value)**
Formula: `ARPU × Gross Margin % ÷ Monthly Churn Rate`
Current value: _[$ — (estimate / actual)]_
Assumptions: _[ARPU = $X, Gross Margin = X%, Monthly Churn = X%]_

**CAC (Customer Acquisition Cost)**
Formula: `Total Sales & Marketing Spend ÷ New Customers Acquired (same period)`
Current value: _[$ — (estimate / actual)]_
Assumptions: _[Spend = $X/mo, acquiring X customers/mo via X channel]_

**LTV:CAC Ratio**
Current: _[X:1 — (estimate / actual)]_
Target: _[e.g., 3:1 minimum for healthy SaaS]_

**CAC Payback Period**
Formula: `CAC ÷ (ARPU × Gross Margin %)`
Current: _[X months — (estimate / actual)]_
Target: _[e.g., < 12 months]_

**Gross Margin**
Current: _[X% — (estimate / actual)]_
Breakdown: _[Revenue less direct COGS: hosting, API costs, payment processing. Does not include S&M or R&D.]_
Target: _[e.g., > 70% at scale — typical SaaS target]_

**Monthly Churn Rate**
Current: _[X% — (estimate / actual — if pre-launch, use industry benchmark with citation)]_
Target: _[e.g., < 3% monthly for SMB SaaS]_

---

## Pricing Strategy

**Model:** _[e.g., Per-seat subscription | Usage-based | Flat-rate | Freemium-to-paid | Hybrid]_

**Pricing rationale:** _[Why this model fits the buyer's budget cycle and the product's value delivery. Reference which persona the pricing is anchored to.]_

**Price anchor / comparison:** _[What do customers compare our price to? e.g., "A junior analyst costs $5K/mo — we're $200/mo and do the same job faster." Ground pricing in a real alternative.]_

**Discounting policy:** _[e.g., Annual plans at 20% discount. No ad-hoc discounts below $X without CEO approval. No perpetual discounts.]_

**Pricing evolution:** _[How pricing is expected to change as the product matures — e.g., "Introduce usage-based component at Series A when we have data on customer usage patterns"]_

---

## Path to Profitability

> Milestones with specific targets. Each milestone should be achievable in 3-6 months from the prior one.

| Milestone | MRR Target | Customer Count | Key Condition | Target Date |
|-----------|-----------|----------------|---------------|-------------|
| Ramen profitable | _[$X MRR]_ | _[X customers]_ | _[e.g., Covers infra + 1 founder salary]_ | _[Date]_ |
| Default alive | _[$X MRR]_ | _[X customers]_ | _[e.g., Revenue growth outpaces burn at current headcount]_ | _[Date]_ |
| Break-even | _[$X MRR]_ | _[X customers]_ | _[e.g., All operating costs covered without fundraising]_ | _[Date]_ |
| Profitable growth | _[$X MRR]_ | _[X customers]_ | _[e.g., 20%+ net margin while still growing > 10% MoM]_ | _[Date]_ |

**Current burn rate:** _[$X/mo — (estimate / actual)]_
**Current runway:** _[X months at current burn — (estimate / actual)]_
**Fundraising plan:** _[e.g., Bootstrapping to $X MRR then raising a seed round | Raising now | Not planning to raise]_

---

_Last updated: [date] | Updated by: [agent]_
