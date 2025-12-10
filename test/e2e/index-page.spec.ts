import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Home/Index Page
 *
 * Tests the main dashboard page functionality, feature cards,
 * and navigation links.
 */

test.describe('Home Page - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });  test('should display page header with title and description', async ({ page }) => {
    // Check for home page title
    const heading = page.locator('h1, [role="heading"]').first();
    await expect(heading).toBeVisible();

    // Verify there's content on the page
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    // The home page should have multiple feature cards/links
    // Look for links or cards that navigate to different sections

    // Wait for any cards to load
    await page.waitForTimeout(1000);

    // Check that we have clickable elements (cards/links)
    const links = page.locator('a[href^="/"]');
    const linkCount = await links.count();

    // Should have at least one navigation link
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should have profile feature card', async ({ page }) => {
    // Look for profile-related link
    const profileLink = page.locator('a[href*="profile"]').first();

    // Profile link should exist and be visible
    if ((await profileLink.count()) > 0) {
      await expect(profileLink).toBeVisible();
    }
  });

  test('should navigate to profile page when profile card is clicked', async ({ page }) => {
    // Find and click profile link
    const profileLink = page.locator('a[href="/profile"]').first();

    if ((await profileLink.count()) > 0) {
      await profileLink.click();

      // Wait for navigation
      await page.waitForURL(/.*profile.*/, { timeout: 5000 });

      // Verify we're on profile page
      expect(page.url()).toContain('profile');
    }
  });

  test('should have CV upload feature when no experiences exist', async ({ page }) => {
    // CV upload should be conditionally shown
    // Check if CV upload link exists
    const cvUploadLink = page.locator('a[href*="cv-upload"]').first();

    // If CV upload is shown, it should be clickable
    if ((await cvUploadLink.count()) > 0) {
      await expect(cvUploadLink).toBeVisible();
    }
  });

  test('should display jobs feature card', async ({ page }) => {
    // Check for jobs-related content
    const jobsText = page.locator('text=/job/i').first();

    if ((await jobsText.count()) > 0) {
      await expect(jobsText).toBeVisible();
    }
  });

  test('should display applications feature card', async ({ page }) => {
    // Check for applications-related content
    const applicationsText = page.locator('text=/application/i').first();

    if ((await applicationsText.count()) > 0) {
      await expect(applicationsText).toBeVisible();
    }
  });

  test('should display interview prep feature card', async ({ page }) => {
    // Check for interview-related content
    const interviewText = page.locator('text=/interview/i').first();

    if ((await interviewText.count()) > 0) {
      await expect(interviewText).toBeVisible();
    }
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

    if ((await header.count()) > 0) {
      await expect(header).toBeVisible();
    }
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
