import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Home/Index Page
 *
 * Tests the main dashboard navigation and authentication workflows.
 * 
 * Component/UI tests moved to: test/nuxt/pages/index.spec.ts
 * - Page header rendering
 * - Feature card display
 * - Responsive layout checks
 * - Accessibility structure
 * 
 * These E2E tests focus on:
 * - Navigation between pages (home → profile)
 * - Authentication redirects
 * - Full page load and interaction workflows
 */

// Empty state tests - run serially FIRST before any experiences are created
test.describe.serial('Home Page - Empty State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.skip('should have CV upload feature when no experiences exist', async ({ page }) => {
    // CV upload is only shown on home page when user has no experiences
    // This test MUST run before any experience creation tests
    // CV upload link has absolute overlay positioning (UPageCard)
    const cvUploadLink = page.locator('a[href="/profile/cv-upload"]');
    await expect(cvUploadLink).toHaveCount(1);
    await expect(cvUploadLink).toHaveAttribute('href', '/profile/cv-upload');
  });
});

test.describe('Home Page - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
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

  test('should redirect to login or show login page', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to settle
    await page.waitForLoadState('networkidle');

    // Check if redirected to login or if login form is shown
    const url = page.url();
    const hasLoginForm =
      (await page.locator('input[type="email"], input[name="username"]').count()) > 0;

    // Either URL contains login/sign-in OR login form is visible
    expect(url.includes('login') || url.includes('sign-in') || hasLoginForm).toBeTruthy();
  });
});
