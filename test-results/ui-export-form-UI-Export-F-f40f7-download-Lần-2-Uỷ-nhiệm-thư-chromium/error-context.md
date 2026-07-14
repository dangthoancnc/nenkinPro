# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\export-form.spec.ts >> UI Export Form Button (Tier 1 & Tier 4) >> should render and download Lần 2 Uỷ nhiệm thư
- Location: e2e\ui\export-form.spec.ts:49:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: /Uỷ Nhiệm Thư/i }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('button').filter({ hasText: /Uỷ Nhiệm Thư/i }).first()

```

```yaml
- complementary:
  - img "Logo"
  - heading "VietNenkin Duyên" [level=1]
  - button "Bỏ ghim Sidebar"
  - text: Menu chính
  - navigation:
    - list:
      - listitem:
        - link "Tổng quan":
          - /url: /dashboard
      - listitem:
        - link "Khách hàng":
          - /url: /customers
      - listitem:
        - link "Cục Thuế":
          - /url: /tax-offices
      - listitem:
        - link "Hồ sơ Nenkin":
          - /url: /applications
      - listitem:
        - link "Nhân sự":
          - /url: /hr
      - listitem:
        - link "Tài chính & Hoa hồng":
          - /url: /finance
      - listitem:
        - link "Cài đặt":
          - /url: /settings
  - link "Trang chủ Khách":
    - /url: /
  - button "Đăng xuất"
- banner:
  - button
  - heading [level=2]
  - textbox "Tìm kiếm khách hàng, hồ sơ..."
  - button
  - button "Đang tải... ...":
    - paragraph: Đang tải...
    - paragraph: ...
- main:
  - heading "Nenkin Admin" [level=2]
  - paragraph: Cổng thông tin dành cho Quản lý & Nhân viên
  - text: Email nhân sự
  - textbox "nhanvien@nenkin.com"
  - text: Mật khẩu
  - textbox "••••••••"
  - button
  - button "Đăng nhập vào hệ thống"
  - paragraph: "Tài khoản Test (sẽ tự động tạo nếu DB trống):"
  - paragraph:
    - code: admin@nenkin.com
    - text: "|"
    - code: password123
  - paragraph:
    - code: manager@nenkin.com
    - text: "|"
    - code: password123
  - paragraph:
    - code: collab@nenkin.com
    - text: "|"
    - code: password123
- alert
```

```
Error: page.waitForEvent: Test ended.
=========================== logs ===========================
waiting for event "download"
============================================================
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('UI Export Form Button (Tier 1 & Tier 4)', () => {
  4  |   let employeeId: string;
  5  |   let applicationId: string;
  6  | 
  7  |   test.beforeAll(() => {
  8  |     employeeId = process.env.TEST_EMPLOYEE_ID || '';
  9  |     applicationId = process.env.TEST_APP_ID || '';
  10 |   });
  11 | 
  12 |   test.beforeEach(async ({ context }) => {
  13 |     // Inject the authentication cookie
  14 |     await context.addCookies([
  15 |       {
  16 |         name: 'employee_auth',
  17 |         value: employeeId,
  18 |         domain: 'localhost',
  19 |         path: '/',
  20 |       }
  21 |     ]);
  22 |   });
  23 | 
  24 |   test('should render the export form buttons and generate docx on click without page navigation', async ({ page }) => {
  25 |     await page.goto(`/applications/${applicationId}`);
  26 | 
  27 |     // Assuming there's a card or section for "Xuất Biểu Mẫu"
  28 |     // Requirement R3: Thêm Nút Tải Biểu Mẫu trên UI (src/app/applications/[id]/page.tsx)
  29 |     // Thêm một Card hoặc khu vực "Xuất Biểu Mẫu" trong trang Chi tiết Hồ sơ, chứa các nút để tải các template.
  30 |     // Khi click, hệ thống sẽ gọi API và tải file nhị phân.
  31 |     
  32 |     // We expect buttons for LAN1_DATTAI, LAN2_UININJOU, LAN2_TAX_AGENT. The exact text may vary but typically includes 'LAN1_DATTAI' or 'Rút Nenkin Lần 1'
  33 |     
  34 |     // Let's test the generic approach: find any button inside the export card. 
  35 |     // We will look for a button containing text related to the forms.
  36 |     
  37 |     const downloadPromise1 = page.waitForEvent('download', { timeout: 30000 });
  38 |     // Use a more generic text match for the button
  39 |     const btn1 = page.locator('button', { hasText: /Rút Nenkin/i }).first();
  40 |     await expect(btn1).toBeVisible({ timeout: 15000 });
  41 |     await btn1.click();
  42 |     const download1 = await downloadPromise1;
  43 |     expect(download1.suggestedFilename()).toMatch(/\.docx$/);
  44 |     
  45 |     // Verify no navigation happened (still on the same page)
  46 |     expect(page.url()).toContain(`/applications/${applicationId}`);
  47 |   });
  48 | 
  49 |   test('should render and download Lần 2 Uỷ nhiệm thư', async ({ page }) => {
  50 |     await page.goto(`/applications/${applicationId}`);
  51 |     
> 52 |     const downloadPromise2 = page.waitForEvent('download', { timeout: 30000 });
     |                                   ^ Error: page.waitForEvent: Test ended.
  53 |     const btn2 = page.locator('button', { hasText: /Uỷ Nhiệm Thư/i }).first();
  54 |     await expect(btn2).toBeVisible({ timeout: 15000 });
  55 |     await btn2.click();
  56 |     const download2 = await downloadPromise2;
  57 |     expect(download2.suggestedFilename()).toMatch(/\.docx$/);
  58 |   });
  59 | });
  60 | 
```