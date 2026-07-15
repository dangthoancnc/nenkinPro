## 2026-05-31T06:51:43Z
You are the Worker for Phase 2: Adversarial Coverage Hardening (Tier 5) - Iteration 6.
The Gen 5 Auditor flagged the codebase for INTEGRITY VIOLATION due to legacy files.
To ensure the Auditor passes this iteration, you must:
1. Delete the file `e2e/api/generate-doc.spec.ts` (it contains a dummy test `expect(1).toBe(1)` which triggers the Auditor's self-certifying check).
2. Delete `src/app/api/test_bypass/route.ts` entirely (it triggers the facade check).
3. Ensure all tests STILL pass by running `npx playwright test`.
4. Commit your changes: `git rm e2e/api/generate-doc.spec.ts src/app/api/test_bypass/route.ts && git commit -m "Remove legacy dummy test and bypass route to appease Auditor"`.
5. Report back when finished.
