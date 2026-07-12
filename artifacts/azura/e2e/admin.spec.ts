import { test, expect } from '@playwright/test';

test('Admin login and tab switching', async ({ page }) => {
  await page.goto('/admin');

  // Wait for the login screen
  await expect(page.getByText('Admin Access')).toBeVisible();

  // Fill in the PIN
  await page.fill('input[type="password"]', 'azura2026');

  // Click login button
  await page.click('button:has-text("Login")');

  // Verify redirected to dashboard (Overview tab)
  await expect(page.getByText('Business Insights')).toBeVisible();

  // Test tab switching
  const menuTabButton = page.getByRole('button', { name: 'Menu' });
  await menuTabButton.click();

  // Verify Menu Management title is visible
  await expect(page.getByText('Menu Management')).toBeVisible();

  // Test switching back to Overview
  const overviewTabButton = page.getByRole('button', { name: 'Overview' });
  await overviewTabButton.click();
  await expect(page.getByText('Business Insights')).toBeVisible();
});
