import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        page = await context.new_page()

        await page.goto('http://localhost:5173')
        await asyncio.sleep(4) # Wait for splash

        # Login
        await page.fill('input[placeholder="Enter your name"]', 'Final Tester')
        await page.fill('input[placeholder="1-99"]', '10')
        await page.click('button:has-text("Start Ordering")')
        await asyncio.sleep(2)

        # Screenshot Menu
        await page.screenshot(path='final_menu.png')

        # Check an item
        await page.click('text=Chicken Butterfly')
        await asyncio.sleep(1)
        await page.screenshot(path='final_item_detail.png')
        await page.keyboard.press('Escape')

        # Go to Admin
        await page.goto('http://localhost:5173/admin')
        await page.fill('input[type="password"]', 'azura2024')
        await page.click('button:has-text("Login")')
        await asyncio.sleep(2)

        # Screenshot Admin Overview
        await page.screenshot(path='final_admin_overview.png')

        # Go to Users Tab
        await page.click('text=Users')
        await asyncio.sleep(1)
        await page.screenshot(path='final_admin_users.png')

        # Go to AI Tab
        await page.click('text=AI Assistant')
        await asyncio.sleep(1)
        await page.screenshot(path='final_admin_ai.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
