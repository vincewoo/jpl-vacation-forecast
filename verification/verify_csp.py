from playwright.sync_api import sync_playwright

def test_csp_headers(page):
    print("Navigating to app...")
    page.goto("http://localhost:4173/jpl-vacation-forecast/")

    print("Waiting for load...")
    page.wait_for_load_state("networkidle")

    title = page.title()
    print(f"Page title: {title}")

    # Check for CSP meta tag
    csp_content = page.evaluate("""
        () => {
            const meta = document.querySelector("meta[http-equiv='Content-Security-Policy']");
            return meta ? meta.content : "CSP Meta Tag Not Found";
        }
    """)
    print(f"CSP Content: {csp_content}")

    # Check for Referrer Policy
    referrer_content = page.evaluate("""
        () => {
            const meta = document.querySelector("meta[name='referrer']");
            return meta ? meta.content : "Referrer Meta Tag Not Found";
        }
    """)
    print(f"Referrer Policy: {referrer_content}")

    # Take screenshot
    page.screenshot(path="verification/csp_verification.png")
    print("Screenshot saved to verification/csp_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_csp_headers(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
