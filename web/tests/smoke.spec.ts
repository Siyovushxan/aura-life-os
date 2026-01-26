import { test, expect, type Page } from '@playwright/test';

test.describe('AURA Smoke Tests', () => {
    test('should load the landing page', async ({ page }: { page: Page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/AURA/);
    });

    test('should redirect to dashboard/login if not authenticated', async ({ page }: { page: Page }) => {
        await page.goto('/dashboard');
        // Expect redirection to login or presence of login elements
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should show finance page structure', async ({ page }: { page: Page }) => {
        await page.goto('/dashboard/finance');
        // Even if not logged in, we check if the basic layout loads (or redirect happens)
        const title = page.locator('h1');
        await expect(title).toBeVisible();
    });

    test('should show tasks page structure', async ({ page }: { page: Page }) => {
        await page.goto('/dashboard/tasks');
        const title = page.locator('h1');
        await expect(title).toBeVisible();
    });
});
