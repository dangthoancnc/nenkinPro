# Project: Nenkin Responsive Redesign & Onboarding Wizard

## Architecture
- **Framework**: Next.js (App Router)
- **UI Constraints**: Responsive (Mobile-first). Desktop keeps sidebar, Mobile (<768px) hides sidebar and uses a Bottom Navigation Bar. Tables become Card Lists on mobile.
- **Onboarding Link**: `/onboarding?ref=STAFF_CODE`. Customers are auto-assigned to that staff member.
- **Wizard (`/onboarding`)**:
  - Step 1: Input Name, Phone, DOB, create 4-digit PIN.
  - Step 2: Upload Zairyu card photo -> instant OCR extraction of Card Number and Address.
  - Step 3: Upload Passport, Nenkin book, Bank card.
  - Step 4: Automatically create Customer and NenkinApplication records with status PENDING.
- **Staff Review**: Staff UI prominently displays PENDING applications with orange tag. Staff can preview images, check OCR, and click 'Duyệt' (Approve to DRAFT/RECEIVED_1ST) or 'Yêu cầu chụp lại ảnh' (Request retake).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Responsive UI | Update LayoutWrapper, Sidebar, create BottomNavigationBar, refactor tables to card lists for mobile. | none | DONE |
| 2 | Onboarding Wizard | Create `/onboarding` route, step UI, PIN + ref code logic, OCR integration, Customer + Application creation. | none | DONE |
| 3 | Staff Review | Update staff lists to highlight PENDING, image preview UI, approval/rejection actions (Duyệt / Yêu cầu chụp lại ảnh). | M2 | DONE |

## Interface Contracts
### API ↔ Frontend
- `POST /api/onboarding`: Accept wizard form data and create Customer/Application.
- `POST /api/ocr`: Accept Zairyu card image and return extracted Card Number and Address.
- `POST /api/applications/:id/review`: Staff action to approve or request retake.

## Code Layout
- Components: `src/components/`
- App Router: `src/app/`
- API Routes: `src/app/api/`

## Performance & Environment Rules
- **Tránh treo máy (Lag/High CPU):** Khi chạy máy chủ dev Next.js, luôn sử dụng lệnh có cờ `--turbo` (ví dụ: `next dev --turbo -p 3015`) kết hợp với cấu hình giới hạn luồng trong `next.config.ts` (`experimental: { workerThreads: true, cpus: 2 }`). 
- **Nguyên nhân:** Nếu chạy `next dev` thuần bằng Webpack, Next.js sẽ spawn rất nhiều tiến trình `node.exe` (jest-workers) gây ăn trọn CPU và RAM. Khi máy quá lag, những tiến trình này dễ trở thành "tiến trình rác" (Zombie Processes) không được dọn dẹp, gây xung đột cổng.
- **Cách xử lý rác Node.js:** Nếu máy tính bị treo, mở Task Manager tắt thủ công các `node.exe` thừa, hoặc dùng lệnh CMD: `taskkill /F /IM node.exe` (Lưu ý: sẽ tắt cả ứng dụng AI nếu chạy chung).
