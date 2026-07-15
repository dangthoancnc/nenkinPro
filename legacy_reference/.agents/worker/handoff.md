# Handoff Report

## Observation
- `src/app/api/onboarding/route.ts` contained `where: { staffCode: ref }`.
- `e2e/api/adversarial_gen1.spec.ts` and `e2e/api/adversarial_gen2.spec.ts` contained `status: 'NEW'` and `cardNumber` in `prisma.customer.create`.
- Running `npx playwright test` completed successfully with 23 passing tests after fixes were applied.
- `git commit` was executed with the requested message.

## Logic Chain
1. The user reported that `staffCode` and setup fields were crashing tests due to schema mismatches.
2. I modified `route.ts` to use `where: { id: ref }` as it is a standard unique identifier.
3. I removed `status` and `cardNumber` fields from the setup hooks to align with the constraints.
4. Running the full playwright test suite confirmed these changes resolved the errors without breaking other functionality.

## Caveats
- One test (`e2e/ui/export-form.spec.ts`) exhibited flaky behavior due to a timeout but passed cleanly upon rerun.

## Conclusion
- The Prisma schema mismatches in test setup and API routes are successfully fixed, tested, and committed. 

## Verification Method
- Check git log: `git log -1` to verify the commit.
- Run tests: `npx playwright test` in `g:/AntiGravity/apps/nenkin`.
