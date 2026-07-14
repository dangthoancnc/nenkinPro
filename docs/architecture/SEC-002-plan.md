# SEC-002: Secure employee authentication, server-side session and RBAC

This plan details the steps to replace the current insecure `employee_auth` UUID cookie mechanism with a secure server-side session strategy.

## 1. Production Migration Strategy
- **Local/Staging:** I will use `npx prisma migrate dev --name init_staff_session` locally to generate the migration file and test the schema changes. The migration folder will be committed to source control.
- **Production:** The deployment pipeline or operator will solely use `npx prisma migrate deploy`.
- **Safety Guarantee:** The migration is strictly additive-only. It creates the new `nenkin_staff_sessions` table and adds indices/relations. No existing tables, rows, or schemas will be reset, dropped, or altered.

## 2. Password Legacy Strategy
Currently, `User.password` stores the password (assumed to be plaintext or another hash). Switching directly to `argon2id` would break existing logins. 
**Decision:** We will enforce a **forced password reset for all staff**.
- Immediately post-deployment, existing staff will not be able to log in with their old passwords since the new system expects an `argon2id` hash. 
- A backend admin script or initial seed update will be required to issue new temporary `argon2id` hashed passwords for the staff, or we will establish a short migration window if requested. 
- *Why:* This is the most secure path and completely purges any insecurely stored passwords from the active verification flow, ensuring plaintext/weak passwords do not persist past this migration.

## 3. Authorization & Ownership Checks
`requireStaff()` is insufficient for full RBAC. I will introduce object-level access helpers:
- `requireCustomerAccess(user, customerId)`
- `requireApplicationAccess(user, applicationId)`

**Ownership Logic (Checked on Server-Side via DB queries):**
- **ADMIN:** Unrestricted access.
- **MANAGER:** Full visibility of all customers and applications (defined scope: team oversight).
- **COLLABORATOR:** Strictly limited to `Customer.createdById === user.id` and any `NenkinApplication` belonging to those specific customers.
- Under no circumstances will the system trust a client-provided `role` or `userId`. Ownership is always derived from the secure session token -> user ID -> database query.

## 4. Route Inventory & RBAC Matrix

| Route Group | Required Policy | Notes |
| :--- | :--- | :--- |
| `/api/onboarding/*` | Public | Strict validation, baseline rate-limiting. |
| `/api/auth/employee/login` | Public | Strict login validation, rate limiting baseline to prevent brute-force. |
| `/api/auth/employee/logout` | Staff | Requires valid session to revoke. |
| `/api/auth/employee/me` | Staff | Requires valid session. |
| `/api/customers/*` | Staff + Ownership | COLLABORATOR restricted to own customers; ADMIN/MANAGER full access. |
| `/api/applications/*` | Staff + Ownership | Inherits customer ownership rules. |
| `/api/generate-doc` | Staff + Ownership | Requires rights to the underlying application; audit-event placeholder. |
| `/api/generate-form` | Staff + Ownership | Requires rights to the underlying application; audit-event placeholder. |
| `/api/applications/[id]/generate-pdf` | Staff + Ownership | Requires rights to the underlying application. |
| `/api/ocr`, `/api/customers/[id]/ocr` | Staff + Ownership | Requires rights to the customer being processed. |
| `/api/dashboard/*` | Staff | Scoped data (e.g., Collaborators see their own KPI, Admin sees all). |
| `/api/exchange-rate*` | Staff | Global read access for staff. |
| `/api/hr/*`, `/api/admin/*` | ADMIN | Strict admin boundary. |
| `/api/tax-offices/*` | Staff (Read), ADMIN (Write) | Reference data management. |
| `/api/tax-representatives/*` | Staff (Read), ADMIN (Write) | Reference data management. |
| `/api/nta-scrape` | ADMIN | Strictly ADMIN; not public; rate-limited. |
| `/api/templates/mapping/*` | ADMIN | Template management strictly ADMIN. |
| `/api/portal/*` | *Out of Scope* | Security debt explicitly acknowledged. Kept intact for this ticket. |

## 5. Testing & Release Gates
The following automated tests will be added/ensured to pass:
1. **Cross-Owner Access:** COLLABORATOR attempting to access `/api/customers/:id` of another user receives `403 Forbidden` (not 404).
2. **Cross-Owner Document Generation:** COLLABORATOR attempting to generate PDF/doc for an unauthorized application receives `403 Forbidden`.
3. **Admin Exclusivity:** COLLABORATOR attempting to access `/api/hr/*` receives `403 Forbidden`.
4. **Session Token Hardening:** The old `employee_auth` UUID cookie is wiped and ignored entirely. The raw 32-byte session token is strictly verified against the SHA-256 hash in the database and never appears in JSON responses, logs, or persistent client state (except the secure HttpOnly cookie).
5. **Rate Limiting Baseline:** Login endpoint incorporates basic failure/rate-limit logic to deter brute forcing.
6. **BUG-001 Separation:** The current Turbopack/OCR build failure will be documented in a separate ticket (BUG-001) and will not be masked or falsely passed in this implementation.

## 6. Document Updates
- **`auth-rbac.md`**: Will be created to meticulously document the session lifecycle, password strategy, revoke policies, cookie security flags, and the explicit RBAC/ownership matrix.
- **`task.md`**: Will track these precise steps with checkboxes, ownership, and definitions of done.
