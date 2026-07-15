# BRIEFING — 2026-05-31T13:50:15Z

## Mission
Investigate the codebase to plan responsive UI updates: LayoutWrapper, Sidebar, BottomNavigationBar creation, and mobile card lists for staff portal tables.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only investigator, analyzer
- Working directory: G:\AntiGravity\apps\nenkin\.agents\teamwork_preview_explorer_m1_2
- Original parent: d190324f-de8e-40f6-8d68-f2c306976f3a
- Milestone: Milestone 1 (Responsive UI)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Mobile-first architecture
- Sidebar hidden on mobile (<768px)
- BottomNavigationBar visible on mobile (<768px)
- Tables in staff portal become Card Lists on mobile
- Sidebar and BottomNavigationBar use the same links

## Current Parent
- Conversation ID: d190324f-de8e-40f6-8d68-f2c306976f3a
- Updated: 2026-05-31T13:50:15Z

## Investigation State
- **Explored paths**:
  - `src/components/LayoutWrapper.tsx`, `Sidebar.tsx`, `Topbar.tsx`
  - `src/app/page.tsx`, `customers/page.tsx`, `tax-offices/page.tsx`, `hr/page.tsx`, `applications/page.tsx`
- **Key findings**:
  - Layout Wrapper needs `md:` modifiers on its margins to prevent empty space on mobile, and needs to render `BottomNavigationBar`.
  - Sidebar has hardcoded `menuItems` which need to be extracted to a shared config.
  - 5 staff portal pages use tables (either `<Table>` component or native `<table>`) that need to be hidden on mobile in favor of stacked `<Card>` lists.
- **Unexplored areas**: 
  - None, full scope investigated.

## Key Decisions Made
- Menu items will be extracted to `src/config/navigation.ts`.
- Tables will use `hidden md:block` for their desktop view and a sibling `flex flex-col gap-4 md:hidden` container for their mobile Card list view.
- Completed investigation and wrote `handoff.md`.

## Artifact Index
- handoff.md — Detailed findings and implementation plan
