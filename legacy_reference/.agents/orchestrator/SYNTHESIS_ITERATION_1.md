# Iteration 1 Failure Feedback

## Reviewer 1 Veto Reasons
1. `npm run lint` fails due to `no-use-before-define` and `no-explicit-any` errors in `src/app/customers/page.tsx` and `src/app/api/ocr/route.ts`. This must be fixed to ensure the CI pipeline passes cleanly.
2. `src/app/api/ocr/route.ts` contains unreachable/dead code around line 53 (`} else if (imageUrl) { return NextResponse.json(...) }`) that should be removed.
3. The new "Trích xuất dữ liệu" button in `src/app/customers/page.tsx` lacks a disabled state when extraction is in progress, which allows users to spam-click and cause race conditions.

## Next Steps
Investigate the codebase to identify exactly where to apply fixes for the 3 points above. Recommend a fix strategy.
