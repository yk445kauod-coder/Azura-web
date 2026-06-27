# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: src/rush_time_test.spec.ts >> Azura App Comprehensive Tests >> User Menu - Search & Filtering
- Location: src/rush_time_test.spec.ts:29:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/menu" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Azura Azura Cafe Tivoli Dome, Alexandria" [ref=e5] [cursor=pointer]:
      - /url: /menu
      - generic [ref=e6]:
        - img "Azura" [ref=e7]
        - generic [ref=e8]:
          - heading "Azura Cafe" [level=1] [ref=e9]
          - paragraph [ref=e10]: Tivoli Dome, Alexandria
    - generic [ref=e11]:
      - generic [ref=e12]: Table 5
      - button "Notifications" [ref=e13]:
        - img [ref=e14]
        - generic [ref=e17]: "1"
  - generic [ref=e19]:
    - generic [ref=e20]: 📢
    - generic [ref=e21]:
      - paragraph [ref=e22]: new app!
      - paragraph [ref=e23]: /
    - button [ref=e24]:
      - img [ref=e25]
  - main [ref=e28]:
    - generic [ref=e30]:
      - generic [ref=e31]:
        - generic [ref=e32]:
          - img "Azura" [ref=e36]
          - generic [ref=e37]:
            - heading "Azura Cafe" [level=1] [ref=e38]
            - paragraph [ref=e39]: The quality is a habit
            - paragraph [ref=e40]: 11 items
          - link "📖 Full Menu" [ref=e41] [cursor=pointer]:
            - /url: https://azura-menu.pages.dev
            - generic [ref=e42]: 📖
            - generic [ref=e43]: Full Menu
        - generic [ref=e44]:
          - img [ref=e45]
          - textbox "Search for something tasty..." [ref=e48]
      - generic [ref=e50]:
        - button "⭐ Top Picks 0" [ref=e51]:
          - generic [ref=e52]: ⭐
          - generic [ref=e53]: Top Picks
          - generic [ref=e54]: "0"
        - button "🆕 New 6" [ref=e55]:
          - generic [ref=e56]: 🆕
          - generic [ref=e57]: New
          - generic [ref=e58]: "6"
        - button "🍲 Soup 4" [ref=e59]:
          - generic [ref=e60]: 🍲
          - generic [ref=e61]: Soup
          - generic [ref=e62]: "4"
        - button "🍟 Appetizers 13" [ref=e63]:
          - generic [ref=e64]: 🍟
          - generic [ref=e65]: Appetizers
          - generic [ref=e66]: "13"
        - button "🥗 Salads 6" [ref=e67]:
          - generic [ref=e68]: 🥗
          - generic [ref=e69]: Salads
          - generic [ref=e70]: "6"
        - button "🍝 Pasta 12" [ref=e71]:
          - generic [ref=e72]: 🍝
          - generic [ref=e73]: Pasta
          - generic [ref=e74]: "12"
        - button "🌯 Tortilla 5" [ref=e75]:
          - generic [ref=e76]: 🌯
          - generic [ref=e77]: Tortilla
          - generic [ref=e78]: "5"
        - button "🥪 Sandwiches 0" [ref=e79]:
          - generic [ref=e80]: 🥪
          - generic [ref=e81]: Sandwiches
          - generic [ref=e82]: "0"
        - button "🥖 Vina Sandwiches 0" [ref=e83]:
          - generic [ref=e84]: 🥖
          - generic [ref=e85]: Vina Sandwiches
          - generic [ref=e86]: "0"
        - button "🍽️ Main Dishes 10" [ref=e87]:
          - generic [ref=e88]: 🍽️
          - generic [ref=e89]: Main Dishes
          - generic [ref=e90]: "10"
        - button "🍔 Beef Burgers 0" [ref=e91]:
          - generic [ref=e92]: 🍔
          - generic [ref=e93]: Beef Burgers
          - generic [ref=e94]: "0"
        - button "🔥 Smash Burgers 7" [ref=e95]:
          - generic [ref=e96]: 🔥
          - generic [ref=e97]: Smash Burgers
          - generic [ref=e98]: "7"
        - button "🍗 Fried Chicken 4" [ref=e99]:
          - generic [ref=e100]: 🍗
          - generic [ref=e101]: Fried Chicken
          - generic [ref=e102]: "4"
        - button "➕ Extra Kitchen 10" [ref=e103]:
          - generic [ref=e104]: ➕
          - generic [ref=e105]: Extra Kitchen
          - generic [ref=e106]: "10"
        - button "☕ Hot Drinks 11" [ref=e107]:
          - generic [ref=e108]: ☕
          - generic [ref=e109]: Hot Drinks
          - generic [ref=e110]: "11"
        - button "☕ Espresso 21" [ref=e111]:
          - generic [ref=e112]: ☕
          - generic [ref=e113]: Espresso
          - generic [ref=e114]: "21"
        - button "🥛 Corto 4" [ref=e115]:
          - generic [ref=e116]: 🥛
          - generic [ref=e117]: Corto
          - generic [ref=e118]: "4"
        - button "🍫 Hot Chocolate 8" [ref=e119]:
          - generic [ref=e120]: 🍫
          - generic [ref=e121]: Hot Chocolate
          - generic [ref=e122]: "8"
        - button "🧊 Frappe 23" [ref=e123]:
          - generic [ref=e124]: 🧊
          - generic [ref=e125]: Frappe
          - generic [ref=e126]: "23"
        - button "🧋 Iced Coffee 11" [ref=e127]:
          - generic [ref=e128]: 🧋
          - generic [ref=e129]: Iced Coffee
          - generic [ref=e130]: "11"
        - button "🍹 Mocktails 19" [ref=e131]:
          - generic [ref=e132]: 🍹
          - generic [ref=e133]: Mocktails
          - generic [ref=e134]: "19"
        - button "🧋 Boba Tea 4" [ref=e135]:
          - generic [ref=e136]: 🧋
          - generic [ref=e137]: Boba Tea
          - generic [ref=e138]: "4"
        - button "🍊 Fresh Juice 14" [ref=e139]:
          - generic [ref=e140]: 🍊
          - generic [ref=e141]: Fresh Juice
          - generic [ref=e142]: "14"
        - button "🍸 Cocktails 0" [ref=e143]:
          - generic [ref=e144]: 🍸
          - generic [ref=e145]: Cocktails
          - generic [ref=e146]: "0"
        - button "🥤 Smoothie 19" [ref=e147]:
          - generic [ref=e148]: 🥤
          - generic [ref=e149]: Smoothie
          - generic [ref=e150]: "19"
        - button "🥛 Milkshake 9" [ref=e151]:
          - generic [ref=e152]: 🥛
          - generic [ref=e153]: Milkshake
          - generic [ref=e154]: "9"
        - button "🧇 Waffle 0" [ref=e155]:
          - generic [ref=e156]: 🧇
          - generic [ref=e157]: Waffle
          - generic [ref=e158]: "0"
        - button "🍰 Desserts 8" [ref=e159]:
          - generic [ref=e160]: 🍰
          - generic [ref=e161]: Desserts
          - generic [ref=e162]: "8"
        - button "🥞 Crepe 6" [ref=e163]:
          - generic [ref=e164]: 🥞
          - generic [ref=e165]: Crepe
          - generic [ref=e166]: "6"
        - button "🥞 Pancakes 8" [ref=e167]:
          - generic [ref=e168]: 🥞
          - generic [ref=e169]: Pancakes
          - generic [ref=e170]: "8"
        - button "🥤 Extra Drinks 0" [ref=e171]:
          - generic [ref=e172]: 🥤
          - generic [ref=e173]: Extra Drinks
          - generic [ref=e174]: "0"
        - button "🥤 Soft Drinks 0" [ref=e175]:
          - generic [ref=e176]: 🥤
          - generic [ref=e177]: Soft Drinks
          - generic [ref=e178]: "0"
        - button "💨 Hookah 8" [ref=e179]:
          - generic [ref=e180]: 💨
          - generic [ref=e181]: Hookah
          - generic [ref=e182]: "8"
        - button "✨ All 266" [ref=e183]:
          - generic [ref=e184]: ✨
          - generic [ref=e185]: All
          - generic [ref=e186]: "266"
      - generic [ref=e188]:
        - generic [ref=e190] [cursor=pointer]:
          - generic [ref=e191]:
            - img "Americano (white-black)" [ref=e192]
            - generic [ref=e193]:
              - generic [ref=e194]: ☕
              - generic [ref=e195]: Hot Drinks
          - generic [ref=e196]:
            - heading "Americano (white-black)" [level=3] [ref=e197]
            - generic [ref=e198]:
              - generic [ref=e199]:
                - generic [ref=e200]: "91"
                - generic [ref=e201]: EGP
              - generic [ref=e202]: Details
        - generic [ref=e204] [cursor=pointer]:
          - generic [ref=e205]:
            - img "Flavor Tea" [ref=e206]
            - generic [ref=e207]:
              - generic [ref=e208]: ☕
              - generic [ref=e209]: Hot Drinks
          - generic [ref=e210]:
            - heading "Flavor Tea" [level=3] [ref=e211]
            - generic [ref=e212]:
              - generic [ref=e213]:
                - generic [ref=e214]: "55"
                - generic [ref=e215]: EGP
              - generic [ref=e216]: Details
        - generic [ref=e218] [cursor=pointer]:
          - generic [ref=e219]:
            - img "French Coffee" [ref=e220]
            - generic [ref=e221]:
              - generic [ref=e222]: ☕
              - generic [ref=e223]: Hot Drinks
          - generic [ref=e224]:
            - heading "French Coffee" [level=3] [ref=e225]
            - generic [ref=e226]:
              - generic [ref=e227]:
                - generic [ref=e228]: "65"
                - generic [ref=e229]: EGP
              - generic [ref=e230]: Details
        - generic [ref=e232] [cursor=pointer]:
          - generic [ref=e233]:
            - img "Hazelnut Coffee" [ref=e234]
            - generic [ref=e235]:
              - generic [ref=e236]: ☕
              - generic [ref=e237]: Hot Drinks
          - generic [ref=e238]:
            - heading "Hazelnut Coffee" [level=3] [ref=e239]
            - generic [ref=e240]:
              - generic [ref=e241]:
                - generic [ref=e242]: "95"
                - generic [ref=e243]: EGP
              - generic [ref=e244]: Details
        - generic [ref=e246] [cursor=pointer]:
          - generic [ref=e247]:
            - img "Hot Cider" [ref=e248]
            - generic [ref=e249]:
              - generic [ref=e250]: ☕
              - generic [ref=e251]: Hot Drinks
          - generic [ref=e252]:
            - heading "Hot Cider" [level=3] [ref=e253]
            - generic [ref=e254]:
              - generic [ref=e255]:
                - generic [ref=e256]: "55"
                - generic [ref=e257]: EGP
              - generic [ref=e258]: Details
        - generic [ref=e260] [cursor=pointer]:
          - generic [ref=e261]:
            - img "Mix Herbs" [ref=e262]
            - generic [ref=e263]:
              - generic [ref=e264]: ☕
              - generic [ref=e265]: Hot Drinks
          - generic [ref=e266]:
            - heading "Mix Herbs" [level=3] [ref=e267]
            - generic [ref=e268]:
              - generic [ref=e269]:
                - generic [ref=e270]: "60"
                - generic [ref=e271]: EGP
              - generic [ref=e272]: Details
        - generic [ref=e274] [cursor=pointer]:
          - generic [ref=e275]:
            - img "Zarda Tea" [ref=e276]
            - generic [ref=e277]:
              - generic [ref=e278]: ☕
              - generic [ref=e279]: Hot Drinks
          - generic [ref=e280]:
            - heading "Zarda Tea" [level=3] [ref=e281]
            - generic [ref=e282]:
              - generic [ref=e283]:
                - generic [ref=e284]: "65"
                - generic [ref=e285]: EGP
              - generic [ref=e286]: Details
        - generic [ref=e288] [cursor=pointer]:
          - img "Classic Sahlab (Nuts)" [ref=e290]
          - generic [ref=e292]:
            - heading "Classic Sahlab (Nuts)" [level=3] [ref=e293]
            - generic [ref=e294]:
              - generic [ref=e295]:
                - generic [ref=e296]: "104"
                - generic [ref=e297]: EGP
              - generic [ref=e298]: Details
        - generic [ref=e300] [cursor=pointer]:
          - img "Lotus Sahlab" [ref=e302]
          - generic [ref=e304]:
            - heading "Lotus Sahlab" [level=3] [ref=e305]
            - generic [ref=e306]:
              - generic [ref=e307]:
                - generic [ref=e308]: "149"
                - generic [ref=e309]: EGP
              - generic [ref=e310]: Details
        - generic [ref=e312] [cursor=pointer]:
          - img "Nutella Sahlab" [ref=e314]
          - generic [ref=e316]:
            - heading "Nutella Sahlab" [level=3] [ref=e317]
            - generic [ref=e318]:
              - generic [ref=e319]:
                - generic [ref=e320]: "139"
                - generic [ref=e321]: EGP
              - generic [ref=e322]: Details
        - generic [ref=e324] [cursor=pointer]:
          - img "Pistachio Sahlab" [ref=e326]
          - generic [ref=e328]:
            - heading "Pistachio Sahlab" [level=3] [ref=e329]
            - generic [ref=e330]:
              - generic [ref=e331]:
                - generic [ref=e332]: "169"
                - generic [ref=e333]: EGP
              - generic [ref=e334]: Details
  - navigation [ref=e336]:
    - generic [ref=e338]:
      - link "Menu" [ref=e339] [cursor=pointer]:
        - /url: /menu
        - button "Menu" [ref=e340]:
          - img [ref=e344]
          - generic [ref=e347]: Menu
      - link "AI" [ref=e348] [cursor=pointer]:
        - /url: /barista
        - button "AI" [ref=e349]:
          - img [ref=e352]
          - generic [ref=e354]: AI
      - link "Reels" [ref=e355] [cursor=pointer]:
        - /url: /reels
        - button "Reels" [ref=e356]:
          - img [ref=e359]
          - generic [ref=e361]: Reels
      - link "Support" [ref=e362] [cursor=pointer]:
        - /url: /support
        - button "Support" [ref=e363]:
          - img [ref=e366]
          - generic [ref=e368]: Support
      - link "Profile" [ref=e369] [cursor=pointer]:
        - /url: /profile
        - button "Profile" [ref=e370]:
          - img [ref=e373]
          - generic [ref=e375]: Profile
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   |
  3   | const BASE_URL = 'http://localhost:5000';
  4   |
  5   | test.describe('Azura App Comprehensive Tests', () => {
  6   |
  7   |   test('Admin Panel - Tab Switching & System Tab', async ({ page }) => {
  8   |     await page.goto(`${BASE_URL}/admin`);
  9   |
  10  |     // Login
  11  |     await page.fill('input[type="password"]', 'azura2026');
  12  |     await page.click('button:has-text("Login"), button:has-text("دخول")');
  13  |
  14  |     // Check Overview - more flexible text check
  15  |     await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 });
  16  |     const overviewText = await page.locator('h2').first().innerText();
  17  |     expect(overviewText.toLowerCase()).toMatch(/activity|نشاط/);
  18  |
  19  |     // Switch to Menu
  20  |     await page.click('button:has-text("Menu"), button:has-text("القائمة")');
  21  |     await expect(page.locator('h3').first()).toContainText(/menu management/i);
  22  |
  23  |     // Switch to System (Should not be blank)
  24  |     await page.click('button:has-text("System"), button:has-text("النظام")');
  25  |     await expect(page.locator('h3:has-text("R2 Fallback"), h3:has-text("إعدادات الطوارئ")')).toBeVisible();
  26  |     await expect(page.locator('button:has-text("Create New Backup"), button:has-text("إنشاء نسخة احتياطية جديدة")')).toBeVisible();
  27  |   });
  28  |
  29  |   test('User Menu - Search & Filtering', async ({ page }) => {
  30  |     // Setup - User flow starts with name/table
  31  |     await page.goto(`${BASE_URL}/`);
  32  |
  33  |     // Wait for Splash Screen transition (t2 = 3600ms)
  34  |     await page.waitForTimeout(6000);
  35  |
  36  |     // Check if we are stuck on splash or reached main
  37  |     const nameInput = page.locator('input[placeholder*="your name"], input[placeholder*="اسمك"]');
  38  |     await expect(nameInput).toBeVisible({ timeout: 30000 });
  39  |
  40  |     await nameInput.fill('Test User');
  41  |     await page.fill('input[placeholder*="1-99"]', '5');
  42  |     await page.click('button:has-text("Ordering"), button:has-text("الطلب")');
  43  |
  44  |     // Wait for Menu
> 45  |     await page.waitForURL('**/menu');
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  46  |
  47  |     // Category check
  48  |     const hotDrinksCat = page.locator('button:has-text("Hot Drinks"), button:has-text("مشروبات ساخنة")');
  49  |     await expect(hotDrinksCat).toBeVisible();
  50  |
  51  |     // Search check
  52  |     const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="ابحث"]');
  53  |     await searchInput.fill('Coffee');
  54  |
  55  |     // Check if results appear
  56  |     await page.waitForTimeout(500); // debounce
  57  |     const items = page.locator('.grid > div');
  58  |     const count = await items.count();
  59  |     console.log(`Found ${count} items for search "Coffee"`);
  60  |
  61  |     // Top Picks (Recommended)
  62  |     await page.click('button:has-text("Top Picks"), button:has-text("الأفضل")');
  63  |     await page.waitForTimeout(500);
  64  |     const recCount = await items.count();
  65  |     console.log(`Found ${recCount} items in Top Picks`);
  66  |   });
  67  |
  68  |   test('AI Barista - Menu Knowledge', async ({ page }) => {
  69  |     // Need to be logged in first to access other pages usually
  70  |     await page.goto(`${BASE_URL}/`);
  71  |     await page.waitForTimeout(6000);
  72  |     const nameInput = page.locator('input[placeholder*="your name"], input[placeholder*="اسمك"]');
  73  |     await nameInput.fill('Test Bot');
  74  |     await page.fill('input[placeholder*="1-99"]', '99');
  75  |     await page.click('button:has-text("Ordering"), button:has-text("الطلب")');
  76  |     await page.waitForURL('**/menu', { timeout: 30000 });
  77  |
  78  |     await page.goto(`${BASE_URL}/barista`);
  79  |
  80  |     // Wait for greeting (it might be in a different class or take time)
  81  |     await page.waitForSelector('.bubble-ai, .bg-card', { timeout: 15000 });
  82  |
  83  |     // Ask about menu
  84  |     const textarea = page.locator('textarea');
  85  |     await textarea.fill('What is on the menu?');
  86  |     await page.click('button:has-text("Send"), button:has-text("Send Icon"), svg.lucide-send');
  87  |
  88  |     // Wait for AI response
  89  |     await expect(page.locator('.bubble-ai').nth(1)).toBeVisible({ timeout: 15000 });
  90  |     const aiText = await page.locator('.bubble-ai').nth(1).innerText();
  91  |     console.log('AI Response:', aiText);
  92  |
  93  |     // Check if it suggests items
  94  |     const suggested = page.locator('.card.rounded-xl.p-3');
  95  |     const suggestedCount = await suggested.count();
  96  |     console.log(`AI suggested ${suggestedCount} items`);
  97  |   });
  98  |
  99  | });
  100 |
```