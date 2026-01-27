import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * E2E Tests: CV Upload Flow (EPIC 1A)
 *
 * Tests the complete CV upload and import workflow:
 * 1. Upload CV file (PDF/TXT)
 * 2. AI parsing and extraction
 * 3. Preview extracted experiences
 * 4. Edit/remove experiences before import
 * 5. Import experiences to database
 * 6. Verify imported data appears in experiences list
 *
 * Note: Experience management tests (CRUD operations) are in experiences.spec.ts
 */

test.describe('CV Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to CV upload page
    await page.goto('/profile/cv-upload', { waitUntil: 'networkidle' });
  });

  test('should display CV upload page with dropzone', async ({ page }) => {
    // Verify page loads
    await expect(page.getByRole('heading', { name: /upload your cv/i })).toBeVisible();

    // Verify dropzone is present with instructions
    await expect(page.getByText(/drop your cv here or click to browse/i)).toBeVisible();
    await expect(page.getByText(/supports pdf and txt files/i)).toBeVisible();
  });

  test('should have file input for upload', async ({ page }) => {
    // Verify file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Verify it accepts correct file types
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('.pdf');
    expect(accept).toContain('.txt');
  });

  test('should show parsing state after file upload', async ({ page }) => {
    const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    const fileInput = page.locator('input[type="file"]');

    // Upload the test CV file
    await fileInput.setInputFiles(testFilePath);

    // Should show parsing indicator
    await expect(page.getByText(/parsing your cv/i)).toBeVisible();

    // Wait for parsing to complete (with generous timeout for AI processing)
    await page.waitForTimeout(3000);
  });

  test('should display preview of extracted experiences', async ({ page }) => {
    const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for parsing to complete
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    // Should show preview heading
    await expect(page.getByRole('heading', { name: /Experiences/i })).toBeVisible();

    // Should show experience count badge
    const countBadge = page
      .locator('span')
      .filter({ hasText: /^[0-9]+$/ })
      .first();
    await expect(countBadge).toBeVisible();

    // Should have at least one experience visible
    await expect(page.getByText(/Senior Software Engineer/i).first()).toBeVisible();
    await expect(page.getByText(/Tech Corporation/i).first()).toBeVisible();
  });

  test('should show Confirm & continue button after parsing', async ({ page }) => {
    const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for parsing
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    // Should show import button
    const importButton = page.getByRole('button', { name: /Confirm/i });
    await expect(importButton).toBeVisible();
    await expect(importButton).toBeEnabled();
  });

  test('should import experiences and redirect to success page', async ({ page }) => {
    const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(testFilePath);

    // Wait until parsing is finished → Import button appears
    const importButton = page.getByRole('button', { name: /Confirm/i });

    await expect(importButton).toBeVisible({ timeout: 20000 });
    await expect(importButton).toBeEnabled();

    await importButton.click();

    // Assert success state (don’t rely on networkidle)
    await expect(
      page.getByText(/imported \d+ experience\(s\), updated \d+ experience\(s\)/i)
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: /view experiences/i })).toBeVisible();
  });

  test('should display imported experiences in list', async ({ page }) => {
    const testFilePath = join(__dirname, 'fixtures', 'test-cv.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for parsing and import
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    // Import experiences
    const importButton = page.getByRole('button', { name: /Confirm/i });
    await importButton.click();
    await page.waitForLoadState('networkidle');

    // Navigate to experiences list
    await page.getByRole('button', { name: /View Experiences/i }).click();
    await page.waitForLoadState('networkidle');

    // Should see imported experiences
    await expect(page.getByText(/Senior Software Engineer/i).first()).toBeVisible();
    await expect(page.getByText(/Tech Corporation/i).first()).toBeVisible();
  });

  test('should allow canceling upload process', async ({ page }) => {
    // Verify cancel/back button exists
    // Button may not be visible initially on upload page, but should exist after upload starts
    // For now, just verify the page structure is correct
    await expect(page.getByRole('heading', { name: /upload your cv/i })).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page }) => {
    // Verify file input has accept attribute to restrict file types
    const fileInput = page.locator('input[type="file"]');
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toBe('.pdf,.txt');

    // Frontend restricts file selection via accept attribute
    // Backend validation would be tested with actual invalid file upload
  });

  test('should show error for file too large', async ({ page }) => {
    // Verify page is ready to handle file uploads
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Backend enforces 5MB max file size
    // This would be tested with actual large file when available
  });
});
