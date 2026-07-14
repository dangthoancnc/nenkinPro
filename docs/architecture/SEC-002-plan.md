# SEC-002: Secure employee authentication, server-side session and RBAC

This plan details the steps to replace the current insecure `employee_auth` UUID cookie mechanism with a secure server-side session strategy.

## User Review Required
> [!WARNING]
> This change introduces a new Prisma model (`StaffSession`) which requires generating a migration. Since I will not reset the DB or delete existing data, any active employee logins will be logged out upon deployment because the UUID cookie will be invalidated.

> [!IMPORTANT]
> The Portal Customer authentication will remain untouched per your instructions. However, we should schedule a review of the Customer Portal PIN and Auth mechanism as a fast follow.

## Proposed Changes

### Prisma Schema
#### [MODIFY] schema.prisma
- Add `StaffSession` model to store active sessions with `tokenHash`, `userId`, `expiresAt`, `revokedAt`, `lastSeenAt`.
- Add `sessions StaffSession[]` to the `User` model.

### Auth Utilities
#### [NEW] password.ts
- Implement password verification using `argon2`.

#### [NEW] session.ts
- Functions to generate 32-byte secure session tokens using `crypto.randomBytes()`.
- Functions to create, validate, and revoke sessions in the database using SHA-256 hashed tokens.

#### [NEW] cookies.ts
- Utilities to set `nenkin_staff_session` cookie (HttpOnly, Secure in prod, Lax, Path=/).

#### [NEW] authorization.ts
- Implementation of `requireStaff()` and `requireRole(...roles)` guards that return standard 401/403 errors.

### Existing Auth Refactoring
#### [MODIFY] serverAuth.ts
- Update `validateEmployee` to verify the `nenkin_staff_session` cookie against the database (checking hash, expiration, and revocation) and update `lastSeenAt`.

#### [MODIFY] login/route.ts
- Change logic to verify password via `argon2`, generate a new session, store the token hash, and set the secure cookie.

#### [MODIFY] logout/route.ts
- Change logic to revoke the current session in DB and clear the cookie.

### API Guards Implementation
I will systematically update all API routes to replace weak or absent checks with `requireStaff()` or `requireRole()`:
- **HR endpoints** (`/api/hr/seed`, `/api/hr/staffs`): `requireRole('ADMIN')`
- **Employee Management**: `requireRole('ADMIN')`
- **Customer/Application Data** (`/api/customers`, `/api/applications`): `requireStaff()`
- **Dashboard/Finance** (`/api/dashboard`, `/api/exchange-rates`): `requireStaff()`
- **Onboarding/Public** (`/api/onboarding`): Leave as public.

### Documentation & Tests
#### [MODIFY] README.md & .env.example
- Add `SESSION_TTL_DAYS` environment variable info.

#### [NEW] auth-rbac.md
- Document the new session lifecycle and RBAC policy.

#### [NEW] auth.test.ts (or equivalent test setup)
- Add core auth unit/integration tests as requested (login success, login fail, old UUID rejected, expired/revoked session rejected).

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npm run build` (understanding the pre-existing OCR error BUG-001 will remain).
- Run newly added Auth unit tests.

### Manual Verification
- Execute `npx prisma migrate dev --name init_staff_session` to verify schema generation works.
- Start dev server, verify login flow sets `nenkin_staff_session` and logout clears it.
- Try accessing an ADMIN route as a COLLABORATOR to ensure 403 Forbidden is returned.
