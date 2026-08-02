# Codebase Map

Key files, directory structure, entry points, state management, and data layer — updated by code-reviewer after each audit.

<!-- Agent: code-reviewer + build-lead | When: After initial codebase audit, after any major refactor, or when a new major feature area is added | Instructions: Run a real directory traversal before filling in Project Structure — do not guess paths. Key Files table should only include files that other agents actually need to know about (avoid listing every file). Known Issues must have real severity assessments — use High/Medium/Low based on user impact, not effort. Update this doc after every significant structural change to the codebase. -->

---

## Project Structure

_[Replace with actual directory tree. Use `tree -L 3 --dirsfirst -I 'node_modules|.git|.next|dist'` or equivalent. Add a 1-line comment after each key folder.]_

```
/
├── app/                    # _[e.g. Next.js App Router — all pages and layouts]_
│   ├── (auth)/             # _[e.g. Auth-gated route group]_
│   ├── api/                # _[e.g. API route handlers]_
│   └── layout.tsx          # _[e.g. Root layout with providers]_
├── components/             # _[e.g. Shared UI components]_
│   ├── ui/                 # _[e.g. Shadcn/UI primitives]_
│   └── [feature]/          # _[e.g. Feature-scoped components]_
├── lib/                    # _[e.g. Shared utilities, clients, helpers]_
├── hooks/                  # _[e.g. Custom React hooks]_
├── types/                  # _[e.g. Shared TypeScript types and Zod schemas]_
├── public/                 # _[e.g. Static assets]_
└── supabase/               # _[e.g. DB migrations, seed scripts, edge functions]_
```

---

## Key Files

| File | Purpose | Who Touches It |
|------|---------|----------------|
| _[path/to/file]_ | _[What this file does and why it matters]_ | _[Agent / role / team]_ |
| _[path/to/file]_ | _[What this file does and why it matters]_ | _[Agent / role / team]_ |
| _[path/to/file]_ | _[What this file does and why it matters]_ | _[Agent / role / team]_ |
| _[path/to/file]_ | _[What this file does and why it matters]_ | _[Agent / role / team]_ |
| _[path/to/file]_ | _[What this file does and why it matters]_ | _[Agent / role / team]_ |

---

## Entry Points

_[Describe how the app starts and how key user flows begin. Include the file path for each entry point.]_

**App bootstrap:** _[e.g. `app/layout.tsx` — mounts providers: Clerk auth, Supabase client, theme]_

**Key user flows:**

1. **_[Flow name — e.g. Unauthenticated user visits homepage]_**
   - Entry: `_[file path]_`
   - Path: _[brief description of what happens step by step]_

2. **_[Flow name — e.g. User signs up]_**
   - Entry: `_[file path]_`
   - Path: _[brief description]_

3. **_[Flow name — e.g. User performs core action]_**
   - Entry: `_[file path]_`
   - Path: _[brief description]_

---

## State Management

_[Describe how state flows through the app. Be specific about what tools are used and for what type of state.]_

**Server state** (data from DB / API): _[e.g. Fetched in Server Components via Supabase client; no client-side caching layer yet]_

**Client state** (UI state, local interactions): _[e.g. useState / useReducer for component-local state; no global client store]_

**Auth state**: _[e.g. Clerk — accessed via `useUser()` hook client-side, `currentUser()` server-side]_

**Form state**: _[e.g. React Hook Form + Zod for all forms]_

**URL state**: _[e.g. Search params via `useSearchParams()` for filters and pagination]_

---

## Data Layer

_[Describe how data is fetched, cached, and mutated. Include the pattern used for each operation type.]_

**Reads (queries):**
_[e.g. Server Components fetch directly from Supabase using the server client from `lib/supabase/server.ts`. No ORM — raw SQL via Supabase query builder.]_

**Writes (mutations):**
_[e.g. Server Actions in `app/[feature]/actions.ts` — validated with Zod, then call Supabase. Revalidate with `revalidatePath()` or `revalidateTag()`.]_

**Caching strategy:**
_[e.g. Next.js default fetch cache for external APIs. Supabase queries are not cached — fetched fresh on each request unless wrapped in `unstable_cache`.]_

**Real-time subscriptions:**
_[e.g. Not implemented yet / Supabase Realtime used in `[file]` for `[feature]`]_

---

## Known Issues

| Issue | Severity | Area | Workaround |
|-------|----------|------|------------|
| _[Description of the issue]_ | _[High / Medium / Low]_ | _[File or feature area]_ | _[Workaround if any, or "None"]_ |
| _[Description of the issue]_ | _[High / Medium / Low]_ | _[File or feature area]_ | _[Workaround if any, or "None"]_ |
| _[Description of the issue]_ | _[High / Medium / Low]_ | _[File or feature area]_ | _[Workaround if any, or "None"]_ |

---

_Last updated: — | Updated by: —_
