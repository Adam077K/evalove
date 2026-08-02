# Architecture

> System architecture overview — how the pieces fit together, what they do, and why they're arranged this way.

<!--
Agent: build-lead (owner) | backend-developer (contributor)
When:
  - Written when the first deployable version of the system is defined.
  - Updated whenever a new component is added, an integration changes, or a key design decision is reversed.
  - If a decision in "Key Design Decisions" changes, add an entry to DECISIONS.md before updating this file.
How:
  1. Architecture Diagram must reflect the actual deployed system — not aspirational. If something isn't built yet, mark it "(planned)".
  2. System Components table must have a named owner for every component. "TBD" is not an owner.
  3. Data Flow should trace the most common user action end-to-end — what the user does, what fires, what reads/writes to DB, what returns.
  4. External Integrations: Auth Method must be specific (OAuth 2.0, API key in header, mTLS, etc.) — not just "API key".
  5. Key Design Decisions here are the top-level choices. For full context and alternatives considered, each should have a corresponding ADR in docs/03-system-design/adr/.
  6. Scale Considerations: state current hard limits (not estimates) and a concrete plan for breaking each one.
-->

---

## Architecture Diagram

_[Replace with an ASCII diagram or a Mermaid diagram block. The diagram must show: client(s), API layer, backend services, database(s), and any async workers or queues. Mark planned-but-not-built components with "(planned)".]_

```
Example shape — replace entirely:

┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│               Next.js App (Vercel Edge)                 │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                     API Layer                           │
│          Next.js API Routes / Server Actions            │
└──────┬─────────────────┬──────────────────┬────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│  Auth       │  │  Database    │  │  Background  │
│  (Clerk)    │  │  (Supabase)  │  │  Jobs        │
│             │  │  PostgreSQL  │  │  (Inngest)   │
└─────────────┘  └──────────────┘  └──────────────┘
```

---

## System Components

| Component | Description | Technology | Owner |
|-----------|-------------|------------|-------|
| _[e.g., Web App]_ | _[What it does for the user]_ | _[e.g., Next.js 14, App Router, Vercel]_ | _[Agent or team]_ |
| _[e.g., API Layer]_ | _[Handles all client requests, validates input, orchestrates services]_ | _[e.g., Next.js API Routes + Zod]_ | _[Agent or team]_ |
| _[e.g., Database]_ | _[Primary data store — users, content, transactions]_ | _[e.g., Supabase PostgreSQL]_ | _[Agent or team]_ |
| _[e.g., Auth Service]_ | _[User identity, sessions, JWT issuance]_ | _[e.g., Clerk]_ | _[Agent or team]_ |
| _[e.g., Job Queue]_ | _[Async processing — emails, webhooks, scheduled tasks]_ | _[e.g., Inngest]_ | _[Agent or team]_ |
| _[e.g., File Storage]_ | _[User-uploaded assets, generated files]_ | _[e.g., Supabase Storage / S3]_ | _[Agent or team]_ |
| _[e.g., AI Service (planned)]_ | _[LLM inference, embeddings, completions]_ | _[e.g., Anthropic Claude API]_ | _[Agent or team]_ |

---

## Data Flow

_[Trace the primary user journey step by step. Use numbered steps. Be specific about what reads from and writes to which component. This is the flow new engineers use to understand the system — do not skip steps.]_

**Primary journey: _[e.g., "User submits a new [core action]"]_**

1. User submits _[action]_ from the _[page/component]_ in the web app.
2. Client calls _[endpoint or Server Action]_ with _[payload description]_.
3. API layer validates input with Zod schema `_[schema name]_`.
4. Auth middleware verifies Clerk JWT — rejects unauthenticated requests with 401.
5. _[Service or function]_ queries _[table(s)]_ in Supabase for _[what]_.
6. _[Any business logic step]_ — _[what it does and why]_.
7. Result is written to _[table]_ and/or returned to client.
8. _[If async]_ Inngest job `_[job name]_` is triggered to handle _[what happens in the background]_.
9. Client receives _[response shape]_ and renders _[state]_.

---

## External Integrations

| Service | Purpose | Auth Method | Status |
|---------|---------|-------------|--------|
| _[e.g., Clerk]_ | _[User authentication and session management]_ | _[e.g., Webhook secret + JWT verification]_ | _[Active / Planned / Deprecated]_ |
| _[e.g., Stripe]_ | _[Payment processing and subscription management]_ | _[e.g., API key in server env, webhook signature]_ | _[Active / Planned / Deprecated]_ |
| _[e.g., Resend]_ | _[Transactional email delivery]_ | _[e.g., API key in Authorization header]_ | _[Active / Planned / Deprecated]_ |
| _[e.g., Inngest]_ | _[Background job scheduling and orchestration]_ | _[e.g., Signing key for event validation]_ | _[Active / Planned / Deprecated]_ |
| _[e.g., Anthropic]_ | _[LLM completions for core AI feature]_ | _[e.g., API key in Authorization header]_ | _[Active / Planned / Deprecated]_ |
| _[Service name]_ | _[Purpose]_ | _[Auth method]_ | _[Status]_ |

---

## Key Design Decisions

_[Each item here is a high-level choice that shapes the whole system. For full context, create a corresponding ADR in docs/03-system-design/adr/. Link to it from each item.]_

1. **_[Decision title — e.g., "Server Components by default, Client Components only when required"]_**
   Rationale: _[Why this choice. What it enables. What it trades off.]_
   ADR: _[Link to docs/03-system-design/adr/NNN-decision-name.md or "Not yet written"]_

2. **_[Decision title — e.g., "Supabase Row-Level Security for all user data"]_**
   Rationale: _[Why this choice.]_
   ADR: _[Link]_

3. **_[Decision title — e.g., "Inngest for all async work — no raw cron jobs or queues"]_**
   Rationale: _[Why this choice.]_
   ADR: _[Link]_

4. **_[Decision title]_**
   Rationale: _[Why this choice.]_
   ADR: _[Link]_

5. **_[Decision title]_**
   Rationale: _[Why this choice.]_
   ADR: _[Link]_

---

## Scale Considerations

**Current limits:**

| Limit | Current Cap | Why This Cap Exists |
|-------|-------------|---------------------|
| _[e.g., Concurrent DB connections]_ | _[e.g., 20 — Supabase free tier]_ | _[e.g., Connection pool ceiling on current plan]_ |
| _[e.g., API response time (P99)]_ | _[e.g., ~800ms — unoptimized queries]_ | _[e.g., No caching layer yet; sequential DB calls]_ |
| _[e.g., Storage]_ | _[e.g., 1 GB — Supabase free tier]_ | _[e.g., Current plan limit]_ |
| _[e.g., Inngest job concurrency]_ | _[e.g., 10 concurrent functions]_ | _[e.g., Free tier limit]_ |

**Scaling plan:**

_[Describe the ordered sequence of scaling moves. What gets fixed first, what only matters at N=1000 users vs. N=100,000? Be concrete — not "add caching" but "add Redis for session data and query results from [specific endpoint] once P99 > 500ms."]_

- **0 → _[N]_ users:** _[What the current architecture handles without changes]_
- **_[N]_ → _[N2]_ users:** _[First architectural change needed, trigger condition]_
- **_[N2]_+ users:** _[Larger-scale changes — horizontal scaling, CDN, read replicas, etc.]_

---

_Last updated: — | Updated by: —_
