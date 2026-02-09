import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Home/Index Page
 *
 * Tests the main dashboard navigation and authentication workflows.
 *
 * Component/UI tests moved to: test/nuxt/pages/index.spec.ts
 * - Page header rendering
 * - Feature card display
 * - Empty state (CV upload visibility)
 * - Responsive layout checks
 * - Accessibility structure
 *
 * These E2E tests focus on:
 * - Navigation between pages (home → profile)
 * - Authentication redirects
 * - Full page load and interaction workflows
 */

test.describe('Home Page - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
    await page.waitForURL('**/home');
  });
  // Retry tests due to occasional auth state timing issues
  test.describe.configure({ retries: 2 });

  test('should navigate to profile page when profile card is clicked', async ({ page }) => {
    // UPageCard creates an overlay link with absolute positioned span inside
    // Click the span that covers the card area
    const profileCard = page.locator(
      'a[href="/profile"][aria-label="Profile"] span.absolute.inset-0'
    );

    await profileCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Click the overlay span
    await profileCard.click();

    // Wait for navigation
    await page.waitForURL(/.*profile.*/, { timeout: 5000 });

    // Verify we're on profile page
    expect(page.url()).toContain('profile');
  });
});

test.describe('Home Page - Unauthenticated User', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should show landing page and route to signup', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('landing-hero')).toBeVisible();

    await page.getByTestId('landing-cta-signup').click();
    await page.waitForURL(/\/login/);

    const url = page.url();
    expect(url.includes('mode=signup')).toBeTruthy();

    await expect(page.locator('input[name="confirm_password"]')).toBeVisible();
  });
});
