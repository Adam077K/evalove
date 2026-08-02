# Patterns

Approved architectural patterns, anti-patterns, and reusable building blocks for this codebase.

<!-- Agent: build-lead + code-reviewer | When: Project initialization, after a major architectural decision, or when a pattern is proven stable and worth standardizing | Instructions: Approved Patterns must each have a concrete code example — abstract descriptions are insufficient. Anti-Patterns must explain WHY it is forbidden, not just that it is. When adding a pattern, verify it is already used in the codebase before marking it approved. If a pattern is under evaluation, mark it "Proposed" not "Approved". -->

---

## Approved Patterns

### Server Components by Default

**When to use:** Any component that does not need browser APIs, event listeners, or React hooks that manage client state.

**Example:**

```tsx
// app/dashboard/page.tsx — Server Component (no 'use client')
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: projects } = await supabase.from('projects').select('*')

  return <ProjectList projects={projects ?? []} />
}
```

---

### Zod Validation at Every Trust Boundary

**When to use:** All external input — API route bodies, Server Action arguments, URL params, environment variables, third-party webhook payloads.

**Example:**

```ts
// lib/schemas/project.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
```

---

### Server Actions for Mutations

**When to use:** All data mutations from the client — form submissions, button actions, optimistic updates.

**Example:**

```ts
// app/projects/actions.ts
'use server'
import { createProjectSchema } from '@/lib/schemas/project'
import { createClient } from '@/lib/supabase/server'

export async function createProject(input: unknown) {
  const validated = createProjectSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: validated.error.flatten() }
  }
  const supabase = createClient()
  const { data, error } = await supabase.from('projects').insert(validated.data).select().single()
  if (error) return { success: false, error: { code: 'DB_ERROR', message: error.message } }
  return { success: true, data }
}
```

---

### _[Pattern Name — add more as needed]_

**When to use:** _[Situation that calls for this pattern]_

**Example:**

```ts
// _[file path]_
_[code example]_
```

---

## Anti-Patterns

### No `any` Types

**Why forbidden:** `any` disables TypeScript's type checker for the annotated value and everything that flows through it. Bugs that TypeScript would catch at compile time become runtime failures. Use `unknown` + type narrowing, or define a proper type.

```ts
// Wrong
function processData(data: any) { ... }

// Correct
function processData(data: unknown) {
  const validated = mySchema.parse(data)
  // now validated is fully typed
}
```

---

### No N+1 Queries

**Why forbidden:** A query inside a loop makes one DB round-trip per item. At 100 items, that is 100 round-trips. This causes visible latency at scale and can saturate connection pools.

```ts
// Wrong — 1 query per user
const users = await getUsers()
for (const user of users) {
  const profile = await getProfile(user.id) // N+1
}

// Correct — 1 query, JOIN or batch fetch
const usersWithProfiles = await supabase
  .from('users')
  .select('*, profiles(*)')
```

---

### No Secrets in Code

**Why forbidden:** Secrets committed to git are permanently exposed in history even if later removed. Rotate any secret that touches source control.

```ts
// Wrong
const client = createClient('https://xyz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6...')

// Correct
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

### No Unhandled Async Operations

**Why forbidden:** Unhandled promise rejections crash the process in Node.js and silently swallow errors in the browser, making bugs invisible.

```ts
// Wrong
async function handleClick() {
  await saveData() // what if this throws?
}

// Correct
async function handleClick() {
  try {
    await saveData()
  } catch (error) {
    toast.error('Failed to save. Please try again.')
    reportError(error)
  }
}
```

---

### _[Anti-pattern name — add more as needed]_

**Why forbidden:** _[Concrete explanation of the failure mode it causes]_

---

## Reusable Components / Utilities

| Name | Location | Purpose | Usage |
|------|----------|---------|-------|
| _[ComponentName]_ | `_[path]_` | _[What it does]_ | `_[import + usage example in 1 line]_` |
| _[utilityName]_ | `_[path]_` | _[What it does]_ | `_[import + usage example in 1 line]_` |
| _[ComponentName]_ | `_[path]_` | _[What it does]_ | `_[import + usage example in 1 line]_` |
| _[utilityName]_ | `_[path]_` | _[What it does]_ | `_[import + usage example in 1 line]_` |

---

## Data Fetching Patterns

_[Describe the approved data fetching approach for each context. Be specific about which library or mechanism is used and where.]_

**In Server Components (default):**
_[e.g. Direct Supabase server client. No SWR or React Query — data is fetched at render time, server-side.]_

```tsx
const supabase = createClient() // lib/supabase/server.ts
const { data } = await supabase.from('table').select('*')
```

**In Client Components (when realtime or user-triggered refetch is needed):**
_[e.g. SWR for client-side fetching. Only used when server rendering is not feasible.]_

```tsx
const { data, error, mutate } = useSWR('/api/resource', fetcher)
```

**Mutations:**
_[e.g. Server Actions — see Approved Patterns above.]_

---

## Authentication Patterns

_[Describe how auth state is accessed server-side and client-side, and how protected routes are enforced.]_

**Server-side auth check:**

```ts
// In Server Components or API routes
import { auth } from '@clerk/nextjs/server'

const { userId } = await auth()
if (!userId) redirect('/sign-in')
```

**Client-side auth check:**

```tsx
import { useUser } from '@clerk/nextjs'

const { user, isLoaded } = useUser()
if (!isLoaded) return <Skeleton />
if (!user) return <RedirectToSignIn />
```

**Middleware (route protection):**
_[e.g. `middleware.ts` at root uses Clerk's `clerkMiddleware` to protect all routes under `(app)/` route group.]_

---

## Error Boundary Patterns

_[Describe where error boundaries are placed and how they behave.]_

**Route-level errors:** Next.js `error.tsx` files catch rendering errors within a route segment.

```tsx
// app/dashboard/error.tsx
'use client'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>Something went wrong loading the dashboard.</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Component-level errors:** _[e.g. Use React's ErrorBoundary class component or a library like react-error-boundary for non-route UI sections that should degrade gracefully.]_

**Async Server Component errors:** _[e.g. Wrap in try/catch and render an inline error state — do not let the error propagate to the route-level error.tsx unless it is truly unrecoverable.]_

---

_Last updated: — | Updated by: —_
