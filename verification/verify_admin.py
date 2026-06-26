from playwright.sync_api import sync_playwright
import time

def verify_admin_menu(page):
    # Navigate to admin page
    page.goto("http://localhost:5000/admin")

    # Login
    page.fill("input[type='password']", "azura2026")
    page.click("button:has-text('Login')")

    # Wait for login and click Menu tab
    page.wait_for_selector("button:has-text('Menu')")
    page.click("button:has-text('Menu')")

    # Wait for menu items to load
    page.wait_for_timeout(2000)

    # Take screenshot of the category list
    page.screenshot(path="verification/admin_menu_categories.png")

    # Expand first category if found
    category_buttons = page.query_selector_all("button:has(span[class*='font-black'])")
    if category_buttons:
        category_buttons[0].click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/admin_menu_items.png")

        # Click an item to edit
        item_cards = page.query_selector_all(".card.rounded-2xl")
        if item_cards:
            item_cards[0].click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/admin_menu_edit_panel.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 375, 'height': 812}, is_mobile=True)
        page = context.new_page()
        try:
            verify_admin_menu(page)
        finally:
            browser.close()
