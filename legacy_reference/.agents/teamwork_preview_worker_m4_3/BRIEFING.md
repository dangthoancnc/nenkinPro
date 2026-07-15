# BRIEFING — 2026-05-31T12:35:00Z

## Mission
Fix all linting and build errors (`any` types, unused variables, `@next/next/no-img-element`) for the M4 Form Generator milestone.

## 🔒 My Identity
- Archetype: Teamwork agent
- Roles: implementer, qa, specialist
- Working directory: G:\AntiGravity\apps\nenkin\.agents\teamwork_preview_worker_m4_3
- Original parent: 9bf3c90d-c020-45c9-ad50-9b4c404029e9
- Milestone: M4 Form Generator (Iteration 3)

## 🔒 Key Constraints
- Must eliminate EVERY `any` type (`@typescript-eslint/no-explicit-any`) in the mentioned files.
- Clean up all unused variables and imports.
- Add `/* eslint-disable @next/next/no-img-element */` where requested.
- Ensure exact types suggested are used.
- Do not cheat; genuine fixes only. Ensure `npm run lint` and `npm run build` pass perfectly.

## Current Parent
- Conversation ID: 9bf3c90d-c020-45c9-ad50-9b4c404029e9
- Updated: not yet

## Task Summary
- **What to build**: Fix type and lint errors across the app.
- **Success criteria**: `npm run lint` and `npm run build` pass perfectly with zero errors.
- **Interface contracts**: See explorer handoff.
- **Code layout**: App router (`src/app/`), Next.js 14 API routes, Prisma schemas.

## Key Decisions Made
- None yet.

## Artifact Index
- G:\AntiGravity\apps\nenkin\.agents\teamwork_preview_worker_m4_3\handoff.md — Final implementation details.
- G:\AntiGravity\apps\nenkin\.agents\teamwork_preview_worker_m4_3\progress.md — Ongoing progress.
