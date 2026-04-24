# JWT Auth System Design

**Date:** 2026-04-23  
**Stack:** Express 5, TypeScript, Bun, Drizzle ORM, PostgreSQL  

---

## Decisions

| Concern | Choice | Reason |
|---|---|---|
| Token strategy | Access + refresh pair | Silent re-auth without re-login |
| Refresh storage | PostgreSQL (Drizzle) | Persistent, revocable, fits existing stack |
| JWT payload | `userId` only | Always-fresh role from DB, no stale role bugs |
| Password hashing | `bcryptjs` (rounds: 10) | Portable, well-known |

---

## File Structure

```
src/
  auth/
    router.ts      — Express routes: POST /login, POST /refresh, POST /logout
    service.ts     — business logic: validateUser, issueTokens, revokeToken
    token.ts       — pure JWT helpers: sign, verify, decode
    middleware.ts  — Express middleware: authenticateRequest (attaches req.user)
  db/
    schema.ts      — add refresh_tokens table
```

`Server` mounts `authRouter` at `/api/auth`. `authenticateRequest` middleware exported for other routers.

---

## Database Schema

New table in `src/db/schema.ts`:

```ts
export const refreshTokens = pgTable('refresh_tokens', {
  id:        serial('id').primaryKey(),
  token:     varchar('token', { length: 512 }).notNull().unique(),
  userId:    integer('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

`users` table unchanged — already has `correo` + `pass`.

---

## Endpoints

### POST /api/auth/login
**Body:** `{ correo: string, pass: string }`

1. Find user by `correo` → 401 if not found
2. `bcryptjs.compare(pass, user.pass)` → 401 if mismatch
3. Sign access token (`userId`, 15min) + refresh token (`userId`, 7d)
4. Store refresh token + `expiresAt` in `refresh_tokens`
5. Return `{ accessToken, refreshToken }`

### POST /api/auth/refresh
**Body:** `{ refreshToken: string }`

1. Verify refresh token signature → 401 if invalid
2. Look up token in DB → 401 if not found or expired
3. **In a single DB transaction:** delete old token row + insert new refresh token row
4. Sign new access token
5. Return `{ accessToken, refreshToken }`

### POST /api/auth/logout
**Body:** `{ refreshToken: string }`

1. Delete refresh token row from DB
2. Return 204

### Middleware: authenticateRequest
Applied to protected routes.

1. Extract `Bearer <token>` from `Authorization` header → 401 if missing
2. Verify access token signature → 401 if invalid/expired
3. Attach `req.user = { userId: number }` → `next()`

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Sign/verify access tokens |
| `JWT_REFRESH_SECRET` | Sign/verify refresh tokens |

Server fails to start if either is missing.

---

## Error Handling & Security

- All auth errors: `{ error: string }` with HTTP 400/401/403
- JWT secrets from env — never hardcoded, never logged
- `bcryptjs` rounds: 10
- Expired refresh tokens purged from DB lazily on each `/refresh` call
- Short access token TTL (15min) + DB-backed refresh revocation = no blacklist needed
- Token rotation on refresh: old token deleted, new pair issued atomically

---

## Token Specs

| Token | Algorithm | TTL | Payload |
|---|---|---|---|
| Access | HS256 | 15 min | `{ userId }` |
| Refresh | HS256 | 7 days | `{ userId }` |

---

## TypeScript: Express Type Augmentation

`req.user` requires declaration merging. Add to `src/auth/middleware.ts`:

```ts
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number };
    }
  }
}
```

This gives typed access to `req.user.userId` in all route handlers without casting.
