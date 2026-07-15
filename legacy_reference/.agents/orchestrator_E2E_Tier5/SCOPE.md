# Scope: Phase 2 - Adversarial Coverage Hardening (Tier 5)

## Architecture
- White-box testing using Playwright.
- Identify untested code paths in `src/app/api/generate-doc/route.ts` and `src/app/api/onboarding/route.ts` etc.
- Generate adversarial test cases.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Tier 5 Adversarial Tests | Analyze source + existing tests, produce gap report, generate adversarial tests, fix exposed bugs. | none | PLANNED |

## Interface Contracts
- Must use Challenger-initiated loop (2 Challengers -> Worker -> Reviewer).
