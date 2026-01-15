
from playwright.sync_api import sync_playwright, expect
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        url = "http://localhost:5173/jpl-vacation-forecast/"
        print(f"Navigating to {url}")
        page.goto(url)

        # Check for Welcome Screen
        try:
            get_started = page.get_by_role("button", name="Get Started")
            if get_started.is_visible(timeout=3000):
                print("Clicking Get Started")
                get_started.click()
        except Exception:
            print("Welcome screen not found or already bypassed")

        # Check for User Input Form
        if page.get_by_label("JPL Start Date").is_visible(timeout=5000):
            print("Filling User Input Form")
            page.get_by_label("JPL Start Date").fill("2020-01-01")
            page.get_by_label("Current Vacation Balance (hours)").fill("100")

            # Use a known Sunday for balance date
            page.get_by_label("Balance As Of Date").fill("2024-01-07")

            page.get_by_role("button", name="Start Forecasting").click()

        # Wait for Calendar
        print("Waiting for Calendar View")
        calendar_view = page.locator(".calendar-view")
        expect(calendar_view).to_be_visible(timeout=10000)

        # Verify calendar tiles are rendered
        tiles = page.locator(".react-calendar__tile")
        count = tiles.count()
        print(f"Found {count} calendar tiles")

        if count < 20:
             raise Exception("Calendar tiles not rendered correctly")

        # Take screenshot
        os.makedirs("verification", exist_ok=True)
        screenshot_path = os.path.abspath("verification/calendar_optimized.png")
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
