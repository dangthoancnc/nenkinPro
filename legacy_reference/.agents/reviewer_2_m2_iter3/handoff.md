## Observation
- Viewed `src/app/api/ocr/route.ts` and confirmed `allowedTypes` for unauthenticated (`source === 'onboarding'`) requests is explicitly set to `['zairyuFront', 'zairyuBack', 'passport', 'nenkin', 'bank']` (line 13).
- Verified `buildPrompt` function contains dedicated handlers for each of these `allowedTypes`, each returning a strictly constrained prompt instructing the AI to parse specific fields and return an error if the document type doesn't match.
- The `bankPassbook` document type has indeed been removed from `allowedTypes`.
- Ran `npm run build` which completed successfully with no TypeScript or build errors.

## Logic Chain
1. The objective was to secure the unauthenticated OCR endpoint by ensuring only document types with strictly defined prompts are permitted.
2. By restricting `allowedTypes` to exactly those handled by `buildPrompt` with strict prompts, and defaulting missing `documentType` to `zairyuFront` (which is also strict), the fallback "extract anything" prompt is effectively locked behind the authentication check.
3. The removal of `bankPassbook` and reliance on the verified `bank` strict prompt satisfies the security requirement.
4. The successful Next.js build verifies that these changes didn't introduce syntax or typing regressions.

## Caveats
- No caveats found. The fix accurately addresses the problem.

## Conclusion
The implemented fix correctly restricts unauthenticated OCR endpoint usage to strictly-prompted document types. The code is complete, robust, and correctly conforms to the interface without breaking the build.

**Verdict**: PASS

## Verification Method
- Code review: Inspect `src/app/api/ocr/route.ts` line 13 and `buildPrompt`.
- Build verification: Run `npm run build`.
