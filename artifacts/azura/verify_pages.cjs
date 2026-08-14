const { chromium } = require('@playwright/test');
const path = require('path');

async function run() {
  console.log('Starting Playwright verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let uncaughtError = null;
  page.on('pageerror', (err) => {
    console.error('BROWSER PAGE ERROR:', err);
    uncaughtError = err;
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('BROWSER CONSOLE ERROR:', msg.text());
      // We can also check if there's any RefError here
      if (msg.text().includes('ReferenceError') || msg.text().includes('Uncaught')) {
        uncaughtError = new Error(msg.text());
      }
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  try {
    // 1. Visit Lightweight Menu (Guest login/splash screen)
    console.log('Navigating to http://localhost:3000/');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    console.log('Filling in Guest Details...');
    // Find the Guest Name input
    const nameInput = await page.locator('input[placeholder*="Enter your name"], input[placeholder*="اسمك"], input[type="text"]');
    await nameInput.waitFor({ timeout: 5000 });
    await nameInput.fill('Jules Test Guest');

    // Find the Table Number input
    const tableInput = await page.locator('input[placeholder="1-50"], input[type="number"]');
    await tableInput.fill('12');

    // Click "Start Ordering" or "ابدأ الطلب"
    console.log('Clicking "Start Ordering" to log in...');
    const startButton = await page.locator('button:has-text("Start Ordering"), button:has-text("ابدأ الطلب"), button.btn-primary');
    await startButton.click();

    // Wait for MenuLightweight to render
    console.log('Waiting for Lightweight Menu page...');
    await page.waitForTimeout(3000);

    // Save menu screenshot
    const menuScreenshotPath = path.join(__dirname, 'screenshot_menu.png');
    await page.screenshot({ path: menuScreenshotPath, fullPage: true });
    console.log(`Saved lightweight menu screenshot to ${menuScreenshotPath}`);

    // Check for errors during guest menu load
    if (uncaughtError) {
      throw new Error(`Uncaught error during lightweight menu load: ${uncaughtError.message}`);
    }

    // 2. Go to Admin login
    console.log('Navigating to http://localhost:3000/admin');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });

    console.log('Logging in as Admin...');
    const pinInput = await page.locator('input[type="password"]');
    await pinInput.waitFor({ timeout: 5000 });
    await pinInput.fill('azura2026');

    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("دخول")');
    await loginButton.click();

    console.log('Waiting for Admin Dashboard...');
    await page.waitForTimeout(3000);

    if (uncaughtError) {
      throw new Error(`Uncaught error during admin dashboard load: ${uncaughtError.message}`);
    }

    // Switch to different tabs
    const tabsToTest = ['menu', 'features', 'users', 'reviews', 'tables', 'api', 'system'];
    for (const tabId of tabsToTest) {
      console.log(`Clicking on Admin tab: ${tabId}...`);
      // Select tab button with matching onClick/text or data key
      // TABS contain pixel icons and text, so we can find button containing the specific tab name
      const tabButton = await page.locator(`button:has-text("${tabId.charAt(0).toUpperCase() + tabId.slice(1)}")`);
      if (await tabButton.count() > 0) {
        await tabButton.click();
        await page.waitForTimeout(1000);
        console.log(`Admin tab ${tabId} clicked.`);
      } else {
        console.log(`Admin tab button for ${tabId} not found, trying with lowercase/other selector`);
        const tabButtonLower = await page.locator(`button:has-text("${tabId}")`);
        if (await tabButtonLower.count() > 0) {
          await tabButtonLower.click();
          await page.waitForTimeout(1000);
        }
      }

      if (uncaughtError) {
        throw new Error(`Uncaught error after clicking tab "${tabId}": ${uncaughtError.message}`);
      }
    }

    // Specifically verify the Tables tab is active and rendered fine
    console.log('Switching specifically to Tables tab to double check...');
    const tablesTabButton = await page.locator('button:has-text("Tables"), button:has-text("الطاولات")');
    await tablesTabButton.waitFor({ timeout: 3000 });
    await tablesTabButton.click();
    await page.waitForTimeout(2000);

    const adminTablesScreenshotPath = path.join(__dirname, 'screenshot_admin_tables.png');
    await page.screenshot({ path: adminTablesScreenshotPath, fullPage: true });
    console.log(`Saved Admin Tables tab screenshot to ${adminTablesScreenshotPath}`);

    if (uncaughtError) {
      throw new Error(`Uncaught error after rendering Tables tab: ${uncaughtError.message}`);
    }

    console.log('All verifications completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Verification failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
