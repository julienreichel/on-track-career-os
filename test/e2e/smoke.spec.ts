import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic Application Structure
 *
 * These tests verify the basic application structure and routing
 * without requiring full backend integration.
 */

test.describe('Application Smoke Tests', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page loaded (check for any content)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have valid HTML structure', async ({ page }) => {
    await page.goto('/');

    // Verify basic HTML structure
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('head')).toBeAttached();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to profile routes', async ({ page }) => {
    // Test that profile routes are accessible
    const routes = ['/profile/cv-upload', '/profile/experiences'];

    for (const route of routes) {
      const response = await page.goto(route);
      // Check that route doesn't 404
      expect(response?.status()).not.toBe(404);
    }
  });
});
