# Conventions

Code conventions, naming rules, and style standards — the law that every agent and contributor follows without exception.

<!-- Agent: build-lead + code-reviewer | When: Project initialization, or when a new pattern is adopted that should be standardized | Instructions: Every section must have concrete examples showing the rule in action. "Examples" sections are not optional — an abstract rule without an example is not actionable. If you discover a pattern being used inconsistently in the codebase, document what it SHOULD be here, then file a Known Issue in MAP.md until it is fixed. -->

---

## File & Folder Naming

**Rule:** All files and folders use kebab-case. No exceptions.

```
# Correct
user-profile.tsx
auth-helpers.ts
forgot-password/
api/send-email/

# Wrong
UserProfile.tsx
authHelpers.ts
ForgotPassword/
api/sendEmail/
```

**Exceptions:**
- `_[Any project-specific exceptions — e.g. Next.js special files like layout.tsx, page.tsx, loading.tsx are lowercase by Next.js convention]_`

---

## Component Naming

**Rule:** React components are PascalCase. File name matches the component name.

```tsx
// File: components/user-profile-card.tsx
// Component:
export function UserProfileCard({ user }: UserProfileCardProps) { ... }

// Wrong
export function userProfileCard() { ... }
export function user_profile_card() { ... }
```

**Co-location rule:** _[e.g. Component-specific sub-components live in the same file unless they exceed 100 lines, at which point they get their own file in the same directory.]_

**Props naming:** Props interfaces are named `[ComponentName]Props`.

```tsx
interface UserProfileCardProps {
  user: User
  onEdit?: () => void
}
```

---

## Variable & Function Naming

**Variables and functions:** camelCase.

```ts
const userCount = 0
const isLoading = false
function fetchUserById(id: string) { ... }
function handleSubmit(event: FormEvent) { ... }
```

**Constants (module-level, never change):** SCREAMING_SNAKE_CASE.

```ts
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_PAGE_SIZE = 20
```

**Boolean variables:** prefix with `is`, `has`, `can`, `should`.

```ts
const isAuthenticated = true
const hasCompletedOnboarding = false
const canEditProfile = user.role === 'admin'
```

**Type aliases and interfaces:** PascalCase.

```ts
type UserId = string
interface UserProfile { ... }
```

---

## API Naming

**REST endpoints:** kebab-case, plural nouns for resources, no verbs.

```
# Correct
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
POST   /api/invitations/accept   ← action on resource is OK

# Wrong
GET  /api/getUsers
POST /api/createUser
GET  /api/user/:id               ← singular
```

**Query parameters:** camelCase.

```
/api/users?pageSize=20&sortBy=createdAt&filterRole=admin
```

**Response shape:**

```ts
// Success
{ data: T, meta?: { total: number, page: number } }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

---

## Database Naming

**Tables:** snake_case, plural nouns.

```sql
-- Correct
users
user_profiles
subscription_events

-- Wrong
User, UserProfile, SubscriptionEvent  -- PascalCase
user, user_profile                    -- singular
```

**Columns:** snake_case.

```sql
id, created_at, updated_at, user_id, stripe_customer_id
```

**Foreign keys:** `[referenced_table_singular]_id`.

```sql
user_id        -- references users.id
workspace_id   -- references workspaces.id
```

**Indexes:** `idx_[table]_[column(s)]`.

```sql
idx_users_email
idx_subscription_events_user_id_created_at
```

**Boolean columns:** prefix with `is_` or `has_`.

```sql
is_active, is_deleted, has_onboarded
```

---

## Comments & Documentation

**What to comment:**
- Non-obvious business logic ("why" not "what")
- Workarounds for known bugs or external API quirks
- Performance decisions (why we denormalized, why we avoid a join here)

**What not to comment:**
- What the code obviously does (`// increment counter` above `count++`)
- Commented-out code — delete it, git has history
- TODO/FIXME — file a Known Issue in `MAP.md` instead

**Format:**

```ts
// Good: explains WHY
// Supabase auth.getUser() makes a network call — use sparingly in hot paths.
// Cache the result at the request level when calling multiple times.
const { data: { user } } = await supabase.auth.getUser()

// Bad: explains WHAT (obvious from code)
// Get the user
const { data: { user } } = await supabase.auth.getUser()
```

**JSDoc:** Only on exported functions in `lib/` that are shared across features. Not required on components.

---

## Import Order Convention

_[Enforce with ESLint `import/order` rule if available. Order is:]_

1. Node built-ins (`fs`, `path`, `crypto`)
2. External packages (`react`, `next`, `zod`)
3. Internal aliases (`@/lib/...`, `@/components/...`, `@/types/...`)
4. Relative imports (`./utils`, `../hooks/use-auth`)
5. Type-only imports (`import type { ... }`) — last

```ts
// 1. Built-ins
import { readFileSync } from 'fs'

// 2. External
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// 3. Internal aliases
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'

// 4. Relative
import { formatDate } from './utils'

// 5. Types
import type { User } from '@/types'
```

---

## Error Handling Patterns

**All async operations use try/catch or Result types — no unhandled promise rejections.**

**Server Actions:**

```ts
// Return a discriminated union — never throw from a Server Action
export async function createUser(input: CreateUserInput): Promise<ActionResult<User>> {
  try {
    const validated = createUserSchema.parse(input)
    const user = await db.users.create(validated)
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } }
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }
  }
}
```

**API Routes:**

```ts
// Use consistent error response shape — see API Naming section
return NextResponse.json(
  { error: { code: 'NOT_FOUND', message: 'User not found' } },
  { status: 404 }
)
```

**Client components:** Wrap in React Error Boundaries. Use `error.tsx` in App Router for route-level errors.

_[Add any project-specific error handling patterns here.]_

---

_Last updated: — | Updated by: —_
