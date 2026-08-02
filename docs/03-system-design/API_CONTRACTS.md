# API Contracts

> Authoritative documentation for all API endpoints — what they accept, what they return, and how they fail.

<!--
Agent: backend-developer
When:
  - Written when the first API route is implemented.
  - Updated in the same PR as any endpoint change — request shape, response shape, or error codes.
  - Never let this file diverge from the actual implementation. If they conflict, the code is truth and this file is wrong.
How:
  1. Group endpoints by resource (e.g., /users, /organizations, /subscriptions). Each group gets its own H2 heading.
  2. Every endpoint must document: method, path, auth requirement, request body schema, success response shape, and all possible error responses.
  3. Request body and response fields must include the type and whether they are required or optional.
  4. "Errors" column must list every status code the endpoint can return and what triggers it — not just 400/500.
  5. Rate Limits: document the actual limits, not placeholder values. If no rate limiting is implemented yet, say so explicitly.
  6. Changelog: add a row every time an endpoint changes. Breaking changes must be flagged.
-->

---

## Base URL + Auth

**Base URL:**
- Production: `_[e.g., https://yourapp.com/api]_`
- Staging: `_[e.g., https://staging.yourapp.com/api]_`
- Local: `http://localhost:3000/api`

**Authentication:**
_[Describe how authentication works for this API. Example below — replace with your actual auth implementation.]_

All protected endpoints require a valid Clerk session. Authentication is verified server-side via:

- **Server Components / Server Actions:** `auth()` from `@clerk/nextjs/server`
- **API Routes:** `auth()` helper in the route handler

Requests without a valid session receive `401 Unauthorized`. Requests from authenticated users attempting to access resources they don't own receive `403 Forbidden`.

Public endpoints (no auth required) are marked with `[PUBLIC]` in the endpoint table.

---

## Endpoints

---

### _[Resource: e.g., Users]_

#### `GET /users/me`

Returns the current authenticated user's profile.

**Auth:** Required

**Request:** No body required.

**Response `200 OK`:**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string | null",
  "createdAt": "ISO 8601 datetime"
}
```

**Errors:**

| Status | Code | Trigger |
|--------|------|---------|
| `401` | `UNAUTHORIZED` | No valid session |
| `404` | `USER_NOT_FOUND` | Authenticated but no matching user record in DB (sync issue) |
| `500` | `INTERNAL_ERROR` | Unhandled server error |

---

#### `PATCH /users/me`

Updates the current user's profile.

**Auth:** Required

**Request body:**
```json
{
  "name": "string (optional, 1-100 chars)"
}
```

**Response `200 OK`:** Same shape as `GET /users/me`.

**Errors:**

| Status | Code | Trigger |
|--------|------|---------|
| `400` | `VALIDATION_ERROR` | Request body fails Zod schema (response includes `errors` array with field-level details) |
| `401` | `UNAUTHORIZED` | No valid session |
| `500` | `INTERNAL_ERROR` | Unhandled server error |

---

### _[Resource: e.g., [Your Resource]]_

#### `_[METHOD]_ _[/path]_`

_[One-sentence description of what this endpoint does.]_

**Auth:** _[Required / Required (admin only) / [PUBLIC]]_

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _[field]_ | _[string / number / boolean / uuid]_ | _[Yes / No]_ | _[Description and any constraints]_ |
| _[field]_ | _[type]_ | _[Yes / No]_ | _[Description]_ |

**Response `_[2xx status]_`:**
```json
{
  "_[field]_": "_[type and description]_"
}
```

**Errors:**

| Status | Code | Trigger |
|--------|------|---------|
| _[400]_ | _[VALIDATION_ERROR]_ | _[What causes this]_ |
| _[401]_ | _[UNAUTHORIZED]_ | _[What causes this]_ |
| _[403]_ | _[FORBIDDEN]_ | _[What causes this]_ |
| _[404]_ | _[NOT_FOUND]_ | _[What causes this]_ |
| _[409]_ | _[CONFLICT]_ | _[What causes this — e.g., duplicate resource]_ |
| _[500]_ | _[INTERNAL_ERROR]_ | _[What causes this]_ |

---

## Common Error Codes

_[All error `code` strings that appear across multiple endpoints.]_

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | `401` | Request has no valid session or token |
| `FORBIDDEN` | `403` | Authenticated but not permitted to perform this action |
| `NOT_FOUND` | `404` | Requested resource does not exist or is not visible to this user |
| `VALIDATION_ERROR` | `400` | Request body or query params failed schema validation. Response body includes an `errors` array: `[{ field: string, message: string }]` |
| `CONFLICT` | `409` | Action conflicts with existing state (e.g., duplicate email, concurrent edit) |
| `RATE_LIMITED` | `429` | Request rate limit exceeded. `Retry-After` header indicates when to retry. |
| `INTERNAL_ERROR` | `500` | Unhandled server error. Logged to Sentry. Safe to retry after backoff. |
| _[CODE]_ | _[status]_ | _[Meaning]_ |

**Error response shape (all errors):**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "errors": [{ "field": "fieldName", "message": "Validation message" }]
  }
}
```
_(`errors` array only present for `VALIDATION_ERROR`)_

---

## Rate Limits

_[Document actual implemented limits. If rate limiting is not yet implemented, state that explicitly so it is not assumed to be in place.]_

| Endpoint / Group | Limit | Window | Scope | Notes |
|-----------------|-------|--------|-------|-------|
| _[e.g., All authenticated endpoints]_ | _[e.g., 100 requests]_ | _[e.g., 60 seconds]_ | _[e.g., Per user]_ | _[e.g., Implemented via Upstash Redis + `@upstash/ratelimit`]_ |
| _[e.g., POST /ai/generate]_ | _[e.g., 10 requests]_ | _[e.g., 60 seconds]_ | _[e.g., Per user]_ | _[e.g., Higher cost endpoint — lower limit to control LLM spend]_ |
| _[e.g., POST /auth/* (webhooks)]_ | _[No limit]_ | _[—]_ | _[—]_ | _[Validated by webhook signature, not rate limited]_ |

**Status: _[Rate limiting is implemented / Rate limiting is NOT yet implemented — all endpoints are unprotected]_**

---

## Changelog

_[Record every endpoint change. Flag breaking changes — a breaking change is any change that requires a client update to avoid errors.]_

| Date | Endpoint | Change | Breaking? |
|------|----------|--------|-----------|
| _[YYYY-MM-DD]_ | _[e.g., GET /users/me]_ | _[e.g., Initial implementation]_ | No |
| _[YYYY-MM-DD]_ | _[e.g., PATCH /users/me]_ | _[e.g., Added `name` field validation — max length increased from 50 to 100 chars]_ | No |
| _[YYYY-MM-DD]_ | _[e.g., POST /items]_ | _[e.g., Removed `tags` field from request body — use POST /items/{id}/tags instead]_ | **YES** |
| _[Date]_ | _[Endpoint]_ | _[Change description]_ | _[Yes / No]_ |

---

_Last updated: — | Updated by: —_
