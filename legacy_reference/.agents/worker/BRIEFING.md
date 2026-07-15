# BRIEFING

## Mission
Fix Prisma test setup and staffCode query, ensure all tests pass perfectly, and commit the changes.

## 🔒 My Identity
- Archetype: Implementer
- Roles: implementer, qa, specialist
- Working directory: g:/AntiGravity/apps/nenkin/.agents/worker
- Original parent: 5c0ae09d-d694-402b-922f-29a3b7fe3940
- Milestone: Phase 2: Adversarial Coverage Hardening (Tier 5) - Iteration 4

## 🔒 Key Constraints
- All implementations must be genuine.
- Do not fabricate test results.
- Commit the changes explicitly.

## Current Parent
- Conversation ID: 5c0ae09d-d694-402b-922f-29a3b7fe3940
- Updated: 2026-05-31T15:33:40+09:00

## Task Summary
- **What to build**: Fix API route querying `staffCode` and remove `status` and `cardNumber` from test setups.
- **Success criteria**: Playwright tests pass perfectly and changes are committed.

## Key Decisions Made
- Used `id: ref` instead of `staffCode: ref` in `onboarding/route.ts` as the schema requires a valid lookup field and the tests use `ref`.
- Removed `status` and `cardNumber` directly from adversarial gen1 and gen2 test `beforeAll` blocks.

## Change Tracker
- **Files modified**: `route.ts`, `adversarial_gen1.spec.ts`, `adversarial_gen2.spec.ts`.
- **Build status**: Pass.
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Pass (23/23 Playwright tests passed).
- **Lint status**: NA.
- **Tests added/modified**: Modified test setup.
