# Handoff Report

## 1. Observation
- In `src/app/api/onboarding/route.ts`, a retry loop has been implemented around `prisma.customer.create` to catch `P2002` (Unique constraint) errors on the `code` field. The code generation logic produces a random suffix (`KH-` + 6 random alphanumeric characters) and retries up to 5 times on collision.
- In `src/app/api/ocr/route.ts`, the unrestricted OCR bypass has been partially addressed. For unauthenticated requests (`source === 'onboarding'`), `documentType` is restricted to `['zairyuFront', 'zairyuBack', 'passport', 'nenkin', 'bankPassbook', 'bank']` (line 13).
- However, in the same file `src/app/api/ocr/route.ts`, the `buildPrompt(documentType)` function does not have a `case 'bankPassbook':`. Thus, requests with `documentType='bankPassbook'` fall through to the `default` case (line 271).
- The `default` case returns the prompt: `Trích xuất thông tin từ tài liệu này và trả về JSON: { "data": "extracted info" }`. It lacks any validation to reject unrelated documents.
- A search of the codebase (`src/app/onboarding/page.tsx` line 105) reveals the frontend actually sends `documentType='bank'` during onboarding, not `bankPassbook`. 

## 2. Logic Chain
- The race condition fix in `api/onboarding/route.ts` is robust. It properly catches `P2002` Prisma errors specific to the `code` field and handles retries safely.
- The OCR API bypass fix intends to limit unauthenticated users to specific document types, which are tied to strict AI prompts (e.g., rejecting the image if it's not a Zairyu card).
- By including `bankPassbook` in the `allowedTypes` array, the API permits an unauthenticated user to submit `documentType=bankPassbook`.
- Because `bankPassbook` falls to the `default` prompt without strict rejection constraints, an attacker can bypass the intended restrictions and use the endpoint as a free, general-purpose OCR service for arbitrary images.
- Thus, the OCR bypass vulnerability remains exploitable.

## 3. Caveats
- I could not dynamically execute the OCR request because the API key is not available in my environment and the workspace has port collisions, but static analysis clearly shows the prompt logic routing flaw.
- The frontend in `portal/dashboard` uses `bankPassbook` for authenticated requests, which explains why the worker might have noticed it. However, it should not have been added to the unauthenticated `allowedTypes` for onboarding.

## 4. Conclusion
**Verdict: REQUEST_CHANGES**
The race condition fix in `api/onboarding/route.ts` is approved.
The unrestricted OCR API bypass fix in `api/ocr/route.ts` is incomplete. An attacker can still exploit the endpoint by sending `documentType=bankPassbook` (which is in `allowedTypes`) to trigger the unrestricted `default` prompt.

**Action Required**:
Remove `bankPassbook` from `allowedTypes` in `src/app/api/ocr/route.ts` (unauthenticated users only need `bank`, which is already handled). Optionally, implement a strict prompt for `bankPassbook` if it needs to be processed accurately for authenticated users.

## 5. Verification Method
1. Inspect `src/app/api/ocr/route.ts` lines 13-16 and lines 187-274.
2. Note that `bankPassbook` is in `allowedTypes` but missing from the `switch` statement in `buildPrompt`.
3. To reproduce the bypass, send a POST request to `/api/ocr` with `source=onboarding`, `documentType=bankPassbook`, and any image (e.g., an invoice) to see that the AI extracts the text without rejecting the document.
