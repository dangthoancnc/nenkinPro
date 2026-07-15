# M4 Form Generator - Implementer Handoff

## Observation
- `src/lib/documentMapper.ts` was created to transform the structured `NenkinApplication` object into a flat object suited for docxtemplater. All text mapping (postal code, bank, date of birth) correctly breaks strings into individual characters, filling empty slots to avoid layout collapses in Word templates. Prisma Decimal fields are cast to strings seamlessly.
- `src/app/api/generate-doc/route.ts` was refactored. The Prisma `include` block was updated to query `customer.taxOffice` and `taxRepresentative`. The hardcoded mapping object was replaced with `mapApplicationToTemplate(application)`.
- `public/templates/MAPPING_GUIDE.md` was authored. It clearly illustrates the various split keys (`{{post_1}}`, `{{bank_1}}`, `{{dob_era_yr_1}}`, `{{my_num_1}}`, `{{nenkin_1}}`, etc.) and basic keys like `fullName`.
- `src/app/applications/[id]/page.tsx` was inspected. The "Xuất File Tự Động" component calls `handleGenerateDoc` and securely downloads the Blob returned by the API locally using `window.URL.createObjectURL(blob)`, which prevents page navigation. 
- The prototype script `scratch/test_mapper.ts` runs correctly and displays the expected flattened outputs.

## Logic Chain
- **Mapper implementation**: By creating `documentMapper.ts`, all field parsing is standardized. Decimals and missing nested relations are guarded. This fulfills requirement R1.
- **Route adaptation**: Passing the queried DB application model to `mapApplicationToTemplate()` successfully delegates formatting. Injecting the result into `doc.render(data)` satisfies R2.
- **UI conformity**: The pre-existing "Xuất File Tự Động" functionality perfectly encapsulates the file streaming procedure as requested by R3.
- **Documentation**: MAPPING_GUIDE.md acts as an interface manual between the code and non-technical editors modifying Word templates, accomplishing R4.

## Caveats
- No new packages were added as `docxtemplater` and `pizzip` were already used in `route.ts`.
- Prisma relations returning `null` (e.g., when `taxRepresentative` is not assigned) will just output blank mappings instead of throwing errors. The `totalExpectedJpy` Decimal field is also cast successfully to `string` if present.

## Conclusion
The M4 Form Generator backend map structure and API route have been fully implemented. Template creation is now decoupled through the `mapApplicationToTemplate` engine and thoroughly documented in `MAPPING_GUIDE.md`. The workflow satisfies all Acceptance Criteria.

## Verification Method
1. Execute `npx tsx scratch/test_mapper.ts`. Output must demonstrate split properties (e.g., `bank_1: '9'`, `bank_2: '8'`) and Decimal variables cast to strings.
2. In the Next.js frontend, access an existing application at `http://localhost:3000/applications/<app_id>`. Click "Đơn xin Rút Nenkin (Lần 1)" and check that a `.docx` file is downloaded locally.
3. Open the downloaded `.docx` to verify the substitution variables mapped successfully.
