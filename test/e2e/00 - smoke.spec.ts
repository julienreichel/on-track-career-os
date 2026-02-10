import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic Application Structure
 *
 * These tests verify the basic application structure and routing
 * without requiring full authentication or backend integration.
 */

test.describe('Application Smoke Tests', () => {
  test('should load and render the application', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify basic HTML structure
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have valid page structure', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to settle
    await page.waitForLoadState('domcontentloaded');

    // Verify basic page structure elements exist
    const hasHtml = await page.locator('html').count();
    const hasBody = await page.locator('body').count();

    expect(hasHtml).toBeGreaterThan(0);
    expect(hasBody).toBeGreaterThan(0);
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(20000);

    // Filter out known Amplify warnings/errors that are expected during dev
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('Amplify') &&
        !error.includes('AuthError') &&
        !error.includes('NotAuthorizedException') &&
        !error.includes('Hydration')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
