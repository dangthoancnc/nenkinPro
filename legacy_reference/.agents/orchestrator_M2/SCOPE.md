# Scope: Milestone 2 (Onboarding Wizard)

## Architecture
- Route: `/onboarding`
- UI: Multi-step wizard (Step 1: Input, Step 2: Zairyu upload + OCR, Step 3: Other docs, Step 4: Submission)
- Link tracking: `/onboarding?ref=STAFF_CODE` -> auto assign to staff.
- APIs: `/api/onboarding` (create Customer and Application in PENDING status), `/api/ocr` (extract info from Zairyu card).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Onboarding Wizard | Create `/onboarding` route, step UI, PIN + ref code logic, OCR integration, Customer + Application creation. | none | DONE |

## Interface Contracts
- API `POST /api/onboarding`: { name, phone, dob, pin, refCode, docs... } -> creates Customer & NenkinApplication.
- API `POST /api/ocr`: { image } -> { cardNumber, address }
