import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        page = await context.new_page()
        await page.goto('http://localhost:5173')
        await asyncio.sleep(5)
        await page.screenshot(path='splash_check.png')
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
