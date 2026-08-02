# Engineering Principles

> The coding standards, conventions, and workflow rules that every engineer on this project follows without exception.

<!--
AGENT INSTRUCTIONS
Agent: build-lead (owns this document) | code-reviewer (enforces and updates based on audit findings)
When:
  - Created at project start by build-lead based on stack choices in CLAUDE.md
  - Updated when a new tech stack decision is made — add to Tech Stack Decisions table
  - Code Reviewer updates Code Conventions when patterns drift from what's written here
  - Any agent can flag a gap; build-lead resolves it with an edit
How:
  1. Every entry must be a hard rule or a firm default — avoid "consider" or "try to"
  2. When a principle is violated in review, cite the specific numbered rule
  3. Tech Stack Decisions rationale must be honest — if it was convenience, say so
  4. Keep Performance and Security Standards measurable, not aspirational
-->

## Core Principles

1. **Correctness before cleverness.** Code that is obviously correct beats code that is impressively compact. Optimize for the next engineer reading it.
2. **No placeholders in production.** `TODO`, `FIXME`, `return null` stubs, and empty handlers are bugs, not drafts. Every function either does its job or throws a typed error.
3. **Fail loudly at the boundary.** Validate all external input (API requests, forms, env vars) with Zod at entry points. Inside the system, trust the types.
4. **Server first.** Default to React Server Components and server-side data fetching. Move to the client only when interactivity or browser APIs require it.
5. **Explicit over implicit.** Name things for what they do. Avoid magic, hidden side effects, or behavior that surprises readers.
6. **One source of truth.** Types, constants, and config live in one place and are imported everywhere else. Never copy-paste logic across files.
7. **Every async op has an error path.** Happy-path-only code is incomplete code. Network calls, DB queries, and file operations must handle failures explicitly.
8. **No N+1 queries.** Fetch related data with joins or batch calls. Loops that trigger individual DB queries are a deployment blocker.

---

## Tech Stack Decisions

| Area | Choice | Rationale |
|------|--------|-----------|
| Framework | _[e.g., Next.js 14 App Router]_ | _[Why this was chosen over alternatives]_ |
| Language | _[e.g., TypeScript strict mode]_ | _[Why strict — not just TS]_ |
| Styling | _[e.g., Tailwind CSS + Shadcn/UI]_ | _[Utility-first rationale, component library choice]_ |
| Database | _[e.g., Supabase (PostgreSQL)]_ | _[Why Supabase over raw Postgres or other BaaS]_ |
| Auth | _[e.g., Clerk]_ | _[Why not NextAuth or rolling custom auth]_ |
| Payments | _[e.g., Stripe]_ | _[Why Stripe, any relevant alternatives considered]_ |
| Email | _[e.g., Resend]_ | _[Why Resend over SendGrid / SES]_ |
| Background Jobs | _[e.g., Inngest]_ | _[Event-driven rationale, alternatives considered]_ |
| Hosting | _[e.g., Vercel]_ | _[Why Vercel, trade-offs acknowledged]_ |
| Testing | _[e.g., Vitest + Playwright]_ | _[Unit/integration/E2E split rationale]_ |

---

## Code Conventions

### Language & Types

- TypeScript strict mode is non-negotiable. `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` all enabled.
- No `any`. No `as unknown as X`. Use proper type narrowing or a well-typed assertion function.
- Prefer `type` over `interface` for object shapes; use `interface` only when declaration merging is intentional.
- All external input validated with Zod schemas. Export the schema alongside the inferred type: `export type Foo = z.infer<typeof FooSchema>`.
- _[Any additional project-specific type conventions]_

### Naming

- **Files:** `kebab-case.ts` — always. Component files: `kebab-case.tsx`.
- **Components:** `PascalCase` — matches the export name exactly.
- **Functions & variables:** `camelCase`.
- **Constants:** `SCREAMING_SNAKE_CASE` for module-level compile-time constants.
- **Database columns:** `snake_case` — matches Postgres convention. Map to camelCase in app layer.
- **Zod schemas:** suffix with `Schema`, e.g. `UserSchema`. Inferred types drop the suffix: `User`.
- _[Any additional naming conventions specific to this project]_

### File Structure

```
src/
  app/                  # Next.js App Router pages and layouts
    (route-group)/      # Parenthesized groups for layout sharing
  components/           # Shared UI components (no business logic)
    ui/                 # Shadcn/UI primitives — do not edit directly
  features/             # Feature-scoped modules (components + logic co-located)
    [feature-name]/
      components/
      hooks/
      actions.ts        # Server Actions for this feature
      types.ts
  lib/                  # Utility functions, clients, shared helpers
    supabase/           # Supabase client + typed DB helpers
  types/                # Global types shared across features
```

_[Adjust the tree above to match the actual project structure once scaffolded]_

---

## Git Workflow

### Branch Naming

```
feat/[short-description]     # New feature
fix/[short-description]      # Bug fix
refactor/[short-description] # Refactor, no behavior change
chore/[short-description]    # Config, deps, tooling
test/[short-description]     # Test-only changes
```

### Commit Format (Conventional Commits)

```
type(scope): concise present-tense description

- bullet: what changed and why (not what the code does)
- bullet: second change if needed
```

Types: `feat` | `fix` | `refactor` | `test` | `chore` | `docs`
Scope: the feature or module name, e.g., `auth`, `billing`, `dashboard`

### PR Process

1. Branch from `main`. Work in a worktree (see `CLAUDE.md` Git Worktree Protocol).
2. All commits must be atomic — one logical change per commit.
3. PR description must include: what changed, why, how to test, and any migration steps.
4. Code Reviewer agent reviews before merge. QA Lead runs E2E before merge.
5. Squash merge to `main`. Delete branch after merge.
6. _[Any CI checks that must pass before merge, e.g., type-check, lint, tests]_

---

## Testing Strategy

| Layer | Tool | Coverage Target | What to Test |
|-------|------|----------------|--------------|
| Unit | _[e.g., Vitest]_ | _[e.g., 80% of business logic]_ | Pure functions, transformations, validation schemas, state machines |
| Integration | _[e.g., Vitest + Supabase local]_ | _[e.g., All API routes]_ | API routes, server actions, DB queries |
| E2E | _[e.g., Playwright]_ | _[e.g., All critical user paths]_ | Sign up, core workflow, payment flow, error states |

**TDD rule:** Any function that can be expressed as `expect(fn(input)).toBe(output)` must have a test written before the implementation.

**What not to test:** UI layout, third-party library internals, one-liner wrappers around well-tested libs.

_[Any project-specific testing constraints or patterns]_

---

## Performance Standards

| Metric | Target | Tool |
|--------|--------|------|
| Core Web Vitals LCP | _[e.g., < 2.5s]_ | Vercel Analytics / Lighthouse |
| Core Web Vitals CLS | _[e.g., < 0.1]_ | Vercel Analytics / Lighthouse |
| Core Web Vitals INP | _[e.g., < 200ms]_ | Vercel Analytics / Lighthouse |
| API p99 response time | _[e.g., < 500ms]_ | _[Monitoring tool]_ |
| DB query time (p95) | _[e.g., < 100ms]_ | Supabase dashboard |
| JS bundle size (initial) | _[e.g., < 200KB gzipped]_ | Next.js bundle analyzer |

**Mandatory:** Run `next build` and check bundle output before every PR. Flag any chunk above _[threshold]_ KB to build-lead.

---

## Security Standards

- **Authentication:** All non-public routes protected at middleware level. Never rely on client-side auth checks alone.
- **Authorization:** Row-level security (RLS) enabled on all Supabase tables that contain user data. Test RLS policies in integration tests.
- **Input validation:** Zod on every API route and server action. Reject before processing.
- **Secrets:** Only via `process.env`. Validated with Zod at startup. Never hardcoded, never logged, never sent to the client.
- **Dependencies:** _[e.g., `npm audit` runs in CI; no high/critical vulnerabilities in production deps]_
- **SQL injection:** Parameterized queries only. No string interpolation in SQL.
- **XSS:** Never use `dangerouslySetInnerHTML`. Sanitize any user-generated content before rendering.
- _[Any additional security requirements specific to this domain, e.g., PII handling, GDPR, SOC2]_

---

_Last updated: [date] | Updated by: [agent]_
