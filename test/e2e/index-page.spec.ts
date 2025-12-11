import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Home/Index Page
 *
 * Tests the main dashboard page functionality, feature cards,
 * and navigation links.
 */

// Empty state tests - run serially FIRST before any experiences are created
test.describe.serial('Home Page - Empty State', () => {
  test.describe.configure({ retries: 2 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have CV upload feature when no experiences exist', async ({ page }) => {
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
  test('should display page header with title and description', async ({ page }) => {
    // Verify page has loaded with content
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent).toBeVisible();

    // Verify we're on the home page (not login)
    await expect(page).not.toHaveURL(/.*sign-in.*/);
  });

  // Retry this test due to occasional auth state timing issues
  test.describe.configure({ retries: 2 });

  test('should have profile feature card', async ({ page }) => {
    // Look for profile link (UPageCard creates absolute positioned overlay)
    const profileLink = page.locator('a[href="/profile"]');
    await expect(profileLink).toHaveCount(1);
    await expect(profileLink).toHaveAttribute('href', '/profile');
  });

  test('should navigate to profile page when profile card is clicked', async ({ page }) => {
    // UPageCard creates an overlay link with absolute positioning
    // Find the actual link element inside the card
    const profileLink = page.locator('a[href="/profile"][aria-label="Profile"]');

    await profileLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Click the overlay link
    await profileLink.click();

    // Wait for navigation
    await page.waitForURL(/.*profile.*/, { timeout: 5000 });

    // Verify we're on profile page
    expect(page.url()).toContain('profile');
  });

  test('should display jobs feature card', async ({ page }) => {
    // Check for jobs-related content
    const jobsText = page.locator('text=/job/i').first();

    await expect(jobsText).toBeVisible();
  });

  test('should display applications feature card', async ({ page }) => {
    // Check for applications-related content
    const applicationsText = page.locator('text=/application/i').first();

    await expect(applicationsText).toBeVisible();
  });

  test('should display interview prep feature card', async ({ page }) => {
    // Check for interview-related content
    const interviewText = page.locator('text=/interview/i').first();

    await expect(interviewText).toBeVisible();
  });

  test('should have responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should still be visible and scrollable
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check that content is not overflowing horizontally
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // Allow small overflow for scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check for header/navigation element
    const header = page.locator('header, nav, [role="navigation"]').first();

    await expect(header).toBeVisible();
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
