# Progress
- Last visited: 2026-05-31T05:08:00Z
- Investigated `src/app/customers/page.tsx` and `src/lib/navigation.ts` for `HềEsơ` and fixed them.
- Investigated `src/app/api/customers/[id]/route.ts` and `src/app/api/tax-offices/[id]/route.ts` for ISO-8859-1 mojibake (`há»“ sÆ¡` etc) and fixed them.
- Checked `e2e/api/generate-doc.spec.ts` build errors with `npx tsc --noEmit` and found none.
- Wrote findings to `handoff.md`.
