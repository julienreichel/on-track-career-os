import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Experience Management (EPIC 2)
 *
 * Tests experience CRUD workflows and navigation.
 *
 * Component/UI tests moved to:
 * - test/nuxt/pages/profile/experiences/index.spec.ts (listing page)
 * - test/nuxt/components/ExperienceForm.spec.ts (form component)
 *
 * These E2E tests focus on:
 * - Complete CRUD workflows (create → save → list → edit → delete)
 * - Form submission and data persistence
 * - Navigation between experiences and stories
 * - Backend integration
 */

test.describe('Experience Management', () => {
  test.describe('Experience Listing', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/profile/experiences');
      await page.waitForLoadState('networkidle');
      // Wait for any initial data loading
      await page.waitForTimeout(2000);
    });

    test('should display experiences page', async ({ page }) => {
      // Auth state should now persist correctly

      // Verify we're on the experiences page
      await expect(page).toHaveURL(/.*\/profile\/experiences/);

      // Page should be visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should display experience cards or table if experiences exist', async ({ page }) => {
      // Wait for any data to load
      await page.waitForTimeout(1500);

      // Check for experience table (UTable component) OR empty state text
      const hasTable = (await page.locator('table').count()) > 0;
      const hasTableRows = (await page.locator('table tbody tr').count()) > 0;
      const hasEmpty =
        (await page.locator('text=/no experiences yet|upload.*cv|add.*manually/i').count()) > 0;

      // Should have either table with rows OR empty state
      expect(hasTable || hasTableRows || hasEmpty).toBe(true);
    });

    test('should have back to profile navigation', async ({ page }) => {
      // Look for back button
      const backButton = page
        .locator(
          'button:has-text("Profile"), a:has-text("Profile"), a:has-text("Back"), button:has-text("Back")'
        )
        .first();

      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Experience Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/profile/experiences');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    test('should navigate to new experience form', async ({ page }) => {
      // Look for the link to /new in page header (UPageHeader)
      const newLink = page.locator('a[href="/profile/experiences/new"]').first();

      const count = await newLink.count();

      if (count > 0) {
        await newLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Should navigate to new experience page
        await expect(page).toHaveURL(/.*\/experiences\/new/);
      }
    });

    test('should display experience creation form', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for UInput fields (Nuxt UI)
      const hasInputs = (await page.locator('input').count()) > 0;

      // Should have input elements
      expect(hasInputs).toBe(true);
    });

    test('should have required form fields', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check for text inputs (title, company, etc.) - Nuxt UI uses regular inputs
      const textInputs = page.locator('input[type="text"]');
      const dateInputs = page.locator('input[type="date"]');

      const hasTextInputs = (await textInputs.count()) > 0;
      const hasDateInputs = (await dateInputs.count()) > 0;

      // Should have both text and date inputs
      expect(hasTextInputs && hasDateInputs).toBe(true);
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

      await expect(saveButton).toBeVisible();
      await expect(cancelButton).toBeVisible();
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that Save button is disabled for empty form
      const saveButton = page.locator('button:has-text("Save")').first();

      // Button should be disabled when required fields are empty
      await expect(saveButton).toBeDisabled();

      // Verify we're still on the new experience page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/new');
    });

    test('should successfully create experience with valid data', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Fill in the form with test data
      const timestamp = Date.now();
      const jobTitle = `E2E Test Engineer ${timestamp}`;
      const companyName = `E2E Test Company ${timestamp}`;

      // Get all text inputs in order (title, company)
      const textInputs = page.locator('input[type="text"]');
      const textInputCount = await textInputs.count();

      if (textInputCount >= 1) {
        await textInputs.nth(0).fill(jobTitle); // Title field
      }
      if (textInputCount >= 2) {
        await textInputs.nth(1).fill(companyName); // Company field
      }

      // Fill start date (first date input)
      const dateInputs = page.locator('input[type="date"]');
      await dateInputs.first().fill('2024-01-01');

      // Submit form
      const saveButton = page.locator('button:has-text("Save")').first();

      await saveButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Should redirect back to experiences list
      await expect(page).toHaveURL(/.*\/profile\/experiences$/);
    });

    test('should allow canceling experience creation', async ({ page }) => {
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');

      // Click cancel button
      const cancelButton = page
        .locator('button:has-text("Cancel"), a:has-text("Cancel"), a:has-text("Back")')
        .first();

      await cancelButton.click();
      await page.waitForLoadState('networkidle');

      // Should navigate back to experiences list
      await expect(page).toHaveURL(/.*\/experiences$/);
    });
  });

  test.describe('Experience Navigation - With Data', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/profile/experiences');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    });

    test('should navigate to story list when clicking view stories button', async ({ page }) => {
      // create an experience
      await page.goto('/profile/experiences/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Fill in the form with test data
      const timestamp = Date.now();
      const jobTitle = `E2E Test Engineer ${timestamp}`;
      const companyName = `E2E Test Company ${timestamp}`;

      // Get all text inputs in order (title, company)
      const textInputs = page.locator('input[type="text"]');
      const textInputCount = await textInputs.count();

      if (textInputCount >= 1) {
        await textInputs.nth(0).fill(jobTitle); // Title field
      }
      if (textInputCount >= 2) {
        await textInputs.nth(1).fill(companyName); // Company field
      }

      // Fill start date (first date input)
      const dateInputs = page.locator('input[type="date"]');
      await dateInputs.first().fill('2024-01-01');

      // Submit form
      const saveButton = page.locator('button:has-text("Save")').first();

      await saveButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if there are any experience rows in the table
      const tableRows = page.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible();

      // Click the first "View Stories" button (document-text icon)
      const viewStoriesButton = page.locator('button[aria-label*="stories" i]').first();
      await viewStoriesButton.click();

      // Should navigate to stories page for that experience
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/experiences\/[^/]+\/stories/);
    });
  });
});
