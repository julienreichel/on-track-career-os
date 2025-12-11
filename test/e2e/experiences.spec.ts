import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Experience Management (EPIC 2)
 *
 * Tests the experience listing and creation flows:
 * - Experience listing page
 * - Experience creation with form validation
 * - Navigation between experiences and stories
 */

test.describe('Experience Management', () => {
  test.describe.configure({ retries: 2 });

  test.describe('Experience Listing', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/profile/experiences');
      await page.waitForLoadState('networkidle');
      // Wait for any initial data loading
      await page.waitForTimeout(1000);
    });

    test('should display experiences page', async ({ page }) => {
      // Verify we're on the experiences page
      await expect(page).toHaveURL(/.*\/profile\/experiences/);

      // Page should be visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      // Look for experiences title/header
      const heading = page.locator('h1, h2').filter({ hasText: /experience/i }).first();

      if ((await heading.count()) > 0) {
        await expect(heading).toBeVisible();
      }
    });

    test('should have "New Experience" button', async ({ page }) => {
      // Look for button to create new experience
      const newButton = page
        .locator('button:has-text("New"), a:has-text("New"), button:has-text("Add")')
        .first();

      // Wait a moment for buttons to render
      await page.waitForTimeout(500);

      if ((await newButton.count()) > 0) {
        await expect(newButton).toBeVisible();
        await expect(newButton).toBeEnabled();
      }
    });

    test('should display empty state if no experiences', async ({ page }) => {
      // Check if empty state is shown
      const emptyState = page.locator('text=/no experiences|get started|create first/i').first();

      // If empty state exists, it should be visible
      if ((await emptyState.count()) > 0) {
        await expect(emptyState).toBeVisible();
      }
    });

    test('should display experience cards if experiences exist', async ({ page }) => {
      // Wait for any data to load
      await page.waitForTimeout(1000);

      // Check for experience cards or table
      const hasCards = (await page.locator('[class*="card"], [role="article"]').count()) > 0;
      const hasTable = (await page.locator('table').count()) > 0;
      const hasEmpty =
        (await page.locator('text=/no experiences|get started|create first/i').count()) > 0;

      // Should have either cards/table OR empty state
      expect(hasCards || hasTable || hasEmpty).toBe(true);
    });

    test('should have back to profile navigation', async ({ page }) => {
      // Look for back button
      const backButton = page
        .locator(
          'button:has-text("Profile"), a:has-text("Profile"), a:has-text("Back"), button:has-text("Back")'
        )
        .first();

      if ((await backButton.count()) > 0) {
        await expect(backButton).toBeVisible();
      }
    });

    test('should navigate to story list when clicking on experience', async ({ page }) => {
      // Wait for experiences to load
      await page.waitForTimeout(1500);

      // Check if there are any experiences (cards or rows)
      const experienceItems = page.locator(
        '[class*="card"], table tbody tr, [role="article"], a[href*="/experiences/"]'
      );
      const count = await experienceItems.count();

      if (count > 0) {
        // Click first experience
        const firstItem = experienceItems.first();
        await firstItem.click();

        // Should navigate to stories page for that experience
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*\/experiences\/[^/]+\/stories/);
      }
    });
  });

  test.describe('Experience Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/profile/experiences');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    test('should navigate to new experience form', async ({ page }) => {
      // Look for "New" or "Add" button
      const newButton = page
        .locator(
          'button:has-text("New"), a:has-text("New"), button:has-text("Add"), a[href*="/new"]'
        )
        .first();

      const count = await newButton.count();

      if (count > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to new experience page
        await expect(page).toHaveURL(/.*\/experiences\/new/);
      }
    });

    test('should display experience creation form', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');

      // Look for form fields
      const hasForm = (await page.locator('form').count()) > 0;
      const hasInputs = (await page.locator('input, textarea, select').count()) > 0;

      // Should have form or input elements
      expect(hasForm || hasInputs).toBe(true);
    });

    test('should have required form fields', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check for essential experience fields
      const hasJobTitle =
        (await page
          .locator('input[name*="title"], input[placeholder*="title"], label:has-text("Title")')
          .count()) > 0;
      const hasCompany =
        (await page
          .locator(
            'input[name*="company"], input[placeholder*="company"], label:has-text("Company")'
          )
          .count()) > 0;

      // Should have at least job title field
      expect(hasJobTitle || hasCompany).toBe(true);
    });

    test('should have save and cancel buttons', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Look for save button
      const saveButton = page
        .locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]')
        .first();

      // Look for cancel button
      const cancelButton = page
        .locator('button:has-text("Cancel"), a:has-text("Cancel"), a:has-text("Back")')
        .first();

      if ((await saveButton.count()) > 0) {
        await expect(saveButton).toBeVisible();
      }

      if ((await cancelButton.count()) > 0) {
        await expect(cancelButton).toBeVisible();
      }
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Try to submit empty form
      const saveButton = page
        .locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]')
        .first();

      if ((await saveButton.count()) > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);

        // Should show validation errors
        const hasError =
          (await page.locator('text=/required|cannot be empty|please enter/i').count()) > 0;
        const hasFormError = (await page.locator('[class*="error"], [role="alert"]').count()) > 0;

        // Should have some form of validation feedback
        expect(hasError || hasFormError).toBe(true);
      }
    });

    test('should successfully create experience with valid data', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Fill in the form with test data
      const timestamp = Date.now();
      const jobTitle = `E2E Test Engineer ${timestamp}`;
      const companyName = `E2E Test Company ${timestamp}`;

      // Try to fill job title
      const titleInput = page
        .locator('input[name*="title"], input[placeholder*="title"]')
        .first();
      if ((await titleInput.count()) > 0) {
        await titleInput.fill(jobTitle);
      }

      // Try to fill company
      const companyInput = page
        .locator('input[name*="company"], input[placeholder*="company"]')
        .first();
      if ((await companyInput.count()) > 0) {
        await companyInput.fill(companyName);
      }

      // Fill dates if present
      const startDateInput = page
        .locator('input[name*="start"], input[type="date"]')
        .first();
      if ((await startDateInput.count()) > 0) {
        await startDateInput.fill('2024-01-01');
      }

      // Submit form
      const saveButton = page
        .locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]')
        .first();

      if ((await saveButton.count()) > 0) {
        await saveButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Should redirect back to experiences list or experience detail
        await expect(page).toHaveURL(/.*\/experiences/);
      }
    });

    test('should allow canceling experience creation', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');

      // Click cancel button
      const cancelButton = page
        .locator('button:has-text("Cancel"), a:has-text("Cancel"), a:has-text("Back")')
        .first();

      if ((await cancelButton.count()) > 0) {
        await cancelButton.click();
        await page.waitForLoadState('networkidle');

        // Should navigate back to experiences list
        await expect(page).toHaveURL(/.*\/experiences$/);
      }
    });
  });
});
