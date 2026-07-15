# BRIEFING — 2026-05-31T14:00:30Z

## Mission
Investigate issues with LayoutWrapper sidebar unpinning, localization corruption in customer/application pages, and Topbar hamburger visibility on mobile. Produce a fix strategy.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only investigator
- Working directory: G:\AntiGravity\apps\nenkin\.agents\teamwork_preview_explorer_m1_iter2_2
- Original parent: d190324f-de8e-40f6-8d68-f2c306976f3a
- Milestone: Milestone 1 (Responsive UI) Iteration 2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Produce a detailed plan in handoff.md

## Current Parent
- Conversation ID: d190324f-de8e-40f6-8d68-f2c306976f3a
- Updated: 2026-05-31T14:00:30Z

## Investigation State
- **Explored paths**: `src/components/LayoutWrapper.tsx`, `src/components/Topbar.tsx`, `src/app/customers/page.tsx`, `src/app/applications/page.tsx`
- **Key findings**: 
  - `LayoutWrapper.tsx` has an erroneous `onClick` on desktop that unpins the sidebar.
  - "hềEsơ" exists in `customers/page.tsx` and `applications/page.tsx` and needs to be replaced with "hồ sơ".
  - Hamburger button in `Topbar.tsx` needs `hidden md:flex` to hide on mobile.
- **Unexplored areas**: None.

## Key Decisions Made
- Wrote findings and fix strategy to `handoff.md`.

## Artifact Index
- handoff.md — Final investigation report and fix strategy
