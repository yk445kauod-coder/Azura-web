# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/verify-ai-v3.spec.ts >> AI Barista - Check Context and Functionality
- Location: tests/verify-ai-v3.spec.ts:3:1

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('nav') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img [ref=e5]
    - button "EN" [ref=e8]
    - button "عربي" [ref=e9]
  - button [ref=e11]:
    - img [ref=e12]
  - generic [ref=e15]:
    - generic [ref=e16]:
      - generic [ref=e19]:
        - img "Azura" [ref=e20]
        - generic [ref=e21]: Summer ☀️
      - heading "Welcome to Azura" [level=1] [ref=e22]
      - paragraph [ref=e23]: Your cozy corner in Alexandria
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - text: Your Name
          - textbox "Enter your name" [ref=e27]
        - generic [ref=e28]:
          - text: Table Number
          - spinbutton [ref=e29]
      - button "Start Ordering" [ref=e30]:
        - img [ref=e31]
        - text: Start Ordering
    - paragraph [ref=e33]: Powered by AI · Made in Egypt
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('AI Barista - Check Context and Functionality', async ({ page }) => {
  4  |   // Set a long timeout for the entire test
  5  |   test.setTimeout(60000);
  6  |
  7  |   // Go to menu first
  8  |   await page.goto('http://localhost:5000/menu');
  9  |   console.log('Navigated to /menu');
  10 |
  11 |   // Handle login if redirected to Welcome
  12 |   if (page.url().includes('/welcome')) {
  13 |     console.log('On welcome page, logging in...');
  14 |     await page.fill('input[type="password"]', 'azura2026');
  15 |     await page.keyboard.press('Enter');
  16 |     await page.waitForURL('**/menu', { timeout: 10000 });
  17 |   }
  18 |
  19 |   console.log('Current URL:', page.url());
  20 |
  21 |   // Wait for the navigation bar to be present
> 22 |   await page.waitForSelector('nav', { timeout: 10000 });
     |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  23 |   console.log('Nav bar found');
  24 |
  25 |   // Find the AI Barista link. It might be hidden if feature flag is false.
  26 |   // But we want to test if our changes work.
  27 |   const baristaLink = page.locator('a[href="/barista"]');
  28 |   const count = await baristaLink.count();
  29 |   console.log('Barista link count:', count);
  30 |
  31 |   if (count === 0) {
  32 |     // Maybe feature flags are not loaded yet or disabled
  33 |     console.log('Barista link not found, forcing navigation to /barista');
  34 |     await page.goto('http://localhost:5000/barista');
  35 |   } else {
  36 |     await baristaLink.click();
  37 |   }
  38 |
  39 |   await page.waitForURL('**/barista', { timeout: 10000 });
  40 |   console.log('Successfully navigated to /barista');
  41 |
  42 |   // Check if initial greeting appeared
  43 |   const greeting = page.locator('div.bubble-ai').first();
  44 |   await expect(greeting).toBeVisible({ timeout: 15000 });
  45 |   console.log('Greeting found:', await greeting.innerText());
  46 |
  47 |   // Send a message
  48 |   await page.fill('textarea', 'Suggest some coffee with price');
  49 |   await page.click('button >> svg.lucide-send');
  50 |   console.log('Message sent');
  51 |
  52 |   // Wait for AI response (second bubble)
  53 |   const aiMessages = page.locator('div.bubble-ai');
  54 |   await expect(aiMessages).toHaveCount(2, { timeout: 30000 });
  55 |
  56 |   const responseText = await aiMessages.nth(1).innerText();
  57 |   console.log('AI Response:', responseText);
  58 |
  59 |   // Take screenshot
  60 |   await page.screenshot({ path: 'ai-barista-final-check.png' });
  61 | });
  62 |
```