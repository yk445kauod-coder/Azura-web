import { test, expect } from '@playwright/test';

test('verify admin improvements', async ({ page }) => {
  await page.goto('http://localhost:5173/admin');

  // Login
  await page.fill('input[type="password"]', 'azura2024');
  await page.click('button:has-text("Login"), button:has-text("دخول")');

  // Go to Users tab
  await page.click('nav button:has-text("Users"), nav button:has-text("المستخدمين")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/admin_users_v4.png' });

  // Go to API settings
  await page.click('nav button:has-text("Egytronic"), nav button:has-text("إيچترونيك")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification/admin_api_v4.png' });

  // Go to AI Assistant
  await page.click('nav button:has-text("AI Assistant"), nav button:has-text("المساعد الذكي")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/admin_ai_v4.png' });
});
