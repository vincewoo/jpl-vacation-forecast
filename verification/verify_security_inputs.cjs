const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    // 1. Load the app
    await page.goto('http://localhost:5173/jpl-vacation-forecast/');

    // Check for Welcome Screen first
    try {
        console.log('Waiting for Get Started button...');
        const getStartedBtn = page.getByRole('button', { name: /get started/i });
        await getStartedBtn.waitFor({ state: 'visible', timeout: 5000 });
        await getStartedBtn.click();
        console.log('Clicked Get Started.');
    } catch (e) {
        console.log('Get Started button not found or timed out. Maybe already on form?');
    }

    // Wait for the form to appear
    console.log('Waiting for UserInputForm...');
    await page.waitForSelector('.user-input-form', { timeout: 10000 });

    // 2. Check UserInputForm validation
    // Fill out the form to proceed
    await page.fill('#startDate', '2024-01-01');

    // Verify max attribute on currentBalance
    const balanceInput = await page.$('#currentBalance');
    const maxAttr = await balanceInput.getAttribute('max');
    console.log(`Current Balance Max Attribute: ${maxAttr}`);

    if (maxAttr !== '1000') {
      throw new Error('Expected currentBalance to have max="1000"');
    }

    await page.fill('#currentBalance', '100');
    await page.fill('#balanceAsOfDate', '2023-12-31'); // A Sunday

    // Submit form
    console.log('Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for calendar to load
    console.log('Waiting for calendar view...');
    await page.waitForSelector('.calendar-view', { timeout: 10000 });

    // 3. Create a vacation to test VacationEditModal

    console.log('Finding calendar tiles...');
    // Wait a bit for layout
    await page.waitForTimeout(1000);

    // Re-query tiles
    let tiles = await page.locator('.calendar-tile-wrapper').all();
    console.log(`Found ${tiles.length} tiles`);

    // Check if vacation already exists (from previous run)
    // We look for tile 23 (Jan 20)
    const vacationIndicator = page.locator('.calendar-tile-wrapper').nth(23).locator('.indicator.vacation');
    const isVacationExists = await vacationIndicator.count() > 0;

    if (!isVacationExists) {
        if (tiles.length > 30) {
            console.log('Creating vacation...');
            console.log('Clicking start date (tile 23)...');
            await tiles[23].click();
            // Small delay
            await page.waitForTimeout(500);
            console.log('Clicking end date (tile 25)...');
            await tiles[25].click();
            // Wait for creation
            await page.waitForTimeout(1000);
        } else {
            throw new Error('Not enough calendar tiles found');
        }
    } else {
        console.log('Vacation already exists on tile 23.');
    }

    // 4. Click the vacation to open modal
    console.log('Clicking vacation (tile 23) to open modal...');
    // Re-query tiles to be safe
    tiles = await page.locator('.calendar-tile-wrapper').all();
    await tiles[23].click();

    // Wait for modal to appear
    console.log('Waiting for modal...');
    try {
        await page.waitForSelector('.modal-content', { timeout: 10000 });
    } catch (e) {
        console.log("Modal content not found. Taking screenshot of failure state.");
        await page.screenshot({ path: 'verification/modal_failure.png' });
        throw e;
    }

    // 5. Check VacationEditModal validation
    const descriptionInput = await page.$('#edit-description');
    const descMaxLength = await descriptionInput.getAttribute('maxLength');
    console.log(`Description MaxLength Attribute: ${descMaxLength}`);

    if (descMaxLength !== '100') {
        throw new Error('Expected description to have maxLength="100"');
    }

    // 6. Screenshot
    await page.screenshot({ path: 'verification/verification.png' });
    console.log('Verification screenshot taken.');

  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
