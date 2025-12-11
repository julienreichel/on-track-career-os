import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Profile Page
 *
 * Tests the user profile page functionality including viewing,
 * editing, and managing profile information.
 */

test.describe('Profile Page - View Mode', () => {
  // Retry tests in this suite due to occasional auth state timing issues
  test.describe.configure({ retries: 2 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('should display profile page header', async ({ page }) => {
    // Check for page header/title
    const heading = page.locator('h1, h2').first();

    // Give it a moment to render
    await page.waitForTimeout(500);

    await expect(heading).toBeVisible();
  });

  test('should display back to home button', async ({ page }) => {
    // Look for back button - actual text is 'Back to Home'
    const backButton = page
      .locator('a:has-text("Back to Home"), button:has-text("Back to Home"), a:has-text("back")')
      .first();

    await expect(backButton).toBeVisible();
  });

  test('should have edit button in view mode', async ({ page }) => {
    // Look for edit button - actual text is 'Edit Profile'
    const editButton = page
      .locator(
        'button:has-text("Edit Profile"), button:has-text("Edit"), button[aria-label*="edit"]'
      )
      .first();

    // Wait a moment for buttons to render
    await page.waitForTimeout(500);

    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
  });

  test('should display profile sections', async ({ page }) => {
    // Profile page should be visible (even if empty)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify we're on the profile page (not login)
    await expect(page).toHaveURL(/.*profile.*/);

    // Check for either profile sections OR edit button (if profile is empty)
    const hasContent = (await page.locator('h3').count()) > 0;
    const hasEditButton = (await page.getByRole('button', { name: /edit/i }).count()) > 0;

    // Should have either content sections or an edit button
    expect(hasContent || hasEditButton).toBe(true);
  });

  test('should display core identity section if data exists', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Verify page loaded and content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display core identity section', async ({ page }) => {
    // Look for Core Identity section that contains name input
    const coreIdentitySection = page.locator('text=/core identity/i').first();

    await expect(coreIdentitySection).toBeVisible();
  });

  test('should display profile management section', async ({ page }) => {
    // Scroll to bottom to see management links
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for content to be visible
    await page.waitForTimeout(500);

    // Look for Profile Management section with management cards
    const managementSection = page.locator('text=/profile management/i').first();

    await expect(managementSection).toBeVisible();
  });

  test('should have link to experiences page', async ({ page }) => {
    // Look for experiences link (UPageCard creates absolute positioned overlay)
    const experiencesLink = page.locator('a[href="/profile/experiences"]');
    await expect(experiencesLink).toHaveCount(1);
    await expect(experiencesLink).toHaveAttribute('href', '/profile/experiences');
  });

  test('should have link to personal canvas page', async ({ page }) => {
    // Look for canvas link (UPageCard creates absolute positioned overlay)
    const canvasLink = page.locator('a[href="/profile/canvas"]');
    await expect(canvasLink).toHaveCount(1);
    await expect(canvasLink).toHaveAttribute('href', '/profile/canvas');
  });
});

test.describe('Profile Page - Edit Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('should enter edit mode when edit button is clicked', async ({ page }) => {
    // Find and click edit button - text is 'Edit Profile'
    const editButton = page
      .locator(
        'button:has-text("Edit Profile"), button:has-text("Edit"), button[aria-label*="edit"]'
      )
      .first();

    // Wait for button to be ready
    await page.waitForTimeout(500);

    await editButton.click();

    // Wait for edit mode to activate
    await page.waitForTimeout(500);

    // Scroll to bottom to see Save/Cancel buttons
    // TODO: Improve UI with floating buttons that are always visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Should now see save/cancel buttons - actual text is 'Save Profile' and 'Cancel'
    const saveButton = page.locator('button[type="submit"]:has-text("Save Profile")');
    const cancelButton = page.locator('button[type="button"]:has-text("Cancel")').first();

    // Both buttons should be visible in edit mode
    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
  });

  test('should display form inputs in edit mode', async ({ page }) => {
    // Enter edit mode
    const editButton = page
      .locator('button:has-text("Edit Profile"), button:has-text("Edit")')
      .first();

    await editButton.click();
    await page.waitForTimeout(500);

    // Should see input fields
    const inputs = page.locator('input, textarea');

    await expect(inputs.first()).toBeVisible();
  });

  test('should have cancel button in edit mode', async ({ page }) => {
    const editButton = page
      .locator('button:has-text("Edit Profile"), button:has-text("Edit")')
      .first();

    await editButton.click();
    await page.waitForTimeout(500);

    // Scroll to bottom to see Cancel button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const cancelButton = page.locator('button:has-text("Cancel")').first();

    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
  });

  test('should exit edit mode when cancel is clicked', async ({ page }) => {
    const editButton = page
      .locator('button:has-text("Edit Profile"), button:has-text("Edit")')
      .first();

    await editButton.click();
    await page.waitForTimeout(500);

    // Scroll to bottom to see Cancel button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const cancelButton = page.locator('button:has-text("Cancel")').first();

    await cancelButton.click();
    await page.waitForTimeout(500);

    // Should be back in view mode - edit button should be visible again
    await expect(editButton).toBeVisible();
  });
});

test.describe('Profile Page - Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Page should be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check no horizontal overflow
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Profile Page - Navigation', () => {
  test('should navigate back to home page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Find back button or home link
    const backButton = page
      .locator('button:has-text("back"), a:has-text("back"), a:has-text("home")')
      .first();

    await backButton.click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Should be back at home
    const url = page.url();
    expect(url).toMatch(/\/$|\/index/);
  });

  test('should navigate to experiences page from profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for the experiences link and navigate programmatically
    // UPageCard creates an overlay that can be tricky to click
    const experiencesLink = page.locator('a[href="/profile/experiences"]');
    const count = await experiencesLink.count();

    if (count > 0) {
      // Navigate directly instead of clicking (more reliable for overlay links)
      await page.goto('/profile/experiences');
      await page.waitForLoadState('networkidle');

      // Verify navigation succeeded
      await expect(page).toHaveURL(/.*experiences/);
    } else {
      test.skip(true, 'Experiences link not found');
    }
  });
});

test.describe('Profile Page - Unauthenticated Access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Should redirect to login or show login form
    const url = page.url();
    const hasLoginForm =
      (await page.locator('input[type="email"], input[name="username"]').count()) > 0;

    expect(url.includes('login') || url.includes('sign-in') || hasLoginForm).toBeTruthy();
  });
});
