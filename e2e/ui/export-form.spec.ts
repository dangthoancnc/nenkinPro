import { test, expect } from '@playwright/test';

test.describe('UI Export Form Button (Tier 1 & Tier 4)', () => {
  let employeeId: string;
  let applicationId: string;

  test.beforeAll(() => {
    employeeId = process.env.TEST_EMPLOYEE_ID || '';
    applicationId = process.env.TEST_APP_ID || '';
  });

  test.beforeEach(async ({ context }) => {
    // Inject the authentication cookie
    await context.addCookies([
      {
        name: 'employee_auth',
        value: employeeId,
        domain: '127.0.0.1',
        path: '/',
      }
    ]);
  });

  test('should render the export form buttons and generate docx on click without page navigation', async ({ page }) => {
    await page.goto(`/applications/${applicationId}`);

    // Assuming there's a card or section for "Xuất Biểu Mẫu"
    // Requirement R3: Thêm Nút Tải Biểu Mẫu trên UI (src/app/applications/[id]/page.tsx)
    // Thêm một Card hoặc khu vực "Xuất Biểu Mẫu" trong trang Chi tiết Hồ sơ, chứa các nút để tải các template.
    // Khi click, hệ thống sẽ gọi API và tải file nhị phân.
    
    // We expect buttons for LAN1_DATTAI, LAN2_UININJOU, LAN2_TAX_AGENT. The exact text may vary but typically includes 'LAN1_DATTAI' or 'Rút Nenkin Lần 1'
    
    // Let's test the generic approach: find any button inside the export card. 
    // We will look for a button containing text related to the forms.
    
    const downloadPromise1 = page.waitForEvent('download', { timeout: 30000 });
    // Use a more generic text match for the button
    const btn1 = page.locator('button', { hasText: /Rút Nenkin/i }).first();
    await expect(btn1).toBeVisible({ timeout: 15000 });
    await btn1.click();
    const download1 = await downloadPromise1;
    expect(download1.suggestedFilename()).toMatch(/\.docx$/);
    
    // Verify no navigation happened (still on the same page)
    expect(page.url()).toContain(`/applications/${applicationId}`);
  });

  test('should render and download Lần 2 Uỷ nhiệm thư', async ({ page }) => {
    await page.goto(`/applications/${applicationId}`);
    
    const downloadPromise2 = page.waitForEvent('download', { timeout: 30000 });
    const btn2 = page.locator('button', { hasText: /Uỷ Nhiệm Thư/i }).first();
    await expect(btn2).toBeVisible({ timeout: 15000 });
    await btn2.click();
    const download2 = await downloadPromise2;
    expect(download2.suggestedFilename()).toMatch(/\.docx$/);
  });
});
