# Legacy Feature Inventory

- Legacy branch: `legacy-ai-form-reference`
- Legacy commit: `19a64273af02e2f802ae71f26a96952b3bd141ec`
- Mainline strategy: Strangler migration — no merge/cherry-pick from legacy
- Classification:
  - PORT-CONCEPT: retain business behavior, rewrite implementation
  - PORT-ASSET: reuse non-executable asset/data only
  - REWRITE: feature has value but implementation must be rebuilt
  - REJECT: do not reuse

## Guardrails

1. Legacy branch is read-only reference.
2. No legacy session, cookie, auth middleware, database client, environment file, or API secret may enter `main`.
3. All document generation output is PDF. DOCX is not a target format.
4. Gemini may produce mapping proposals only; it can never publish a PDF mapping.
5. Customer-identifying data must never be included in fixture, test output, client logs, or AI prompt logs.
6. Mapping changes require draft/review/publish lifecycle and audit records.

## File-by-file classification

| Legacy file | Classification | Decision / target on main | Primary risk |
|---|---|---|---|
| `src/app/admin/pdf-mapper/PdfMapperClient.tsx` | PORT-CONCEPT / REWRITE | Rebuild as `src/features/templates/components/PdfMappingStudio.tsx`; preserve drag/drop interaction and preview workflow only | Client-side coordinate/model persistence and missing RBAC must be assumed until audited |
| `src/app/admin/pdf-mapper/page.tsx` | REWRITE | Replace with `/admin/templates/[templateId]/mapper` | Page-level access may rely on frontend-only checks |
| `src/app/api/templates/mapping/route.ts` | REWRITE | New protected template-version API; server-side role check; draft/review/publish | Unauthorized users could alter production mapping |
| `src/app/api/applications/[id]/generate-pdf/route.ts` | PORT-CONCEPT / REWRITE | Keep endpoint purpose, rebuild with current auth, ownership check, template version pinning and audit record | IDOR, arbitrary application/template access, unsafe PDF rendering |
| `src/app/api/generate-doc/route.ts` | REJECT as runtime code | Replace DOCX-first flow with PDF-only renderer | Wrong document format and likely legacy data/auth coupling |
| `src/app/api/generate-form/route.ts` | REJECT as runtime code | Extract any business field list only, if useful | Duplicate/ambiguous generation path |
| `src/lib/documentMapper.ts` | PORT-CONCEPT | Diff carefully against current mapper; retain pure transforms such as era conversion, split boxes and normalized field naming | Silent mapping mismatch across templates |
| `src/lib/pdfGenerator.ts` | PORT-CONCEPT / REWRITE | Keep pure overlay ideas; rebuild around immutable PDF template + versioned mapping config | Incorrect coordinate origin, font embedding, page rotation, overflow |
| `src/components/PrintOverlay.tsx` | PORT-CONCEPT | Use as UX reference for preview/download state | Could expose raw customer data in browser/logs |
| `src/app/applications/[id]/print/page.tsx` | REWRITE | New preview page that requests a short-lived generated PDF | Weak authorization or caching of sensitive PDFs |
| `src/app/customers/[id]/PrintTab.tsx` | PORT-CONCEPT | Reimplement as a document-generation panel | May embed generation logic directly in UI |
| `src/app/api/customers/[id]/ocr/route.ts` | REWRITE | New server-side OCR job workflow with review/confirm screen | PII sent to AI, weak authorization, unvalidated model output |
| `src/app/api/ocr/route.ts` | REWRITE | Consolidate into `ocr-extractions` service/API; delete duplicate path | Different OCR rules can yield inconsistent customer data |
| `src/components/DocumentCaptureOverlay.tsx` | PORT-CONCEPT | Rebuild capture/upload UI with clear consent and upload progress | Image data leakage, unsafe browser-only processing |
| `src/components/ImageCropper.tsx` | PORT-CONCEPT | Reuse UX only; enforce server-side image validation after upload | MIME spoofing, oversized image processing |
| `src/lib/ai/config.ts` | REJECT | Do not copy. Create server-only AI provider config from environment variables | Client-exposed Gemini key or logging risk |
| `test-gemini.js` | PORT-CONCEPT | Retain as development reference only; replace with mocked integration test | Keys and real PII may be hard-coded |
| `src/app/api/tax-offices/route.ts` | PORT-CONCEPT / REWRITE | Preserve API behavior/data contract after audit; use normalized address resolver | Wrong office assignment and tenant/role leakage |
| `src/app/api/tax-offices/[id]/route.ts` | REWRITE | Implement current ownership/staff authorization conventions | IDOR |
| `src/app/api/nta-scrape/route.ts` | REWRITE | Convert to a controlled admin sync job, not a request-time scraper | Fragile upstream data, rate limit, injection, audit gap |
| `scratch/nta_map.html` | PORT-ASSET | Retain only as research/reference, never deploy | Unverified mapping source |
| `scratch/nta_post.html` | PORT-ASSET | Retain only as research/reference, never deploy | Unverified mapping source |
| `scratch/test_nta.js` | PORT-CONCEPT | Extract expected lookup cases into fixtures/tests | Network-dependent test |
| `scratch/test_nta_post.js` | PORT-CONCEPT | Extract expected lookup cases into fixtures/tests | Network-dependent test |
| `scratch/test_ddg.js` | REJECT | Do not use a search engine as tax-office production source | Non-deterministic and non-authoritative result |
| `scratch/test_yahoo_parse.js` | REJECT | Do not use scraping parser in production | Terms, layout breakage, non-determinism |
| `src/app/api/customers/route.ts` | REWRITE | Keep resource contract only; use current auth, validation and audit conventions | PII exposure / insufficient input validation |
| `src/app/api/customers/[id]/route.ts` | REWRITE | Keep resource contract only | IDOR / cross-user data exposure |
| `src/app/customers/page.tsx` | PORT-CONCEPT | Reuse information architecture and UX insight after review | Monolithic component state |
| `src/app/customers/[id]/page.tsx` | PORT-CONCEPT | Reuse tabs/workflow concept, not runtime implementation | Coupled to legacy API/auth |
| `src/app/customers/[id]/AppDetailsTab.tsx` | PORT-CONCEPT | Rebuild as current-domain application detail component | Form schema drift |
| `src/app/applications/page.tsx` | PORT-CONCEPT | Reuse list/filter UX only | Frontend-only permission behavior |
| `src/app/applications/[id]/page.tsx` | PORT-CONCEPT | Reuse workflow layout only | Coupled data fetching and IDOR |
| `src/app/api/applications/route.ts` | REWRITE | Current API remains source of truth | Data validation and authorization risk |
| `src/app/api/applications/[id]/route.ts` | REWRITE | Current API remains source of truth | IDOR |
| `src/app/api/applications/[id]/review/route.ts` | PORT-CONCEPT / REWRITE | New explicit application/document review state machine | Approval without role/audit enforcement |
| `src/app/api/auth/employee/login/route.ts` | REJECT | Do not reuse | Legacy authentication/session design |
| `src/app/api/auth/employee/logout/route.ts` | REJECT | Do not reuse | Legacy session invalidation design |
| `src/app/api/auth/employee/me/route.ts` | REJECT | Do not reuse | Legacy identity/session representation |
| `src/app/api/portal/auth/route.ts` | REJECT | Do not reuse | Separate legacy auth flow |
| `src/app/api/portal/auth/me/route.ts` | REJECT | Do not reuse | Separate legacy auth flow |
| `src/app/api/portal/profile/route.ts` | REWRITE | Rebuild only if portal remains product requirement | Customer/staff authorization boundary |
| `src/app/api/hr/staffs/route.ts` | REWRITE | Keep main’s staff/RBAC domain only | Unauthorized staff management |
| `src/app/api/hr/seed/route.ts` | REJECT | Remove from any deployable environment | Production data mutation endpoint |
| `scripts/backfill_pins.ts` | REJECT | Do not run; document migration intent only | Plaintext/weak PIN migration |
| `src/scripts/migrate_to_supabase.ts` | REJECT as executable | Use only as a field-level migration reference | Accidental production overwrite or secret disclosure |
| `src/scripts/check.ts` | PORT-CONCEPT | Replace with CI health checks | May contain direct DB access/secrets |
| `scripts/query_db.ts` | REJECT | Do not retain in application repository runtime paths | Direct PII query / credential leakage |
| `scripts/query_users.ts` | REJECT | Do not retain in application repository runtime paths | Account/PII disclosure |
| `scripts/overlay_grid.js` | PORT-CONCEPT | Replace with local/dev-only grid preview utility | Confusion between render scale and PDF points |
| `scratch/test_mapper.ts` | PORT-CONCEPT | Turn expected output into mapper unit tests | Legacy coordinate assumptions |
| `src/app/api/dashboard/*` | PORT-CONCEPT | Reuse KPI definitions only; retain current dashboard API design | Data aggregation may bypass authorization |
| `src/app/api/exchange-rate/*` | PORT-CONCEPT | Keep only if current product requires this domain | External API validation/cache gap |
| `src/app/api/onboarding/route.ts` | REWRITE | Retain current onboarding only | Role escalation or unauthenticated setup risk |
