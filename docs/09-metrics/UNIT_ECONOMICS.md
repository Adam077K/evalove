# Unit Economics

<!-- Agent: business-lead + data-lead | When: Monthly review, or after major pricing/cost changes | Instructions: Fill with real numbers as soon as possible — mark estimates with "(E)" and actuals with "(A)". The goal is to understand if the business is fundamentally healthy. Never delete metrics once added — mark retired ones as "N/A — see notes". -->

Financial health per customer — the numbers that determine if this business works.

---

## Key Metrics Snapshot

| Metric | Value | As Of | Benchmark | Notes |
|--------|-------|-------|-----------|-------|
| **MRR** | _$—_ | — | — | Monthly Recurring Revenue |
| **ARR** | _$—_ | — | — | MRR × 12 |
| **Avg Revenue Per User (ARPU)** | _$—_ | — | — | MRR ÷ paid users |
| **LTV** | _$—_ | — | — | `ARPU × Gross Margin % ÷ Monthly Churn Rate` |
| **CAC** | _$—_ | — | — | Total S&M spend ÷ new customers acquired |
| **LTV:CAC Ratio** | _—x_ | — | >3x | Target: >3x for healthy SaaS |
| **CAC Payback Period** | _— months_ | — | <12 months | `CAC ÷ (ARPU × Gross Margin %)` |
| **Gross Margin** | _—%_ | — | >70% SaaS | Revenue minus direct COGS |
| **Churn Rate (monthly)** | _—%_ | — | <2% SMB | Target: <2% monthly |
| **NRR (Net Revenue Retention)** | _—%_ | — | >100% | Target: >100%; >120% = excellent |
| **Burn Rate** | _$—/mo_ | — | — | Monthly net cash consumption |
| **Runway** | _— months_ | — | >12 months | Cash on hand ÷ monthly burn rate |
| **Burn Multiple** | _—x_ | — | <2x good; <1x great | Net Burn ÷ Net New ARR. Measures capital efficiency |
| **Magic Number** | _—_ | — | >0.75 | `(Net New ARR × Gross Margin %) ÷ Prior Qtr S&M Spend`. >0.75 = ready to scale S&M |
| **Quick Ratio** | _—_ | — | >4.0 | `(New MRR + Expansion MRR) ÷ (Contraction MRR + Churned MRR)`. >4.0 = healthy growth quality |
| **Rule of 40** | _—%_ | — | >40% | Revenue Growth % + Profit Margin %. Relevant at $1M+ ARR |

---

## Revenue Breakdown

| Plan / Tier | Price | # Customers | MRR | % of Total |
|-------------|-------|-------------|-----|------------|
| _[Free]_ | $0 | — | $0 | — |
| _[Starter]_ | _$—/mo_ | — | — | — |
| _[Pro]_ | _$—/mo_ | — | — | — |
| _[Enterprise]_ | _Custom_ | — | — | — |

---

## MRR Movement (Waterfall)

> Update monthly. This waterfall reveals whether growth is healthy. A rising Expansion/New MRR ratio (>20%) is a strong product-market fit signal.

| Component | This Month | Last Month | MoM Change | Notes |
|-----------|-----------|-----------|------------|-------|
| **New MRR** | _$—_ | _$—_ | — | Revenue from brand-new customers |
| **Expansion MRR** | _$—_ | _$—_ | — | Upsells and plan upgrades from existing customers |
| **Contraction MRR** | _$(—)_ | _$(—)_ | — | Downgrades from existing customers |
| **Churned MRR** | _$(—)_ | _$(—)_ | — | Revenue lost from cancellations |
| **Net New MRR** | _$—_ | _$—_ | — | `New + Expansion − Contraction − Churned` |
| **Total MRR (end of month)** | _$—_ | _$—_ | — | Prior MRR + Net New MRR |

---

## Cost Structure

| Cost | Monthly | Per Customer | Notes |
|------|---------|--------------|-------|
| Hosting / Infra | _$—_ | _$—_ | — |
| AI / LLM costs | _$—_ | _$—_ | — |
| Payment processing | _$—_ | _$—_ | — |
| Third-party APIs | _$—_ | _$—_ | — |
| **Total COGS** | _$—_ | _$—_ | Direct costs only (no S&M, no R&D) |

---

## Gross Margin by Tier

> Blended gross margin can hide per-tier problems. Free tiers often run negative gross margin — know your actual economics per segment before scaling.

| Plan / Tier | Revenue / Customer | COGS / Customer | Gross Margin % | Notes |
|-------------|-------------------|----------------|----------------|-------|
| _[Free]_ | $0 | _$—_ | N/A (cost center) | — |
| _[Starter]_ | _$—_ | _$—_ | _—%_ | — |
| _[Pro]_ | _$—_ | _$—_ | _—%_ | — |
| **Blended** | — | — | _—%_ | Weighted average across paying customers |

---

## Path to Profitability

| Month | MRR Target | Customers Needed | Key Milestone |
|-------|------------|-----------------|---------------|
| Month 3 | _$—_ | _—_ | _[e.g., Ramen profitable — covers infra + founder salaries]_ |
| Month 6 | _$—_ | _—_ | _[e.g., Default alive — revenue growth outpaces burn]_ |
| Month 12 | _$—_ | _—_ | _[e.g., Break even — all operating costs covered]_ |
| Month 18 | _$—_ | _—_ | _[e.g., Profitable growth — 20%+ net margin while growing]_ |

**Current burn rate:** _[$—/mo — (E) or (A)]_
**Current runway:** _[— months at current burn — (E) or (A)]_
**Fundraising plan:** _[e.g., Bootstrapping to $X MRR then raising seed | Raising now | Not planning to raise]_

---

## Capital Efficiency

> Track from $0 — the habit matters more than the number early on. Benchmarks: Top-quartile SaaS at Series A runs $150–200K ARR per FTE.

| Metric | Value | Notes |
|--------|-------|-------|
| **ARR per FTE** | _$—_ | ARR ÷ total headcount. Industry benchmark: $150–200K at Series A |
| **ARR per $ Raised** | _—_ | ARR ÷ total capital raised. >$1 ARR per $1 raised = very efficient |
| **ARR per $ S&M Spend** | _—_ | ARR ÷ cumulative sales & marketing spend |
| **Revenue per Engineering Dollar** | _—_ | MRR ÷ monthly engineering cost. Track trajectory, not absolute number |

---

## Assumptions & Model Notes

**Model version:** _[v0.1 — (E) = estimate, (A) = based on actual data]_
**Last updated:** _[date]_

### Revenue Assumptions
- _[e.g., Average contract length: 12 months (E)]_
- _[e.g., Annual plan discount: 20% off monthly price (E)]_
- _[e.g., Free-to-paid conversion rate: X% at 14 days (E — based on industry benchmark)]_

### Cost Assumptions
- _[e.g., LLM costs: $X per 1,000 requests at current model pricing (A as of date)]_
- _[e.g., Hosting scales linearly with users above X MAU (E)]_

### Churn Assumptions
- _[e.g., Monthly churn estimate: X% — based on comparable B2B SaaS benchmarks (E); will replace with actuals after Month 3]_

### CAC Assumptions
- _[e.g., Primary acquisition channel: content/SEO — $X blended CAC (E)]_
- _[e.g., CAC calculation method: all S&M spend in period ÷ new customers in same period]_

---

_Last updated: — | Updated by: —_
