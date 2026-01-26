
const { chromium } = require('playwright');

(async () => {
    try {
        console.log('Starting browser...');
        const browser = await chromium.launch();
        const page = await browser.newPage();

        console.log('Navigating to FOCUS page (Auth should be bypassed)...');
        // Increase timeout for slow dev server
        await page.goto('http://localhost:3000/dashboard/focus', { timeout: 60000 });

        console.log('Waiting for H1 content...');
        await page.waitForSelector('h1');

        const title = await page.$eval('h1', el => el.innerText);
        console.log('Page Title:', title);

        // Check if we are really on the focus page (look for specific text like "BOSHLASH")
        const content = await page.content();
        if (content.includes("BOSHLASH")) {
            console.log('SUCCESS: "BOSHLASH" button found. We are on the Focus Page.');
        } else {
            console.log('WARNING: "BOSHLASH" button NOT found. Still login page?');
        }

        // Get computed style of the timer text
        // Assuming the timer is the largest text or has a specific class. 
        // Based on previous edits, the timer might be in a div or span with 'text-[8rem]'.
        // Let's find the element with typical timer text (e.g. contains ":")
        const timerElement = await page.$('text=/\\d+:\\d+/');
        if (timerElement) {
            const fontSize = await timerElement.evaluate((el) => {
                return window.getComputedStyle(el).fontSize;
            });
            const className = await timerElement.getAttribute('class');
            console.log('Timer Font Size:', fontSize);
            console.log('Timer Class Name:', className);
        } else {
            // Fallback: look for the H1 if it IS the timer
            console.log('Trying to identify timer by class...');
            // The timer usually has "font-mono" or similar.
            // Let's dump all text-8xl or text-[8rem] elements
            const hugeText = await page.$('.text-\\[8rem\\]');
            if (hugeText) {
                console.log('Found .text-[8rem] element!');
                const text = await hugeText.innerText();
                console.log('Content:', text);
            } else {
                console.log('Could not find .text-[8rem] element.');
            }
        }

        console.log('Taking verification screenshot...');
        await page.screenshot({ path: 'focus-verified.png' });

        await browser.close();
        console.log('Verification Pass Complete.');
    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    }
})();
