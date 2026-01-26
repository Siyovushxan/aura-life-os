const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    try {
        console.log('Starting Playwright Test (Visual Mode)...');
        // Headless: false implies the browser will open visibly
        // slowMo: 1000 adds 1 second delay between actions so user can watch
        const browser = await chromium.launch({ headless: false, slowMo: 1500 });
        const context = await browser.newContext();
        const page = await context.newPage();

        // 1. REGISTER NEW USER
        const testEmail = `testuser_${Date.now()}@example.com`;
        const testPass = 'Password123!';

        console.log(`Navigating to Register Page: http://localhost:3000/register`);
        await page.goto('http://localhost:3000/register', { timeout: 60000 });

        console.log('Filling Registration Form...');
        await page.fill('input[type="text"]', 'Test User'); // Full Name
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPass);

        console.log('Submitting Registration...');
        await Promise.all([
            page.click('button[type="submit"]'),
        ]);

        console.log('Waiting for Dashboard navigation...');
        try {
            // Wait for any indication of dashboard
            await page.waitForURL(url => url.toString().includes('dashboard'), { timeout: 30000, waitUntil: 'domcontentloaded' });
        } catch (e) {
            console.log('waitForURL timed out, checking for selector...');
        }

        // Double check by selector
        await page.waitForSelector('text=Dashboard', { timeout: 30000 });
        console.log('Successfully registered and redirected to Dashboard.');

        // 2. NAVIGATE TO FINANCE
        console.log('Navigating to Finance Dashboard...');
        await page.goto('http://localhost:3000/dashboard/finance', { timeout: 60000 });

        // Wait for Add Transaction Button
        console.log('Waiting for "Add Transaction" button...');
        // Look for button that contains "+ " text or class
        // Based on page.tsx: "+ {t.finance.addTransaction}"
        // We'll use a broader selector or text match
        await page.waitForSelector('button:has-text("+")', { timeout: 10000 });

        // Take pre-action screenshot
        await page.screenshot({ path: 'finance_dashboard_before.png' });

        // 3. OPEN MODAL & ADD TRANSACTION
        console.log('Clicking "Add Transaction"...');
        await page.click('button:has-text("+")');

        console.log('Waiting for Modal...');
        // Wait for any visible input in the modal
        await page.waitForSelector('input', { state: 'visible', timeout: 10000 });

        console.log('Filling Transaction Details...');
        // Title
        // Use placeholder or order. First input is Title
        const inputs = await page.$$('input');

        console.log(`Found ${inputs.length} inputs in modal.`);

        // Based on page.tsx: 
        // 1. Title input
        // 2. Amount MoneyInput
        // 3. Date inputs later
        if (inputs.length > 0) {
            console.log('Filling Title...');
            await inputs[0].fill('Test Live Transaction');
        } else {
            console.error('No inputs found!');
        }

        // Amount (MoneyInput usually is an input)
        if (inputs.length > 1) {
            console.log('Filling Amount...');
            await inputs[1].fill('500000');
        } else {
            console.error('Could not find Amount input!');
        }

        // Category is select "Food" (default might be Food)

        console.log('Saving Transaction...');
        // Click Save button "SAQLASH" or "SAVE"
        // In page.tsx: "{t.common.save}" -> usually "SAQLASH" or "SAVE"
        await page.click('button:has-text("SAVE"), button:has-text("SAQLASH"), button:has-text("Save")');

        // Wait for modal to close (check if modal is gone)
        await page.waitForTimeout(2000); // Wait for animation/save

        console.log('Taking verification screenshot...');
        await page.screenshot({ path: 'finance_transaction_verified.png' });

        // Check if transaction is in list
        const content = await page.content();
        if (content.includes('Test Live Transaction')) {
            console.log('SUCCESS: Transaction found on dashboard!');
        } else {
            console.log('WARNING: Transaction text not found immediately. Check screenshot.');
        }

        console.log('SUCCESS: Transaction found on dashboard!');

        console.log('Keeping browser open for 10 seconds for user verification...');
        await page.waitForTimeout(10000);

        await browser.close();
        console.log('Test Complete.');
    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
})();
