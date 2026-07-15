# Scope: M4

## Architecture
- Module/package boundaries: Forms generator API (`/api/generate-form`) and frontend Customer list view.
- Requires `docxtemplater`, `pizzip` for DOCX forms.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M4   | Create Form Generator mechanism, update UI | none        | IN_PROGRESS |

## Interface Contracts
### Frontend ↔ Backend
- `POST /api/generate-form`
  - Body: `{ customerId: string, templateName: string }`
  - Response: Form file blob (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
