import { test, expect } from '@playwright/test';

test('verify client improvements', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Login
  await page.fill('input[placeholder*="الاسم"], input[placeholder*="Name"]', 'Test User');
  await page.fill('input[placeholder*="الطاولة"], input[placeholder*="Table"]', '42');
  await page.click('button:has-text("ابدأ"), button:has-text("Start")');

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/client_menu_v4.png' });

  // Open an item modal
  await page.click('.group.relative:first-child');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification/client_modal_v4.png' });

  // Close modal and go to AI
  await page.click('button:has-text("إغلاق"), button:has-text("Close"), .fixed.inset-0');
  await page.click('a[href="/ai"], button:has-text("AI")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/client_ai_v4.png' });
});
