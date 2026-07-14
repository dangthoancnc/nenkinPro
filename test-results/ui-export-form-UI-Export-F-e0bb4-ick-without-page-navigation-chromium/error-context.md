# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\export-form.spec.ts >> UI Export Form Button (Tier 1 & Tier 4) >> should render the export form buttons and generate docx on click without page navigation
- Location: e2e\ui\export-form.spec.ts:24:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForEvent: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for event "download"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - img "Logo" [ref=e7]
          - heading "VietNenkin Duyên" [level=1] [ref=e8]
        - button "Bỏ ghim Sidebar" [ref=e9]:
          - img [ref=e10]
      - generic [ref=e14]: Menu chính
      - navigation [ref=e15]:
        - list [ref=e16]:
          - listitem [ref=e17]:
            - link "Tổng quan" [ref=e18] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e19]
              - generic [ref=e22]: Tổng quan
          - listitem [ref=e23]:
            - link "Khách hàng" [ref=e24] [cursor=pointer]:
              - /url: /customers
              - img [ref=e25]
              - generic [ref=e30]: Khách hàng
          - listitem [ref=e31]:
            - link "Cục Thuế" [ref=e32] [cursor=pointer]:
              - /url: /tax-offices
              - img [ref=e33]
              - generic [ref=e37]: Cục Thuế
          - listitem [ref=e38]:
            - link "Hồ sơ Nenkin" [ref=e39] [cursor=pointer]:
              - /url: /applications
              - img [ref=e40]
              - generic [ref=e43]: Hồ sơ Nenkin
          - listitem [ref=e44]:
            - link "Nhân sự" [ref=e45] [cursor=pointer]:
              - /url: /hr
              - img [ref=e46]
              - generic [ref=e49]: Nhân sự
          - listitem [ref=e50]:
            - link "Tài chính & Hoa hồng" [ref=e51] [cursor=pointer]:
              - /url: /finance
              - img [ref=e52]
              - generic [ref=e55]: Tài chính & Hoa hồng
          - listitem [ref=e56]:
            - link "Cài đặt" [ref=e57] [cursor=pointer]:
              - /url: /settings
              - img [ref=e58]
              - generic [ref=e61]: Cài đặt
      - generic [ref=e62]:
        - link "Trang chủ Khách" [ref=e63] [cursor=pointer]:
          - /url: /
          - img [ref=e64]
          - generic [ref=e67]: Trang chủ Khách
        - button "Đăng xuất" [ref=e68]:
          - img [ref=e69]
          - generic [ref=e72]: Đăng xuất
    - generic [ref=e73]:
      - banner [ref=e74]:
        - generic [ref=e75]:
          - button [ref=e76]:
            - img [ref=e77]
          - heading [level=2]
        - generic [ref=e79]:
          - img [ref=e80]
          - textbox "Tìm kiếm khách hàng, hồ sơ..." [ref=e83]
        - generic [ref=e84]:
          - button [ref=e85]:
            - img [ref=e86]
          - button "Đang tải... ..." [ref=e92]:
            - img [ref=e94]
            - generic [ref=e98]:
              - paragraph [ref=e99]: Đang tải...
              - paragraph [ref=e100]: ...
      - main [ref=e101]:
        - generic [ref=e102]:
          - generic [ref=e104]:
            - img [ref=e106]
            - heading "Nenkin Admin" [level=2] [ref=e110]
            - paragraph [ref=e111]: Cổng thông tin dành cho Quản lý & Nhân viên
          - generic [ref=e113]:
            - generic [ref=e114]:
              - generic [ref=e115]:
                - generic [ref=e116]: Email nhân sự
                - generic [ref=e117]:
                  - img [ref=e118]
                  - textbox "nhanvien@nenkin.com" [ref=e121]
              - generic [ref=e122]:
                - generic [ref=e123]: Mật khẩu
                - generic [ref=e124]:
                  - img [ref=e125]
                  - textbox "••••••••" [ref=e128]
                  - button [ref=e129]:
                    - img [ref=e130]
              - button "Đăng nhập vào hệ thống" [ref=e133]:
                - text: Đăng nhập vào hệ thống
                - img [ref=e134]
            - generic [ref=e136]:
              - paragraph [ref=e137]: "Tài khoản Test (sẽ tự động tạo nếu DB trống):"
              - paragraph [ref=e138]:
                - code [ref=e139]: admin@nenkin.com
                - text: "|"
                - code [ref=e140]: password123
              - paragraph [ref=e141]:
                - code [ref=e142]: manager@nenkin.com
                - text: "|"
                - code [ref=e143]: password123
              - paragraph [ref=e144]:
                - code [ref=e145]: collab@nenkin.com
                - text: "|"
                - code [ref=e146]: password123
  - button "Open Next.js Dev Tools" [ref=e152] [cursor=pointer]:
    - generic [ref=e155]:
      - text: Compiling
      - generic [ref=e156]:
        - generic [ref=e157]: .
        - generic [ref=e158]: .
        - generic [ref=e159]: .
  - alert [ref=e160]
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
> 37 |     const downloadPromise1 = page.waitForEvent('download', { timeout: 30000 });
     |                                   ^ Error: page.waitForEvent: Test timeout of 30000ms exceeded.
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
  52 |     const downloadPromise2 = page.waitForEvent('download', { timeout: 30000 });
  53 |     const btn2 = page.locator('button', { hasText: /Uỷ Nhiệm Thư/i }).first();
  54 |     await expect(btn2).toBeVisible({ timeout: 15000 });
  55 |     await btn2.click();
  56 |     const download2 = await downloadPromise2;
  57 |     expect(download2.suggestedFilename()).toMatch(/\.docx$/);
  58 |   });
  59 | });
  60 | 
```