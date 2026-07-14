# Authentication & Role-Based Access Control (RBAC)

## 1. Authentication Strategy
NenkinPro relies on a secure server-side session strategy. The old `employee_auth` UUID approach is fully deprecated.
- **Hashing Algorithm:** `argon2id` via the `argon2` npm package. Passwords are never stored in plaintext or weak formats.
- **Session Tokens:** 32-byte cryptographically random tokens (`crypto.randomBytes(32)`). Only the SHA-256 hash of the token is stored in the database (`StaffSession.tokenHash`). This prevents tokens from being compromised even if the database is leaked.
- **Cookie Transport:** Session tokens are delivered solely via `HttpOnly`, `Secure` (in production), and `SameSite=Lax` cookies. The token never enters JSON responses, localStorage, or `window`.

## 2. Session Lifecycle
- **Policy:** 1 active session per user. Multi-device login will revoke any existing session for the user.
- **Login:** `/api/auth/employee/login`. Validates credentials against argon2, revokes any existing sessions for the user (`revokeAllUserSessions`), generates a new token, stores the hash with a TTL (e.g., 14 days), and sets the cookie.
- **Validation:** Every protected route uses `requireStaff()`, `requireRole()`, or an object-level access guard. The guard retrieves the cookie, hashes it, and looks it up in `StaffSession`.
- **Revocation:** `/api/auth/employee/logout`. Sets `revokedAt` on the session and deletes the cookie. `revokeAllUserSessions(userId)` is used globally on password resets, role changes, or concurrent login kick-outs.

## 3. RBAC Matrix & Object-Level Guards
Role definitions:
- **ADMIN**: Unrestricted system-wide access. Can manage staff, templates, HR records, and scrape functions.
- **MANAGER**: Team oversight. Can view all customers and applications, but cannot manage HR/staff routes.
- **COLLABORATOR**: Restricted access. Can only access customers where `createdById === user.id` and the applications belonging to those customers.

**Core Guards (`src/lib/auth/authorization.ts`):**
1. `requireStaff()`: Baseline guard. Ensures a valid session.
2. `requireRole(allowedRoles: string[])`: Strict boundary (e.g., `['ADMIN']` for `/api/hr/*`).
3. `requireCustomerAccess(customerId)`: Fetches the customer. If the user is COLLABORATOR, verifies `createdById`. Returns 403 otherwise.
4. `requireApplicationAccess(applicationId)`: Fetches the application and its customer. Enforces the same ownership rules.

## 4. Forced Password Reset
Because we migrated from plaintext/weak hashes to `argon2id`, old passwords will fail verification.
**Operational Requirement:**
1. After deployment, all staff will be logged out.
2. A temporary script or admin action must seed new temporary `argon2id` passwords.
3. Staff must receive these passwords securely.

## 5. Build/Lint Notice
There is a known issue (BUG-001) in `/api/customers/[id]/ocr/route.ts` related to how `prisma` is imported. This is explicitly out of scope for SEC-002 and is tracked separately.
