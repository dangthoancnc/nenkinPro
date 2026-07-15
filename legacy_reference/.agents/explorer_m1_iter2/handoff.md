# Handoff Report: Milestone 1 - Iteration 2 (Codebase Investigation)

## Observation
1. **Lint Errors (`no-use-before-define`, `no-explicit-any`)**:
   - `src/app/customers/page.tsx`:
     - Line 12 uses `any` in `VerifiedInput` component props: `...props }: any) => {`.
     - Lines 57, 60 use `any` in `useState<any[]>`, `useState<any>`.
     - Lines 71-74 call `fetchCustomers();` inside a `useEffect` hook *before* the function is defined on line 75, causing the `no-use-before-define` error.
     - Multiple setter callbacks use `(prev: any)` (lines 113, 117, 127, 138, 170).
     - Multiple event handlers use `(e:any)` in `onChange` (lines 325, 326, 327, 337, 356).
   - `src/app/api/ocr/route.ts`:
     - Line 62: `let extractedData: any = null;`
     - Line 72: `tools: [{ googleSearch: {} } as any]`
     - Line 121: `(ocrError as any).message`
2. **Dead Code in OCR Route**:
   - `src/app/api/ocr/route.ts`, lines 53-55 contain a redundant `else if (imageUrl)` block that is unreachable because line 39 already handles `else if (imageUrl)`.
3. **Missing Disabled State for Extraction Button**:
   - `src/app/customers/page.tsx`, lines 268-270: The `<Button onClick={handleExtractAll} ...>` does not have a `disabled` property bound to the `ocrStatus`.

## Logic Chain
1. To fix the `no-use-before-define` error in `src/app/customers/page.tsx`, the `fetchCustomers` arrow function declaration needs to be moved above the `useEffect` block.
2. To resolve `no-explicit-any` in `src/app/customers/page.tsx`, we must define strict TypeScript interfaces (`VerifiedInputProps`, `CustomerData`, `TaxOfficeData`) and remove all `any` usages. For the `setActiveCustomer` state updates, we need to handle the potentially null previous state (e.g., `prev => prev ? { ...prev, [field]: value } : null`).
3. To resolve `no-explicit-any` in `src/app/api/ocr/route.ts`, we need to:
   - Change `extractedData: any` to `extractedData: Record<string, unknown> | null`.
   - Cast the Gemini tools securely as `as unknown as import('@google/generative-ai').Tool`.
   - Cast the error in the catch block as `(ocrError as Error).message`.
4. Removing lines 53-55 in `src/app/api/ocr/route.ts` will clear the dead code safely without altering the logical flow, as the preceding block handles URL fetching.
5. In `src/app/customers/page.tsx`, adding `disabled={ocrStatus === 'processing'}` to the `Trích xuất dữ liệu` button along with `disabled:bg-indigo-400 disabled:cursor-not-allowed` styles will prevent race conditions and spam-clicking.

## Caveats
- Next.js 14 linting is extremely strict on `any`. Care must be taken not to introduce type errors down the line when replacing `any` with `CustomerData`.
- Only lint errors in `src/app/customers/page.tsx` and `src/app/api/ocr/route.ts` will be fixed per this instruction, though the global `npm run lint` log shows other existing warnings in the codebase.

## Conclusion
The investigation confirms all reviewer veto points. The required changes are highly localized and safely actionable. 
Implementer should:
1. Define interfaces `CustomerData` and `VerifiedInputProps` in `src/app/customers/page.tsx` and replace all `any` types. Move `fetchCustomers` definition above its `useEffect`.
2. Add `disabled={ocrStatus === 'processing'}` to the extract button in `src/app/customers/page.tsx`.
3. Remove lines 53-55 in `src/app/api/ocr/route.ts`.
4. Replace `any` in `src/app/api/ocr/route.ts` with explicit types (`Record<string, unknown>`, `import('@google/generative-ai').Tool`, `Error`).

## Verification Method
1. Run `npm run lint` and ensure `src/app/customers/page.tsx` and `src/app/api/ocr/route.ts` are error-free.
2. Visually inspect `src/app/api/ocr/route.ts` to confirm the dead code is removed.
3. Test the extraction button in the browser to ensure it disables properly when `ocrStatus` is set to `processing`.
