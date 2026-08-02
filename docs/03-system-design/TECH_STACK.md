# Tech Stack

> Technology choices for every layer of the system — what we use, what version, and why we chose it over the alternatives.

<!--
Agent: build-lead
When:
  - Written when the stack is first chosen. Updated when any layer changes (new library, version bump that changes behavior, replacement of a tool).
  - Never change the stack without an entry in DECISIONS.md and a corresponding ADR in docs/03-system-design/adr/.
  - Rejected Alternatives is as important as the chosen stack — it prevents relitigating decisions that were already made.
How:
  1. "Why We Chose It" must be a specific reason, not a generic one. "It's popular" or "the team knows it" are acceptable facts but not sufficient alone — add the technical or strategic reason.
  2. Version column must reflect what is actually installed (check package.json), not the latest available.
  3. Monitoring row is required — an unmonitored system in production is an incident waiting to happen.
  4. Rejected Alternatives: "Why Rejected" must name the actual dealbreaker, not a vague preference.
  5. Upgrade Path: only list upgrades with a concrete trigger condition — not "someday" upgrades.
-->

---

## Stack Overview

| Layer | Technology | Version | Why We Chose It |
|-------|------------|---------|-----------------|
| **Frontend** | _[e.g., Next.js — App Router]_ | _[e.g., 14.x]_ | _[e.g., Server Components reduce client bundle size; App Router enables fine-grained streaming and nested layouts; Vercel deployment is zero-config]_ |
| **Language** | _[e.g., TypeScript (strict mode)]_ | _[e.g., 5.x]_ | _[e.g., Strict mode catches an entire class of bugs at compile time; required for safe refactoring as the codebase grows]_ |
| **Styling** | _[e.g., Tailwind CSS + Shadcn/UI]_ | _[e.g., 3.x / latest]_ | _[e.g., Utility-first means no naming conflicts or dead CSS; Shadcn gives accessible primitives we own and can modify, not a locked-in library]_ |
| **Backend** | _[e.g., Next.js API Routes + Server Actions]_ | _[e.g., 14.x]_ | _[e.g., Collocated with frontend — no separate server to deploy or maintain; Server Actions eliminate boilerplate for form mutations]_ |
| **Validation** | _[e.g., Zod]_ | _[e.g., 3.x]_ | _[e.g., Runtime + compile-time type safety; schema is the single source of truth for API contracts and DB input]_ |
| **Database** | _[e.g., Supabase — PostgreSQL]_ | _[e.g., PostgreSQL 15]_ | _[e.g., Managed Postgres with built-in auth, storage, and real-time; RLS enforces data isolation at DB level — not application level]_ |
| **Auth** | _[e.g., Clerk]_ | _[e.g., latest]_ | _[e.g., Handles sessions, MFA, social providers, and org management out of the box; webhook-based sync to our DB is reliable and well-documented]_ |
| **Payments** | _[e.g., Stripe]_ | _[e.g., API v2024]_ | _[e.g., Best-in-class subscription billing, proration, and invoice management; extensive test mode and webhook tooling]_ |
| **Email** | _[e.g., Resend]_ | _[e.g., latest]_ | _[e.g., React Email component model means email templates are testable code, not fragile HTML strings; strong deliverability reputation]_ |
| **Jobs** | _[e.g., Inngest]_ | _[e.g., latest]_ | _[e.g., Serverless-native background jobs with built-in retry, step functions, and local dev tooling; no Redis or worker infrastructure to manage]_ |
| **Hosting** | _[e.g., Vercel]_ | _[e.g., —]_ | _[e.g., Zero-config deployment for Next.js; Edge Network reduces global latency; preview deployments on every PR]_ |
| **AI** | _[e.g., Anthropic Claude API]_ | _[e.g., claude-sonnet-4-6]_ | _[e.g., Best instruction-following for structured output use cases; Messages API with streaming; competitive context window]_ |
| **Monitoring** | _[e.g., Vercel Analytics + Sentry]_ | _[e.g., latest]_ | _[e.g., Vercel Analytics for Web Vitals with zero config; Sentry for error tracking with source maps and session replay]_ |
| **Testing** | _[e.g., Vitest + Playwright]_ | _[e.g., latest]_ | _[e.g., Vitest is fast and Jest-compatible for unit/integration; Playwright for E2E with multi-browser support]_ |

---

## Dependencies

_[Key npm packages beyond the framework itself. Focus on packages with significant behavior, security, or lock-in implications. Omit trivial utilities.]_

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| _[e.g., `@supabase/supabase-js`]_ | _[e.g., 2.x]_ | _[Supabase client — DB queries, auth helpers, storage]_ | _[Use server client in Server Components; browser client only in Client Components]_ |
| _[e.g., `@clerk/nextjs`]_ | _[e.g., 5.x]_ | _[Clerk auth middleware + React hooks]_ | _[Wrap root layout with `ClerkProvider`; use `auth()` in Server Components]_ |
| _[e.g., `zod`]_ | _[e.g., 3.x]_ | _[Schema validation for all API inputs and env vars]_ | _[Required on every API route and Server Action — no exceptions]_ |
| _[e.g., `inngest`]_ | _[e.g., latest]_ | _[Background job definitions and client]_ | _[All functions in `src/inngest/`; serve via `/api/inngest` route]_ |
| _[e.g., `resend`]_ | _[e.g., latest]_ | _[Transactional email via Resend API]_ | _[Email templates in `src/emails/` using `@react-email/components`]_ |
| _[e.g., `stripe`]_ | _[e.g., latest]_ | _[Stripe Node.js SDK for payments]_ | _[Always use server-only; never expose secret key to client]_ |
| _[Package name]_ | _[Version]_ | _[Purpose]_ | _[Notes]_ |

---

## Rejected Alternatives

_[Document what was considered and ruled out. This prevents the same debate from happening six months later.]_

| What | Why Rejected |
|------|--------------|
| _[e.g., Prisma (ORM)]_ | _[e.g., Supabase's generated TypeScript types + raw SQL give more control and eliminate the N+1 risk from ORMs. Prisma's migration model also conflicts with Supabase's built-in migration tooling.]_ |
| _[e.g., Auth.js (NextAuth)]_ | _[e.g., Requires significant custom code for org-level features (teams, roles, invitations) that Clerk provides out of the box. The maintenance overhead was not justified at this stage.]_ |
| _[e.g., tRPC]_ | _[e.g., Adds a layer of abstraction that complicates onboarding and debugging. Next.js Server Actions + Zod achieve the same type-safety at the API boundary without a separate transport layer.]_ |
| _[e.g., PlanetScale]_ | _[e.g., MySQL dialect and branching model are compelling, but lack of row-level security and PostgreSQL ecosystem (pgvector, PostGIS, etc.) was a dealbreaker given our AI roadmap.]_ |
| _[e.g., Vercel AI SDK]_ | _[e.g., Evaluated but adds abstraction over the Anthropic SDK that complicates function-calling and structured output patterns we rely on. Direct SDK gives clearer error surfaces.]_ |
| _[Technology name]_ | _[Specific dealbreaker reason]_ |

---

## Upgrade Path

_[Only planned upgrades with a concrete trigger — not a wishlist.]_

| Upgrade | Current | Target | Trigger Condition |
|---------|---------|--------|-------------------|
| _[e.g., Next.js major version]_ | _[e.g., 14.x]_ | _[e.g., 15.x]_ | _[e.g., Once App Router caching model stabilizes in 15.x stable and Clerk adapter is compatible]_ |
| _[e.g., Switch to pgvector for embeddings]_ | _[e.g., Pinecone]_ | _[e.g., Supabase pgvector]_ | _[e.g., When vector search queries exceed $50/month on Pinecone or we need hybrid BM25+vector search]_ |
| _[e.g., Add read replica]_ | _[e.g., Single Supabase instance]_ | _[e.g., Primary + read replica]_ | _[e.g., When P99 read latency on analytics queries exceeds 1s under normal load]_ |
| _[Upgrade name]_ | _[From]_ | _[To]_ | _[Trigger]_ |

---

_Last updated: — | Updated by: —_
