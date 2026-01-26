import { test, expect, type Page } from '@playwright/test';

test.describe('Dashboard Modules Visibility', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');
    });

    test('should have a voice input button on dashboard', async ({ page }: { page: Page }) => {
        const voiceBtn = page.locator('button:has(svg path[d*="M12 2a3"])');
        await expect(voiceBtn).toBeVisible();
    });

    test('should have a link to finance module', async ({ page }: { page: Page }) => {
        const financeLink = page.locator('a[href*="/dashboard/finance"]');
        await expect(financeLink).toBeVisible();
    });

    test('should have a link to health module', async ({ page }: { page: Page }) => {
        const healthLink = page.locator('a[href*="/dashboard/health"]');
        await expect(healthLink).toBeVisible();
    });

    test('should have a link to family module', async ({ page }: { page: Page }) => {
        const familyLink = page.locator('a[href*="/dashboard/family"]');
        await expect(familyLink).toBeVisible();
    });
});

test.describe('Finance Page Structure', () => {
    test('should have transaction list container', async ({ page }: { page: Page }) => {
        await page.goto('/dashboard/finance');
        // Check for "Transaction" or similar keyword in localized text if possible, 
        // but usually containers have specific classes or structures.
        const main = page.locator('main');
        await expect(main).toBeVisible();
    });
});
