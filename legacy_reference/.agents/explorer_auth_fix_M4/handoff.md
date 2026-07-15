# Handoff Report: Auth Bypass in `generate-form/route.ts`

## 1. Observation

In `src/app/api/generate-form/route.ts` (lines 11-16), the authentication check is implemented as follows:
```typescript
    const cookieStore = await cookies();
    const userId = cookieStore.get('employee_auth')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
```
This route then accesses the requested customer via `prisma.customer.findUnique({ where: { id: customerId } })` and generates a form document.

In comparison, proper authentication in the app, such as in `src/app/api/customers/[id]/route.ts` (lines 5-20), involves a `verifyAccess` function that queries the database:
```typescript
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, error: 'Unauthorized', status: 401 };

  if (user.role === 'COLLABORATOR') {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.createdById !== userId) {
      return { allowed: false, error: 'Bạn không có quyền thao tác trên khách hàng này.', status: 403 };
    }
  }
```

## 2. Logic Chain

1. The `employee_auth` cookie stores only the user ID string without any cryptographic signature (as seen in `src/app/api/auth/employee/login/route.ts` where it simply does `cookieStore.set('employee_auth', user.id)`). 
2. The current check in `generate-form` only verifies if the `userId` is present in the cookie. An attacker can trivially forge an `employee_auth` cookie containing any arbitrary value to bypass this check.
3. Furthermore, even if the cookie contains a valid user ID, the system does not enforce Role-Based Access Control (RBAC). Specifically, a user with the `COLLABORATOR` role should only be able to generate forms for customers they have created (`customer.createdById === userId`). Without this check, a collaborator can access personal data of any customer by predicting their `customerId`.
4. Therefore, `generate-form/route.ts` is vulnerable to both unauthenticated access (via fake cookies) and unauthorized data access (via missing RBAC checks).

## 3. Caveats
- I did not create a shared authentication middleware, as Next.js API routes often use inline checks or a helper file in this repository. 
- It appears `src/app/api/customers/route.ts` also has a similar vulnerability in its `POST` route where it does not verify the user in the database before assigning `createdById: userId`. Fixing this was outside the requested scope, but it's worth noting.

## 4. Conclusion

**Actionable Fix Strategy:**
The implementer must update `src/app/api/generate-form/route.ts` to perform full session validation and access control. 
Recommended changes to `src/app/api/generate-form/route.ts`:
1. **User Validation:** After retrieving `userId` from the cookie, use `prisma.user.findUnique` to verify the user exists in the database. If not, return a 401 response.
2. **Access Control:** After fetching the `customer` from the database, check the user's role. If `user.role === 'COLLABORATOR'`, verify that `customer.createdById === userId`. If they don't match, return a 403 response.

Proposed pseudo-code for `src/app/api/generate-form/route.ts`:
```typescript
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ... later after fetching customer ...
    if (user.role === 'COLLABORATOR' && customer.createdById !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
```

## 5. Verification Method

- **Code Review:** Inspect `src/app/api/generate-form/route.ts` to ensure it contains a call to `prisma.user.findUnique` and a check for `user.role === 'COLLABORATOR'`.
- **Manual Test:** Try to trigger `/api/generate-form` with a fake `employee_auth` cookie containing a non-existent UUID. It should return 401. Try to trigger it as a `COLLABORATOR` for a customer created by someone else. It should return 403.
