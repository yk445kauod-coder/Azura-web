import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(f"PAGE ERROR: {err}"))

        print("Navigating to http://localhost:3000/admin ...")
        await page.goto("http://localhost:3000/admin", wait_until="networkidle")

        print("Entering PIN azura2026 ...")
        await page.fill("input[type='password']", "azura2026")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(1000)

        tabs = ["Overview", "Menu", "Features", "Users", "Chat", "Reviews", "Broadcast", "Reels", "AI Barista", "API", "System", "Tables"]
        for tab_name in tabs:
            print(f"Testing tab: {tab_name}...")
            tab_btn = page.locator(f"button:has-text('{tab_name}')")
            if await tab_btn.count() > 0:
                await tab_btn.first.click()
                await page.wait_for_timeout(300)

        print("Finished clicking tabs.")
        await page.screenshot(path="verification/admin_screenshot.png")
        await browser.close()

        if page_errors:
            print("PAGE ERRORS DETECTED:")
            for err in page_errors:
                print(err)
            exit(1)
        else:
            print("SUCCESS! Zero uncaught page errors or tab reference crashes detected.")

asyncio.run(main())
