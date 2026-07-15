# Scope: Milestone 3 (Staff Review)

## Architecture
- Route: `/staff/applications` (or similar staff portal page)
- UI: Highlight PENDING applications with orange tag. Image preview capability.
- Actions: 'Duyệt' (Approve to DRAFT/RECEIVED_1ST) and 'Yêu cầu chụp lại ảnh' (Request retake).
- API: `POST /api/applications/:id/review`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Staff Review UI & API | Update staff lists to highlight PENDING, image preview UI, approval/rejection actions (Duyệt / Yêu cầu chụp lại ảnh). | none | DONE |

## Interface Contracts
- API `POST /api/applications/:id/review`: { action: "APPROVE" | "REJECT" }
