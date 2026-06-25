import { test, expect } from '@playwright/test';

test('verify reels page and facebook sdk', async ({ page }) => {
  // Go to reels page
  await page.goto('http://localhost:5173/reels');

  // Check if FB SDK script is present in head or body
  const fbSdk = await page.evaluate(() => {
    return !!document.querySelector('script[src*="connect.facebook.net"]');
  });
  console.log('Facebook SDK present:', fbSdk);
  expect(fbSdk).toBe(true);

  // Check if fb-root is present
  const fbRoot = await page.locator('#fb-root');
  await expect(fbRoot).toBeAttached();

  // Wait for some content to load (the "No reels yet" or a reel)
  await page.waitForTimeout(2000);

  const noReels = await page.getByText(/No reels yet|لا توجد ريليز/).count();
  console.log('No reels message count:', noReels);

  // Take screenshot for visual verification
  await page.screenshot({ path: 'verification/reels_page.png', fullPage: true });
});
