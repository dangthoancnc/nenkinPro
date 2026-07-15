# Handoff Report: Auth & RBAC Bypass Vulnerability

## Observation
1. The authentication mechanism in `src/app/api/auth/employee/login/route.ts` sets a plain text cookie storing the raw UUID of the user: `cookieStore.set('employee_auth', user.id, ...)`.
2. The `GET /api/hr/staffs/route.ts` endpoint is completely unauthenticated and leaks the `staffCode` (e.g., "A001") and `role` of all staff, allowing an attacker to identify the Admin's `staffCode`.
3. The `POST /api/portal/auth/route.ts` (action: 'register') endpoint is unauthenticated and accepts a `staffCode` parameter. It queries the `User` table for that `staffCode` and creates a new `Customer` record, setting `createdById: staff.id` to the associated user's full UUID.
4. The `POST /api/applications/route.ts` endpoint is completely unauthenticated. It accepts a `customerId` and creates a new application for that customer.
5. The `GET /api/applications/route.ts` endpoint is also completely unauthenticated. It fetches all applications and uses Prisma's `include: { customer: true }`, which returns the entire `Customer` object, explicitly exposing the `createdById` field (which contains the user's full UUID).

## Logic Chain
- Because the `employee_auth` cookie relies entirely on the client supplying a valid `user.id` (UUID), any attacker who can determine the Admin's UUID can trivially forge the cookie to become the Admin.
- An attacker can first query `GET /api/hr/staffs` to find the Admin's `staffCode` (e.g., "A001").
- The attacker then calls `POST /api/portal/auth` (action='register') with `staffCode: "A001"` to create a new customer. This binds the customer's `createdById` to the Admin's UUID in the database.
- The attacker then calls `POST /api/applications` with their new `customerId` to create an application.
- Finally, the attacker calls `GET /api/applications`, finds their application, and inspects the `customer.createdById` field in the response. This yields the Admin's true UUID.
- The attacker sets their cookie to `employee_auth=<Admin_UUID>`, completely bypassing authentication and trivially defeating the RBAC fixes implemented in `generate-form` and `customers`, since they now have `ADMIN` privileges.

## Caveats
- This attack chain assumes the database has been seeded with staff members who have a `staffCode`. (Confirmed by `check_users.js` and the login seeding logic).
- This relies on the endpoints `/api/applications` and `/api/hr/staffs` lacking authentication, which was observed in the codebase.

## Conclusion
**CRITICAL**: The recent RBAC fix is completely ineffective because the underlying authentication mechanism is fundamentally broken (Improper Authentication). The `employee_auth` cookie is an unencrypted UUID, and the system leaks this UUID through an unauthenticated application/customer creation and retrieval chain. Auth bypass is still 100% possible, leading to a complete compromise of RBAC.

## Verification Method
1. Run `curl -s http://localhost:3015/api/hr/staffs` to obtain the Admin's `staffCode`.
2. Run `curl -X POST http://localhost:3015/api/portal/auth -H "Content-Type: application/json" -d '{"action":"register","cardNumber":"HACK123","passwordPin":"1990","staffCode":"A001","fullName":"Hacker"}'` and extract the returned `customerId`.
3. Run `curl -X POST http://localhost:3015/api/applications -H "Content-Type: application/json" -d '{"customerId":"<customerId_from_step_2>"}'`
4. Run `curl -s http://localhost:3015/api/applications` and parse the output for the application with the matching `customerId`, reading `customer.createdById`.
5. Set `Cookie: employee_auth=<Admin_UUID>` and verify full `ADMIN` access to protected endpoints like `POST /api/generate-form` without any RBAC restrictions.
